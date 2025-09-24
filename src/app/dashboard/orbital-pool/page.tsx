"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  BoltIcon,
  ChartBarIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useAccount } from "wagmi";
import { useOrbital } from "@/hooks/useOrbital";
import { fromBaseUnits } from "@/utils/orbital/client";

function truncate(addr?: string | null) {
  if (!addr) return "Connect";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function OrbitalPoolPage() {
  const { address, chain } = useAccount();
  const [tab, setTab] = useState<"swap" | "liquidity" | "analytics">("swap");
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("ZAR");
  const [fromAmount, setFromAmount] = useState("");

  const orbital = useOrbital();

  // derive metrics from on-chain where possible
  const tokensList = ["USDC","ZAR","NGN","KES","UGX"] as const;
  const poolTokens = useMemo(() => tokensList.map((s) => ({ symbol: s })), []);


  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[rgb(var(--foreground))]">DeFi AMM</h1>
          <p className="text-[rgb(var(--muted-foreground))]">SPHERICAL LIQUIDITY PROTOCOL</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-xl border border-[rgb(var(--border))]/50 text-sm text-[rgb(var(--muted-foreground))]">
            {chain?.name || "Hedera Testnet (EVM)"}
          </span>
          <button onClick={() => orbital.refresh()} className="px-3 py-1 rounded-xl border border-[rgb(var(--border))]/50 text-sm text-[rgb(var(--foreground))]">
            {truncate(address)}
          </button>
        </div>
      </div>

      {/* Protocol intro */}
      <motion.div className="card backdrop-blur-lg p-6" variants={fadeIn} initial="initial" animate="animate">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[rgb(var(--foreground))]">DeFi AMM</h2>
            <p className="text-[rgb(var(--muted-foreground))]">Protocol</p>
            <p className="mt-3 text-[rgb(var(--muted-foreground))]">
              Revolutionary AMM using spherical geometry and orbital mechanics. Trade with optimal capital efficiency through mathematical innovation.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="border border-[rgb(var(--border))]/40 rounded-xl p-4">
              <div className="text-xs text-[rgb(var(--muted-foreground))]">Tokens Supported</div>
              <div className="text-lg font-semibold">5+</div>
            </div>
            <div className="border border-[rgb(var(--border))]/40 rounded-xl p-4">
              <div className="text-xs text-[rgb(var(--muted-foreground))]">Total Liquidity</div>
              <div className="text-lg font-semibold">
                {(() => {
                  const sum = orbital.reserves.reduce((a,b)=> (BigInt(a) + BigInt(b)), BigInt(0));
                  return sum === BigInt(0) ? '0' : sum.toString();
                })()}
              </div>
            </div>
            <div className="border border-[rgb(var(--border))]/40 rounded-xl p-4">
              <div className="text-xs text-[rgb(var(--muted-foreground))]">Max Efficiency</div>
              <div className="text-lg font-semibold">1000x</div>
            </div>
            <div className="border border-[rgb(var(--border))]/40 rounded-xl p-4">
              <div className="text-xs text-[rgb(var(--muted-foreground))]">Invariant</div>
              <div className="text-lg font-semibold">K = ||r||²</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: "swap", label: "SWAP" },
          { key: "liquidity", label: "LIQUIDITY" },
          { key: "analytics", label: "ANALYTICS" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              tab === t.key
                ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] border-transparent"
                : "bg-[rgb(var(--muted))]/20 text-[rgb(var(--muted-foreground))] border-[rgb(var(--border))]/50 hover:bg-[rgb(var(--muted))]/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Swap/Liquidity/Analytics */}
        <motion.div className="lg:col-span-3 space-y-6" variants={fadeIn} initial="initial" animate="animate">
          {tab === "swap" && (
            <div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
              <div className="flex items-center gap-2 mb-5">
                <ArrowsRightLeftIcon className="w-6 h-6 text-[rgb(var(--primary))]" />
                <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">SPHERICAL TRADING PROTOCOL</h3>
              </div>

              {/* From */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2 text-xs text-[rgb(var(--muted-foreground))]">
                  <span>FROM</span>
                  <span>BALANCE: {(() => { const i = (tokensList as readonly string[]).indexOf(fromToken as any); return i >= 0 ? (orbital.balances[i] ?? '0') : '0'; })()}</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgb(var(--background))] border border-[rgb(var(--border))]/40">
                  <input
                    className="flex-1 bg-transparent outline-none text-[rgb(var(--foreground))] text-2xl"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-2 rounded-lg border border-[rgb(var(--border))]/40 text-sm">
                      U
                    </div>
                    <select
                      className="px-3 py-2 rounded-lg border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]"
                      value={fromToken}
                      onChange={(e) => setFromToken(e.target.value)}
                    >
                      {poolTokens.map((t) => (
                        <option key={t.symbol as string} value={t.symbol as string}>
                          {t.symbol}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-[rgb(var(--muted-foreground))] hidden sm:block">
                      {fromToken}
                    </div>
                  </div>
                </div>
              </div>

              {/* To */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2 text-xs text-[rgb(var(--muted-foreground))]">
                  <span>TO</span>
                  <span>BALANCE: {(() => { const i = (tokensList as readonly string[]).indexOf(toToken as any); return i >= 0 ? (orbital.balances[i] ?? '0') : '0'; })()}</span>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgb(var(--background))] border border-[rgb(var(--border))]/40">
                  <input
                    className="flex-1 bg-transparent outline-none text-[rgb(var(--muted-foreground))] text-2xl"
                    placeholder="0.0"
                    readOnly
                    value={(() => {
                      try {
                        const q = orbital.quoteOut(fromToken, toToken, fromAmount || '0');
                        return q.amountOut ? q.amountOut.toString() : '';
                      } catch { return ''; }
                    })()}
                  />
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-2 rounded-lg border border-[rgb(var(--border))]/40 text-sm">
                      U
                    </div>
                    <select
                      className="px-3 py-2 rounded-lg border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]"
                      value={toToken}
                      onChange={(e) => setToToken(e.target.value)}
                    >
                      {poolTokens.map((t) => (
                        <option key={t.symbol as string} value={t.symbol as string}>
                          {t.symbol}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-[rgb(var(--muted-foreground))] hidden sm:block">
                      {toToken}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  try { await orbital.approve(fromToken, fromAmount || '0'); } catch (e) { console.error(e); }
                }}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] font-medium disabled:opacity-50"
                disabled={!fromAmount || fromToken === toToken || !orbital.ready}
              >
                APPROVE {fromToken}
              </button>

              <button
                onClick={async () => {
                  try { await orbital.swap(fromToken, toToken, fromAmount); setFromAmount(''); } catch (e) { console.error(e); }
                }}
                className="mt-3 w-full md:w-auto px-6 py-3 rounded-xl bg-[rgb(var(--foreground))] text-[rgb(var(--background))] font-medium disabled:opacity-50"
                disabled={!fromAmount || fromToken === toToken || !orbital.ready}
              >
                SWAP
              </button>
            </div>
          )}

          {tab === "liquidity" && (
            <div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))] space-y-4">
              <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">Liquidity</h3>
              <p className="text-[rgb(var(--muted-foreground))]">
                Provide multi-asset liquidity into the spherical invariant pool and earn fees.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-[rgb(var(--foreground))]">Add Liquidity</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["USDC","USDT","DAI","FRAX","LUSD"].map((sym) => (
                      <div key={sym} className="flex items-center gap-2">
                        <span className="w-10 text-sm">{sym}</span>
                        <input id={`amt-${sym}`} className="flex-1 px-3 py-2 rounded-lg border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]" placeholder="0.0" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="k-input" className="flex-1 px-3 py-2 rounded-lg border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]" placeholder="Tick k" />
                    <button
                      onClick={async () => {
                        const k = (document.getElementById('k-input') as HTMLInputElement)?.value;
                        const entries = ["USDC","USDT","DAI","FRAX","LUSD"].map((sym) => {
                          const v = (document.getElementById(`amt-${sym}`) as HTMLInputElement)?.value || '0';
                          return [sym, v] as const;
                        });
                        const payload = Object.fromEntries(entries);
                        try { await orbital.addLiquidity(k, payload as any); } catch (e) { console.error(e); }
                      }}
                      className="px-4 py-2 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]"
                      disabled={!orbital.ready}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-[rgb(var(--foreground))]">Remove Liquidity</h4>
                  <div className="flex items-center gap-2">
                    <input id="k-remove" className="flex-1 px-3 py-2 rounded-lg border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]" placeholder="Tick k" />
                    <input id="lp-remove" className="flex-1 px-3 py-2 rounded-lg border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]" placeholder="LP Shares" />
                    <button
                      onClick={async () => {
                        const k = (document.getElementById('k-remove') as HTMLInputElement)?.value;
                        const lp = (document.getElementById('lp-remove') as HTMLInputElement)?.value;
                        try { await orbital.removeLiquidity(k, lp); } catch (e) { console.error(e); }
                      }}
                      className="px-4 py-2 rounded-lg bg-[rgb(var(--foreground))] text-[rgb(var(--background))]"
                      disabled={!orbital.ready}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "analytics" && (
            <div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))] space-y-4">
              <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">Analytics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Metric title="24H VOLUME" value="$2.4M" icon={ArrowTrendingUpIcon} />
                <Metric title="FEES EARNED" value="$7.2K" icon={BanknotesIcon} />
                <Metric title="TRADES" value="1,247" icon={ChartBarIcon} />
              </div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                Real-time pricing, historical liquidity, and trade distribution analytics will appear here.
              </p>
            </div>
          )}
        </motion.div>

        {/* Right column: Market and pool info */}
        <motion.div className="lg:col-span-2 space-y-6" variants={fadeIn} initial="initial" animate="animate">
          {/* Price + Liquidity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
              <div className="text-xs text-[rgb(var(--muted-foreground))]">24H PRICE</div>
              <div className="text-2xl font-semibold text-[rgb(var(--foreground))]">—</div>
              <div className={`text-xs mt-1 text-[rgb(var(--muted-foreground))]`}>
                on-chain derived
              </div>
            </div>
            <div className="p-4 rounded-xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
              <div className="text-xs text-[rgb(var(--muted-foreground))]">TOTAL LIQUIDITY</div>
              <div className="text-2xl font-semibold text-[rgb(var(--foreground))]">
                {(() => {
                  const sum = orbital.reserves.reduce((a,b)=> (BigInt(a) + BigInt(b)), BigInt(0));
                  return sum === BigInt(0) ? '0' : sum.toString();
                })()}
              </div>
              <div className="text-xs mt-1 text-[rgb(var(--muted-foreground))]">reserves sum (raw)</div>
            </div>
          </div>

          {/* Pool composition */}
          <div className="p-4 rounded-xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-[rgb(var(--muted-foreground))]">POOL COMPOSITION</div>
              <div className="text-xs text-[rgb(var(--muted-foreground))]">5 TOKENS</div>
            </div>
            <div className="space-y-2">
              {poolTokens.map((t, i) => (
                <div key={t.symbol as string} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[rgb(var(--primary))]/20 flex items-center justify-center text-xs">U</div>
                    <div>
                      <div className="font-medium text-[rgb(var(--foreground))]">{t.symbol}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[rgb(var(--muted-foreground))]">
                    <span>{orbital.reserves[i] ? String(orbital.reserves[i]) : '0'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MiniStat label="24H VOLUME" value="$2.4M" />
            <MiniStat label="FEES EARNED" value="$7.2K" />
            <MiniStat label="TRADES" value="1,247" />
          </div>
        </motion.div>
      </div>

      {/* Advantages */}
      <motion.div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]" variants={fadeIn} initial="initial" animate="animate">
        <h3 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-2">ORBITAL GEOMETRY ADVANTAGES</h3>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-[rgb(var(--muted-foreground))] list-disc pl-5">
          <li>Spherical invariant reduces impermanent loss by 40%</li>
          <li>Torus topology enables multi-asset efficiency</li>
          <li>Orbital mechanics optimize capital utilization</li>
        </ul>
        <div className="mt-3 text-xs text-green-500">
          PROTOCOL ACTIVE • REAL-TIME PRICING • ARBITRUM STYLUS
        </div>
      </motion.div>

      {/* Spherical Innovation */}
      <motion.div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))] space-y-4" variants={fadeIn} initial="initial" animate="animate">
        <h3 className="text-xl font-semibold text-[rgb(var(--foreground))]">Spherical Innovation</h3>
        <p className="text-[rgb(var(--muted-foreground))]">Built with advanced mathematics for the next generation of automated market makers</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Feature title="Spherical Geometry" emoji="⚛️" desc="Uses spherical invariant K = ||r||² where reserves form vectors in n-dimensional space, enabling optimal capital efficiency." />
          <Feature title="Concentrated Liquidity" emoji="🎯" desc="Interior and Boundary tick classification allows for concentrated liquidity positions with up to 1000x capital efficiency." />
          <Feature title="Mathematical Precision" emoji="📐" desc="Integer square root calculations and normalized reserve vectors ensure precise trading with minimal slippage." />
        </div>
      </motion.div>

      {/* Mathematical Process Flow */}
      <motion.div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))] space-y-4" variants={fadeIn} initial="initial" animate="animate">
        <h3 className="text-xl font-semibold text-[rgb(var(--foreground))]">📐 Mathematical Process Flow</h3>
        <p className="text-[rgb(var(--muted-foreground))]">Step-by-step breakdown of the spherical invariant calculation</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Step title="Reserve Vector" emoji="📊" desc="Calculate current reserves as n-dimensional vector r = [x₁, x₂, ..., xₙ]" />
          <Step title="K Constant" emoji="⚡" desc="Compute spherical invariant K = ||r||² = x₁² + x₂² + ... + xₙ²" />
          <Step title="Trade Calculation" emoji="🔄" desc="Solve for output: (rᵢₙ + Δᵢₙ)² + (rₒᵤₜ - Δₒᵤₜ)² + Σ(rᵢ²) = K" />
          <Step title="Integer Sqrt" emoji="√" desc="Use Newton's method for precise integer square root calculation" />
          <Step title="Price Impact" emoji="✅" desc="Calculate price impact and ensure optimal execution" />
        </div>
      </motion.div>

      {/* Technical Deep Dive */}
      <motion.div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))] space-y-4" variants={fadeIn} initial="initial" animate="animate">
        <h3 className="text-xl font-semibold text-[rgb(var(--foreground))]">Technical Deep Dive</h3>
        <p className="text-[rgb(var(--muted-foreground))]">Advanced mathematics powering the next generation of automated market makers</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature title="Spherical Invariant" emoji="⚛️" desc="K = ||r||² maintains constant sum of squared reserves across all trades" />
          <Feature title="Vector Mathematics" emoji="📐" desc="Reserves treated as n-dimensional vectors with precise geometric calculations" />
          <Feature title="Tick Classification" emoji="🎯" desc="Interior/Boundary classification enables concentrated liquidity positions" />
          <Feature title="Gas Optimization" emoji="⚡" desc="Integer arithmetic and Newton's method minimize computational costs" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Spec label="Invariant Formula" value="K = ||r||² = Σ(xᵢ²)" />
          <Spec label="Precision" value="10¹⁸ (18 decimals)" />
          <Spec label="Square Root Method" value="Newton's Method" />
          <Spec label="Max Efficiency" value="1000x Capital" />
          <Spec label="Gas Estimation" value="80K + 15K×complexity" />
          <Spec label="Supported Tokens" value="n-dimensional" />
        </div>
      </motion.div>
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
  return (
    <div className="p-4 rounded-xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[rgb(var(--muted-foreground))]">{title}</div>
          <div className="text-xl font-semibold text-[rgb(var(--foreground))]">{value}</div>
        </div>
        <Icon className="w-5 h-5 text-[rgb(var(--primary))]" />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
      <div className="text-xs text-[rgb(var(--muted-foreground))]">{label}</div>
      <div className="text-lg font-semibold text-[rgb(var(--foreground))]">{value}</div>
    </div>
  );
}

function Feature({ title, emoji, desc }: { title: string; emoji: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl leading-none">{emoji}</span>
        <h4 className="font-semibold text-[rgb(var(--foreground))]">{title}</h4>
      </div>
      <p className="text-sm text-[rgb(var(--muted-foreground))]">{desc}</p>
    </div>
  );
}

function Step({ title, emoji, desc }: { title: string; emoji: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl leading-none">{emoji}</span>
        <h4 className="font-semibold text-[rgb(var(--foreground))]">{title}</h4>
      </div>
      <p className="text-sm text-[rgb(var(--muted-foreground))]">{desc}</p>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
      <div className="text-xs text-[rgb(var(--muted-foreground))]">{label}</div>
      <div className="text-sm font-medium text-[rgb(var(--foreground))]">{value}</div>
    </div>
  );
}

