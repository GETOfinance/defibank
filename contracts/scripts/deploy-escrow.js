const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EscrowHub contract...");

  // Get the contract factory
  const EscrowHub = await hre.ethers.getContractFactory("EscrowHub");

  // Deploy the contract
  console.log("📦 Deploying contract...");
  const escrowHub = await EscrowHub.deploy();

  // Wait for deployment to complete
  await escrowHub.waitForDeployment();

  console.log("✅ EscrowHub deployed successfully!");
  console.log("📍 Contract address:", await escrowHub.getAddress());
  console.log("🔗 Transaction hash:", escrowHub.deploymentTransaction().hash);

  // Get contract info
  const minimumEscrow = await escrowHub.getMinimumEscrow();
  const feePercentage = await escrowHub.getFeePercentage();
  
  console.log("\n📊 Contract Configuration:");
  console.log("💰 Minimum escrow amount:", hre.ethers.formatEther(minimumEscrow), "HBAR");
  console.log("💸 Fee percentage:", feePercentage.toString(), "%");

  // Verify contract on Hedera if we're on testnet/mainnet
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await escrowHub.deploymentTransaction().wait(5);

    console.log("🔍 Verifying contract on Hedera...");
    try {
      await hre.run("verify:verify", {
        address: await escrowHub.getAddress(),
        constructorArguments: [],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("❌ Contract verification failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    contractName: "EscrowHub",
    address: await escrowHub.getAddress(),
    transactionHash: escrowHub.deploymentTransaction().hash,
    blockNumber: escrowHub.deploymentTransaction().blockNumber,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    minimumEscrow: minimumEscrow.toString(),
    feePercentage: feePercentage.toString(),
    deployer: (await hre.ethers.getSigners())[0].address
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Environment variable suggestion
  console.log("\n🔧 Add this to your .env.local file:");
  console.log(`NEXT_PUBLIC_ESCROW_HUB_ADDRESS_${hre.network.config.chainId}=${await escrowHub.getAddress()}`);

  return deploymentInfo;
}

// Handle errors
main()
  .then((deploymentInfo) => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment failed:");
    console.error(error);
    process.exit(1);
  });
