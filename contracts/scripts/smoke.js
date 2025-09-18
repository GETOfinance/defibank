require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  const rpc = process.env.HEDERA_TESTNET_RPC_URL || 'https://testnet.hashio.io/api';
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error('DEPLOYER_PRIVATE_KEY missing');
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);

  const envPath = path.resolve(__dirname, '..', '..', '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found at project root');
  const env = fs.readFileSync(envPath, 'utf8');
  const m = env.match(/^NEXT_PUBLIC_CONTRACT_ADDRESS_296=(.+)$/m);
  if (!m) throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS_296 not found in .env.local');
  const address = m[1].trim();

  const artifactPath = path.resolve(__dirname, '..', 'artifacts', 'contracts', 'ProtectedPay.sol', 'ProtectedPay.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;

  const contract = new ethers.Contract(address, abi, wallet);

  const username = `smoke_${Date.now()}`;
  console.log('Registering username:', username);
  let tx = await contract.registerUsername(username);
  await tx.wait();
  console.log('Username registered');

  const value = ethers.parseEther('0.0001');
  console.log('Sending to self with value', value.toString());
  tx = await contract.sendToAddress(wallet.address, 'smoke', { value });
  await tx.wait();
  console.log('Transfer initiated');

  // Fetch pending transfers for sender and claim the first one if any
  const pending = await contract.getPendingTransfers(wallet.address);
  console.log('Pending transfer IDs:', pending);
  if (pending.length > 0) {
    tx = await contract.claimTransferById(pending[0]);
    await tx.wait();
    console.log('Transfer claimed');
  } else {
    console.log('No pending transfers to claim');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

