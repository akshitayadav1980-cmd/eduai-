import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<ComponentPropsWithoutRef<'select'>, 'prefix'> {
  label?: string
  options: SelectOption[]
  error?: string
  hint?: string
  placeholder?: string
  prefix?: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, hint, placeholder, prefix, className = '', id, ...rest }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={[
              'w-full appearance-none bg-surface-2/60 border rounded-lg',
              prefix ? 'pl-9' : 'pl-3.5',
              'pr-9 py-2.5 text-white text-sm',
              'transition-all duration-150 focus:outline-none cursor-pointer',
              'focus:border-cyan-500/60 focus:bg-surface-2/80 focus:ring-2 focus:ring-cyan-500/20',
              error
                ? 'border-rose-500/50'
                : 'border-white/10 hover:border-white/20',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={!!error}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-surface-2 text-white"
              >
                {opt.label}
              </option>
            ))}
          </select>
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
              {prefix}
            </div>
          )}
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
