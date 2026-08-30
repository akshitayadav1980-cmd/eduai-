import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: ReactNode
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className = '', id, ...rest }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-500">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full bg-surface-2/60 border rounded-lg text-white placeholder-slate-500',
              'transition-all duration-150 focus:outline-none',
              'focus:border-cyan-500/60 focus:bg-surface-2/80 focus:ring-2 focus:ring-cyan-500/20',
              error
                ? 'border-rose-500/50 focus:border-rose-500/60 focus:ring-rose-500/20'
                : 'border-white/10 hover:border-white/20',
              prefix ? 'pl-9' : 'pl-3.5',
              suffix ? 'pr-9' : 'pr-3.5',
              'py-2.5 text-sm',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...rest}
          />
          {suffix && (
            <div className="absolute right-3 flex items-center text-slate-500">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
