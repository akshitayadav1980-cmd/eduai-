interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 gap-4 ${className}`}
      aria-label={message}
      aria-busy
    >
      {/* Spinner rings */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-violet-400 animate-spin [animation-duration:0.7s]" />
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
