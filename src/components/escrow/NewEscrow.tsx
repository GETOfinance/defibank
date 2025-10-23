'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useAccount } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { 
  PlusIcon, 
  CalendarIcon, 
  UserIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useEscrow } from '@/hooks/useEscrow'

interface NewEscrowFormData {
  title: string
  description: string
  sellerAddress: string
  amount: string
  expireAt: string
}

interface NewEscrowProps {
  onSuccess?: () => void
}

export const NewEscrow: React.FC<NewEscrowProps> = ({ onSuccess }) => {
  const { address } = useAccount()
  const { createEscrow, isLoading, minimumEscrow, feePercentage } = useEscrow()
  const [step, setStep] = useState(1)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset
  } = useForm<NewEscrowFormData>({
    mode: 'onChange',
    defaultValues: {
      amount: '0.001'
    }
  })

  const watchedAmount = watch('amount')
  
  const calculations = useMemo(() => {
    const amount = parseFloat(watchedAmount || '0')
    const feePercent = feePercentage ? Number(feePercentage) / 100 : 0.02 // Default 2% fee
    const fee = amount * feePercent
    const escrowAmount = amount - fee

    return {
      totalAmount: amount,
      fee,
      escrowAmount: Math.max(0, escrowAmount)
    }
  }, [watchedAmount, feePercentage])

  const onSubmit = async (data: NewEscrowFormData) => {
    try {
      const expireTimestamp = Math.floor(new Date(data.expireAt).getTime() / 1000)

      await createEscrow({
        seller: data.sellerAddress as `0x${string}`,
        title: data.title,
        description: data.description,
        expireAt: BigInt(expireTimestamp),
        amount: parseEther(data.amount)
      })

      reset()
      setStep(1)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create escrow:', error)
    }
  }

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                    : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`w-16 h-0.5 mx-2 ${
                    step > stepNumber
                      ? 'bg-[rgb(var(--primary))]'
                      : 'bg-[rgb(var(--muted))]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          <span>Contract Details</span>
          <span>Parties & Amount</span>
          <span>Review & Create</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Contract Details */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4">
                Contract Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                    <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                    Contract Title *
                  </label>
                  <input
                    {...register('title', { required: 'Title is required' })}
                    className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent"
                    placeholder="e.g., Website Development Project"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent"
                    placeholder="Describe the terms and conditions of this escrow..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={nextStep}
                disabled={!watch('title')}
                className="px-6 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Parties & Amount */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4">
                Parties & Amount
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    Seller Address *
                  </label>
                  <input
                    {...register('sellerAddress', { 
                      required: 'Seller address is required',
                      pattern: {
                        value: /^0x[a-fA-F0-9]{40}$/,
                        message: 'Invalid Ethereum address'
                      }
                    })}
                    className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent"
                    placeholder="0x..."
                  />
                  {errors.sellerAddress && (
                    <p className="text-red-500 text-sm mt-1">{errors.sellerAddress.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                    <CurrencyDollarIcon className="w-4 h-4 inline mr-2" />
                    Escrow Amount (HBAR) *
                  </label>
                  <input
                    {...register('amount', { 
                      required: 'Amount is required',
                      min: { value: 0.001, message: 'Minimum amount is 0.001 HBAR' }
                    })}
                    type="number"
                    step="0.001"
                    min="0.001"
                    className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent"
                    placeholder="0.001"
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                  )}
                  
                  {/* Fee Breakdown */}
                  <div className="mt-2 p-3 bg-[rgb(var(--muted))] rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span>{calculations.totalAmount.toFixed(6)} HBAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee (2%):</span>
                      <span>{calculations.fee.toFixed(6)} HBAR</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Escrow Amount:</span>
                      <span>{calculations.escrowAmount.toFixed(6)} HBAR</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-2">
                    <CalendarIcon className="w-4 h-4 inline mr-2" />
                    Expiry Date *
                  </label>
                  <input
                    {...register('expireAt', { required: 'Expiry date is required' })}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent"
                  />
                  {errors.expireAt && (
                    <p className="text-red-500 text-sm mt-1">{errors.expireAt.message}</p>
                  )}
                  <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                    Seller can claim funds automatically after this date
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-[rgb(var(--border))] text-[rgb(var(--foreground))] rounded-lg font-medium"
              >
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={nextStep}
                disabled={!watch('sellerAddress') || !watch('amount') || !watch('expireAt')}
                className="px-6 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-4">
                Review & Create
              </h3>
              
              <div className="bg-[rgb(var(--muted))] rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Title:</span>
                  <span>{watch('title')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Seller:</span>
                  <span className="font-mono text-sm">{watch('sellerAddress')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Amount:</span>
                  <span>{calculations.escrowAmount.toFixed(6)} HBAR</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Fee:</span>
                  <span>{calculations.fee.toFixed(6)} HBAR</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">{calculations.totalAmount.toFixed(6)} HBAR</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Expires:</span>
                  <span>{watch('expireAt')}</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex">
                  <InformationCircleIcon className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Funds will be locked until delivery confirmation or expiry</li>
                      <li>You can confirm delivery to release funds to the seller</li>
                      <li>Seller can claim funds automatically after expiry date</li>
                      <li>Disputes can be resolved by the platform owner</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-[rgb(var(--border))] text-[rgb(var(--foreground))] rounded-lg font-medium"
              >
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Escrow'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  )
}
