require('dotenv').config();
const hre = require('hardhat');

async function main() {
  const chainId = hre.network.config.chainId;
  const stableAddr = process.env.NEXT_PUBLIC_STABLECOINS_ADDRESS_296 || process.env.STABLECOINS_ADDRESS_296;
  const oracleAddr = process.env.NEXT_PUBLIC_STABLECOINS_ORACLE_296 || process.env.STABLECOINS_ORACLE_296;
  const usdtAddr = process.env.HEDERA_USDC_ADDRESS_296 || process.env.NEXT_PUBLIC_USDC_ADDRESS_296 || process.env.NEXT_PUBLIC_USDT_ADDRESS_296;

  if (!stableAddr || !oracleAddr || !usdtAddr) {
    throw new Error('Missing addresses. Ensure .env and frontend .env.local are updated.');
  }

  console.log('chainId', chainId);
  console.log('StableCoins', stableAddr);
  console.log('Oracle     ', oracleAddr);
  console.log('USDC       ', usdtAddr);

  const stable = await hre.ethers.getContractAt('StableCoins', stableAddr);
  const oracle = await hre.ethers.getContractAt('MockStableOracle', oracleAddr);

  const symbols = await stable.listSymbols();
  console.log('Symbols count:', symbols.length);

  function b32ToString(b) {
    return hre.ethers.decodeBytes32String(b);
  }

  const ngn = hre.ethers.encodeBytes32String('NGN');
  const kes = hre.ethers.encodeBytes32String('KES');
  const zar = hre.ethers.encodeBytes32String('ZAR');

  const pNGN = await oracle.localPerUSDC(ngn);
  const pKES = await oracle.localPerUSDC(kes);
  const pZAR = await oracle.localPerUSDC(zar);
  console.log('Oracle NGN:', hre.ethers.formatUnits(pNGN, 18));
  console.log('Oracle KES:', hre.ethers.formatUnits(pKES, 18));
  console.log('Oracle ZAR:', hre.ethers.formatUnits(pZAR, 18));

  console.log('First 5 symbols:', symbols.slice(0,5).map(b32ToString));
}

main().catch((e) => { console.error(e); process.exit(1); });

