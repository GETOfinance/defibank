require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.30",
  networks: {
    // Hedera Testnet Configuration
    hederaTestnet: {
      url: process.env.HEDERA_TESTNET_RPC_URL || "https://testnet.hashio.io/api",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 296,
      gas: 3000000,
      gasPrice: 400000000000, // 400 gwei (Hashio min ~380 gwei)
    },

  },
  etherscan: {
    apiKey: {
      // Hedera uses Hashscan, no API key needed for verification
    },
    customChains: [
      {
        network: "hederaTestnet",
        chainId: 296,
        urls: {
          apiURL: "https://testnet.hashio.io/api",
          browserURL: "https://hashscan.io/testnet"
        }
      },

    ]
  }
};

