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
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)'
];

async function main() {
  const { ethers } = hre;
  const chainId = hre.network.config.chainId;
  const poolAddr = readEnvVar(`NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_${chainId}`);
  const tokensCSV = readEnvVar(`NEXT_PUBLIC_ORBITAL_TOKENS_${chainId}`);
  if (!poolAddr || !tokensCSV) throw new Error('Missing Orbital envs for this chain');
  const tokens = tokensCSV.split(',');

  const [signer] = await ethers.getSigners();
  console.log('Signer:', signer.address);
  console.log('Pool:', poolAddr);
  console.log('Tokens:', tokens);

  const pool = await ethers.getContractAt('OrbitalPool', poolAddr, signer);

  // Approve and compute 5 amounts of 0.1 units each
  const amounts = [];
  for (let i = 0; i < 5; i++) {
    const t = new ethers.Contract(tokens[i], ERC20_ABI, signer);
    const dec = await t.decimals().catch(() => 18);
    const amt = hre.ethers.parseUnits('0.1', dec);
    amounts.push(amt);
    const current = await t.allowance(signer.address, poolAddr);
    if (current < amt) {
      console.log(`Approving token[${i}] ${tokens[i]} for`, amt.toString());
      await (await t.approve(poolAddr, hre.ethers.MaxUint256)).wait();
    }
  }

  console.log('Calling addLiquidity k=1000 with amounts:', amounts.map(a=>a.toString()));
  await (await pool.addLiquidity(1000n, amounts)).wait();
  console.log('addLiquidity OK');

  // Swap token0 -> token1 0.05
  const t0 = new ethers.Contract(tokens[0], ERC20_ABI, signer);
  const d0 = await t0.decimals().catch(() => 18);
  const amtIn = hre.ethers.parseUnits('0.05', d0);
  console.log('Swapping token0->token1, amtIn', amtIn.toString());
  await (await pool.swap(0, 1, amtIn, 0)).wait();
  console.log('swap OK');
}

main().catch((e) => { console.error(e); process.exit(1); });

