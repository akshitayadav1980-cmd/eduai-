import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import type { ComponentPropsWithoutRef } from 'react'

type Variant = 'ghost' | 'glass' | 'primary' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant
  size?: Size
  label: string // required for accessibility
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  ghost: 'text-slate-400 hover:text-white hover:bg-white/8 border border-transparent',
  glass:
    'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15',
  primary:
    'text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30',
  danger: 'text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 w-7 rounded-md',
  md: 'h-9 w-9 rounded-lg',
  lg: 'h-11 w-11 rounded-xl',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', label, loading, children, className = '', disabled, ...rest }, ref) => {
    const isDisabled = disabled || loading
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: isDisabled ? 1 : 0.92 }}
        aria-label={label}
        aria-disabled={isDisabled}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center transition-all duration-150',
          'focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...(rest as any)}
      >
        {children}
      </motion.button>
    )
  },
)

IconButton.displayName = 'IconButton'
