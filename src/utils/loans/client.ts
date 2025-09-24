import { ethers } from 'ethers';
import { CROSS_CHAIN_DEFI_HUB_ABI } from './abi';
import { IERC20_ABI } from '@/utils/orbital/abi';

export interface LoansAddresses {
  hub: string; // CrossChainDefiHub
}

export function getLoansAddressesByChainId(chainId: number): LoansAddresses | null {
  const hub = process.env[`NEXT_PUBLIC_LOANS_HUB_ADDRESS_${chainId}` as any] as string | undefined;
  if (!hub) return null;
  return { hub };
}

export function getHub(address: string, signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(address, CROSS_CHAIN_DEFI_HUB_ABI, signerOrProvider);
}

export function getERC20(address: string, signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(address, IERC20_ABI, signerOrProvider);
}

export function toUnits(amount: string, decimals = 18) {
  try { return ethers.utils.parseUnits(amount || '0', decimals); } catch { return ethers.constants.Zero; }
}

export function fromUnits(amount: ethers.BigNumberish, decimals = 18) {
  try { return ethers.utils.formatUnits(amount, decimals); } catch { return '0'; }
}

