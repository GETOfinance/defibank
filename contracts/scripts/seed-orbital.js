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

const ERC20_MIN_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)'
];
const MINT_ABI = ['function mint(address,uint256)'];

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

  // Mint 10 units of each token to signer if possible
  for (let i=0;i<tokens.length;i++) {
    const t = new ethers.Contract(tokens[i], ERC20_MIN_ABI, signer);
    const dec = await t.decimals().catch(() => 18);
    const ten = hre.ethers.parseUnits('10', dec);
    // try mint
    try {
      const minter = new ethers.Contract(tokens[i], MINT_ABI, signer);
      console.log(`Minting 10 units to signer for token[${i}] ${tokens[i]}`);
      await (await minter.mint(signer.address, ten)).wait();
    } catch (e) {
      console.log(`Mint not available for token[${i}] ${tokens[i]}:`, e.message);
    }
  }

  // Approve Max for all
  for (let i=0;i<tokens.length;i++) {
    const t = new ethers.Contract(tokens[i], ERC20_MIN_ABI, signer);
    const current = await t.allowance(signer.address, poolAddr).catch(()=>0n);
    if (current === 0n) {
      console.log(`Approving Max for token[${i}] ${tokens[i]}`);
      await (await t.approve(poolAddr, hre.ethers.MaxUint256)).wait();
    }
  }

  // Build amounts: 0.2 of each and choose k = common amount (valid boundary)
  const amounts = [];
  for (let i=0;i<tokens.length;i++) {
    const t = new ethers.Contract(tokens[i], ERC20_MIN_ABI, signer);
    const dec = await t.decimals().catch(() => 18);
    const amt = hre.ethers.parseUnits('0.2', dec);
    amounts.push(amt);
  }
  const k = amounts[0];

  const pool = await ethers.getContractAt('OrbitalPool', poolAddr, signer);
  console.log('Calling addLiquidity k=amounts[0] with amounts:', amounts.map(a=>a.toString()));
  await (await pool.addLiquidity(k, amounts)).wait();
  console.log('Seed liquidity OK');
}

main().catch((e) => { console.error(e); process.exit(1); });

