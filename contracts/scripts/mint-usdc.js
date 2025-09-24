require('dotenv').config();
const hre = require('hardhat');

async function main() {
  const to = process.argv[2] || process.env.MINT_TO;
  const amountStr = process.argv[3] || process.env.MINT_AMOUNT || '100';
  if (!to) throw new Error('Usage: node scripts/mint-usdt.js <toAddress> [amountUSDC] (or set MINT_TO and MINT_AMOUNT envs)');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address);
  const usdtAddr = process.env.HEDERA_USDC_ADDRESS_296 || process.env.NEXT_PUBLIC_USDC_ADDRESS_296 || process.env.NEXT_PUBLIC_USDT_ADDRESS_296;
  if (!usdtAddr) throw new Error('Missing USDC address in env: HEDERA_USDC_ADDRESS_296 or NEXT_PUBLIC_USDC_ADDRESS_296');

  const usdt = await hre.ethers.getContractAt('MockUSDC', usdtAddr);
  const dec = await usdt.decimals();
  const amt = hre.ethers.parseUnits(amountStr, dec);

  console.log(`Minting ${amountStr} USDC (${amt}) to ${to} on ${hre.network.name} ...`);
  const tx = await usdt.mint(to, amt);
  const rcpt = await tx.wait();
  console.log('Mint tx hash:', rcpt?.hash || tx.hash);

  const bal = await usdt.balanceOf(to);
  console.log('New USDC balance:', hre.ethers.formatUnits(bal, dec));
}

main().catch((e)=>{ console.error(e); process.exit(1); });

