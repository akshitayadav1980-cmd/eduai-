import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'icon' | 'outline' | 'danger' | 'success'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#171717] hover:bg-[#262626] text-[#FFFFFF] font-medium shadow-editorial border border-black/10 transition-all cursor-pointer',
  secondary:
    'bg-[#FAFAF8] dark:bg-[#18181D] hover:bg-[#F1F1EE] dark:hover:bg-[#23232A] text-[#171717] dark:text-[#F5F5F5] font-medium border border-black/[0.06] dark:border-white/[0.08] shadow-subtle transition-all cursor-pointer',
  glass:
    'bg-white/80 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.1] text-[#171717] dark:text-[#F5F5F5] font-medium backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-subtle transition-all cursor-pointer',
  ghost:
    'bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#6F6F6A] dark:text-[#A3A39E] hover:text-[#171717] dark:hover:text-[#F5F5F5] border border-transparent cursor-pointer',
  icon:
    'p-2.5 rounded-xl bg-white/70 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.1] text-[#6F6F6A] dark:text-[#F5F5F5] border border-black/[0.05] dark:border-white/[0.08] backdrop-blur-lg shadow-subtle cursor-pointer',
  outline:
    'bg-transparent hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-subtle cursor-pointer',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-[#FFFFFF] font-medium border border-rose-700/30 shadow-subtle cursor-pointer',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-[#FFFFFF] font-medium border border-emerald-700/30 shadow-subtle cursor-pointer',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
  sm: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2 rounded-xl',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-2xl',
  xl: 'px-8 py-3.5 text-base sm:text-lg gap-3 rounded-2xl',
}

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={!isDisabled ? { y: -1, scale: 1.005 } : undefined}
        whileTap={!isDisabled ? { y: 0, scale: 0.985 } : undefined}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={[
          'inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none',
          'focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          variant !== 'icon' ? sizeClasses[size] : '',
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...rest}
      >
        {loading && <Spinner />}
        {!loading && icon && iconPosition === 'left' && (
          <span className="shrink-0 inline-flex items-center" aria-hidden="true">
            {icon}
          </span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0 inline-flex items-center" aria-hidden="true">
            {icon}
          </span>
        )}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'
