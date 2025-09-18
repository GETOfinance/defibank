"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowsRightLeftIcon, BanknotesIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { useOrbital } from "@/hooks/useOrbital";
import { AnalyticsDashboard } from "@/components/orbital/AnalyticsDashboard";

const tokensList = ["USDC","USDT","DAI","FRAX","LUSD"] as const;

export default function ExchangeTabs() {
  const [tab, setTab] = useState<"swap" | "liquidity" | "analytics">("swap");

  // Sync with URL (?tab=swap|liquidity|analytics)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const t = url.searchParams.get('tab');
    if (t === 'swap' || t === 'liquidity' || t === 'analytics') {
      setTab(t);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  }, [tab]);
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("USDT");
  const [fromAmount, setFromAmount] = useState("");
  const orbital = useOrbital();

  const poolTokens = useMemo(() => tokensList.map((s) => ({ symbol: s })), []);

  // Liquidity (Add) local state: only USDC and USDT rows
  const [addRows, setAddRows] = useState<Array<{ token: (typeof tokensList)[number]; amount: string }>>([
    { token: "USDC", amount: "" },
    { token: "USDT", amount: "" }
  ]);
  const [kAdd, setKAdd] = useState("");
  const selectedTokens = addRows.map((r) => r.token);

  return (
    <div className="space-y-6">
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

      {/* Content */}
      {tab === "swap" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
            <div className="flex items-center gap-2 mb-5">
              <ArrowsRightLeftIcon className="w-6 h-6 text-[rgb(var(--primary))]" />
              <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">SPHERICAL TRADING PROTOCOL</h3>
            </div>

            {/* From */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 text-xs text-[rgb(var(--muted-foreground))]">
                <span>FROM</span>
                <span>BALANCE: 0.00</span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgb(var(--background))] border border-[rgb(var(--border))]/40">
                <input
                  className="flex-1 bg-transparent outline-none text-[rgb(var(--foreground))] text-2xl"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                />
                <div className="flex items-center gap-2">
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
                <span>BALANCE: 0.00</span>
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

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={async () => {
                  try { await orbital.approve(fromToken, fromAmount || '0'); } catch (e) { console.error(e); }
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] font-medium disabled:opacity-50"
                disabled={!fromAmount || fromToken === toToken || !orbital.ready}
              >
                APPROVE {fromToken}
              </button>

              <button
                onClick={async () => { try { await orbital.swap(fromToken, toToken, fromAmount); setFromAmount(''); } catch (e) { console.error(e); } }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[rgb(var(--foreground))] text-[rgb(var(--background))] font-medium disabled:opacity-50"
                disabled={!fromAmount || fromToken === toToken || !orbital.ready}
              >
                SWAP
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]">
              <div className="text-xs text-[rgb(var(--muted-foreground))]">TOTAL LIQUIDITY</div>
              <div className="text-2xl font-semibold text-[rgb(var(--foreground))]">
                {(() => {
                  const sum = orbital.reserves.reduce((a,b)=> (BigInt(a) + BigInt(b)), BigInt(0));
                  return sum === BigInt(0) ? '0' : sum.toString();
                })()}
              </div>
            </div>

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

            <div className="grid grid-cols-3 gap-4">
              <MiniStat label="24H VOLUME" value="$—" />
              <MiniStat label="FEES EARNED" value="$—" />
              <MiniStat label="TRADES" value="—" />
            </div>
          </div>
        </div>
      )}

      {tab === "liquidity" && (
        <div className="space-y-4">
          <p className="text-[rgb(var(--muted-foreground))]">Provide multi-asset liquidity into the spherical invariant pool and earn fees.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Liquidity Card */}
            <div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))] space-y-4">
              <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">Add Liquidity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      className="w-28 px-2 py-1.5 h-9 text-sm rounded-md border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]"
                      value={row.token}
                      onChange={(e) => {
                        const token = e.target.value as (typeof tokensList)[number];
                        setAddRows((prev) => prev.map((r, i) => (i === idx ? { ...r, token } : r)));
                      }}
                    >
                      {tokensList.map((sym) => (
                        <option key={sym} value={sym}>
                          {sym}
                        </option>
                      ))}
                    </select>
                    <input
                      className="w-full min-w-0 px-2 py-1.5 h-9 text-sm rounded-md border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]"
                      placeholder="0.0"
                      value={row.amount}
                      onChange={(e) => setAddRows((prev) => prev.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r)))}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="w-full max-w-xs px-2 py-1.5 h-9 text-sm rounded-md border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]"
                  placeholder="Tick k"
                  value={kAdd}
                  onChange={(e) => setKAdd(e.target.value)}
                />
                <button
                  onClick={async () => {
                    const payload = Object.fromEntries(addRows.map((r) => [r.token, r.amount || '0']));
                    try { await orbital.addLiquidity(kAdd, payload as any); } catch (e) { console.error(e); }
                  }}
                  className="px-3 py-2 text-sm rounded-md bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]"
                  disabled={!orbital.ready}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Remove Liquidity Card */}
            <div className="p-6 rounded-2xl border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))] space-y-4">
              <h3 className="text-lg font-semibold text-[rgb(var(--foreground))]">Remove Liquidity</h3>
              <div className="flex items-center gap-2">
                <input id="k-remove" className="w-full max-w-[10rem] px-2 py-1.5 h-9 text-sm rounded-md border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]" placeholder="Tick k" />
                <input id="lp-remove" className="w-full max-w-[12rem] px-2 py-1.5 h-9 text-sm rounded-md border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]" placeholder="LP Shares" />
                <button
                  onClick={async () => {
                    const k = (document.getElementById('k-remove') as HTMLInputElement)?.value;
                    const lp = (document.getElementById('lp-remove') as HTMLInputElement)?.value;
                    try { await orbital.removeLiquidity(k, lp); } catch (e) { console.error(e); }
                  }}
                  className="px-3 py-2 text-sm rounded-md bg-[rgb(var(--foreground))] text-[rgb(var(--background))]"
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
        <AnalyticsDashboard />
      )}
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

