"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BanknotesIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { oraclePrices, AfricanCurrency, getOraclePrice, localToUSDT } from "@/utils/mockOracle";
import { useAccount } from "wagmi";
import { getHoldings, getHistory, mintStablecoin, burnStablecoin, HistoryItem } from "@/utils/stablecoinService";
import { getStableCoinsAddress, getStableCoins, symbolToBytes32, toUnits, fromUnits } from "@/utils/stablecoinsClient";
import { getERC20, getUsdcAddress } from "@/utils/erc20Client";
import { ethers } from "ethers";
import MintActions from "./MintActions";

// This page simulates minting and burning African currency stablecoins
// backed by USDC price using a mock oracle. No on-chain txs are performed.

export default function StablecoinsPage() {
  const { address } = useAccount();
  const [mode, setMode] = useState<"mint" | "burn">("mint");
  const [symbol, setSymbol] = useState<AfricanCurrency>("NGN");
  const [amountLocal, setAmountLocal] = useState<string>("");
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [scAddress, setScAddress] = useState<string | undefined>(undefined);
  const [usdtAddress, setUsdtAddress] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string>("");
  const [approving, setApproving] = useState(false);
  const [minting, setMinting] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setScAddress(getStableCoinsAddress(296));
    setUsdtAddress(getUsdcAddress(296));
    setHoldings(getHoldings());
    setHistory(getHistory());
  }, []);

  const price = useMemo(() => getOraclePrice(symbol), [symbol]);

  // Load on-chain balance for selected symbol when configured
  useEffect(() => {
    const run = async () => {
      if (!address || !scAddress) return;
      try {
        // @ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = getStableCoins(scAddress, provider);
        const bal = await contract.balanceOf(address, symbolToBytes32(symbol));
        setHoldings((prev) => ({ ...prev, [symbol]: parseFloat(fromUnits(bal, 6)) }));
      } catch (e) {
        console.debug('Failed to load on-chain stablecoin balance:', e);
      }
    };
    run();
  }, [address, scAddress, symbol]);

  // Require wallet connection (match Dashboard/History pattern)
  if (!address) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[rgb(var(--foreground))]">StableCoins</h1>
            <p className="text-[rgb(var(--muted-foreground))]">Mint and burn African currency stablecoins using mock USDC oracle prices.</p>
          </div>
        </div>
        <motion.div className="card backdrop-blur-lg p-8 text-center">
          <UserCircleIcon className="w-16 h-16 text-[rgb(var(--primary))] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">
            Please connect your wallet to access StableCoins.
          </p>
        </motion.div>
      </div>
    );
  }

  const amountUSDT = useMemo(() => {
    const num = parseFloat(amountLocal || "0");
    return localToUSDT(num, symbol);
  }, [amountLocal, symbol]);

  const previewText = useMemo(() => {
    if (!price) return "";
    const numLocal = parseFloat(amountLocal || "0");
    if (mode === "mint") {
      return `You will mint approximately ${numLocal.toLocaleString()} ${symbol} backed by ${amountUSDT.toFixed(2)} USDC`;
    } else {
      return `You will burn approximately ${numLocal.toLocaleString()} ${symbol} to redeem ${amountUSDT.toFixed(2)} USDC`;
    }
  }, [amountLocal, amountUSDT, mode, price, symbol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!address) return;
    const amount = parseFloat(amountLocal || "0");
    if (!amount || amount <= 0) return;

    if (scAddress && usdtAddress) {
      try {
        // @ts-ignore window.ethereum exists when wallet connected
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = getStableCoins(scAddress, signer);
        const symbolBytes = symbolToBytes32(symbol);
        const units = toUnits(amount, 6);
        if (mode === "mint") {
          const usdt = getERC20(usdtAddress, signer);
          const requiredUsdt = toUnits(amountUSDT.toFixed(6), 6);
          const [bal, allowance] = await Promise.all([
            usdt.balanceOf(address),
            usdt.allowance(address, scAddress),
          ]);
          if (bal.lt(requiredUsdt)) {
            setError("Insufficient USDC balance for mint.");
            return;
          }
          if (allowance.lt(requiredUsdt)) {
            setError("Allowance too low. Please approve USDC first.");
            return;
          }
          setMinting(true);
          const tx = await contract.mint(symbolBytes, units);
          await tx.wait();
          setMinting(false);
        } else {
          // burn will redeem USDC back to user
          const tx = await contract.burn(symbolBytes, units);
          await tx.wait();
        }
        // Refresh holdings from chain for selected symbol
        const balLocal = await contract.balanceOf(address, symbolBytes);
        setHoldings((prev) => ({ ...prev, [symbol]: parseFloat(fromUnits(balLocal, 6)) }));
        // Keep local history for UI feedback
        if (mode === "mint") {
          await mintStablecoin(address, symbol, amount);
        } else {
          await burnStablecoin(address, symbol, amount);
        }
      } catch (err: any) {
        console.error('StableCoins tx failed:', err);
        const msg = (err?.reason || err?.message || "").toLowerCase();
        if (msg.includes("transferfrom")) setError("USDC transferFrom failed. Check allowance and balance.");
        else if (msg.includes("oracle")) setError("Oracle rate unavailable for this currency.");
        else if (msg.includes("reserve")) setError("Contract reserves are insufficient to redeem right now.");
        else setError("Transaction failed. See console for details.");
        setMinting(false);
      }
    } else {
      // Fallback to local mock
      if (mode === "mint") {
        await mintStablecoin(address, symbol, amount);
      } else {
        await burnStablecoin(address, symbol, amount);
      }
      setHoldings(getHoldings());
    }

    setHistory(getHistory());
    setAmountLocal("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--foreground))]">StableCoins</h1>
          <p className="text-[rgb(var(--muted-foreground))]">Mint and burn African currency stablecoins using mock USDC oracle prices.</p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Card */}
        <motion.div className="col-span-2 p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[rgb(var(--primary))]/10">
                <BanknotesIcon className="w-6 h-6 text-[rgb(var(--primary))]" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-[rgb(var(--foreground))]">{mode === "mint" ? "Mint Stablecoin" : "Burn Stablecoin"}</h2>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Backed by USDC via mock oracle pricing</p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center bg-[rgb(var(--muted))]/60 rounded-lg p-1">
              <button
                onClick={() => setMode("mint")}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm ${mode === "mint" ? "bg-[rgb(var(--background))] text-[rgb(var(--foreground))]" : "text-[rgb(var(--muted-foreground))]"}`}
              >
                <ArrowUpCircleIcon className="w-4 h-4" />
                <span>Mint</span>
              </button>
              <button
                onClick={() => setMode("burn")}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm ${mode === "burn" ? "bg-[rgb(var(--background))] text-[rgb(var(--foreground))]" : "text-[rgb(var(--muted-foreground))]"}`}
              >
                <ArrowDownCircleIcon className="w-4 h-4" />
                <span>Burn</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Currency */}
            <div>
              <label className="block text-sm text-[rgb(var(--muted-foreground))] mb-1">Currency</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value as AfricanCurrency)}
                className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--background))] border border-[rgb(var(--border))]/40 focus:outline-none"
              >
                {oraclePrices.map((p) => (
                  <option key={p.symbol} value={p.symbol}>{p.symbol} - {p.name}</option>
                ))}
              </select>
              {price && (
                <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">Oracle: 1 USDC ≈ {price.perUSDT.toLocaleString()} {symbol}</p>
              )}
            </div>

            {/* Amount Local */}
            <div>
              <label className="block text-sm text-[rgb(var(--muted-foreground))] mb-1">Amount ({symbol})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountLocal}
                onChange={(e) => setAmountLocal(e.target.value)}
                placeholder={`Enter amount in ${symbol}`}
                className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--background))] border border-[rgb(var(--border))]/40 focus:outline-none"
              />
              {amountLocal && (
                <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">≈ {amountUSDT.toFixed(2)} USDC</p>
              )}
              {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
              )}
            </div>

            {/* Preview */}
            {amountLocal && (
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/40 border border-[rgb(var(--border))]/40 text-sm text-[rgb(var(--foreground))]">
                {previewText}
              </div>
            )}

            {/* Action */}
            {mode === "mint" && scAddress && usdtAddress && amountLocal ? (
              <MintActions
                address={address}
                scAddress={scAddress}
                usdtAddress={usdtAddress}
                symbol={symbol}
                amountUSDT={amountUSDT}
                onApproved={() => setError("")}
                minting={minting}
                setError={setError}
              />
            ) : (
              <button
                type="submit"
                disabled={!address || !amountLocal || parseFloat(amountLocal) <= 0}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] font-medium disabled:opacity-50"
              >
                {mode === "mint" ? "Mint Stablecoin" : "Burn Stablecoin"}
              </button>
            )}

            {!address && (
              <p className="text-xs text-red-500">Connect your wallet to simulate minting/burning.</p>
            )}
          </form>
        </motion.div>

        {/* Sidebar: Holdings and History */}
        <motion.div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
          <h3 className="text-base font-medium mb-4 text-[rgb(var(--foreground))]">Your Holdings {scAddress ? "(on-chain)" : "(local)"}</h3>
          <div className="space-y-2 max-h-48 overflow-auto pr-2">
            {Object.keys(holdings).length === 0 && (
              <p className="text-sm text-[rgb(var(--muted-foreground))]">No holdings yet. Mint some stablecoins to get started.</p>
            )}
            {Object.entries(holdings).map(([sym, amt]) => (
              <div key={sym} className="flex items-center justify-between text-sm">
                <span className="text-[rgb(var(--muted-foreground))]">{sym}</span>
                <span className="font-medium text-[rgb(var(--foreground))]">{amt.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <h3 className="text-base font-medium mt-6 mb-2 text-[rgb(var(--foreground))]">Recent Activity</h3>
          <div className="space-y-2 max-h-64 overflow-auto pr-2">
            {history.length === 0 && (
              <p className="text-sm text-[rgb(var(--muted-foreground))]">No activity yet.</p>
            )}
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm py-2 border-b border-[rgb(var(--border))]/30">
                <div className="flex-1">
                  <div className="font-medium text-[rgb(var(--foreground))]">{h.action.toUpperCase()} {h.amountLocal.toLocaleString()} {h.symbol}</div>
                  <div className="text-[rgb(var(--muted-foreground))]">Ref: {h.amountUSDT.toFixed(2)} USDC • {new Date(h.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Simple Chart Placeholder */}
      <motion.div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
        <h3 className="text-base font-medium mb-4 text-[rgb(var(--foreground))]">Mint/Burn Totals (Session)</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-[rgb(var(--muted))]/40">
            <div className="text-[rgb(var(--muted-foreground))]">Total Minted (local)</div>
            <div className="text-xl font-semibold">{history.filter(h=>h.action==='mint').reduce((a,b)=>a+b.amountLocal,0).toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-lg bg-[rgb(var(--muted))]/40">
            <div className="text-[rgb(var(--muted-foreground))]">Total Burned (local)</div>
            <div className="text-xl font-semibold">{history.filter(h=>h.action==='burn').reduce((a,b)=>a+b.amountLocal,0).toLocaleString()}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

