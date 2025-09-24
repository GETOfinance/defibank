const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const network = hre.network.name;
  const chainId = hre.network.config.chainId;
  console.log(`Deploying Loans Hub to ${network} (chainId=${chainId})...`);

  // Minimal placeholders for constructor params
  const router = '0x0000000000000000000000000000000000000001';
  const linkToken = '0x0000000000000000000000000000000000000002';
  const functionsRouter = '0x0000000000000000000000000000000000000003';
  const vrfCoordinator = '0x0000000000000000000000000000000000000004';
  const subscriptionId = 0;
  const donId = hre.ethers.encodeBytes32String('donid');
  const keyHash = hre.ethers.encodeBytes32String('keyhash');

  const Hub = await hre.ethers.getContractFactory('CrossChainDefiHub');
  const hub = await Hub.deploy(router, linkToken, functionsRouter, vrfCoordinator, subscriptionId, donId, keyHash);
  await hub.waitForDeployment();
  const hubAddress = await hub.getAddress();
  console.log('CrossChainDefiHub deployed at:', hubAddress);

  // Write to frontend .env.local
  const rootEnvPath = path.resolve(__dirname, '..', '..', '.env.local');
  const line = `NEXT_PUBLIC_LOANS_HUB_ADDRESS_${chainId}=${hubAddress}`;
  try {
    if (fs.existsSync(rootEnvPath)) {
      let cur = fs.readFileSync(rootEnvPath, 'utf8');
      const k = `NEXT_PUBLIC_LOANS_HUB_ADDRESS_${chainId}`;
      const re = new RegExp(`^${k}=.*$`, 'm');
      if (re.test(cur)) cur = cur.replace(re, line);
      else cur += `\n${line}`;
      fs.writeFileSync(rootEnvPath, cur);
    } else {
      fs.writeFileSync(rootEnvPath, `${line}\n`);
    }
    console.log('Updated .env.local with', line);
  } catch (e) {
    console.log('Could not update .env.local automatically:', e.message);
  }

  console.log('\n✅ Loans Hub deployment complete!');
}

main().catch((e) => { console.error(e); process.exit(1); });

