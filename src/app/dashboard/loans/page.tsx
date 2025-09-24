"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import {
  BuildingLibraryIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  InformationCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useLoans } from "@/hooks/useLoans";
import { getOrbitalAddressesByChainId } from "@/utils/orbital/client";

// Compact stat tile
function StatTile({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" }) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-500"
      : tone === "danger"
      ? "bg-red-500/10 text-red-500"
      : "bg-[rgb(var(--muted))]/40 text-[rgb(var(--foreground))]";
  return (
    <div className={`rounded-xl p-4 border border-[rgb(var(--border))]/40 ${toneClasses}`}>
      <div className="text-xs opacity-80 mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

// Labeled input
function LabeledInput({ label, placeholder, right, value, onChange }: { label: string; placeholder: string; right?: string; value?: string; onChange?: (v: string) => void }) {
  const controlled = value !== undefined;
  return (
    <div>
      <label className="block text-sm mb-1 text-[rgb(var(--muted-foreground))]">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder={placeholder}
          value={controlled ? value : undefined}
          onChange={controlled ? (e) => onChange?.(e.target.value) : undefined}
          className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--muted))]/40 border border-[rgb(var(--border))]/40 outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/30"
        />
        {right && <span className="text-sm text-[rgb(var(--muted-foreground))] px-2">{right}</span>}
      </div>
    </div>
  );
}

function LiveReadouts({ usdcAddress }: { usdcAddress?: string }) {
  const { address } = useAccount();
  const loans = useLoans();
  const [stats, setStats] = useState<{ totalDeposits: string; totalBorrowed: string; protocolFees: string; utilizationRate: string } | null>(null);
  const [profile, setProfile] = useState<{ healthFactor: string; creditScore: string; lastActivity: string; isActive: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await loans.getProtocolStats();
        setStats(s as any);
        if (address) {
          const p = await loans.getUserProfile(address);
          setProfile(p as any);
        }
      } catch {}
    })();
  }, [loans, address]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="rounded-xl p-4 border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]/60">
        <div className="text-sm mb-2 font-medium">Protocol Stats</div>
        <div className="text-xs text-[rgb(var(--muted-foreground))] space-y-1">
          <div>Total Deposits: {stats?.totalDeposits ?? '0'}</div>
          <div>Total Borrowed: {stats?.totalBorrowed ?? '0'}</div>
          <div>Utilization: {stats?.utilizationRate ?? '0'}</div>
          <div>Protocol Fees: {stats?.protocolFees ?? '0'}</div>
        </div>
      </div>
      <div className="rounded-xl p-4 border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]/60">
        <div className="text-sm mb-2 font-medium">Your Profile</div>
        <div className="text-xs text-[rgb(var(--muted-foreground))] space-y-1">
          <div>Health Factor: {profile?.healthFactor ?? '—'}</div>
          <div>Credit Score: {profile?.creditScore ?? '—'}</div>
          <div>Last Activity: {profile?.lastActivity ?? '—'}</div>
          <div>Status: {profile?.isActive ? 'Active' : 'Inactive'}</div>
        </div>
      </div>
      <div className="rounded-xl p-4 border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]/60">
        <div className="text-sm mb-2 font-medium">Config</div>
        <div className="text-xs text-[rgb(var(--muted-foreground))] space-y-1">
          <div>Hub: {loans.addresses?.hub ? `${loans.addresses.hub.slice(0,6)}...${loans.addresses.hub.slice(-4)}` : 'not set'}</div>
          <div>USDC: {usdcAddress ? `${usdcAddress.slice(0,6)}...${usdcAddress.slice(-4)}` : '—'}</div>
        </div>
      </div>
    </div>
  );
}


