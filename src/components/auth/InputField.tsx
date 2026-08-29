import React, { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helperText, icon, id, className = '', ...props }, ref) => {
    const { isDarkMode } = useAppStore()
    const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`

    return (
      <div className="w-full space-y-1.5 text-left">
        <label
          htmlFor={inputId}
          className={`block text-xs font-semibold uppercase tracking-wider ${
            isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'
          }`}
        >
          {label}
        </label>

        <div className="relative flex items-center">
          {icon && (
            <div
              className={`absolute left-3.5 pointer-events-none ${
                isDarkMode ? 'text-[#737373]' : 'text-[#A3A39E]'
              }`}
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`w-full text-sm sm:text-base rounded-2xl border px-4 py-3.5 transition-all duration-200 outline-none ${
              icon ? 'pl-11' : ''
            } ${
              error
                ? 'border-rose-500/70 bg-rose-50/30 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500/30'
                : isDarkMode
                ? 'bg-white/[0.04] border-white/[0.08] text-[#F5F5F5] placeholder:text-[#525252] focus:bg-white/[0.07] focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20'
                : 'bg-[#FAFAF8] border-black/[0.06] text-[#171717] placeholder:text-[#A3A39E] focus:bg-[#FFFFFF] focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 shadow-xs'
            } ${className}`}
            {...props}
          />
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1.5 text-xs text-rose-500 font-medium pt-0.5"
            >
              <AlertCircle size={13} className="shrink-0" />
              <span>{error}</span>
            </motion.p>
          ) : helperText ? (
            <p className={`text-[11px] ${isDarkMode ? 'text-[#737373]' : 'text-[#A3A39E]'}`}>
              {helperText}
            </p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)

InputField.displayName = 'InputField'
