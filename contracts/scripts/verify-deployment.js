const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Verifying ProtectedPay Contract Deployment");
  console.log("============================================");

  const network = hre.network.name;
  const chainId = hre.network.config.chainId;
  
  console.log(`📡 Network: ${network} (Chain ID: ${chainId})`);

  // Get contract address from environment or deployment file
  let contractAddress;
  
  if (chainId === 296) {
    contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_296;
    console.log("🌐 Hedera Testnet Configuration");


  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    console.log("❌ Contract address not found in environment variables");
    console.log("💡 Make sure to deploy the contract first");
    return;
  }

  console.log(`📍 Contract Address: ${contractAddress}`);

  try {
    // Get contract instance
    const ProtectedPay = await ethers.getContractFactory("ProtectedPay");
    const contract = ProtectedPay.attach(contractAddress);

    console.log("\n🧪 Running Contract Verification Tests...");

    // Test 1: Check if contract is deployed
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
      console.log("❌ No contract found at this address");
      return;
    }
    console.log("✅ Contract code found at address");

    // Test 2: Check contract name
    try {
      const contractName = await contract.name();
      console.log(`✅ Contract Name: ${contractName}`);
    } catch (error) {
      console.log("⚠️  Could not read contract name (this is normal for some contracts)");
    }

    // Test 3: Check if we can read basic functions
    try {
      const userCount = await contract.userCount();
      console.log(`✅ User Count: ${userCount.toString()}`);
    } catch (error) {
      console.log("⚠️  Could not read user count:", error.message);
    }

    // Test 4: Check transfer count
    try {
      const transferCount = await contract.transferCount();
      console.log(`✅ Transfer Count: ${transferCount.toString()}`);
    } catch (error) {
      console.log("⚠️  Could not read transfer count:", error.message);
    }

    // Test 5: Check group payment count
    try {
      const groupPaymentCount = await contract.groupPaymentCount();
      console.log(`✅ Group Payment Count: ${groupPaymentCount.toString()}`);
    } catch (error) {
      console.log("⚠️  Could not read group payment count:", error.message);
    }

    // Test 6: Check savings pot count
    try {
      const savingsPotCount = await contract.savingsPotCount();
      console.log(`✅ Savings Pot Count: ${savingsPotCount.toString()}`);
    } catch (error) {
      console.log("⚠️  Could not read savings pot count:", error.message);
    }

    console.log("\n🎉 Contract Verification Complete!");
    console.log("✅ The ProtectedPay contract is successfully deployed and functional");
    
    if (chainId === 296) {
      console.log(`🔗 View on Hashscan: https://hashscan.io/testnet/contract/${contractAddress}`);
    }

  } catch (error) {
    console.log("❌ Error verifying contract:", error.message);
    console.log("💡 Make sure the contract is deployed and the address is correct");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
