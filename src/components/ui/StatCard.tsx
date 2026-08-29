import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type StatTrend = 'up' | 'down' | 'neutral'
type StatColor = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: StatTrend
  trendValue?: string
  color?: StatColor
  description?: string
  className?: string
}

const colorMap: Record<StatColor, { icon: string; value: string; bg: string }> = {
  cyan: {
    icon: 'text-cyan-400',
    value: 'text-cyan-300',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  violet: {
    icon: 'text-violet-400',
    value: 'text-violet-300',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  emerald: {
    icon: 'text-emerald-400',
    value: 'text-emerald-300',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  amber: {
    icon: 'text-amber-400',
    value: 'text-amber-300',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  rose: {
    icon: 'text-rose-400',
    value: 'text-rose-300',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
}

const trendMap = {
  up: { color: 'text-emerald-400', symbol: '↑' },
  down: { color: 'text-rose-400', symbol: '↓' },
  neutral: { color: 'text-slate-500', symbol: '—' },
}

export function StatCard({ label, value, icon, trend, trendValue, color = 'cyan', description, className = '' }: StatCardProps) {
  const c = colorMap[color]
  const t = trend ? trendMap[trend] : null

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={[
        'glass rounded-xl p-5 border transition-all duration-200',
        c.bg,
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
          <p className={`mt-1.5 text-2xl font-bold tabular-nums ${c.value}`}>{value}</p>
          {description && <p className="mt-0.5 text-xs text-slate-500 truncate">{description}</p>}
          {t && trendValue && (
            <p className={`mt-1.5 text-xs font-medium ${t.color}`}>
              {t.symbol} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className={`shrink-0 p-2.5 rounded-lg border ${c.bg}`}>
            <span className={c.icon}>{icon}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
