"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useOrbital } from "@/hooks/useOrbital";

export type Timeframe = "1H" | "4H" | "1D" | "1W";

export interface AnalyticsPoint {
  t: number; // unix ms
  liquidity: number; // USD approximation
  volume?: number; // USD approximation within interval
  efficiency?: number;
  fees?: number;
  apy?: number;
  trades?: number;
}

interface Preferences {
  timeframe: Timeframe;
  tokens: string[]; // symbols filter
}

/**
 * Collects on-chain snapshots and persists them into localStorage per chain.
 * Provides time-series suitable for the analytics charts.
 */
export function useOrbitalAnalytics() {
  const { chain } = useAccount();
  const chainId = chain?.id ?? 0;
  const storageKey = `orbital-timeseries-${chainId}`;
  const prefKey = `orbital-prefs-${chainId}`;

  const orbital = useOrbital();

  const [series, setSeries] = useState<AnalyticsPoint[]>([]);
  const [prefs, setPrefs] = useState<Preferences>(() => {
    if (typeof window === "undefined") return { timeframe: "1D", tokens: [] };
    try {
      const saved = window.localStorage.getItem(prefKey);
      return saved ? (JSON.parse(saved) as Preferences) : { timeframe: "1D", tokens: [] };
    } catch {
      return { timeframe: "1D", tokens: [] };
    }
  });

  // Load stored series on mount/chain change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as AnalyticsPoint[]) : [];
      setSeries(parsed);
    } catch {
      setSeries([]);
    }
  }, [storageKey]);

  // Persist preferences
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(prefKey, JSON.stringify(prefs));
  }, [prefKey, prefs]);

  // Poll on-chain reserves every 30s and create a point
  useEffect(() => {
    if (!orbital.ready) return;

    const writePoint = () => {
      // TVL approximation (stablecoins ~ $1)
      const symbols = ["USDC","USDT","DAI","FRAX","LUSD"] as const;
      const considered = prefs.tokens && prefs.tokens.length > 0 ? prefs.tokens : symbols as unknown as string[];
      const tvl = orbital.reserves.reduce((acc, r, i) => {
        const sym = symbols[i] as unknown as string;
        if (!considered.includes(sym)) return acc;
        return acc + Number(r) / 10 ** (orbital.decimals[i] || 18);
      }, 0);
      const now = Date.now();
      const point: AnalyticsPoint = { t: now, liquidity: tvl };
      setSeries((prev) => {
        const next = [...prev, point].filter((p) => now - p.t <= 7 * 24 * 60 * 60 * 1000); // keep 1 week
        if (typeof window !== "undefined") {
          try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
        }
        return next;
      });
    };

    // initial
    writePoint();
    const id = setInterval(writePoint, 30_000);
    return () => clearInterval(id);
  }, [orbital.ready, orbital.reserves, orbital.decimals, storageKey]);

  // Simple derived statistics
  const stats = useMemo(() => {
    if (series.length === 0) return { current: 0, average: 0, low24h: 0, high24h: 0 };
    const now = Date.now();
    const lastDay = series.filter((p) => now - p.t <= 24 * 60 * 60 * 1000);
    const values = lastDay.map((p) => p.liquidity);
    const current = values[values.length - 1] ?? series[series.length - 1].liquidity;
    const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : current;
    const low24h = values.length ? Math.min(...values) : current;
    const high24h = values.length ? Math.max(...values) : current;
    return { current, average, low24h, high24h };
  }, [series]);

  const setTimeframe = useCallback((tf: Timeframe) => setPrefs((p) => ({ ...p, timeframe: tf })), []);
  const setTokens = useCallback((tokens: string[]) => setPrefs((p) => ({ ...p, tokens })), []);

  const filteredSeries = useMemo(() => {
    const now = Date.now();
    const windowMs = prefs.timeframe === "1H" ? 60 * 60 * 1000
      : prefs.timeframe === "4H" ? 4 * 60 * 60 * 1000
      : prefs.timeframe === "1D" ? 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;
    return series.filter((p) => now - p.t <= windowMs);
  }, [series, prefs.timeframe]);

  return {
    timeframe: prefs.timeframe,
    tokens: prefs.tokens,
    setTimeframe,
    setTokens,
    series: filteredSeries,
    rawSeries: series,
    stats,
  };
}

