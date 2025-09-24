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
  const { ethers } = hre;
  const chainId = hre.network.config.chainId;
  const poolAddr = readEnvVar(`NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_${chainId}`);
  const tokensCSV = readEnvVar(`NEXT_PUBLIC_ORBITAL_TOKENS_${chainId}`);
  if (!poolAddr || !tokensCSV) throw new Error('Missing Orbital envs for this chain');
  const tokens = tokensCSV.split(',');

  console.log('Pool:', poolAddr);
  console.log('Tokens:', tokens);

  const pool = await ethers.getContractAt('OrbitalPool', poolAddr);

  // Read tokens() from contract and _getTotalReserves
  const onchainTokens = await Promise.all([0,1,2,3,4].map(i => pool.tokens(i)));
  console.log('On-chain token slots:', onchainTokens);

  let reserves;
  try {
    reserves = await pool._getTotalReserves();
  } catch (e) {
    console.log('Could not call _getTotalReserves():', e.message);
    reserves = [];
  }
  console.log('Reserves:', reserves.map(x => x.toString ? x.toString() : String(x)));
}

main().catch((e) => { console.error(e); process.exit(1); });

