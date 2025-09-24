const hre = require('hardhat');
const { ethers } = hre;

async function main() {
  const chainId = hre.network.config.chainId;
  const hubAddress = process.env[`LOANS_HUB_${chainId}`] || process.env.LOANS_HUB;
  const usdcAddress = process.env[`ORBITAL_USDC_${chainId}`] || process.env.ORBITAL_USDC;
  if (!hubAddress || !usdcAddress) throw new Error('Set LOANS_HUB and ORBITAL_USDC envs');

  const Hub = await ethers.getContractFactory('CrossChainDefiHub');
  const hub = Hub.attach(hubAddress);
  const [admin] = await ethers.getSigners();
  console.log('Admin:', admin.address);

  console.log('addSupportedToken(USDC) ...');
  const tx1 = await hub.connect(admin).addSupportedToken(usdcAddress);
  await tx1.wait();

  console.log('adminSetMarketData(USDC, price=1e18, vol=1e16) ...');
  const tx2 = await hub.connect(admin).adminSetMarketData(usdcAddress, ethers.utils.parseEther('1'), ethers.utils.parseEther('0.01'));
  await tx2.wait();

  console.log('Done.');
}

main().catch((e)=>{ console.error(e); process.exit(1); });

