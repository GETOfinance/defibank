"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import { getOrbitalAddressesByChainId, getERC20, getPool, tokenIndex, fromBaseUnits, toBaseUnits } from '@/utils/orbital/client';
import { sphericalQuoteOut, priceImpact } from '@/utils/orbital/quote';

export function useOrbital() {
  const { address, chain } = useAccount();
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [addresses, setAddresses] = useState<ReturnType<typeof getOrbitalAddressesByChainId> | null>(null);
  const [tokenAddrs, setTokenAddrs] = useState<string[]>([]);
  const [decimals, setDecimals] = useState<number[]>([18,18,18,18,18]);
  const [balances, setBalances] = useState<string[]>(["0","0","0","0","0"]);
  const [allowances, setAllowances] = useState<string[]>(["0","0","0","0","0"]);
  const [reserves, setReserves] = useState<bigint[]>([0n,0n,0n,0n,0n]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const p = new ethers.providers.Web3Provider((window as any).ethereum);
      setProvider(p);
      setSigner(p.getSigner());
    }
  }, []);

  // Load addresses from env based on chainId
  useEffect(() => {
    if (!chain?.id) return;
    setAddresses(getOrbitalAddressesByChainId(chain.id) || null);
  }, [chain?.id]);

  // Token addresses and decimals
  useEffect(() => {
    (async () => {
      if (!provider || !addresses?.tokens) return;
      setTokenAddrs(addresses.tokens);
      const decs = await Promise.all(addresses.tokens.map(async (addr) => {
        try { return await getERC20(addr, provider).decimals(); } catch { return 18; }
      }));
      setDecimals(decs);
    })();
  }, [provider, addresses?.tokens]);

  // Refresh balances, allowances, reserves
  const refresh = useCallback(async () => {
    if (!provider || !signer || !address || !addresses?.pool || tokenAddrs.length !== 5) return;
    const pool = getPool(addresses.pool, provider);

    // balances and allowances
    const bals: string[] = [];
    const alls: string[] = [];
    for (let i=0;i<5;i++) {
      const erc = getERC20(tokenAddrs[i], provider);
      const [bal, allowance] = await Promise.all([
        erc.balanceOf(address),
        erc.allowance(address, addresses.pool),
      ]);
      bals.push(fromBaseUnits(bal, decimals[i] || 18));
      alls.push(fromBaseUnits(allowance, decimals[i] || 18));
    }
    setBalances(bals);
    setAllowances(alls);

    // reserves
    try {
      const r = await pool._getTotalReserves();
      setReserves(Array.from(r).map((x: any) => BigInt(x.toString())));
    } catch (e) {
      // If view not available (name leading underscore), consider adding a public getter; fallback to zeros
      setReserves([0n,0n,0n,0n,0n]);
    }
  }, [provider, signer, address, addresses?.pool, tokenAddrs, decimals]);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = useCallback(async (symbol: string, amount: string) => {
    if (!signer || !addresses?.pool) throw new Error('Not ready');
    const idx = tokenIndex(symbol as any);
    const erc = getERC20(tokenAddrs[idx], signer);
    const tx = await erc.approve(addresses.pool, toBaseUnits(amount, decimals[idx]));
    await tx.wait();
    await refresh();
  }, [signer, addresses?.pool, tokenAddrs, decimals, refresh]);

  const quoteOut = useCallback((fromSym: string, toSym: string, amount: string) => {
    const iIn = tokenIndex(fromSym as any);
    const iOut = tokenIndex(toSym as any);
    const amt = toBaseUnits(amount || '0', decimals[iIn] || 18).toBigInt();
    const amtAfterFee = (amt * BigInt(997000)) / BigInt(1000000); // assume 0.3% until read from pool
    const out = sphericalQuoteOut(reserves, iIn, iOut, amtAfterFee);
    const impact = priceImpact(reserves, iIn, iOut, amtAfterFee);
    return { amountOut: out, priceImpact: impact };
  }, [reserves, decimals]);

  const swap = useCallback(async (fromSym: string, toSym: string, amount: string, minOutPct = 0.98) => {
    if (!signer || !addresses?.pool) throw new Error('Not ready');
    const iIn = tokenIndex(fromSym as any);
    const iOut = tokenIndex(toSym as any);
    const pool = getPool(addresses.pool, signer);
    const amtIn = toBaseUnits(amount, decimals[iIn]);
    const { amountOut } = await pool.callStatic.swap(iIn, iOut, amtIn, 0);
    const minOut = (amountOut.mul(Math.floor(minOutPct * 10000))).div(10000); // keep BN path
    const tx = await pool.swap(iIn, iOut, amtIn, minOut);
    await tx.wait();
    await refresh();
  }, [signer, addresses?.pool, decimals, refresh]);

  const addLiquidity = useCallback(async (k: string, amountsBySymbol: Record<string,string>) => {
    if (!signer || !addresses?.pool) throw new Error('Not ready');
    const pool = getPool(addresses.pool, signer);
    // Build uint256[5]
    const arr: any[] = [0,0,0,0,0];
    const syms = ['USDC','USDT','DAI','FRAX','LUSD'];
    for (let i=0;i<5;i++) {
      const sym = syms[i];
      const amt = toBaseUnits(amountsBySymbol[sym] || '0', decimals[i]);
      arr[i] = amt;
    }
    const tx = await pool.addLiquidity(ethers.BigNumber.from(k), arr);
    await tx.wait();
    await refresh();
  }, [signer, addresses?.pool, decimals, refresh]);

  const removeLiquidity = useCallback(async (k: string, lpShares: string) => {
    if (!signer || !addresses?.pool) throw new Error('Not ready');
    const pool = getPool(addresses.pool, signer);
    const tx = await pool.removeLiquidity(ethers.BigNumber.from(k), ethers.BigNumber.from(lpShares));
    await tx.wait();
    await refresh();
  }, [signer, addresses?.pool, refresh]);

  return {
    ready: Boolean(address && addresses?.pool && tokenAddrs.length === 5),
    chainId: chain?.id,
    addresses,
    tokenAddrs,
    decimals,
    balances,
    allowances,
    reserves,
    refresh,
    approve,
    quoteOut,
    swap,
    addLiquidity,
    removeLiquidity,
  };
}

