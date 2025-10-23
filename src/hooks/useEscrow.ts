import { useState, useEffect, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { toast } from 'react-hot-toast'
import { 
  EscrowClient, 
  EscrowData, 
  CreateEscrowParams, 
  getEscrowContractAddress,
  calculateEscrowFee,
  calculateNetEscrowAmount
} from '@/utils/escrow/client'
import { useChain } from './useChain'

export interface UseEscrowReturn {
  // State
  escrows: EscrowData[]
  isLoading: boolean
  error: string | null
  
  // Contract info
  minimumEscrow: bigint | null
  feePercentage: bigint | null
  totalEscrows: bigint | null
  
  // Actions
  createEscrow: (params: CreateEscrowParams) => Promise<void>
  deliverFunds: (escrowId: bigint) => Promise<void>
  claimFunds: (escrowId: bigint) => Promise<void>
  refundEscrow: (escrowId: bigint) => Promise<void>
  refreshEscrows: () => Promise<void>
  
  // Utilities
  calculateFee: (amount: bigint) => bigint
  calculateNetAmount: (totalAmount: bigint) => bigint
}

export function useEscrow(): UseEscrowReturn {
  const { address, isConnected } = useAccount()
  const { chainId } = useChain()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // State
  const [escrows, setEscrows] = useState<EscrowData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [minimumEscrow, setMinimumEscrow] = useState<bigint | null>(null)
  const [feePercentage, setFeePercentage] = useState<bigint | null>(null)
  const [totalEscrows, setTotalEscrows] = useState<bigint | null>(null)

  // Get contract client for reading (only needs publicClient)
  const getReadClient = useCallback((): EscrowClient | null => {
    if (!publicClient || !chainId) return null

    const contractAddress = getEscrowContractAddress(chainId)
    if (!contractAddress) return null

    // For read operations, we can pass null as walletClient
    return new EscrowClient(contractAddress, publicClient, null)
  }, [publicClient, chainId])

  // Get contract client for writing (needs both clients)
  const getWriteClient = useCallback((): EscrowClient | null => {
    if (!publicClient || !walletClient || !chainId) return null

    const contractAddress = getEscrowContractAddress(chainId)
    if (!contractAddress) return null

    return new EscrowClient(contractAddress, publicClient, walletClient)
  }, [publicClient, walletClient, chainId])

  // Load contract info
  const loadContractInfo = useCallback(async () => {
    const client = getReadClient()
    if (!client) return

    try {
      const [minEscrow, fee, total] = await Promise.all([
        client.getMinimumEscrow(),
        client.getFeePercentage(),
        client.getTotalEscrows()
      ])

      setMinimumEscrow(minEscrow)
      setFeePercentage(fee)
      setTotalEscrows(total)
    } catch (err) {
      console.error('Failed to load contract info:', err)
    }
  }, [getReadClient])

  // Load all escrows (public view)
  const loadEscrows = useCallback(async () => {
    const client = getReadClient()
    if (!client) {
      setEscrows([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const allEscrows = await client.getAllEscrows()
      setEscrows(allEscrows)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load escrows'
      setError(errorMessage)
      console.error('Failed to load escrows:', err)
    } finally {
      setIsLoading(false)
    }
  }, [getReadClient])

  // Create new escrow
  const createEscrow = useCallback(async (params: CreateEscrowParams) => {
    const client = getWriteClient()
    if (!client) {
      throw new Error('Escrow client not available')
    }

    setIsLoading(true)
    setError(null)

    try {
      const hash = await client.createEscrow(params)
      
      toast.promise(
        client.waitForTransaction(hash),
        {
          loading: 'Creating escrow...',
          success: 'Escrow created successfully!',
          error: 'Failed to create escrow'
        }
      )

      await client.waitForTransaction(hash)
      await loadEscrows() // Refresh escrows list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create escrow'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [getWriteClient, loadEscrows])

  // Deliver funds (buyer confirms delivery)
  const deliverFunds = useCallback(async (escrowId: bigint) => {
    const client = getWriteClient()
    if (!client) {
      throw new Error('Escrow client not available')
    }

    setIsLoading(true)
    setError(null)

    try {
      const hash = await client.deliverFunds(escrowId)
      
      toast.promise(
        client.waitForTransaction(hash),
        {
          loading: 'Confirming delivery...',
          success: 'Delivery confirmed! Funds released to seller.',
          error: 'Failed to confirm delivery'
        }
      )

      await client.waitForTransaction(hash)
      await loadEscrows() // Refresh escrows list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm delivery'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [getWriteClient, loadEscrows])

  // Claim funds (seller claims after expiry)
  const claimFunds = useCallback(async (escrowId: bigint) => {
    const client = getWriteClient()
    if (!client) {
      throw new Error('Escrow client not available')
    }

    setIsLoading(true)
    setError(null)

    try {
      const hash = await client.claimFunds(escrowId)
      
      toast.promise(
        client.waitForTransaction(hash),
        {
          loading: 'Claiming funds...',
          success: 'Funds claimed successfully!',
          error: 'Failed to claim funds'
        }
      )

      await client.waitForTransaction(hash)
      await loadEscrows() // Refresh escrows list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim funds'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [getWriteClient, loadEscrows])

  // Refund escrow
  const refundEscrow = useCallback(async (escrowId: bigint) => {
    const client = getWriteClient()
    if (!client) {
      throw new Error('Escrow client not available')
    }

    setIsLoading(true)
    setError(null)

    try {
      const hash = await client.refundEscrow(escrowId)
      
      toast.promise(
        client.waitForTransaction(hash),
        {
          loading: 'Processing refund...',
          success: 'Escrow refunded successfully!',
          error: 'Failed to process refund'
        }
      )

      await client.waitForTransaction(hash)
      await loadEscrows() // Refresh escrows list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process refund'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [getWriteClient, loadEscrows])

  // Refresh escrows
  const refreshEscrows = useCallback(async () => {
    await loadEscrows()
  }, [loadEscrows])

  // Utility functions
  const calculateFee = useCallback((amount: bigint): bigint => {
    return calculateEscrowFee(amount, feePercentage || 2n)
  }, [feePercentage])

  const calculateNetAmount = useCallback((totalAmount: bigint): bigint => {
    return calculateNetEscrowAmount(totalAmount, feePercentage || 2n)
  }, [feePercentage])

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadContractInfo()
  }, [loadContractInfo])

  useEffect(() => {
    loadEscrows()
  }, [loadEscrows])

  return {
    // State
    escrows,
    isLoading,
    error,
    
    // Contract info
    minimumEscrow,
    feePercentage,
    totalEscrows,
    
    // Actions
    createEscrow,
    deliverFunds,
    claimFunds,
    refundEscrow,
    refreshEscrows,
    
    // Utilities
    calculateFee,
    calculateNetAmount
  }
}
