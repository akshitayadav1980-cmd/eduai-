import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  breadcrumb?: string
  className?: string
}

export function PageHeader({ title, description, action, breadcrumb, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        {breadcrumb && (
          <p className="text-xs font-medium text-slate-600 uppercase tracking-widest mb-1">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-xl font-bold text-white truncate">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
