require('dotenv').config();
const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address, '(deploy-mockusdc)');

  const USDC = await hre.ethers.getContractFactory('MockUSDC');
  const usdt = await USDC.deploy('Mock USDC', 'USDC', 1000000);
  await usdt.waitForDeployment();
  const addr = await usdt.getAddress();
  console.log('MockUSDC deployed at:', addr);

  // Mint some USDT to deployer and optional faucet recipient
  const mintTo = process.env.FAUCET_ADDRESS_296 || deployer.address;
  const amt = hre.ethers.parseUnits('1000', 18);
  console.log('Minted', hre.ethers.formatUnits(amt, 18), 'USDC to', mintTo);

  // Write address for pro deployment
  const contractsEnvPath = path.resolve(__dirname, '..', '.env');
  try {
    let env = '';
    if (fs.existsSync(contractsEnvPath)) env = fs.readFileSync(contractsEnvPath, 'utf8');
    if (!env.includes('HEDERA_USDC_ADDRESS_296=')) {
      fs.appendFileSync(contractsEnvPath, `HEDERA_USDC_ADDRESS_296=${addr}\n`, { encoding: 'utf8' });
      console.log('Updated contracts .env with HEDERA_USDC_ADDRESS_296');
    } else {
      console.log('HEDERA_USDC_ADDRESS_296 already present in contracts .env');
    }
  } catch (e) {
    console.log('Could not update contracts .env automatically:', e.message);
  }

  // Also write frontend env for convenience
  const rootEnvPath = path.resolve(__dirname, '..', '..', '.env.local');
  try {
    fs.appendFileSync(rootEnvPath, `NEXT_PUBLIC_USDC_ADDRESS_${hre.network.config.chainId}=${addr}\n`, { encoding: 'utf8' });
    console.log('Updated frontend .env.local with NEXT_PUBLIC_USDC_ADDRESS');
  } catch (e) {
    console.log('Could not update frontend .env.local automatically:', e.message);
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });

