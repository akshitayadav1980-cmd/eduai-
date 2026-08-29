import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  alpha: number
  baseAlpha: number
  color: string
}

export function ParticleField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const isMobile = width < 768
    const count = isMobile ? 18 : 36

    const colors = [
      'rgba(6, 182, 212, ',   // Cyan
      'rgba(59, 130, 246, ',  // Electric Blue
      'rgba(139, 92, 246, ',  // Violet
      'rgba(255, 255, 255, ', // White/Star
    ]

    const particles: Particle[] = []

    for (let i = 0; i < count; i++) {
      const baseAlpha = Math.random() * 0.25 + 0.08
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.6,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15 - 0.05, // gentle upward drift
        alpha: baseAlpha,
        baseAlpha,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    let t = 0
    const render = () => {
      t += 0.015
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < count; i++) {
        const p = particles[i]

        p.x += p.vx
        p.y += p.vy

        // Wrap around boundaries smoothly
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10
        if (p.y < -10) p.y = height + 10
        if (p.y > height + 10) p.y = -10

        // Subtle shimmer
        const shimmer = Math.sin(t + i) * 0.08
        const currentAlpha = Math.max(0.04, Math.min(0.4, p.baseAlpha + shimmer))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${currentAlpha})`
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none w-full h-full ${className}`}
      aria-hidden="true"
    />
  )
}
