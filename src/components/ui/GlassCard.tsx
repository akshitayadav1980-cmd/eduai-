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
    'bg-white/80 backdrop-blur-2xl border border-black/[0.06] shadow-editorial text-[#171717]',
  subtle:
    'bg-white/50 backdrop-blur-md border border-black/[0.04] shadow-sm text-[#171717]',
  interactive:
    'bg-white/80 backdrop-blur-2xl border border-black/[0.06] shadow-editorial hover:bg-white/95 hover:border-indigo-500/30 hover:shadow-warm-glass transition-all duration-300 cursor-pointer text-[#171717]',
  highlighted:
    'bg-white/90 backdrop-blur-3xl border border-indigo-500/25 shadow-editorial text-[#171717]',
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
        whileHover={isInteractive ? { y: -2, scale: 1.005 } : undefined}
        whileTap={isInteractive ? { scale: 0.99 } : undefined}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={[
          'relative rounded-2xl overflow-hidden',
          variantStyles[variant],
          paddingStyles[padding],
          glowStyles[glow],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {/* Subtle Top Inner Highlight */}
        <div
          className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {children}
      </motion.div>
    )
  },
)

GlassCard.displayName = 'GlassCard'
