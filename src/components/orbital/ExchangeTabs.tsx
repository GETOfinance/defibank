"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowsRightLeftIcon, BanknotesIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { useOrbital } from "@/hooks/useOrbital";
import { toBaseUnits } from "@/utils/orbital/client";
import { AnalyticsDashboard } from "@/components/orbital/AnalyticsDashboard";

const tokensList = ["USDC","ZAR","NGN","KES","UGX"] as const;
const iconFor = (sym: string) => {
  switch (sym) {
    case 'USDC': return '/tokens/usdc.svg';
    case 'ZAR': return '/tokens/zar.svg';
    case 'NGN': return '/tokens/ngn.svg';
    case 'KES': return '/tokens/kes.svg';
    case 'UGX': return '/tokens/ugx-uganda.svg';
    default: return undefined;
  }
};

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
  const [toToken, setToToken] = useState("ZAR");
  const [fromAmount, setFromAmount] = useState("");
  const orbital = useOrbital();

  const poolTokens = useMemo(() => tokensList.map((s) => ({ symbol: s })), []);

  // Liquidity (Add) local state: all 5 tokens must be provided (contract requires >0 for each)
  const [addRows, setAddRows] = useState<Array<{ token: (typeof tokensList)[number]; amount: string }>>([
    { token: "USDC", amount: "" },
    { token: "ZAR", amount: "" },
    { token: "NGN", amount: "" },
    { token: "KES", amount: "" },
    { token: "UGX", amount: "" },
  ]);
  const [kAdd, setKAdd] = useState("");
  const selectedTokens = addRows.map((r) => r.token);
  const [kInfo, setKInfo] = useState<null | { k: bigint; lowerBound: bigint; upperBound: bigint; reserveConstraint: bigint }>(null)
  const [kError, setKError] = useState<string>('')
  const [kLoading, setKLoading] = useState<boolean>(false)

  const [lastSuggestSig, setLastSuggestSig] = useState<string>("");

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
                  {iconFor(fromToken) && (
                    <img src={iconFor(fromToken)!} alt={fromToken} className="w-5 h-5" />
                  )}
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
                  {iconFor(toToken) && (
                    <img src={iconFor(toToken)!} alt={toToken} className="w-5 h-5" />
                  )}
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
                Approve
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
                      {iconFor(t.symbol as string) ? (
                        <img src={iconFor(t.symbol as string)!} alt={t.symbol as string} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[rgb(var(--primary))]/20 flex items-center justify-center text-xs">U</div>
                      )}
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setAddRows((prev) => {
                          if (row.token === 'USDC') {
                            const usdc = val;
                            const usdcNum = usdc === '' ? NaN : Number(usdc);
                            const fmt = (x: number) => {
                              if (!isFinite(x)) return '';
                              const s = x.toFixed(6);
                              return s.replace(/\.?0+$/, '');
                            };
                            return prev.map((r) => {
                              if (r.token === 'USDC') return { ...r, amount: val };
                              if (r.token === 'ZAR') return { ...r, amount: usdc === '' ? '' : fmt(usdcNum * 18.5) };
                              if (r.token === 'NGN') return { ...r, amount: usdc === '' ? '' : fmt(usdcNum * 1600) };
                              if (r.token === 'KES') return { ...r, amount: usdc === '' ? '' : fmt(usdcNum * 130) };
                              if (r.token === 'UGX') return { ...r, amount: usdc === '' ? '' : fmt(usdcNum * 3800) };
                              return r;
                            });
                          }
                          return prev.map((r, i) => (i === idx ? { ...r, amount: val } : r));
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  className="w-full max-w-xs px-2 py-1.5 h-9 text-sm rounded-md border border-[rgb(var(--border))]/40 bg-[rgb(var(--background))]"
                  placeholder="Tick k"
                  value={kAdd}
                  onChange={(e) => { setKAdd(e.target.value); setKError(''); }}
                />
                <button
                  onClick={async () => {
                    setKError(''); setKLoading(true);
                    const payload = Object.fromEntries(addRows.map((r) => [r.token, r.amount || '0']));

                    // Lightweight client-side numeric validation before calling suggestK
                    const invalid = addRows.find((r) => r.amount !== '' && !/^\d*(?:\.\d*)?$/.test(r.amount));
                    if (invalid) {
                      setKError(`Invalid amount format for ${invalid.token}: "${invalid.amount}"`);
                      setKLoading(false);
                      return;
                    }

                    try {
                      const info = await orbital.suggestK(payload as any);
                      setKInfo(info);
                      setLastSuggestSig(JSON.stringify(payload));
                    } catch (e: any) {
                      console.error(e);
                      const msg = (e && e.message) ? e.message : 'Failed to suggest k.';
                      setKError(msg);
                    } finally {
                      setKLoading(false);
                    }
                  }}
                  className="px-3 py-2 text-sm rounded-md bg-[rgb(var(--muted))] text-[rgb(var(--foreground))] disabled:opacity-50"
                  disabled={!orbital.ready || kLoading}
                >
                  {kLoading ? 'Suggesting…' : 'Suggest k'}
                </button>
                {kInfo && (
                  <span className="text-xs text-[rgb(var(--muted-foreground))]">Suggested: {kInfo.k.toString()}</span>
                )}
                <button
                  onClick={async () => {
                    const payload = Object.fromEntries(addRows.map((r) => [r.token, r.amount || '0']));

                    // Lightweight numeric validation and positivity check
                    const invalid = addRows.find((r) => r.amount === '' || !/^\d*(?:\.\d*)?$/.test(r.amount));
                    if (invalid) { setKError(`Invalid amount format for ${invalid.token}: "${invalid.amount || ''}"`); return; }

                    const allPositive = Object.values(payload).every((v: any) => Number(v) > 0);
                    if (!allPositive) { setKError('All five token amounts must be > 0.'); return; }

                    // If relying on suggested k and inputs changed since last suggest, recompute
                    let effectiveKInfo = kInfo;
                    const sig = JSON.stringify(payload);
                    if (!kAdd && (!kInfo || lastSuggestSig !== sig)) {
                      try {
                        setKLoading(true);
                        const info = await orbital.suggestK(payload as any);
                        setKInfo(info);
                        setLastSuggestSig(sig);
                        effectiveKInfo = info;
                      } catch (e: any) {
                        console.error(e);
                        const msg = (e && e.message) ? e.message : 'Failed to suggest k.';
                        setKError(msg);
                        setKLoading(false);
                        return;
                      } finally {
                        setKLoading(false);
                      }
                    }

                    // Validate k (either user-provided or suggested)
                    const useK = kAdd || (effectiveKInfo ? effectiveKInfo.k.toString() : '');
                    const validation = orbital.validateK(useK, effectiveKInfo || undefined);
                    if (!validation.valid) { setKError(validation.reason); return; }

                    // Proactively detect missing allowances and prompt Approve with exact amounts
                    try {
                      const needed: Array<{ sym: string; amount: string; idx: number }> = [];
                      for (let i = 0; i < tokensList.length; i++) {
                        const sym = tokensList[i];
                        const dec = orbital.decimals?.[i] ?? 18;
                        const requiredBN = toBaseUnits(String(payload[sym] || '0'), dec);
                        const allowanceStr = orbital.allowances?.[i] ?? '0';
                        const allowanceBN = toBaseUnits(allowanceStr, dec);
                        if (allowanceBN.lt(requiredBN)) {
                          needed.push({ sym, amount: String(payload[sym] || '0'), idx: i });
                        }
                      }

                      if (needed.length > 0) {
                        const list = needed.map(n => `${n.sym}: ${n.amount}`).join('\n');
                        const ok = typeof window !== 'undefined' ? window.confirm(`Approve needed before adding liquidity:\n\n${list}\n\nProceed to send approvals?`) : false;
                        if (!ok) { setKError('Approvals required were not granted.'); return; }
                        for (const n of needed) {
                          await orbital.approve(n.sym as any, n.amount);
                        }
                      }
                    } catch (e: any) {
                      console.error(e);
                      const msg = (e && e.message) ? e.message : 'Failed to prepare approvals.';
                      setKError(msg);
                      return;
                    }

                    setKError('');
                    try {
                      await orbital.addLiquidity(useK, payload as any);
                    } catch (e: any) {
                      console.error(e);
                      const msg = (e && e.message) ? e.message : 'addLiquidity failed.';
                      setKError(msg);
                    }
                  }}
                  className="px-3 py-2 text-sm rounded-md bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]"
                  disabled={!orbital.ready}
                >
                  Add
                </button>
                {kInfo && (
                  <div className="w-full text-xs text-[rgb(var(--muted-foreground))] mt-2">
                    Suggested k: {kInfo.k.toString()} | Bounds: [{kInfo.lowerBound.toString()} , {kInfo.upperBound.toString()}], constraint ≥ {kInfo.reserveConstraint.toString()}
                  </div>
                )}
                {kError && (
                  <div className="w-full text-xs text-red-500 mt-1">{kError}</div>
                )}
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

