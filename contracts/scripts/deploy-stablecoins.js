require('dotenv').config();
const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address);

  // Initial supported symbols (bytes32) matching frontend list
  const symbols = ['NGN','KES','GHS','ZAR','UGX','TZS','MAD','EGP','XOF','XAF','ETB','RWF','ZMW','MZN','NAD','BWP','BIF','CDF','AOA','DZD','TND','LYD','SDG','SOS','SLL','GMD','LRD','MGA','GNF','DJF','ERN','KMF','ZWL','SSP','SCR','SZL','LSL','MUR','CVE'];
  const symbolsBytes = symbols.map(s => hre.ethers.utils.formatBytes32String(s));

  const Factory = await hre.ethers.getContractFactory('StableCoins');
  const contract = await Factory.deploy(symbolsBytes);
  await contract.deployed();

  console.log('StableCoins deployed at:', contract.address);

  const chainId = hre.network.config.chainId;
  const rootEnvPath = path.resolve(__dirname, '..', '..', '.env.local');
  const line = `NEXT_PUBLIC_STABLECOINS_ADDRESS_${chainId}=${contract.address}\n`;
  try {
    fs.appendFileSync(rootEnvPath, line, { encoding: 'utf8' });
    console.log('Updated .env.local with', line.trim());
  } catch (e) {
    console.log('Could not update .env.local automatically:', e.message);
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });

