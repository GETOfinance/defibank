require('dotenv').config();
const hre = require('hardhat');

async function main() {
  const address = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_296;
  if (!address) throw new Error('Set CONTRACT_ADDRESS or NEXT_PUBLIC_CONTRACT_ADDRESS_296');

  console.log('Verifying on Hashscan (Hedera Testnet):', address);
  await hre.run('verify:verify', {
    address,
    constructorArguments: [],
  });
}

main().catch((e) => { console.error(e); process.exit(1); });

