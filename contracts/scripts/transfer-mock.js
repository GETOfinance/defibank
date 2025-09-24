const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

function readEnvVar(key) {
  if (process.env[key]) return process.env[key];
  const envPath = path.resolve(__dirname, '..', '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const re = new RegExp(`^${key}=(.*)$`, 'm');
    const m = content.match(re);
    if (m) return m[1].trim();
  }
  return undefined;
}

async function main() {
  const chainId = hre.network.config.chainId;
  const [deployer] = await hre.ethers.getSigners();

  const tokensCsv = readEnvVar(`NEXT_PUBLIC_ORBITAL_TOKENS_${chainId}`);
  if (!tokensCsv) throw new Error(`Missing NEXT_PUBLIC_ORBITAL_TOKENS_${chainId} in .env.local`);
  const tokens = tokensCsv.split(',');
  const usdc = tokens[0];
  const whbar = readEnvVar(`NEXT_PUBLIC_HBAR_ERC20_ADDRESS_${chainId}`);
  const to = process.env.USER_ADDR;
  if (!to) throw new Error('Set USER_ADDR=0xYourWallet');

  console.log('Deployer:', deployer.address);
  console.log('USDC:', usdc);
  console.log('WHBAR:', whbar);
  console.log('To:', to);

  const ercAbi = ["function transfer(address to, uint256 amount) external returns (bool)"];
  const usdcCtr = await hre.ethers.getContractAt(ercAbi, usdc);
  const whbarCtr = whbar ? await hre.ethers.getContractAt(ercAbi, whbar) : null;

  const amt = hre.ethers.parseUnits('1000', 18);
  const tx1 = await usdcCtr.transfer(to, amt);
  await tx1.wait();
  console.log('Transferred 1000 USDC');

  if (whbarCtr) {
    const tx2 = await whbarCtr.transfer(to, amt);
    await tx2.wait();
    console.log('Transferred 1000 WHBAR');
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });

