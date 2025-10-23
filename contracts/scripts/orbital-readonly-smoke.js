require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env.local') });

const hre = require('hardhat');
const { ethers } = hre;

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

async function main() {
  const chainName = hre.network.name;
  console.log('Network:', chainName);

  const poolAddr = process.env.NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_296;
  const tokensCsv = process.env.NEXT_PUBLIC_ORBITAL_TOKENS_296;
  if (!poolAddr || !tokensCsv) {
    throw new Error('Missing NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_296 or NEXT_PUBLIC_ORBITAL_TOKENS_296 in .env.local');
  }
  const tokenAddrs = tokensCsv.split(',').map((s) => s.trim());
  console.log('Pool:', poolAddr);
  console.log('Tokens:', tokenAddrs);

  const [signer] = await ethers.getSigners();
  console.log('Signer:', await signer.getAddress());

  const poolArtifact = require('../artifacts/contracts/IntegratedOrbital.sol/OrbitalPool.json');
  const pool = new ethers.Contract(poolAddr, poolArtifact.abi, ethers.provider);

  // 1) Read total reserves (public view)
  const reserves = await pool._getTotalReserves();
  console.log('Total reserves (raw):', reserves.map(r => r.toString()));

  // 2) Inspect first two tokens metadata and balances
  const t0 = new ethers.Contract(tokenAddrs[0], ERC20_ABI, ethers.provider);
  const t1 = new ethers.Contract(tokenAddrs[1], ERC20_ABI, ethers.provider);
  const [sym0, d0, sym1, d1] = await Promise.all([
    t0.symbol().catch(() => 'T0'),
    t0.decimals().catch(() => 18),
    t1.symbol().catch(() => 'T1'),
    t1.decimals().catch(() => 18)
  ]);
  console.log(`Token0: ${sym0} (decimals ${d0})`);
  console.log(`Token1: ${sym1} (decimals ${d1})`);

  const signerAddr = await signer.getAddress();
  const [bal0, bal1, allo0] = await Promise.all([
    t0.balanceOf(signerAddr).catch(() => 0),
    t1.balanceOf(signerAddr).catch(() => 0),
    t0.allowance(signerAddr, poolAddr).catch(() => 0),
  ]);
  console.log(`Signer balances: ${sym0}=${bal0.toString()}, ${sym1}=${bal1.toString()}`);
  console.log(`Allowance of ${sym0} to pool:`, allo0.toString());

  // 3) Read-only quote via callStatic.swap (no state changes)
  const amtIn = ethers.parseUnits('0.01', d0);
  const poolWithSigner = pool.connect(signer);
  try {
    // ethers v6 static call
    const swapFn = pool.connect(signer).getFunction('swap');
    const quotedOut = await swapFn.staticCall(0, 1, amtIn, 0);
    console.log(`Quote: 0.01 ${sym0} -> ${ethers.formatUnits(quotedOut, d1)} ${sym1}`);
  } catch (e) {
    console.log('Quote staticCall failed (likely helper not view/pure but should simulate):');
    console.error(e.message || e);
  }

  console.log('Readonly smoke complete. No state changes performed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

