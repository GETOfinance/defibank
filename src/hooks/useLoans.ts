"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { getLoansAddressesByChainId, getHub, getERC20, toUnits, fromUnits } from '@/utils/loans/client';

export function useLoans() {
  const { address, chain } = useAccount();
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [addresses, setAddresses] = useState<ReturnType<typeof getLoansAddressesByChainId> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const p = new ethers.providers.Web3Provider((window as any).ethereum);
      setProvider(p);
      setSigner(p.getSigner());
    }
  }, []);

  useEffect(() => {
    if (!chain?.id) return;
    setAddresses(getLoansAddressesByChainId(chain.id));
  }, [chain?.id]);

  const hub = useMemo(() => (addresses?.hub && provider ? getHub(addresses.hub, provider) : null), [addresses?.hub, provider]);

  const getDecimals = useCallback(async (token: string) => {
    if (!provider) return 18;
    try { return await getERC20(token, provider).decimals(); } catch { return 18; }
  }, [provider]);

  const approve = useCallback(async (token: string, spender: string, amount: string) => {
    if (!signer) throw new Error('Not ready');
    const dec = await getDecimals(token);
    const tx = await getERC20(token, signer).approve(spender, toUnits(amount, dec));
    await tx.wait();
  }, [signer, getDecimals]);

  const deposit = useCallback(async (token: string, amount: string) => {
    if (!signer || !addresses?.hub) throw new Error('Not ready');
    const dec = await getDecimals(token);
    const tx = await getHub(addresses.hub, signer).deposit(token, toUnits(amount, dec));
    await tx.wait();
  }, [signer, addresses?.hub, getDecimals]);

  const withdraw = useCallback(async (token: string, amount: string) => {
    if (!signer || !addresses?.hub) throw new Error('Not ready');
    const dec = await getDecimals(token);
    const tx = await getHub(addresses.hub, signer).withdraw(token, toUnits(amount, dec));
    await tx.wait();
  }, [signer, addresses?.hub, getDecimals]);

  const borrow = useCallback(async (token: string, amount: string) => {
    if (!signer || !addresses?.hub) throw new Error('Not ready');
    const dec = await getDecimals(token);
    const tx = await getHub(addresses.hub, signer).borrow(token, toUnits(amount, dec));
    await tx.wait();
  }, [signer, addresses?.hub, getDecimals]);

  const repay = useCallback(async (token: string, amount: string) => {
    if (!signer || !addresses?.hub) throw new Error('Not ready');
    const dec = await getDecimals(token);
    const tx = await getHub(addresses.hub, signer).repay(token, toUnits(amount, dec));
    await tx.wait();
  }, [signer, addresses?.hub, getDecimals]);

  const getUserDeposits = useCallback(async (user: string, token: string) => {
    if (!hub) return '0';
    const dec = await getDecimals(token);
    const v: any = await hub.getUserDeposits(user, token);
    return fromUnits(v, dec);
  }, [hub, getDecimals]);

  const getUserBorrowed = useCallback(async (user: string, token: string) => {
    if (!hub) return '0';
    const dec = await getDecimals(token);
    const v: any = await hub.getUserBorrowed(user, token);
    return fromUnits(v, dec);
  }, [hub, getDecimals]);

  const getProtocolStats = useCallback(async () => {
    if (!hub) return null as null | { totalDeposits: string; totalBorrowed: string; utilizationRate: string; protocolFees: string };
    const res: any = await hub.getProtocolStats();
    return {
      totalDeposits: res.totalDeposits?.toString?.() ?? res._totalDeposits?.toString?.() ?? res[0]?.toString?.() ?? '0',
      totalBorrowed: res.totalBorrowed?.toString?.() ?? res._totalBorrowed?.toString?.() ?? res[1]?.toString?.() ?? '0',
      protocolFees: res.protocolFees?.toString?.() ?? res._protocolFees?.toString?.() ?? res[2]?.toString?.() ?? '0',
      utilizationRate: res.utilizationRate?.toString?.() ?? res[3]?.toString?.() ?? '0',
    };
  }, [hub]);

  const getUserProfile = useCallback(async (user: string) => {
    if (!hub) return null as null | { healthFactor: string; creditScore: string; lastActivity: string; isActive: boolean };
    const res: any = await hub.getUserProfile(user);
    return {
      healthFactor: res.healthFactor?.toString?.() ?? res[0]?.toString?.() ?? '0',
      creditScore: res.creditScore?.toString?.() ?? res[1]?.toString?.() ?? '0',
      lastActivity: res.lastActivity?.toString?.() ?? res[2]?.toString?.() ?? '0',
      isActive: (typeof res.isActive === 'boolean' ? res.isActive : res[3]) ?? false,
    };
  }, [hub]);

  return {
    ready: Boolean(address && addresses?.hub),
    chainId: chain?.id,
    addresses,
    approve,
    deposit,
    withdraw,
    borrow,
    repay,
    getUserDeposits,
    getUserBorrowed,
    getProtocolStats,
    getUserProfile,
  };
}

