const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Compiling and deploying ProtectedPay...");

  // Get network information
  const network = hre.network.name;
  const chainId = hre.network.config.chainId;

  console.log(`Deploying to network: ${network} (Chain ID: ${chainId})`);

  const Contract = await hre.ethers.getContractFactory("ProtectedPay");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ProtectedPay deployed to:", address);

  // Display network-specific information
  if (chainId === 296) {
    console.log("🌐 Hedera Testnet Deployment");
    console.log(`📍 Explorer: https://hashscan.io/testnet/contract/${address}`);
    console.log(`🔗 RPC: https://testnet.hashio.io/api`);
  }

  // Write an .env.local file update hint at project root
  const rootEnvPath = path.resolve(__dirname, "..", "..", ".env.local");
  const envKey = `NEXT_PUBLIC_CONTRACT_ADDRESS_${chainId}`;
  const line = `${envKey}=${address}\n`;

  try {
    if (fs.existsSync(rootEnvPath)) {
      const current = fs.readFileSync(rootEnvPath, "utf8");
      const regex = new RegExp(`${envKey}=.*`, 'g');
      const replaced = current.replace(regex, `${envKey}=${address}`);
      if (replaced !== current) {
        fs.writeFileSync(rootEnvPath, replaced);
        console.log("Updated .env.local with new address.");
      } else if (!current.includes(envKey)) {
        fs.appendFileSync(rootEnvPath, line);
        console.log("Appended contract address to .env.local.");
      } else {
        console.log(".env.local already has the address; update manually if needed.");
      }
    } else {
      fs.writeFileSync(rootEnvPath, line);
      console.log("Created .env.local with contract address.");
    }
  } catch (e) {
    console.log("Note: could not write .env.local automatically:", e.message);
  }

  console.log(`\n✅ Deployment complete!`);
  console.log(`📝 Contract address: ${address}`);
  console.log(`🔧 Add this to your .env.local: ${envKey}=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

