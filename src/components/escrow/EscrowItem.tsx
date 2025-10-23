'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  EllipsisVerticalIcon,
  DocumentTextIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'
import { useEscrow } from '@/hooks/useEscrow'

interface EscrowData {
  id: number
  title: string
  description: string
  buyer: string
  seller: string
  amount: string
  fee: string
  createdAt: Date
  expireAt: Date
  clearAt: Date | null
  state: number
}

interface EscrowItemProps {
  escrow: EscrowData
}

const EscrowState = {
  AWAITING_DELIVERY: 0,
  COMPLETED: 1,
  CLAIMED_ON_EXPIRE: 2,
  REFUNDED: 3
}

const stateLabels = {
  [EscrowState.AWAITING_DELIVERY]: 'Active',
  [EscrowState.COMPLETED]: 'Completed',
  [EscrowState.CLAIMED_ON_EXPIRE]: 'Claimed on Expire',
  [EscrowState.REFUNDED]: 'Refunded'
}

const stateColors = {
  [EscrowState.AWAITING_DELIVERY]: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
  [EscrowState.COMPLETED]: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
  [EscrowState.CLAIMED_ON_EXPIRE]: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20',
  [EscrowState.REFUNDED]: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
}

const stateIcons = {
  [EscrowState.AWAITING_DELIVERY]: ClockIcon,
  [EscrowState.COMPLETED]: CheckCircleIcon,
  [EscrowState.CLAIMED_ON_EXPIRE]: XCircleIcon,
  [EscrowState.REFUNDED]: ArrowPathIcon
}

export const EscrowItem: React.FC<EscrowItemProps> = ({ escrow }) => {
  const { address } = useAccount()
  const { deliverFunds, claimFunds, refundEscrow, isLoading } = useEscrow()
  const [showActions, setShowActions] = useState(false)

  const StateIcon = stateIcons[escrow.state]

  // Determine user role
  const userRole = useMemo(() => {
    if (!address) return 'unknown'
    if (address.toLowerCase() === escrow.buyer.toLowerCase()) return 'buyer'
    if (address.toLowerCase() === escrow.seller.toLowerCase()) return 'seller'
    // TODO: Add owner check when we have access to contract owner
    return 'unknown'
  }, [address, escrow.buyer, escrow.seller])

  // Check if escrow is expired
  const isExpired = useMemo(() => {
    return new Date() > escrow.expireAt
  }, [escrow.expireAt])

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (escrow.state !== EscrowState.AWAITING_DELIVERY) return null
    
    const now = new Date()
    const diff = escrow.expireAt.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }, [escrow.expireAt, escrow.state])

  const handleAction = async (action: string) => {
    try {
      const escrowId = BigInt(escrow.id)

      switch (action) {
        case 'deliver':
          await deliverFunds(escrowId)
          break
        case 'claim':
          await claimFunds(escrowId)
          break
        case 'refund':
          await refundEscrow(escrowId)
          break
        default:
          console.log(`Unknown action: ${action}`)
      }

      setShowActions(false)
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const canDeliverFunds = userRole === 'buyer' && escrow.state === EscrowState.AWAITING_DELIVERY
  const canClaimFunds = userRole === 'seller' && escrow.state === EscrowState.AWAITING_DELIVERY && isExpired
  const canRefund = userRole === 'seller' && escrow.state === EscrowState.AWAITING_DELIVERY

  return (
    <motion.div
      layout
      className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6 hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">
              {escrow.title}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stateColors[escrow.state]}`}>
              {stateLabels[escrow.state]}
            </span>
          </div>
          <p className="text-sm text-[rgb(var(--muted-foreground))] mb-3">
            {escrow.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-[rgb(var(--muted-foreground))]">
            <span className="flex items-center gap-1">
              <DocumentTextIcon className="w-4 h-4" />
              ID: {escrow.id}
            </span>
            {timeRemaining && (
              <span className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {timeRemaining}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <StateIcon className="w-6 h-6 text-[rgb(var(--muted-foreground))]" />
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
            >
              <EllipsisVerticalIcon className="w-5 h-5 text-[rgb(var(--muted-foreground))]" />
            </motion.button>
            
            {/* Actions Dropdown */}
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg shadow-lg z-10 min-w-[150px]"
              >
                {canDeliverFunds && (
                  <button
                    onClick={() => handleAction('deliver')}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[rgb(var(--muted))] transition-colors disabled:opacity-50"
                  >
                    Confirm Delivery
                  </button>
                )}
                {canClaimFunds && (
                  <button
                    onClick={() => handleAction('claim')}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[rgb(var(--muted))] transition-colors disabled:opacity-50"
                  >
                    Claim Funds
                  </button>
                )}
                {canRefund && (
                  <button
                    onClick={() => handleAction('refund')}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    Refund
                  </button>
                )}
                <button
                  onClick={() => console.log('Show QR code')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[rgb(var(--muted))] transition-colors"
                >
                  <QrCodeIcon className="w-4 h-4 inline mr-2" />
                  Show QR
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">Buyer</span>
            <span className="text-sm font-mono">
              {formatAddress(escrow.buyer)}
              {userRole === 'buyer' && (
                <span className="ml-2 text-xs text-[rgb(var(--primary))]">(You)</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">Seller</span>
            <span className="text-sm font-mono">
              {formatAddress(escrow.seller)}
              {userRole === 'seller' && (
                <span className="ml-2 text-xs text-[rgb(var(--primary))]">(You)</span>
              )}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">Amount</span>
            <span className="text-sm font-medium">{escrow.amount} HBAR</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">Fee</span>
            <span className="text-sm">{escrow.fee} HBAR</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">Created</span>
            <span className="text-sm">{escrow.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[rgb(var(--muted-foreground))]">
              {escrow.state === EscrowState.AWAITING_DELIVERY ? 'Expires' : 'Expired'}
            </span>
            <span className="text-sm">{escrow.expireAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(canDeliverFunds || canClaimFunds || canRefund) && (
        <div className="flex gap-2 pt-4 border-t border-[rgb(var(--border))]">
          {canDeliverFunds && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction('deliver')}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Confirm Delivery'}
            </motion.button>
          )}
          
          {canClaimFunds && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction('claim')}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Claim Funds'}
            </motion.button>
          )}
          
          {canRefund && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction('refund')}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Refund'}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  )
}
