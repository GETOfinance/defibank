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

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

async function main() {
  const { ethers } = hre;
  const chainId = hre.network.config.chainId;
  const poolAddr = readEnvVar(`NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_${chainId}`);
  const tokensCSV = readEnvVar(`NEXT_PUBLIC_ORBITAL_TOKENS_${chainId}`);
  if (!poolAddr || !tokensCSV) throw new Error('Missing Orbital envs for this chain');
  const tokens = tokensCSV.split(',').map((s) => s.trim());

  const [signer] = await ethers.getSigners();
  const signerAddr = await signer.getAddress();
  console.log('Signer:', signerAddr);
  console.log('Pool:', poolAddr);
  console.log('Tokens:', tokens);

  const poolArtifact = require('../artifacts/contracts/IntegratedOrbital.sol/OrbitalPool.json');
  const pool = new ethers.Contract(poolAddr, poolArtifact.abi, signer);

  // 1) Prepare small addLiquidity across 5 tokens
  const targetEach = '0.01'; // per-token, small
  let k = 1000n;

  const decimals = [];
  const symbols = [];
  const tokenContracts = tokens.map((addr) => new ethers.Contract(addr, ERC20_ABI, signer));
  for (let i = 0; i < 5; i++) {
    const [sym, dec] = await Promise.all([
      tokenContracts[i].symbol().catch(() => `TOK${i}`),
      tokenContracts[i].decimals().catch(() => 18),
    ]);
    symbols[i] = sym;
    decimals[i] = dec;
  }

  // Check balances
  const balances = await Promise.all(tokenContracts.map((t) => t.balanceOf(signerAddr)));
  console.log('Balances:', balances.map((b, i) => `${symbols[i]}=${b.toString()}`));

  const amounts = [];
  for (let i = 0; i < 5; i++) {
    const amt = ethers.parseUnits(targetEach, decimals[i]);
    amounts[i] = amt;
    // Approve if needed
    const current = await tokenContracts[i].allowance(signerAddr, poolAddr);
    if (current < amt) {
      console.log(`Approving ${symbols[i]} to MaxUint256...`);
      await (await tokenContracts[i].approve(poolAddr, ethers.MaxUint256)).wait();
    }
  }

  // 1.5) Compute k from helper to satisfy constraint
  const helperAddr = readEnvVar(`NEXT_PUBLIC_ORBITAL_HELPER_ADDRESS_${chainId}`);
  if (helperAddr) {
    try {
      const helper = new ethers.Contract(helperAddr, [
        'function calculateRadius(uint256[] reserves) returns (uint256)'
      ], signer);
      const dyn = amounts.map(a => BigInt(a.toString()));
      const calcFn = helper.getFunction('calculateRadius');
      const radius = await calcFn.staticCall(dyn);
      const PRECISION = 10n ** 15n;
      const SQRT5_SCALED = 2236067977499790n;
      const reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
      // Choose k slightly above constraint to avoid boundary flip rounding
      k = reserveConstraint + 1n;
      console.log('Computed radius:', radius.toString(), 'reserveConstraint:', reserveConstraint.toString(), 'k:', k.toString());
    } catch (e) {
      console.log('Helper calculateRadius failed, fallback to k=1000');
    }
  }

  // 2) Add Liquidity
  console.log('Adding liquidity k=', k.toString(), 'amounts=', amounts.map(a=>a.toString()));
  const addTx = await pool.addLiquidity(k, amounts);
  const addRcpt = await addTx.wait();
  console.log('addLiquidity tx:', addTx.hash);

  // 3) Fetch LP shares then remove 1 share if possible
  const userShares = await pool.getLpShares(k, signerAddr);
  console.log('LP shares after add:', userShares.toString());
  if (userShares > 0n) {
    const remove = 1n;
    console.log('Removing LP shares:', remove.toString());
    const remTx = await pool.removeLiquidity(k, remove);
    const remRcpt = await remTx.wait();
    console.log('removeLiquidity tx:', remTx.hash);
  } else {
    console.log('No LP shares minted; skipping remove.');
  }

  // 4) Swap token0 -> token1 small amount with slippage control
  const t0d = decimals[0];
  const t1d = decimals[1];
  const swapIn = ethers.parseUnits('0.005', t0d);
  const swapFn = pool.getFunction('swap');
  const quoted = await swapFn.staticCall(0, 1, swapIn, 0);
  const minOut = (quoted * 98n) / 100n; // 2% slippage tolerance
  console.log(`Swap quote: 0.005 ${symbols[0]} -> ~${ethers.formatUnits(quoted, t1d)} ${symbols[1]}; minOut=${ethers.formatUnits(minOut, t1d)}`);
  const swapTx = await pool.swap(0, 1, swapIn, minOut);
  const swapRcpt = await swapTx.wait();
  console.log('swap tx:', swapTx.hash);

  console.log('Live flow complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });

