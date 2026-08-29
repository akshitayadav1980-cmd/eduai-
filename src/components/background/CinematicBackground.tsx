import { AmbientGlow } from './AmbientGlow'

interface CinematicBackgroundProps {
  showParticles?: boolean
  showGlow?: boolean
  showGrid?: boolean
  className?: string
  children?: React.ReactNode
}

export function CinematicBackground({
  showGlow = true,
  className = '',
  children,
}: CinematicBackgroundProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden bg-[#F8F7F3] z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Soft Layered Studio Gallery Glow */}
      {showGlow && <AmbientGlow />}

      {children}
    </div>
  )
}
