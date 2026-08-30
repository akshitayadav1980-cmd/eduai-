/**
 * DevPlaceholder
 *
 * Temporary stand-in rendered at each route while real pages are built.
 * Will be replaced page-by-page in subsequent steps.
 */

interface DevPlaceholderProps {
  pageName: string
  description?: string
}

export function DevPlaceholder({ pageName, description }: DevPlaceholderProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 text-white">
      <div className="rounded-lg border border-slate-700 bg-slate-900 px-8 py-6 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Development Placeholder
        </p>
        <h1 className="text-2xl font-bold text-white">{pageName}</h1>
        {description && (
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        )}
      </div>
    </div>
  )
}
