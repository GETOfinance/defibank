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
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)'
];
const MINT_ABI = ['function mint(address,uint256)'];

function sqrtBigInt(value) {
  if (value < 0n) throw new Error('negative');
  if (value < 2n) return value;
  let x0 = value / 2n;
  let x1 = (x0 + value / x0) / 2n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + value / x0) / 2n;
  }
  return x0;
}

async function main() {
  const { ethers } = hre;
  const chainId = hre.network.config.chainId;
  const poolAddr = readEnvVar(`NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_${chainId}`);
  const tokensCSV = readEnvVar(`NEXT_PUBLIC_ORBITAL_TOKENS_${chainId}`);
  if (!poolAddr || !tokensCSV) throw new Error('Missing Orbital envs for this chain');
  const tokens = tokensCSV.split(',');

  const [signer] = await ethers.getSigners();
  console.log('Signer:', signer.address);
  console.log('Pool:', poolAddr);
  console.log('Tokens:', tokens);

  // Prepare 5 amounts of 1.0 each (respecting decimals), mint if possible and approve
  const amounts = [];
  const amountsBI = [];
  for (let i=0;i<5;i++) {
    const t = new ethers.Contract(tokens[i], ERC20_ABI, signer);
    const dec = await t.decimals().catch(() => 18);
    const amt = hre.ethers.parseUnits('1', dec);
    amounts.push(amt);
    amountsBI.push(BigInt(amt.toString()));
    try {
      const minter = new ethers.Contract(tokens[i], MINT_ABI, signer);
      await (await minter.mint(signer.address, amt)).wait();
    } catch {}
    const cur = await t.allowance(signer.address, poolAddr).catch(()=>0n);
    if (cur < amt) {
      await (await t.approve(poolAddr, hre.ethers.MaxUint256)).wait();
    }
  }

  // Compute radius off-chain: sqrt(sum(amount_i^2))
  let sumSquares = 0n;
  for (const a of amountsBI) {
    sumSquares += a * a;
  }
  const r = sqrtBigInt(sumSquares);
  const PRECISION = 1000000000000000n; // 1e15
  const SQRT5_SCALED = 2236067977499790n; // ~sqrt(5)*1e15
  const sqrt5MinusOne = SQRT5_SCALED - PRECISION;
  const lowerBound = (sqrt5MinusOne * r) / PRECISION;
  const upperBound = (4n * r * PRECISION) / SQRT5_SCALED;
  const reserveConstraint = (r * PRECISION) / SQRT5_SCALED;
  // Choose k in [lowerBound, upperBound], pick midpoint to be safe
  const k = (lowerBound + upperBound) / 2n;
  console.log('r=', r.toString(), 'lower=', lowerBound.toString(), 'upper=', upperBound.toString(), 'alpha=', reserveConstraint.toString(), 'k=', k.toString());

  const pool = await ethers.getContractAt('OrbitalPool', poolAddr, signer);
  await (await pool.addLiquidity(k, amounts)).wait();
  console.log('addLiquidity OK at k =', k.toString());

  // Swap token0 -> token1 0.1
  const dec0 = await (new ethers.Contract(tokens[0], ERC20_ABI, signer)).decimals().catch(() => 18);
  const amtIn = hre.ethers.parseUnits('0.1', dec0);
  await (await pool.swap(0, 1, amtIn, 0)).wait();
  console.log('swap OK');
}

main().catch((e) => { console.error(e); process.exit(1); });

