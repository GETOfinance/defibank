import { ethers } from 'ethers';
import { IERC20_ABI, ORBITAL_POOL_ABI } from './abi';

export type TokenSymbol = 'USDC' | 'ZAR' | 'NGN' | 'KES' | 'UGX';

export interface TokenInfo {
  symbol: TokenSymbol;
  address: string;
  decimals: number;
}

export interface OrbitalAddresses {
  pool: string;
  helper?: string;
  tokens: string[]; // length 5
}

export function getOrbitalAddressesByChainId(chainId: number): OrbitalAddresses | null {
  // Use static references so Next.js can inline NEXT_PUBLIC_* at build time
  if (chainId === 296) {
    const pool = process.env.NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_296 as string | undefined;
    const helper = process.env.NEXT_PUBLIC_ORBITAL_HELPER_ADDRESS_296 as string | undefined;
    const tokensCSV = process.env.NEXT_PUBLIC_ORBITAL_TOKENS_296 as string | undefined;
    if (!pool || !tokensCSV) return null;
    const tokens = tokensCSV.split(',').map((s) => s.trim());
    return { pool, helper, tokens };
  }
  return null;
}

export function tokenIndex(symbol: TokenSymbol): number {
  return ['USDC', 'ZAR', 'NGN', 'KES', 'UGX'].indexOf(symbol as any);
}

export function getERC20(address: string, signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(address, IERC20_ABI, signerOrProvider);
}

export function getPool(address: string, signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(address, ORBITAL_POOL_ABI, signerOrProvider);
}

export async function getTokenMeta(address: string, provider: ethers.providers.Provider) {
  const erc = getERC20(address, provider);
  const [symbol, decimals] = await Promise.all([
    erc.symbol().catch(() => 'TKN'),
    erc.decimals().catch(() => 18),
  ]);
  return { symbol, decimals };
}

export function toBaseUnits(amount: string, decimals: number) {
  return ethers.utils.parseUnits(amount || '0', decimals);
}

export function fromBaseUnits(amount: ethers.BigNumberish, decimals: number) {
  try { return ethers.utils.formatUnits(amount, decimals); } catch { return '0'; }
}

