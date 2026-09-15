export function AmbientGlow({ className = '' }: { className?: string; intensity?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Soft Center-Top Cyan/Indigo Aura Behind AI Core */}
      <div
        className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full blur-[140px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.25) 0%, rgba(99, 102, 241, 0.15) 45%, rgba(12, 12, 12, 0) 80%)',
        }}
      />

      {/* Subtle Warm Violet Ambient Gradient */}
      <div
        className="absolute top-[45%] right-[10%] w-[650px] h-[650px] rounded-full blur-[160px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(12, 12, 12, 0) 70%)',
        }}
      />
    </div>
  )
}
