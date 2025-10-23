import { getContract, PublicClient, WalletClient } from 'viem'
import { EscrowHubABI } from './abi'

export interface EscrowData {
  id: bigint
  title: string
  description: string
  buyer: `0x${string}`
  seller: `0x${string}`
  amount: bigint
  fee: bigint
  createdAt: bigint
  expireAt: bigint
  clearAt: bigint
  state: number
}

export interface CreateEscrowParams {
  seller: `0x${string}`
  title: string
  description: string
  expireAt: bigint
  amount: bigint
}

export enum EscrowState {
  AWAITING_DELIVERY = 0,
  COMPLETED = 1,
  CLAIMED_ON_EXPIRE = 2,
  REFUNDED = 3
}

export class EscrowClient {
  private contract: any
  private publicClient: PublicClient
  private walletClient: WalletClient | null

  constructor(
    contractAddress: `0x${string}`,
    publicClient: PublicClient,
    walletClient: WalletClient | null
  ) {
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.contract = getContract({
      address: contractAddress,
      abi: EscrowHubABI,
      client: walletClient ? {
        public: publicClient,
        wallet: walletClient,
      } : publicClient,
    })
  }

  /**
   * Create a new escrow contract
   */
  async createEscrow(params: CreateEscrowParams): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations')
    }

    const { seller, title, description, expireAt, amount } = params

    const hash = await this.contract.write.newEscrow(
      [seller, title, description, expireAt],
      { value: amount }
    )

    return hash
  }

  /**
   * Buyer confirms delivery and releases funds to seller
   */
  async deliverFunds(escrowId: bigint): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations')
    }
    const hash = await this.contract.write.deliver([escrowId])
    return hash
  }

  /**
   * Seller claims funds after expiry
   */
  async claimFunds(escrowId: bigint): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations')
    }
    const hash = await this.contract.write.claimAfterExpire([escrowId])
    return hash
  }

  /**
   * Refund escrow to buyer (seller or owner only)
   */
  async refundEscrow(escrowId: bigint): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet client required for write operations')
    }
    const hash = await this.contract.write.refund([escrowId])
    return hash
  }

  /**
   * Get all escrows (public view)
   */
  async getAllEscrows(): Promise<EscrowData[]> {
    console.log('🔍 EscrowClient.getAllEscrows called')
    console.log('📍 Contract address:', this.contract.address)
    try {
      console.log('📞 Calling contract.read.fetchAllEscrows()')
      const escrows = await this.contract.read.fetchAllEscrows()
      console.log('✅ Raw escrows from contract:', escrows.length, 'escrows')
      console.log('📊 Raw escrows data:', escrows)
      const formatted = escrows.map(this.formatEscrowData)
      console.log('✅ Formatted escrows:', formatted.length, 'escrows')
      return formatted
    } catch (error) {
      console.error('❌ Error in getAllEscrows:', error)
      throw error
    }
  }

  /**
   * Get all escrows for the current user
   */
  async getMyEscrows(): Promise<EscrowData[]> {
    const escrows = await this.contract.read.fetchMyEscrows()
    return escrows.map(this.formatEscrowData)
  }

  /**
   * Get a specific escrow by ID
   */
  async getEscrow(escrowId: bigint): Promise<EscrowData> {
    const escrow = await this.contract.read.fetchEscrow([escrowId])
    return this.formatEscrowData(escrow)
  }

  /**
   * Get minimum escrow amount
   */
  async getMinimumEscrow(): Promise<bigint> {
    return await this.contract.read.getMinimumEscrow()
  }

  /**
   * Get fee percentage
   */
  async getFeePercentage(): Promise<bigint> {
    return await this.contract.read.getFeePercentage()
  }

  /**
   * Get total number of escrows
   */
  async getTotalEscrows(): Promise<bigint> {
    return await this.contract.read.getTotalEscrows()
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash: `0x${string}`) {
    return await this.publicClient.waitForTransactionReceipt({ hash })
  }

  /**
   * Format raw escrow data from contract
   */
  private formatEscrowData(rawEscrow: any): EscrowData {
    return {
      id: rawEscrow.id,
      title: rawEscrow.title,
      description: rawEscrow.description,
      buyer: rawEscrow.buyer,
      seller: rawEscrow.seller,
      amount: rawEscrow.amount,
      fee: rawEscrow.fee,
      createdAt: rawEscrow.createdAt,
      expireAt: rawEscrow.expireAt,
      clearAt: rawEscrow.clearAt,
      state: rawEscrow.state
    }
  }

  /**
   * Listen to escrow events
   */
  watchEscrowEvents(callback: (logs: any[]) => void) {
    return this.publicClient.watchContractEvent({
      address: this.contract.address,
      abi: EscrowHubABI,
      eventName: 'EscrowCreated',
      onLogs: callback
    })
  }

  /**
   * Get escrow creation events
   */
  async getEscrowCreatedEvents(fromBlock?: bigint) {
    return await this.publicClient.getContractEvents({
      address: this.contract.address,
      abi: EscrowHubABI,
      eventName: 'EscrowCreated',
      fromBlock: fromBlock || 'earliest'
    })
  }

  /**
   * Get escrow update events
   */
  async getEscrowUpdatedEvents(fromBlock?: bigint) {
    return await this.publicClient.getContractEvents({
      address: this.contract.address,
      abi: EscrowHubABI,
      eventName: 'EscrowUpdated',
      fromBlock: fromBlock || 'earliest'
    })
  }
}

/**
 * Get escrow contract address for the current chain
 */
export function getEscrowContractAddress(chainId: number): `0x${string}` | null {
  // Static environment variable access for Next.js build-time inlining
  if (chainId === 296) {
    return process.env.NEXT_PUBLIC_ESCROW_HUB_ADDRESS_296 as `0x${string}` || null
  }
  
  return null
}

/**
 * Calculate escrow fee
 */
export function calculateEscrowFee(amount: bigint, feePercentage: bigint = 2n): bigint {
  return (amount * feePercentage) / 100n
}

/**
 * Calculate net escrow amount (after fee)
 */
export function calculateNetEscrowAmount(totalAmount: bigint, feePercentage: bigint = 2n): bigint {
  const fee = calculateEscrowFee(totalAmount, feePercentage)
  return totalAmount - fee
}
