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
      className={`fixed inset-0 pointer-events-none overflow-hidden bg-[#0c0c0c] z-0 ${className}`}
      aria-hidden="true"
    >
      {/* ── High Contrast Looping Video ── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-80 pointer-events-none filter contrast-125 saturate-125"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
      />

      {/* SVG Noise Filter */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      {/* Vertical Guide Lines */}
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {/* Soft Layered Studio Gallery Glow */}
      {showGlow && <AmbientGlow />}

      {children}
    </div>
  )
}
