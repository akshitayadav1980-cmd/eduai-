export function AmbientGlow({ className = '' }: { className?: string; intensity?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Soft Center-Top Radial Aura Behind AI Core */}
      <div
        className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[140px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(224,231,255,0.3) 40%, rgba(248,247,243,0) 80%)',
        }}
      />

      {/* Subtle Warm Indigo Ambient Gradient */}
      <div
        className="absolute top-[40%] right-[10%] w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(238,242,255,0.5) 0%, rgba(248,247,243,0) 70%)',
        }}
      />
    </div>
  )
}
