'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  UserCircleIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { NewEscrow } from '@/components/escrow/NewEscrow'
import { AllEscrows } from '@/components/escrow/AllEscrows'
import { useEscrow } from '@/hooks/useEscrow'

const EscrowPage = () => {
  const { address, isConnected } = useAccount()
  const { escrows, refreshEscrows } = useEscrow()
  const [activeTab, setActiveTab] = useState<'all' | 'create'>('all')

  // Calculate real stats from escrows
  const stats = useMemo(() => {
    return {
      active: escrows.filter(e => e.state === 0).length, // AWAITING_DELIVERY
      completed: escrows.filter(e => e.state === 1).length, // COMPLETED
      disputed: escrows.filter(e => e.state === 2).length, // CLAIMED_ON_EXPIRE
      refunded: escrows.filter(e => e.state === 3).length // REFUNDED
    }
  }, [escrows])

  const handleEscrowCreated = () => {
    setActiveTab('all')
    refreshEscrows()
  }

  if (!isConnected) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[rgb(var(--foreground))]">Escrow</h1>
            <p className="text-[rgb(var(--muted-foreground))]">Secure contract-based transactions with built-in dispute resolution</p>
          </div>
        </div>
        <motion.div className="card backdrop-blur-lg p-8 text-center">
          <UserCircleIcon className="w-16 h-16 text-[rgb(var(--primary))] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Please connect your wallet to create and manage escrow contracts.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--foreground))]">
            Escrow
          </h1>
          <p className="text-[rgb(var(--muted-foreground))] mt-1">
            Secure contract-based transactions with built-in dispute resolution
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]/80'
            }`}
          >
            <PlusIcon className="w-4 h-4 inline mr-2" />
            New Escrow
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]/80'
            }`}
          >
            View All
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Active</p>
              <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{stats.active}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Completed</p>
              <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{stats.completed}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Disputed</p>
              <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{stats.disputed}</p>
            </div>
            <XCircleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Refunded</p>
              <p className="text-2xl font-bold text-[rgb(var(--foreground))]">{stats.refunded}</p>
            </div>
            <ArrowPathIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6"
      >
        {activeTab === 'create' ? (
          <NewEscrow onSuccess={handleEscrowCreated} />
        ) : (
          <AllEscrows />
        )}
      </motion.div>
    </div>
  )
}

export default EscrowPage
