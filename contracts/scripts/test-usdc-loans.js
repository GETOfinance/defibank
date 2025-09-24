const hre = require('hardhat');

async function main() {
  const chainId = hre.network.config.chainId;
  const [signer] = await hre.ethers.getSigners();

  const hubAddr = process.env[`NEXT_PUBLIC_LOANS_HUB_ADDRESS_${chainId}`];
  const tokensCsv = process.env[`NEXT_PUBLIC_ORBITAL_TOKENS_${chainId}`];
  if (!hubAddr || !tokensCsv) throw new Error('Missing env: Hub or Orbital tokens');
  const usdc = tokensCsv.split(',')[0];

  console.log('Chain:', chainId);
  console.log('Signer:', signer.address);
  console.log('Hub:', hubAddr);
  console.log('USDC:', usdc);

  const Hub = await hre.ethers.getContractFactory('CrossChainDefiHub');
  const hub = Hub.attach(hubAddr).connect(signer);

  const ercAbi = [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ];
  const erc = await hre.ethers.getContractAt(ercAbi, usdc, signer);
  const dec = await erc.decimals().catch(()=>18);
  const toUnits = (x) => hre.ethers.parseUnits(x, dec);

  const balBefore = await erc.balanceOf(signer.address);
  console.log('USDC balance (before):', hre.ethers.formatUnits(balBefore, dec));

  // Approve and deposit 1 USDC
  console.log('Approving 5 USDC to Hub...');
  await (await erc.approve(hubAddr, toUnits('5'))).wait();
  console.log('Depositing 1 USDC...');
  await (await hub.deposit(usdc, toUnits('1'))).wait();

  // Withdraw 0.4 USDC
  console.log('Withdrawing 0.4 USDC...');
  await (await hub.withdraw(usdc, toUnits('0.4'))).wait();

  const balAfter = await erc.balanceOf(signer.address);
  console.log('USDC balance (after):', hre.ethers.formatUnits(balAfter, dec));

  console.log('USDC deposit/withdraw test completed');
}

main().catch((e)=>{ console.error(e); process.exit(1); });

