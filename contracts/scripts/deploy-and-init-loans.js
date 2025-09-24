const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const network = hre.network.name;
  const chainId = hre.network.config.chainId;
  console.log(`Deploying Orbital and Loans Hub to ${network} (chainId=${chainId})...`);

  // 1) Deploy Orbital set if not present yet
  const deployOrbital = process.env.DEPLOY_ORBITAL !== 'false';
  let usdc;
  if (deployOrbital) {
    const MockUSDC = await hre.ethers.getContractFactory('MockUSDC');
    const tokensMeta = [
      ['USD Coin', 'USDC'],
      ['South African Rand', 'ZAR'],
      ['Nigerian Naira', 'NGN'],
      ['Kenyan Shilling', 'KES'],
      ['Ugandan Shilling', 'UGX'],
    ];

    const tokenContracts = [];
    for (const [name, symbol] of tokensMeta) {
      const c = await MockUSDC.deploy(name, symbol, 0n);
      await c.waitForDeployment();
      tokenContracts.push(c);
      console.log(`Deployed ${symbol} at ${await c.getAddress()}`);
    }

    const [deployer] = await hre.ethers.getSigners();
    for (const c of tokenContracts) {
      await (await c.mint(deployer.address, 1000000n)).wait();
    }

    usdc = await tokenContracts[0].getAddress();

    const Helper = await hre.ethers.getContractFactory('OrbitalMathHelperEVM');
    const helper = await Helper.deploy();
    await helper.waitForDeployment();
    const helperAddress = await helper.getAddress();

    const IERC20Array = tokenContracts.map(t => t.target);
    const Pool = await hre.ethers.getContractFactory('OrbitalPool');
    const pool = await Pool.deploy(IERC20Array, helperAddress);
    await pool.waitForDeployment();

    const poolAddress = await pool.getAddress();
    const rootEnvPath = path.resolve(__dirname, '..', '..', '.env.local');
    const lines = [
      `NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_${chainId}=${poolAddress}`,
      `NEXT_PUBLIC_ORBITAL_HELPER_ADDRESS_${chainId}=${helperAddress}`,
      `NEXT_PUBLIC_ORBITAL_TOKENS_${chainId}=${IERC20Array.join(',')}`,
      ''
    ];
    let updated = '';
    try {
      if (fs.existsSync(rootEnvPath)) {
        const cur = fs.readFileSync(rootEnvPath, 'utf8');
        updated = cur;
        for (const l of lines) {
          const [k] = l.split('=');
          const re = new RegExp(`^${k}=.*$`, 'm');
          if (re.test(updated)) updated = updated.replace(re, l); else updated += `\n${l}`;
        }
      } else {
        updated = lines.join('\n');
      }
      fs.writeFileSync(rootEnvPath, updated);
      console.log('Wrote Orbital addresses to .env.local');
    } catch (e) { console.log('Note: could not write Orbital envs:', e.message); }
  } else {
    usdc = process.env[`ORBITAL_USDC_${chainId}`] || process.env.ORBITAL_USDC;
  }

  // 2) Deploy Loans Hub
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

  // 3) Admin init: addSupportedToken(USDC & WHBAR) + adminSetMarketData
  console.log('Admin init...');
  const [admin] = await hre.ethers.getSigners();

  // Derive WHBAR as an extra ERC-20. Here we deploy a MockUSDC named Wrapped HBAR if not provided.
  let whbar = process.env[`NEXT_PUBLIC_HBAR_ERC20_ADDRESS_${chainId}`] || process.env.NEXT_PUBLIC_HBAR_ERC20_ADDRESS;
  if (!whbar) {
    const MockUSDC = await hre.ethers.getContractFactory('MockUSDC');
    const wrapped = await MockUSDC.deploy('Wrapped HBAR', 'HBAR', 0n);
    await wrapped.waitForDeployment();
    whbar = await wrapped.getAddress();
    const [deployer] = await hre.ethers.getSigners();
    await (await wrapped.mint(deployer.address, 1000000n)).wait();
  }

  // Add supported tokens and set market data
  await (await hub.connect(admin).addSupportedToken(usdc)).wait();
  await (await hub.connect(admin).adminSetMarketData(usdc, hre.ethers.parseEther('1'), hre.ethers.parseEther('0.01'))).wait();
  await (await hub.connect(admin).addSupportedToken(whbar)).wait();
  await (await hub.connect(admin).adminSetMarketData(whbar, hre.ethers.parseEther('0.05'), hre.ethers.parseEther('0.01'))).wait();
  console.log('Admin init complete.');

  // 4) Write Hub env and HBAR ERC-20 env
  const rootEnvPath = path.resolve(__dirname, '..', '..', '.env.local');
  const lines = [
    `NEXT_PUBLIC_LOANS_HUB_ADDRESS_${chainId}=${hubAddress}`,
    `NEXT_PUBLIC_HBAR_ERC20_ADDRESS_${chainId}=${whbar}`,
  ];
  try {
    let updated = '';
    if (fs.existsSync(rootEnvPath)) {
      updated = fs.readFileSync(rootEnvPath, 'utf8');
      for (const l of lines) {
        const [k] = l.split('=');
        const re = new RegExp(`^${k}=.*$`, 'm');
        if (re.test(updated)) updated = updated.replace(re, l); else updated += `\n${l}`;
      }
      fs.writeFileSync(rootEnvPath, updated);
    } else {
      updated = lines.join('\n') + '\n';
      fs.writeFileSync(rootEnvPath, updated);
    }
    console.log('Updated .env.local with Hub and HBAR ERC-20');
  } catch (e) {
    console.log('Could not update .env.local automatically:', e.message);
  }

  console.log('\n✅ Deploy-and-init complete!');
}

main().catch((e)=>{ console.error(e); process.exit(1); });

