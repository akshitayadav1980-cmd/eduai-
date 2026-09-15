import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

export type GlassCardVariant = 'default' | 'subtle' | 'interactive' | 'highlighted'
export type GlassCardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'
export type GlassCardGlow = 'none' | 'cyan' | 'violet' | 'emerald' | 'indigo'

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: GlassCardVariant
  padding?: GlassCardPadding
  glow?: GlassCardGlow
  hover?: boolean
  children?: React.ReactNode
  className?: string
}

const variantStyles: Record<GlassCardVariant, string> = {
  default:
    'bg-[#0e1014]/80 backdrop-blur-2xl border border-white/10 shadow-2xl text-white',
  subtle:
    'bg-[#0e1014]/50 backdrop-blur-md border border-white/[0.08] text-white/90 shadow-md',
  interactive:
    'bg-[#0e1014]/80 backdrop-blur-2xl border border-white/10 shadow-xl hover:bg-[#151821]/90 hover:border-cyan-400/50 hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer text-white',
  highlighted:
    'bg-[#121622]/90 backdrop-blur-3xl border border-cyan-400/60 shadow-glow-cyan-subtle ring-1 ring-cyan-400/30 text-white',
}

const paddingStyles: Record<GlassCardPadding, string> = {
  none: 'p-0',
  sm: 'p-3.5 sm:p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
  xl: 'p-8 sm:p-10',
}

const glowStyles: Record<GlassCardGlow, string> = {
  none: '',
  cyan: 'shadow-glow-cyan',
  violet: 'shadow-glow-violet',
  emerald: 'shadow-glow-emerald',
  indigo: 'shadow-glow-indigo',
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      glow = 'none',
      hover = false,
      children,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const isInteractive = variant === 'interactive' || hover

    return (
      <motion.div
        ref={ref}
        whileHover={isInteractive ? { y: -3, scale: 1.008 } : undefined}
        whileTap={isInteractive ? { scale: 0.99 } : undefined}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={[
          'relative rounded-2xl overflow-hidden liquid-glass',
          variantStyles[variant],
          paddingStyles[padding],
          glowStyles[glow],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {/* Crisp Top Inner Highlight */}
        <div
          className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {children}
      </motion.div>
    )
  },
)

GlassCard.displayName = 'GlassCard'
