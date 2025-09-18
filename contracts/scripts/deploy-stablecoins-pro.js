require('dotenv').config();
const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address);

  // External config (set these appropriately)
  const USDT_ADDRESS = process.env.HEDERA_USDT_ADDRESS_296; // e.g., a USDT-like token on Hedera Testnet
  if (!USDT_ADDRESS) throw new Error('HEDERA_USDT_ADDRESS_296 missing in .env');

  // Symbols list
  const symbols = ['NGN','KES','GHS','ZAR','UGX','TZS','MAD','EGP','XOF','XAF','ETB','RWF','ZMW','MZN','NAD','BWP','BIF','CDF','AOA','DZD','TND','LYD','SDG','SOS','SLL','GMD','LRD','MGA','GNF','DJF','ERN','KMF','ZWL','SSP','SCR','SZL','LSL','MUR','CVE'];
  const symbolsBytes = symbols.map(s => hre.ethers.encodeBytes32String(s));

  // Deploy oracle (mock)
  const OracleFactory = await hre.ethers.getContractFactory('MockStableOracle');
  const oracle = await OracleFactory.deploy(deployer.address);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log('Oracle deployed at:', oracleAddress);

  // Seed a few prices (1 USDT = 1600 NGN, 130 KES, 20 ZAR), scaled 1e18
  await (await oracle.setPrice(hre.ethers.encodeBytes32String('NGN'), hre.ethers.parseUnits('1600', 18))).wait();
  await (await oracle.setPrice(hre.ethers.encodeBytes32String('KES'), hre.ethers.parseUnits('130', 18))).wait();
  await (await oracle.setPrice(hre.ethers.encodeBytes32String('ZAR'), hre.ethers.parseUnits('20', 18))).wait();

  // Deploy StableCoins (owner=deployer)
  const StableFactory = await hre.ethers.getContractFactory('StableCoins');
  const stable = await StableFactory.deploy(deployer.address, USDT_ADDRESS, oracleAddress, symbolsBytes);
  await stable.waitForDeployment();
  const stableAddress = await stable.getAddress();
  console.log('StableCoins deployed at:', stableAddress);



  // Write frontend envs
  const chainId = hre.network.config.chainId;
  const rootEnvPath = path.resolve(__dirname, '..', '..', '.env.local');
  const lines = [
    `NEXT_PUBLIC_STABLECOINS_ADDRESS_${chainId}=${stableAddress}\n`,
    `NEXT_PUBLIC_STABLECOINS_ORACLE_${chainId}=${oracleAddress}\n`,
    `NEXT_PUBLIC_USDT_ADDRESS_${chainId}=${USDT_ADDRESS}\n`
  ];
  try {
    fs.appendFileSync(rootEnvPath, lines.join(''), { encoding: 'utf8' });
    console.log('Updated .env.local with StableCoins + Oracle addresses');
  } catch (e) {
    console.log('Could not update .env.local automatically:', e.message);
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });

