"use client";
import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { getERC20 } from '@/utils/erc20Client'
import { symbolToBytes32, toUnits } from '@/utils/stablecoinsClient'

interface Props {
  address: string
  scAddress: string
  usdtAddress: string
  symbol: string
  amountUSDT: number
  onApproved: () => void
  setError: (m: string) => void
  minting: boolean
}

export default function MintActions({ address, scAddress, usdtAddress, symbol, amountUSDT, onApproved, setError, minting }: Props) {
  const [needApprove, setNeedApprove] = useState(false)
  const [checking, setChecking] = useState(true)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    const check = async () => {
      setChecking(true)
      setError("")
      try {
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const usdt = getERC20(usdtAddress, provider)
        const required = toUnits(amountUSDT.toFixed(6), 6)
        const [bal, allowance] = await Promise.all([
          usdt.balanceOf(address),
          usdt.allowance(address, scAddress),
        ])
        if (bal.lt(required)) {
          setError("Insufficient USDT balance for mint.")
          setNeedApprove(false)
        } else if (allowance.lt(required)) {
          setNeedApprove(true)
        } else {
          setNeedApprove(false)
        }
      } catch (e) {
        setError("Failed to check USDT allowance/balance.")
      }
      setChecking(false)
    }
    if (amountUSDT > 0) check()
  }, [address, scAddress, usdtAddress, amountUSDT, setError])

  const doApprove = async () => {
    try {
      setApproving(true)
      // @ts-ignore
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const usdt = getERC20(usdtAddress, signer)
      const required = toUnits(amountUSDT.toFixed(6), 6)
      const tx = await usdt.approve(scAddress, required)
      await tx.wait()
      setApproving(false)
      setNeedApprove(false)
      onApproved()
    } catch (e: any) {
      setApproving(false)
      const msg = (e?.reason || e?.message || "").toLowerCase()
      if (msg.includes('user denied')) setError('Approval rejected by user.')
      else setError('Approve failed. Check console for details.')
      console.error('approve failed', e)
    }
  }

  if (checking) {
    return (
      <button disabled className="w-full md:w-auto px-6 py-3 rounded-xl bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] font-medium opacity-70">Checking…</button>
    )
  }

  if (needApprove) {
    return (
      <button type="button" onClick={doApprove} disabled={approving} className="w-full md:w-auto px-6 py-3 rounded-xl bg-amber-500 text-white font-medium disabled:opacity-50">
        {approving ? 'Approving…' : 'Approve USDT'}
      </button>
    )
  }

  return (
    <button type="submit" disabled={minting} className="w-full md:w-auto px-6 py-3 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] font-medium disabled:opacity-50">
      {minting ? 'Minting…' : 'Mint Stablecoin'}
    </button>
  )
}

