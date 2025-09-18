const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  const chainId = hre.network.config.chainId;
  console.log(`Deploying Orbital contracts to ${network} (chainId=${chainId})...`);

  // 1) Deploy 5 mock tokens (18 decimals)
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const tokensMeta = [
    ["USD Coin", "USDC"],
    ["Tether USD", "USDT"],
    ["Dai Stablecoin", "DAI"],
    ["Frax", "FRAX"],
    ["Liquity USD", "LUSD"],
  ];

  const tokenContracts = [];
  for (const [name, symbol] of tokensMeta) {
    const c = await MockUSDC.deploy(name, symbol, 0n);
    await c.waitForDeployment();
    tokenContracts.push(c);
    console.log(`Deployed ${symbol} at ${await c.getAddress()}`);
  }

  // Optional: mint to deployer for testing
  const [deployer] = await hre.ethers.getSigners();
  for (const c of tokenContracts) {
    const mintTx = await c.mint(deployer.address, 1000000n);
    await mintTx.wait();
  }

  // 2) Deploy math helper
  const Helper = await hre.ethers.getContractFactory("OrbitalMathHelperEVM");
  const helper = await Helper.deploy();
  await helper.waitForDeployment();
  const helperAddress = await helper.getAddress();
  console.log(`Deployed OrbitalMathHelperEVM at ${helperAddress}`);

  // 3) Deploy OrbitalPool (IntegratedOrbital.sol)
  const IERC20Array = tokenContracts.map(t => t.target);
  if (IERC20Array.length !== 5) throw new Error("Expected 5 token addresses");

  const Pool = await hre.ethers.getContractFactory("OrbitalPool");
  const pool = await Pool.deploy(IERC20Array, helperAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log(`Deployed OrbitalPool at ${poolAddress}`);

  // 4) Write env hints (optional)
  const rootEnvPath = path.resolve(__dirname, "..", "..", ".env.local");
  const lines = [
    `NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_${chainId}=${poolAddress}`,
    `NEXT_PUBLIC_ORBITAL_HELPER_ADDRESS_${chainId}=${helperAddress}`,
    `NEXT_PUBLIC_ORBITAL_TOKENS_${chainId}=${IERC20Array.join(",")}`,
    ""
  ];

  try {
    if (fs.existsSync(rootEnvPath)) {
      const cur = fs.readFileSync(rootEnvPath, "utf8");
      let updated = cur;
      for (const l of lines) {
        const [k] = l.split("=");
        const re = new RegExp(`^${k}=.*$`, "m");
        if (re.test(updated)) {
          updated = updated.replace(re, l);
        } else {
          updated += `\n${l}`;
        }
      }
      fs.writeFileSync(rootEnvPath, updated);
      console.log("Updated .env.local with Orbital addresses.");
    } else {
      fs.writeFileSync(rootEnvPath, lines.join("\n"));
      console.log("Created .env.local with Orbital addresses.");
    }
  } catch (e) {
    console.log("Note: could not write .env.local automatically:", e.message);
  }

  console.log("\n✅ Orbital deployment complete!");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

