const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

function readEnvVar(key) {
  if (process.env[key]) return process.env[key];
  const envPath = path.resolve(__dirname, '..', '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const re = new RegExp(`^${key}=(.*)$`, 'm');
    const m = content.match(re);
    if (m) return m[1].trim();
  }
  return undefined;
}

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

async function main() {
  const { ethers } = hre;
  const chainId = hre.network.config.chainId;
  const poolAddr = readEnvVar(`NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_${chainId}`);
  const tokensCSV = readEnvVar(`NEXT_PUBLIC_ORBITAL_TOKENS_${chainId}`);
  if (!poolAddr || !tokensCSV) throw new Error('Missing Orbital envs for this chain');
  const tokens = tokensCSV.split(',').map((s) => s.trim());

  const [signer] = await ethers.getSigners();
  const signerAddr = await signer.getAddress();
  console.log('Signer:', signerAddr);
  console.log('Pool:', poolAddr);

  const poolArtifact = require('../artifacts/contracts/IntegratedOrbital.sol/OrbitalPool.json');
  const pool = new ethers.Contract(poolAddr, poolArtifact.abi, signer);

  // Swap token0 -> token1 small amount
  const t0 = new ethers.Contract(tokens[0], ERC20_ABI, signer);
  const t1 = new ethers.Contract(tokens[1], ERC20_ABI, signer);
  const [sym0, d0, sym1, d1] = await Promise.all([
    t0.symbol().catch(() => 'T0'),
    t0.decimals().catch(() => 18),
    t1.symbol().catch(() => 'T1'),
    t1.decimals().catch(() => 18),
  ]);
  const amtIn = ethers.parseUnits('0.005', d0);

  // Ensure allowance for token0
  const current = await t0.allowance(signerAddr, poolAddr);
  if (current < amtIn) {
    console.log(`Approving ${sym0} to MaxUint256...`);
    await (await t0.approve(poolAddr, ethers.MaxUint256)).wait();
  }

  // Quote via static call and apply 2% slippage buffer
  const swapFn = pool.getFunction('swap');
  const quotedOut = await swapFn.staticCall(0, 1, amtIn, 0);
  const minOut = (quotedOut * 98n) / 100n;
  console.log(`Quote: ${ethers.formatUnits(amtIn, d0)} ${sym0} -> ~${ethers.formatUnits(quotedOut, d1)} ${sym1}; minOut=${ethers.formatUnits(minOut, d1)}`);

  const gasPrice = ethers.parseUnits('600', 'gwei');
  const tx = await pool.swap(0, 1, amtIn, minOut, { gasPrice });
  const rcpt = await tx.wait();
  console.log('swap tx:', tx.hash);
}

main().catch((e) => { console.error(e); process.exit(1); });

