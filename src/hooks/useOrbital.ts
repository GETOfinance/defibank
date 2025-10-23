"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, usePublicClient } from 'wagmi';
import { getOrbitalAddressesByChainId, getERC20, getPool, tokenIndex, fromBaseUnits, toBaseUnits } from '@/utils/orbital/client';
// Using mock FX rates for quotes/swaps (ignore k/invariant)

// Mock FX: amount of local token per 1 USDC, scaled by 1e6 for integer math
const FX_SCALE = 1_000_000n;
const PER_USDC_SCALED: Record<string, bigint> = {
  USDC: 1_000_000n, // 1 USDC per 1 USDC
  ZAR: 18_500_000n, // 18.5 ZAR per 1 USDC
  NGN: 1_600_000_000n, // 1600 NGN per 1 USDC
  KES: 130_000_000n, // 130 KES per 1 USDC
  UGX: 3_800_000_000n, // 3800 UGX per 1 USDC
};


export function useOrbital() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
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

  // Load addresses from env based on chainId; fallback to 296 if not connected
  useEffect(() => {
    const cid = chain?.id ?? 296;
    const addrs = getOrbitalAddressesByChainId(cid) || null;
    setAddresses(addrs);
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
    // Fixed mock FX quote using current pool reserves only for availability cap
    const iIn = tokenIndex(fromSym as any);
    const iOut = tokenIndex(toSym as any);
    const decIn = decimals[iIn] || 18;
    const decOut = decimals[iOut] || 18;
    const amtIn = toBaseUnits(amount || '0', decIn).toBigInt();
    const amtAfterFee = (amtIn * 997000n) / 1000000n; // 0.3% fee
    const pIn = PER_USDC_SCALED[fromSym] || FX_SCALE;
    const pOut = PER_USDC_SCALED[toSym] || FX_SCALE;
    const num = amtAfterFee * pOut * (10n ** BigInt(decOut));
    const den = pIn * (10n ** BigInt(decIn));
    let out = den === 0n ? 0n : (num / den);
    // Cap quoted out by current pool reserves for tokenOut
    const cap = reserves?.[iOut] ?? 0n;
    if (out > cap) out = cap;
    return { amountOut: out, priceImpact: 0 };
  }, [decimals, reserves]);

  const swap = useCallback(async (fromSym: string, toSym: string, amount: string, minOutPct = 0.98) => {
    // Mock swap using fixed FX rates; uses current pool reserves for availability; no on-chain tx
    const iIn = tokenIndex(fromSym as any);
    const iOut = tokenIndex(toSym as any);
    const decIn = decimals[iIn] || 18;
    const decOut = decimals[iOut] || 18;
    const amtInBN = toBaseUnits(amount || '0', decIn);
    const { amountOut } = quoteOut(fromSym, toSym, amount || '0');

    // Ensure pool has enough reserves for out token
    const availOut = reserves?.[iOut] ?? 0n;
    const outBig = BigInt(amountOut.toString());
    if (outBig <= 0n) throw new Error('Insufficient output amount');
    if (outBig > availOut) throw new Error('Insufficient pool reserves for token out');

    // Slippage check vs requested minOutPct
    const asBNOut = ethers.BigNumber.from(amountOut.toString());
    const minOutBN = asBNOut.mul(Math.floor(minOutPct * 10000)).div(10000);
    if (asBNOut.lt(minOutBN)) {
      throw new Error('Mock slippage check failed');
    }

    // Locally update balances
    try {
      const currIn = ethers.utils.parseUnits(balances[iIn] || '0', decIn);
      const currOut = ethers.utils.parseUnits(balances[iOut] || '0', decOut);
      const nextIn = currIn.sub(amtInBN).lt(0) ? ethers.constants.Zero : currIn.sub(amtInBN);
      const nextOut = currOut.add(asBNOut);
      const nextBalances = [...balances];
      nextBalances[iIn] = ethers.utils.formatUnits(nextIn, decIn);
      nextBalances[iOut] = ethers.utils.formatUnits(nextOut, decOut);
      setBalances(nextBalances);
    } catch {
      // ignore formatting errors; balances will refresh on next sync
    }

    // Locally update pool reserves: add net token in (after fee), subtract token out
    try {
      const pIn = PER_USDC_SCALED[fromSym] || FX_SCALE;
      const pOut = PER_USDC_SCALED[toSym] || FX_SCALE;
      const amtInBig = BigInt(amtInBN.toString());
      const amtAfterFee = (amtInBig * 997000n) / 1000000n;
      const nextReserves = [...reserves];
      nextReserves[iIn] = (nextReserves[iIn] ?? 0n) + amtAfterFee;
      nextReserves[iOut] = (nextReserves[iOut] ?? 0n) - outBig;
      setReserves(nextReserves as bigint[]);
    } catch {
      // ignore
    }
  }, [decimals, balances, reserves, quoteOut]);

  const addLiquidity = useCallback(async (k: string, amountsBySymbol: Record<string,string>) => {
    if (!signer || !addresses?.pool) throw new Error('Wallet not connected or pool address missing.');

    // Ensure correct network if possible
    try {
      const net = await (signer.provider as any)?.getNetwork?.();
      if (net?.chainId && Number(net.chainId) !== 296) {
        throw new Error('Wrong network: please connect to Hedera Testnet (chainId 296).');
      }
    } catch {/* ignore if unavailable */}

    // Validate k as integer
    let kBN: ethers.BigNumber;
    try {
      kBN = ethers.BigNumber.from(k);
    } catch {
      throw new Error('k must be an integer.');
    }

    const pool = getPool(addresses.pool, signer);

    // Build uint256[5] with validation and ensure all > 0
    const arr: any[] = [0,0,0,0,0];
    const syms = ['USDC','ZAR','NGN','KES','UGX'];
    let nonPositive = false;
    for (let i=0;i<5;i++) {
      const sym = syms[i];
      const raw = amountsBySymbol[sym] || '0';
      let amt;
      try {
        amt = toBaseUnits(raw, decimals[i]);
      } catch {
        throw new Error(`Invalid amount for ${sym}: "${raw}"`);
      }
      if (amt.lte(0)) nonPositive = true;
      arr[i] = amt;
    }
    if (nonPositive) {
      throw new Error('All five token amounts must be > 0.');
    }

    // Pre-validate k against helper-calculated bounds for these amounts
    if (!addresses?.helper) {
      throw new Error('Helper address missing. Set NEXT_PUBLIC_ORBITAL_HELPER_ADDRESS_296 in .env.local and rebuild.');
    }
    try {
      // Build dyn bigint[] from arr BigNumbers
      const dyn: bigint[] = arr.map((bn: any) => BigInt(bn.toString()));
      // Resolve a read provider similar to suggestK
      const DEFAULT_HEDERA_RPC = (process.env.NEXT_PUBLIC_HEDERA_RPC_296 as string) || 'https://testnet.hashio.io/api';
      let rpc: ethers.Signer | ethers.providers.Provider | null = null;
      if (signer) rpc = signer;
      else if (provider) rpc = provider;
      else {
        const url = (publicClient as any)?.transport?.url || (publicClient as any)?.transport?.urls?.[0] || DEFAULT_HEDERA_RPC;
        rpc = new ethers.providers.JsonRpcProvider(url, { name: 'hedera-testnet', chainId: 296 });
      }
      const helper = new ethers.Contract(addresses.helper, [
        'function calculateRadius(uint256[] reserves) returns (uint256)'
      ], rpc as any);
      // @ts-ignore
      const radius: bigint = helper.callStatic?.calculateRadius
        ? await helper.callStatic.calculateRadius(dyn)
        // @ts-ignore
        : await helper.getFunction('calculateRadius').staticCall(dyn);
      const PRECISION = 10n ** 15n;
      const SQRT5_SCALED = 2236067977499790n;
      const sqrt5MinusOne = SQRT5_SCALED - PRECISION;
      const lowerBound = (sqrt5MinusOne * radius) / PRECISION;
      const upperBound = (4n * radius * PRECISION) / SQRT5_SCALED;
      const reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
      const kBig = BigInt(kBN.toString());
      if (kBig < reserveConstraint) throw new Error(`k must be ≥ reserveConstraint (${reserveConstraint.toString()})`);
      if (kBig < lowerBound) throw new Error(`k is below lower bound (${lowerBound.toString()})`);
      if (kBig > upperBound) throw new Error(`k is above upper bound (${upperBound.toString()})`);
    } catch (err: any) {
      const msg = err?.message || err?.reason || err?.error?.message || 'failed to validate k via helper';
      if (!msg.startsWith('k ')) {
        // Only wrap non-validation errors
        throw new Error(`Failed to validate k via helper: ${msg}`);
      }
      // If it's a validation message, rethrow as-is for UI
      throw new Error(msg);
    }

    // Dry-run to surface revert reason before sending
    try {
      // @ts-ignore ethers v5 callStatic
      await (pool as any).callStatic.addLiquidity(kBN, arr);
    } catch (err: any) {
      const msg = err?.reason || err?.error?.message || err?.message || 'transaction would revert';
      throw new Error(`addLiquidity would revert: ${msg}`);
    }

    try {
      const tx = await pool.addLiquidity(kBN, arr);
      await tx.wait();
      await refresh();
    } catch (err: any) {
      const msg = err?.reason || err?.error?.message || err?.message || 'transaction failed';
      throw new Error(`addLiquidity failed: ${msg}`);
    }
  }, [signer, addresses?.pool, decimals, refresh]);

  const removeLiquidity = useCallback(async (k: string, lpShares: string) => {
    if (!signer || !addresses?.pool) throw new Error('Not ready');
    const pool = getPool(addresses.pool, signer);
    const tx = await pool.removeLiquidity(ethers.BigNumber.from(k), ethers.BigNumber.from(lpShares));
    await tx.wait();
    await refresh();
  }, [signer, addresses?.pool, refresh]);

  // Suggest k and validate k using helper.calculateRadius and the contract's constraints
  const suggestK = useCallback(async (amountsBySymbol: Record<string, string>) => {
    if (!addresses?.helper) {
      throw new Error('Helper address missing. Set NEXT_PUBLIC_ORBITAL_HELPER_ADDRESS_296 in .env.local and rebuild.');
    }

    // Build dynamic reserves vector from entered amounts (base units), order: USDC,ZAR,NGN,KES,UGX
    const syms = ['USDC','ZAR','NGN','KES','UGX'];
    const dyn: bigint[] = [];
    for (let i = 0; i < syms.length; i++) {
      const sym = syms[i];
      const raw = amountsBySymbol[sym] || '0';
      try {
        const parsed = toBaseUnits(raw, decimals[i]);
        dyn.push(BigInt(parsed.toString()));
      } catch {
        throw new Error(`Invalid amount for ${sym}: "${raw}"`);
      }
    }

    // Choose a read-only RPC for static call: signer -> injected provider -> wagmi public client -> public Hedera RPC
    const DEFAULT_HEDERA_RPC = (process.env.NEXT_PUBLIC_HEDERA_RPC_296 as string) || 'https://testnet.hashio.io/api';
    let rpc: ethers.Signer | ethers.providers.Provider | null = null;
    if (signer) rpc = signer;
    else if (provider) rpc = provider;
    else {
      const url = (publicClient as any)?.transport?.url || (publicClient as any)?.transport?.urls?.[0] || DEFAULT_HEDERA_RPC;
      rpc = new ethers.providers.JsonRpcProvider(url, { name: 'hedera-testnet', chainId: 296 });
    }

    // If we have a signer or injected provider, ensure it's on Hedera Testnet (296)
    const providerForCheck: any = (signer as any)?.provider || provider;
    if (providerForCheck?.getNetwork) {
      try {
        const net = await providerForCheck.getNetwork();
        if (net?.chainId && Number(net.chainId) !== 296) {
          throw new Error('Wrong network: please connect to Hedera Testnet (chainId 296).');
        }
      } catch (err) {
        // If getNetwork itself fails, continue; the subsequent call may still work via fallback
      }
    }

    const helper = new ethers.Contract(addresses.helper, [
      'function calculateRadius(uint256[] reserves) returns (uint256)'
    ], rpc as any);

    let radius: bigint;
    try {
      // Prefer v5 style callStatic; if not present, fallback
      // @ts-ignore
      radius = helper.callStatic?.calculateRadius
        ? await helper.callStatic.calculateRadius(dyn)
        // @ts-ignore
        : await helper.getFunction('calculateRadius').staticCall(dyn);
    } catch (err: any) {
      const msg = (err && err.message) ? String(err.message) : 'unknown error';
      throw new Error(`Failed to calculate radius via helper: ${msg}`);
    }

    const PRECISION = 10n ** 15n;
    const SQRT5_SCALED = 2236067977499790n;
    const sqrt5MinusOne = SQRT5_SCALED - PRECISION;
    const lowerBound = (sqrt5MinusOne * radius) / PRECISION;
    const upperBound = (4n * radius * PRECISION) / SQRT5_SCALED;
    const reserveConstraint = (radius * PRECISION) / SQRT5_SCALED;
    const k = reserveConstraint + 1n; // nudge above constraint
    return { k, lowerBound, upperBound, reserveConstraint, radius };
  }, [provider, signer, addresses?.helper, decimals, publicClient]);

  const validateK = useCallback((kStr: string, info?: { lowerBound: bigint; upperBound: bigint; reserveConstraint: bigint; }) => {
    try {
      const k = BigInt(kStr);
      if (!info) return { valid: true, reason: '' };
      const { lowerBound, upperBound, reserveConstraint } = info;
      if (k < lowerBound) return { valid: false, reason: `k is below lower bound (${lowerBound.toString()})` };
      if (k > upperBound) return { valid: false, reason: `k is above upper bound (${upperBound.toString()})` };
      if (k < reserveConstraint) return { valid: false, reason: `k must be ≥ reserveConstraint (${reserveConstraint.toString()})` };
      return { valid: true, reason: '' };
    } catch {
      return { valid: false, reason: 'k must be an integer' };
    }
  }, []);

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
    suggestK,
    validateK,
  };
}