export default function LoansPage() {
  const { address, chain } = useAccount();
  const loans = useLoans();

  // Local UI state + contract wiring
  const [lendAsset, setLendAsset] = useState<"HBAR" | "USDC">("HBAR");
  const [borrowAsset, setBorrowAsset] = useState<"HBAR" | "USDC">("HBAR");
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [borrowAmt, setBorrowAmt] = useState("");
  const [repayAmt, setRepayAmt] = useState("");
  const [status, setStatus] = useState<string>("");
  const [usdcDeposit, setUsdcDeposit] = useState("0");
  const [usdcDebt, setUsdcDebt] = useState("0");

  const usdcAddress = useMemo(() => {
    const cid = loans.chainId || chain?.id;
    if (!cid) return undefined;
    const orbital = getOrbitalAddressesByChainId(cid);
    return orbital?.tokens?.[0];
  }, [loans.chainId, chain?.id]);

  // Wrapped HBAR ERC-20 address mapping (Hedera Testnet supported)
  const HBAR_ADDRESSES: Record<number, string | undefined> = useMemo(() => ({
    296: process.env.NEXT_PUBLIC_HBAR_ERC20_ADDRESS_296,
  }), []);
  const hbarErc20 = useMemo(() => {
    const cid = loans.chainId || chain?.id;
    if (!cid) return undefined;
    return HBAR_ADDRESSES[cid];
  }, [HBAR_ADDRESSES, loans.chainId, chain?.id]);

  // Resolve the ERC-20 address for the selected asset
  const tokenAddressFor = useMemo(() => ({
    lend: (asset: "HBAR"|"USDC") => asset === "USDC" ? usdcAddress : hbarErc20,
    borrow: (asset: "HBAR"|"USDC") => asset === "USDC" ? usdcAddress : hbarErc20,
  }), [usdcAddress, hbarErc20]);

  useEffect(() => {
    (async () => {
      if (!address || !usdcAddress) return;
      try {
        const [dep, debt] = await Promise.all([
          loans.getUserDeposits(address, usdcAddress),
          loans.getUserBorrowed(address, usdcAddress),
        ]);
        setUsdcDeposit(dep);
        setUsdcDebt(debt);
      } catch {}
    })();
  }, [address, usdcAddress, loans]);

  const poolStats = useMemo(
    () => ({
      HBAR: { liquidity: "0.1790 HBAR", util: "17.41%", lendAPY: "5.00%", borrowAPY: "8.00%" },
      USDC: { liquidity: "16.00 USDC", util: "12.49%", lendAPY: "4.00%", borrowAPY: "6.00%" },
    }),
    []
  );

  if (!address) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[rgb(var(--foreground))]">Loans</h1>
            <p className="text-[rgb(var(--muted-foreground))]">Borrow against your assets.</p>
          </div>
        </div>
        <motion.div className="card backdrop-blur-lg p-8 text-center">
          <UserCircleIcon className="w-16 h-16 text-[rgb(var(--primary))] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-[rgb(var(--muted-foreground))] mb-4">Please connect your wallet to access Loans.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Live data */}
      <LiveReadouts usdcAddress={usdcAddress} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[rgb(var(--foreground))]">Loans</h1>


          <p className="text-[rgb(var(--muted-foreground))]">Multi-Asset Lending and Borrowing</p>
        </div>
      </div>
      {status && (

        <div className="rounded-lg border border-[rgb(var(--border))]/40 bg-[rgb(var(--muted))]/40 text-sm px-3 py-2">
          {status}
        </div>
      )}


      {/* Pool Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HBAR Pool */}
        <motion.div className="card backdrop-blur-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <ChartBarIcon className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold">HBAR Pool Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Total Liquidity" value={poolStats.HBAR.liquidity} />
            <StatTile label="Utilization Rate" value={poolStats.HBAR.util} />
            <StatTile label="Lending APY" value={poolStats.HBAR.lendAPY} tone="success" />
            <StatTile label="Borrowing APY" value={poolStats.HBAR.borrowAPY} tone="danger" />
          </div>
        </motion.div>

        {/* USDC Pool */}
        <motion.div className="card backdrop-blur-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <ChartBarIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold">USDC Pool Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Total Liquidity" value={poolStats.USDC.liquidity} />
            <StatTile label="Utilization Rate" value={poolStats.USDC.util} />
            <StatTile label="Lending APY" value={poolStats.USDC.lendAPY} tone="success" />
            <StatTile label="Borrowing APY" value={poolStats.USDC.borrowAPY} tone="danger" />
          </div>
        </motion.div>
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lending Panel */}
        <motion.div className="card backdrop-blur-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-[rgb(var(--primary))]/10">
              <BanknotesIcon className="w-6 h-6 text-[rgb(var(--primary))]" />
            </div>
            <h2 className="text-lg font-semibold">Multi-Asset Lending</h2>
          </div>

          {/* Asset tabs */}
          <div className="flex gap-2 mb-4">
            {(["HBAR", "USDC"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setLendAsset(a)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  lendAsset === a
                    ? "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] border-[rgb(var(--primary))]/30"
                    : "bg-[rgb(var(--muted))]/40 text-[rgb(var(--muted-foreground))] border-[rgb(var(--border))]/40 hover:bg-[rgb(var(--muted))]/60"
                }`}
              >
                {a} {a === "HBAR" ? "(5% APY)" : "(4% APY)"}
              </button>
            ))}
          </div>

          {/* Balances & Pool */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl p-4 border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]/60">
              <div className="text-sm mb-2 font-medium">Your Balances</div>
              <div className="text-sm text-[rgb(var(--muted-foreground))]">USDC Deposited: {usdcDeposit} • USDC Debt: {usdcDebt}</div>
            </div>
            <div className="rounded-xl p-4 border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]/60">
              <div className="text-sm mb-2 font-medium">Protocol</div>
              <div className="text-sm text-[rgb(var(--muted-foreground))]">Hub: {loans.addresses?.hub ? `${loans.addresses.hub.slice(0,6)}...${loans.addresses.hub.slice(-4)}` : 'not set'}</div>
            </div>
          </div>

          {/* Buffer note */}
          <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm mb-4 flex items-start gap-2">
            <InformationCircleIcon className="w-5 h-5 mt-0.5" />
            <p>
              Pool Liquidity Buffer: A portion of assets is reserved to ensure sufficient liquidity for all users. Reserved
              amounts cannot be withdrawn.
            </p>
          </div>

          {/* Portfolio snapshot */}
          <div className="rounded-xl p-4 border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]/60 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-[rgb(var(--foreground))]/70" />
              <div className="font-medium">Your Multi-Asset Portfolio</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[rgb(var(--muted-foreground))]">
              <div>HBAR Position • Principal: 0.0000 • Interest: +0.0000 • Balance: 0.0000 HBAR</div>
              <div>USDC Position • Principal: 0.00 • Interest: +0.00 • Balance: 0.00 USDC</div>
            </div>
          </div>

          {/* Deposit/Withdraw */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <LabeledInput label={`Deposit ${lendAsset} Amount`} placeholder="0.0" right={lendAsset} value={depositAmt} onChange={setDepositAmt} />
              <button
                className="mt-3 w-full px-4 py-2 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] font-medium disabled:opacity-60"
                disabled={!loans.ready || !tokenAddressFor.lend(lendAsset) || !depositAmt}
                onClick={async () => {
                  const token = tokenAddressFor.lend(lendAsset);
                  if (!token) return;
                  try {
                    setStatus('Approving...');
                    await loans.approve(token, loans.addresses!.hub, depositAmt);
                    setStatus('Depositing...');
                    await loans.deposit(token, depositAmt);
                    setStatus('Deposit successful');
                  } catch (e) {
                    setStatus('Deposit failed');
                  }
                }}
              >
                Deposit {lendAsset}
              </button>
            </div>
            <div>
              <LabeledInput label={`Withdraw ${lendAsset} Amount`} placeholder="0.0" right={lendAsset} value={withdrawAmt} onChange={setWithdrawAmt} />
              <button
                className="mt-3 w-full px-4 py-2 rounded-lg bg-[rgb(var(--muted))]/50 border border-[rgb(var(--border))]/40 font-medium disabled:opacity-60"
                disabled={!loans.ready || !tokenAddressFor.lend(lendAsset) || !withdrawAmt}
                onClick={async () => {
                  const token = tokenAddressFor.lend(lendAsset);
                  if (!token) return;
                  try {
                    setStatus('Withdrawing...');
                    await loans.withdraw(token, withdrawAmt);
                    setStatus('Withdraw successful');
                  } catch (e) {
                    setStatus('Withdraw failed');
                  }
                }}
              >
                Withdraw {lendAsset}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Borrowing Panel */}
        <motion.div className="card backdrop-blur-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-[rgb(var(--primary))]/10">
              <BuildingLibraryIcon className="w-6 h-6 text-[rgb(var(--primary))]" />
            </div>
            <h2 className="text-lg font-semibold">Multi-Asset Borrowing</h2>
          </div>

          {/* Borrow tabs */}
          <div className="flex gap-2 mb-4">
            {(["HBAR", "USDC"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setBorrowAsset(a)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  borrowAsset === a
                    ? "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] border-[rgb(var(--primary))]/30"
                    : "bg-[rgb(var(--muted))]/40 text-[rgb(var(--muted-foreground))] border-[rgb(var(--border))]/40 hover:bg-[rgb(var(--muted))]/60"
                }`}
              >
                Borrow {a} ({a === "HBAR" ? "8% APY" : "6% APY"})
              </button>
            ))}
          </div>

          {/* Info */}
          <div className="rounded-xl p-4 bg-blue-500/10 border border-blue-500/20 text-sm text-blue-500/90 mb-4">
            <div className="font-medium mb-1">Cross-Collateral Borrowing Information</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>Use ETH as collateral to borrow USDC, or USDC as collateral to borrow ETH.</li>
              <li>Collateralization: 150% required • Liquidation below 120% health factor.</li>
              <li>Prices are illustrative and may come from an oracle in production.</li>
            </ul>
          </div>

          {/* Balances & Pool */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl p-4 border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]/60">
              <div className="text-sm mb-2 font-medium">Your Balances</div>
              <div className="text-sm text-[rgb(var(--muted-foreground))]">HBAR: 0.0000 • USDC: 0.00</div>
            </div>
            <div className="rounded-xl p-4 border border-[rgb(var(--border))]/40 bg-[rgb(var(--card))]/60">
              <div className="text-sm mb-2 font-medium">Pool Liquidity</div>
              <div className="text-sm text-[rgb(var(--muted-foreground))]">HBAR Available: 0.1790 • USDC Available: 16.00</div>
            </div>
          </div>

          {/* Borrow form */}
          <div className="space-y-4">
            <LabeledInput label={`Borrow ${borrowAsset} Amount`} placeholder="0.0" right={borrowAsset} value={borrowAmt} onChange={setBorrowAmt} />

            <div>
              <div className="block text-sm mb-1 text-[rgb(var(--muted-foreground))]">Collateral Type</div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="col" defaultChecked={borrowAsset === "USDC"} /> HBAR Collateral
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="col" defaultChecked={borrowAsset === "HBAR"} /> USDC Collateral
                </label>
              </div>
            </div>

            <LabeledInput label="Required Collateral (150%)" placeholder="0.0" right={borrowAsset === "HBAR" ? "USDC" : "HBAR"} />

            <button
              className="w-full px-4 py-2 rounded-lg bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] font-medium disabled:opacity-60"
              disabled={!loans.ready || !tokenAddressFor.borrow(borrowAsset) || !borrowAmt}
              onClick={async () => {
                const token = tokenAddressFor.borrow(borrowAsset);
                if (!token) return;
                try {
                  setStatus('Borrowing...');
                  await loans.borrow(token, borrowAmt);
                  setStatus('Borrow successful');
                } catch (e) {
                  setStatus('Borrow failed');
                }
              }}
            >
              Borrow {borrowAmt || '0'} {borrowAsset}
            </button>

            <div className="pt-2">
              <LabeledInput label={`Repay ${borrowAsset} Amount`} placeholder="0.0" right={borrowAsset} value={repayAmt} onChange={setRepayAmt} />
              <button
                className="mt-3 w-full px-4 py-2 rounded-lg bg-[rgb(var(--muted))]/50 border border-[rgb(var(--border))]/40 font-medium disabled:opacity-60"
                disabled={!loans.ready || !tokenAddressFor.borrow(borrowAsset) || !repayAmt}
                onClick={async () => {
                  const token = tokenAddressFor.borrow(borrowAsset);
                  if (!token) return;
                  try {
                    setStatus('Repaying...');
                    await loans.repay(token, repayAmt);
                    setStatus('Repay successful');
                  } catch (e) {
                    setStatus('Repay failed');
                  }
                }}
              >
                Repay {repayAmt || '0'} {borrowAsset}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

