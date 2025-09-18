import { ethers } from 'ethers'

// Minimal ABI for StableCoins.sol
export const STABLECOINS_ABI = [
  {
    inputs: [],
    name: 'DECIMALS',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'listSymbols',
    outputs: [{ internalType: 'bytes32[]', name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'bytes32', name: 'symbol', type: 'bytes32' },
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'symbol', type: 'bytes32' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'symbol', type: 'bytes32' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export function getStableCoinsAddress(chainId?: number): string | undefined {
  // App is Hedera-only; default chainId 296 if not provided. Must reference literal env key for Next.js bundling.
  const id = chainId ?? 296
  if (id === 296) return process.env.NEXT_PUBLIC_STABLECOINS_ADDRESS_296
  return undefined
}

export function getStableCoins(
  address: string,
  signerOrProvider: ethers.Signer | ethers.providers.Provider
) {
  return new ethers.Contract(address, STABLECOINS_ABI, signerOrProvider)
}

export function toUnits(amount: string | number, decimals = 6) {
  try {
    return ethers.utils.parseUnits((amount ?? '0').toString(), decimals)
  } catch {
    return ethers.constants.Zero
  }
}

export function fromUnits(amount: ethers.BigNumberish, decimals = 6) {
  try {
    return ethers.utils.formatUnits(amount, decimals)
  } catch {
    return '0'
  }
}

export function symbolToBytes32(sym: string) {
  return ethers.utils.formatBytes32String(sym)
}

