import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import type { ComponentPropsWithoutRef } from 'react'

type GlowColor = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose'

interface GlowCardProps extends ComponentPropsWithoutRef<'div'> {
  glowColor?: GlowColor
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const glowMap: Record<GlowColor, { border: string; glow: string; bg: string }> = {
  cyan: {
    border: 'border-cyan-500/30',
    glow: 'hover:shadow-glow-cyan',
    bg: 'hover:bg-cyan-500/5',
  },
  violet: {
    border: 'border-violet-500/30',
    glow: 'hover:shadow-glow-violet',
    bg: 'hover:bg-violet-500/5',
  },
  emerald: {
    border: 'border-emerald-500/30',
    glow: 'hover:shadow-glow-emerald',
    bg: 'hover:bg-emerald-500/5',
  },
  amber: {
    border: 'border-amber-500/30',
    glow: '',
    bg: 'hover:bg-amber-500/5',
  },
  rose: {
    border: 'border-rose-500/30',
    glow: '',
    bg: 'hover:bg-rose-500/5',
  },
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
}

export const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  ({ glowColor = 'cyan', hover = true, padding = 'md', children, className = '', ...rest }, ref) => {
    const g = glowMap[glowColor]
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -2 } : undefined}
        className={[
          'glass rounded-xl border transition-all duration-200',
          g.border,
          hover ? `${g.glow} ${g.bg}` : '',
          paddingClasses[padding],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...(rest as any)}
      >
        {children}
      </motion.div>
    )
  },
)

GlowCard.displayName = 'GlowCard'
