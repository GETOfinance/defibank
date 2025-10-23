'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { EscrowItem } from './EscrowItem'
import { useEscrow } from '@/hooks/useEscrow'
import { formatEther } from 'viem'

// No mock data - using real on-chain data only

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

export const AllEscrows: React.FC = () => {
  const { escrows: realEscrows, isLoading, refreshEscrows } = useEscrow()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')

  // Convert real escrows to display format
  const displayEscrows = useMemo(() => {
    return realEscrows.map(escrow => ({
      id: Number(escrow.id),
      title: escrow.title,
      description: escrow.description,
      buyer: escrow.buyer,
      seller: escrow.seller,
      amount: formatEther(escrow.amount),
      fee: formatEther(escrow.fee),
      createdAt: new Date(Number(escrow.createdAt) * 1000),
      expireAt: new Date(Number(escrow.expireAt) * 1000),
      clearAt: escrow.clearAt > 0 ? new Date(Number(escrow.clearAt) * 1000) : null,
      state: escrow.state
    }))
  }, [realEscrows])

  // Use only real escrows from the blockchain
  const escrowsToUse = displayEscrows

  // Filter and sort escrows
  const filteredEscrows = useMemo(() => {
    let filtered = escrowsToUse

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(escrow =>
        escrow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        escrow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        escrow.id.toString().includes(searchTerm)
      )
    }

    // Filter by state
    if (filterState !== 'all') {
      filtered = filtered.filter(escrow => escrow.state === filterState)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return b.createdAt.getTime() - a.createdAt.getTime()
      } else {
        return parseFloat(b.amount) - parseFloat(a.amount)
      }
    })

    return filtered
  }, [searchTerm, filterState, sortBy, escrowsToUse])

  // Calculate stats
  const stats = useMemo(() => {
    return {
      active: escrowsToUse.filter(e => e.state === EscrowState.AWAITING_DELIVERY).length,
      completed: escrowsToUse.filter(e => e.state === EscrowState.COMPLETED).length,
      disputed: escrowsToUse.filter(e => e.state === EscrowState.CLAIMED_ON_EXPIRE).length,
      refunded: escrowsToUse.filter(e => e.state === EscrowState.REFUNDED).length
    }
  }, [escrowsToUse])

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[rgb(var(--muted))] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Active</p>
              <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{stats.active}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-[rgb(var(--muted))] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Completed</p>
              <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{stats.completed}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-[rgb(var(--muted))] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Disputed</p>
              <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{stats.disputed}</p>
            </div>
            <XCircleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-[rgb(var(--muted))] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Refunded</p>
              <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{stats.refunded}</p>
            </div>
            <ArrowPathIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search by title, description, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent"
          >
            <option value="all">All States</option>
            <option value={EscrowState.AWAITING_DELIVERY}>Active</option>
            <option value={EscrowState.COMPLETED}>Completed</option>
            <option value={EscrowState.CLAIMED_ON_EXPIRE}>Claimed</option>
            <option value={EscrowState.REFUNDED}>Refunded</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
            className="px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>

      {/* Escrows List */}
      <div className="space-y-4">
        {filteredEscrows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto bg-[rgb(var(--muted))] rounded-full flex items-center justify-center mb-4">
              <FunnelIcon className="w-8 h-8 text-[rgb(var(--muted-foreground))]" />
            </div>
            <h3 className="text-lg font-medium text-[rgb(var(--foreground))] mb-2">
              No escrows found
            </h3>
            <p className="text-[rgb(var(--muted-foreground))]">
              {searchTerm || filterState !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first escrow to get started'
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredEscrows.map((escrow, index) => (
              <motion.div
                key={escrow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <EscrowItem escrow={escrow} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Load More Button (for future pagination) */}
      {filteredEscrows.length > 0 && filteredEscrows.length >= 10 && (
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 border border-[rgb(var(--border))] text-[rgb(var(--foreground))] rounded-lg font-medium hover:bg-[rgb(var(--muted))]"
          >
            Load More
          </motion.button>
        </div>
      )}
    </div>
  )
}
