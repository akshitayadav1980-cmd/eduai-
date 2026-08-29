interface DividerProps {
  label?: string
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Divider({ label, orientation = 'horizontal', className = '' }: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={`w-px bg-white/8 self-stretch ${className}`} aria-hidden="true" />
  }

  if (label) {
    return (
      <div className={`flex items-center gap-3 ${className}`} role="separator">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-xs text-slate-600 font-medium px-1">{label}</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>
    )
  }

  return <hr className={`border-0 h-px bg-white/8 ${className}`} aria-hidden="true" />
}
