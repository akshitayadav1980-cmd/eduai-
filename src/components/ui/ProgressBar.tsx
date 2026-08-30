import { motion } from 'framer-motion'

type ProgressColor = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose'
type ProgressSize = 'xs' | 'sm' | 'md' | 'lg'

interface ProgressBarProps {
  value: number          // 0–100
  max?: number
  color?: ProgressColor
  size?: ProgressSize
  animated?: boolean
  showLabel?: boolean
  label?: string
  className?: string
}

const colorMap: Record<ProgressColor, string> = {
  cyan: 'from-cyan-500 to-cyan-400',
  violet: 'from-violet-600 to-violet-400',
  emerald: 'from-emerald-600 to-emerald-400',
  amber: 'from-amber-600 to-amber-400',
  rose: 'from-rose-600 to-rose-400',
}

const sizeMap: Record<ProgressSize, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({
  value,
  max = 100,
  color = 'cyan',
  size = 'sm',
  animated = true,
  showLabel = false,
  label,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showLabel && <span className="text-xs text-slate-400 tabular-nums">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={`w-full bg-white/8 rounded-full overflow-hidden ${sizeMap[size]}`}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className={`h-full bg-gradient-to-r rounded-full ${colorMap[color]}`}
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
