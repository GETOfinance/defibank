"use client"

import { motion } from 'framer-motion'
import { AdvancedChart } from '@/components/orbital/ui/AdvancedChart'
import { OrbitalVisualization } from '@/components/orbital/ui/OrbitalVisualization'
import { TrendingUp, Activity, Droplets, Zap, Users, Target, BarChart3, PieChart } from 'lucide-react'
import { useOrbitalAnalytics } from '@/hooks/useOrbitalAnalytics'

export function AnalyticsDashboard() {
  const { timeframe, setTimeframe, tokens, setTokens, series, stats } = useOrbitalAnalytics()

  const keyMetrics = [
    {
      title: 'Total Value Locked',
      value: `$${stats.current.toLocaleString(undefined, { maximumFractionDigits: 2 })}M`,
      change: `${(((stats.current - stats.low24h) / (stats.low24h || stats.current)) * 100).toFixed(2)}%`,
      changeType: 'positive' as const,
      icon: Droplets,
      color: '#f97316'
    },
    {
      title: '24h Trading Volume',
      value: '$—',
      change: '+0.0%',
      changeType: 'positive' as const,
      icon: Activity,
      color: '#22c55e'
    },
    {
      title: 'Avg Capital Efficiency',
      value: '—',
      change: '+0.0x',
      changeType: 'positive' as const,
      icon: Zap,
      color: '#8b5cf6'
    },
    {
      title: 'Protocol Fees (24h)',
      value: '$—',
      change: '+0.0%',
      changeType: 'positive' as const,
      icon: Target,
      color: '#f59e0b'
    },
    {
      title: 'Average APY',
      value: '—',
      change: '+0.0%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: '#06b6d4'
    }
  ]

  const tokenOptions = ['USDC','USDT','DAI','FRAX','LUSD']

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          {(['1H','4H','1D','1W'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs border ${timeframe===tf? 'bg-orange-500 text-black border-transparent':'bg-transparent text-orange-300 border-orange-500/30 hover:bg-orange-500/10'}`}
            >{tf}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {tokenOptions.map(sym => {
            const active = tokens.includes(sym)
            return (
              <button
                key={sym}
                onClick={() => {
                  const set = new Set(tokens)
                  if (active) set.delete(sym); else set.add(sym)
                  setTokens(Array.from(set))
                }}
                className={`px-2.5 py-1 rounded-lg text-xs border ${active? 'bg-orange-500 text-black border-transparent':'bg-transparent text-orange-300 border-orange-500/30 hover:bg-orange-500/10'}`}
              >{sym}</button>
            )
          })}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {keyMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-morphism-dark rounded-xl p-6 border border-orange-500/20 hover:border-orange-400/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 rounded-full border"
                  style={{ backgroundColor: `${metric.color}20`, borderColor: `${metric.color}30` }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <metric.icon className="w-5 h-5" style={{ color: metric.color }} />
                </motion.div>
                <div>
                  <h3 className="text-sm font-medium text-orange-300/70">{metric.title}</h3>
                  <div className="text-2xl font-bold text-orange-100">{metric.value}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>{metric.change} vs 24h ago</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <AdvancedChart title="Liquidity Analytics" className="col-span-1 xl:col-span-2" />
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="col-span-1">
          <div className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20">
            <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                <Zap className="w-5 h-5 text-orange-400" />
              </motion.div>
              Orbital Liquidity Map
            </h3>
            <OrbitalVisualization />
          </div>
        </motion.div>
      </div>

      {/* Secondary Chart */}
      <div className="grid grid-cols-1 gap-6">
        <AdvancedChart title="Trading Performance & Volume Analysis" showMetricSelector={true} />
      </div>

      {/* Secondary Analytics - keep mock summaries for now */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20">
          <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
              <PieChart className="w-5 h-5 text-orange-400" />
            </motion.div>
            Pool Distribution
          </h3>
          <div className="space-y-4">
            {['USDC','USDT','DAI','FRAX','LUSD'].map((token, index) => (
              <motion.div key={token} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + index * 0.1 }} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/20">
                <div className="flex items-center gap-3">
                  <motion.div className="w-4 h-4 rounded-full bg-orange-400" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }} />
                  <span className="font-semibold text-orange-200">{token}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-orange-100">—</div>
                  <div className="text-xs text-orange-400/70">—</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20">
          <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </motion.div>
            Top Performers
          </h3>
          <div className="space-y-3">
            {[
              { pair: 'USDC/USDT', apy: '—', efficiency: '—', volume: '—' },
              { pair: 'DAI/FRAX', apy: '—', efficiency: '—', volume: '—' },
              { pair: 'USDT/DAI', apy: '—', efficiency: '—', volume: '—' },
              { pair: 'FRAX/LUSD', apy: '—', efficiency: '—', volume: '—' }
            ].map((performer, index) => (
              <motion.div key={performer.pair} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + index * 0.1 }} className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-green-200">{performer.pair}</span>
                  <span className="text-sm text-green-400 font-bold">{performer.apy}</span>
                </div>
                <div className="flex justify-between text-xs text-green-300/70">
                  <span>Efficiency: {performer.efficiency}</span>
                  <span>Volume: {performer.volume}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="glass-morphism-dark rounded-2xl p-6 border border-orange-500/20">
          <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
            <motion.div animate={{ rotate: [0, 180, 360] }} transition={{ duration: 3, repeat: Infinity }}>
              <Activity className="w-5 h-5 text-blue-400" />
            </motion.div>
            Recent Activity
          </h3>
          <div className="text-sm text-orange-300/70">Live event feed coming soon…</div>
        </motion.div>
      </div>
    </div>
  )
}

