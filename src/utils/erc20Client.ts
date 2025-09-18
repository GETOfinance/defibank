import { ethers } from 'ethers'

export const ERC20_ABI = [
  { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'owner', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
] as const

export function getERC20(address: string, signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(address, ERC20_ABI, signerOrProvider)
}

export function getUsdtAddress(chainId?: number): string | undefined {
  const id = chainId ?? 296
  if (id === 296) return process.env.NEXT_PUBLIC_USDT_ADDRESS_296
  return undefined
}

