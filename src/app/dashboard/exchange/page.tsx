"use client";

import React from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { ArrowsRightLeftIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import ExchangeTabs from "@/components/orbital/ExchangeTabs";

export default function ExchangePage() {
  const { address } = useAccount();

  return (
    <div className="space-y-6">
      {/* Header + Tabs inline (always visible) */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ArrowsRightLeftIcon className="w-6 h-6 text-[rgb(var(--primary))]" />
            <h1 className="text-2xl font-bold">Exchange</h1>
          </div>
          {/* Subtitle shown regardless, but request is to display before wallet connection */}
          <p className="text-[rgb(var(--muted-foreground))] mt-1">
            StableCoins AMM using spherical geometry and orbital mechanics.
          </p>
        </div>
      </div>

      {/* Content: show tabs only when wallet is connected */}
      {address ? (
        <>
          {/* Tabs: Swap / Liquidity / Analytics */}
          <ExchangeTabs />
        </>
      ) : (
        <motion.div className="card backdrop-blur-lg p-8 text-center space-y-6">
          <div>
            <UserCircleIcon className="w-16 h-16 text-[rgb(var(--primary))] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-[rgb(var(--muted-foreground))] mb-4">
              Please connect your wallet to access Exchange.
            </p>
          </div>

          {/* DeFi AMM Protocol content block */}
          <div className="text-left space-y-4">
            <div>
              <h3 className="text-2xl font-bold">DeFi AMM<br/>Protocol</h3>
              <p className="mt-2 text-[rgb(var(--muted-foreground))]">
                Revolutionary AMM using spherical geometry and orbital mechanics. Trade with optimal capital efficiency through mathematical innovation.
              </p>
            </div>

            <div className="rounded-xl border border-[rgb(var(--border))]/40 p-4">
              <p className="text-xs tracking-wide text-[rgb(var(--muted-foreground))]">
                <span className="font-semibold">ORBITAL GEOMETRY ADVANTAGES</span><br/>
                Spherical invariant reduces impermanent loss by 40%<br/>
                Torus topology enables multi-asset efficiency<br/>
                Orbital mechanics optimize capital utilization
              </p>
              <p className="mt-2 text-xs font-semibold text-[rgb(var(--foreground))]">PROTOCOL ACTIVE • REAL-TIME PRICING • ARBITRUM STYLUS</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                <div className="text-2xl mb-2">⚛️</div>
                <h4 className="font-semibold mb-1">Spherical Geometry</h4>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Uses spherical invariant K = ||r||² where reserves form vectors in n-dimensional space, enabling optimal capital efficiency.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-semibold mb-1">Concentrated Liquidity</h4>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Interior and Boundary tick classification allows for concentrated liquidity positions with up to 1000x capital efficiency.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                <div className="text-2xl mb-2">📐</div>
                <h4 className="font-semibold mb-1">Mathematical Precision</h4>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Integer square root calculations and normalized reserve vectors ensure precise trading with minimal slippage.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">📐 Mathematical Process Flow</h4>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                Step-by-step breakdown of the spherical invariant calculation
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium">Reserve Vector</div>
                  <div className="text-sm text-[rgb(var(--muted-foreground))]">Calculate current reserves as n-dimensional vector r = [x₁, x₂, ..., xₙ]</div>
                </div>
                <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-medium">K Constant</div>
                  <div className="text-sm text-[rgb(var(--muted-foreground))]">Compute spherical invariant K = ||r||² = x₁² + x₂² + ... + xₙ²</div>
                </div>
                <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="font-medium">Trade Calculation</div>
                  <div className="text-sm text-[rgb(var(--muted-foreground))]">Solve for output: (rᵢₙ + Δᵢₙ)² + (rₒᵤₜ - Δₒᵤₜ)² + Σ(rᵢ²) = K</div>
                </div>
                <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                  <div className="text-2xl mb-2">√</div>
                  <div className="font-medium">Integer Sqrt</div>
                  <div className="text-sm text-[rgb(var(--muted-foreground))]">Use Newton's method for precise integer square root calculation</div>
                </div>
                <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40 md:col-span-2">
                  <div className="text-2xl mb-2">✅</div>
                  <div className="font-medium">Price Impact</div>
                  <div className="text-sm text-[rgb(var(--muted-foreground))]">Calculate price impact and ensure optimal execution</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Technical Deep Dive</h4>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Advanced mathematics powering the next generation of automated market makers</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                  <div className="text-2xl mb-2">⚛️</div>
                  <div className="font-medium">Spherical Invariant</div>
                  <div className="text-sm text-[rgb(var(--muted-foreground))]">K = ||r||² maintains constant sum of squared reserves across all trades</div>
                </div>
                <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                  <div className="text-2xl mb-2">📐</div>
                  <div className="font-medium">Vector Mathematics</div>
                  <div className="text-sm text-[rgb(var(--muted-foreground))]">Reserves treated as n-dimensional vectors with precise geometric calculations</div>
                </div>
                <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-medium">Tick Classification</div>
                  <div className="text-sm text-[rgb(var(--muted-foreground))]">Interior/Boundary classification enables concentrated liquidity positions</div>
                </div>
                <div className="p-4 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-medium">Gas Optimization</div>
                  <div className="text-sm text-[rgb(var(--muted-foreground))]">Integer arithmetic and Newton's method minimize computational costs</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                <div className="text-xs uppercase opacity-70">Invariant Formula</div>
                <div className="font-semibold">K = ||r||² = Σ(xᵢ²)</div>
              </div>
              <div className="p-3 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                <div className="text-xs uppercase opacity-70">Precision</div>
                <div className="font-semibold">10¹⁸ (18 decimals)</div>
              </div>
              <div className="p-3 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                <div className="text-xs uppercase opacity-70">Square Root Method</div>
                <div className="font-semibold">Newton's Method</div>
              </div>
              <div className="p-3 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                <div className="text-xs uppercase opacity-70">Max Efficiency</div>
                <div className="font-semibold">1000x Capital</div>
              </div>
              <div className="p-3 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                <div className="text-xs uppercase opacity-70">Gas Estimation</div>
                <div className="font-semibold">80K + 15K×complexity</div>
              </div>
              <div className="p-3 rounded-xl bg-[rgb(var(--muted))]/10 border border-[rgb(var(--border))]/40">
                <div className="text-xs uppercase opacity-70">Supported Tokens</div>
                <div className="font-semibold">n-dimensional</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

