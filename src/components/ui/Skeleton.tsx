interface SkeletonProps {
  className?: string
  rounded?: boolean
  circle?: boolean
}

export function Skeleton({ className = '', rounded = false, circle = false }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        'animate-pulse bg-white/6',
        circle ? 'rounded-full' : rounded ? 'rounded-lg' : 'rounded-md',
        className,
      ].join(' ')}
    />
  )
}

// Convenience compound skeletons
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-label="Loading..." aria-busy>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass rounded-xl p-5 space-y-3 ${className}`} aria-label="Loading..." aria-busy>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" circle />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}
