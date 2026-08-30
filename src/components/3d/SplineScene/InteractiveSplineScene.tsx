'use client'

import { Suspense, lazy, useRef, useState, useEffect, useCallback } from 'react'
import type { Application } from '@splinetool/runtime'

// Lazy load the Spline runtime
const Spline = lazy(() => import('@splinetool/react-spline'))

export type SplineApp = Application

export interface InteractiveSplineSceneProps {
  sceneUrl: string
  fallbackImage?: string
  onObjectClick?: (objectName: string) => void
  onObjectHover?: (objectName: string) => void
  className?: string
}

export function InteractiveSplineScene({
  sceneUrl,
  fallbackImage,
  onObjectClick,
  onObjectHover,
  className = '',
}: InteractiveSplineSceneProps) {
  const splineRef = useRef<Application | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewports
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scene loaded callback
  const handleLoad = useCallback(
    (app: SplineApp) => {
      splineRef.current = app
      setIsLoaded(true)

      // Object click event
      app.addEventListener('mouseDown', (e: any) => {
        if (e?.target?.name) {
          onObjectClick?.(e.target.name)
        }
      })

      // Object hover event
      app.addEventListener('mouseHover', (e: any) => {
        document.body.style.cursor = 'pointer'
        if (e?.target?.name) {
          onObjectHover?.(e.target.name)
        }
      })
    },
    [onObjectClick, onObjectHover]
  )

  // Scroll progress synchronization
  useEffect(() => {
    if (!isLoaded || !splineRef.current) return

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      if (maxScroll <= 0) return
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)
      splineRef.current?.setVariable('scrollProgress', progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLoaded])

  // Mobile fallback view
  if (isMobile && fallbackImage) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <img src={fallbackImage} alt="3D scene preview" className="w-full h-full object-cover" />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60">
          Interactive 3D available on desktop
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading Spinner */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#05070B] z-10">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {/* 3D Spline Canvas */}
      <Suspense fallback={null}>
        <Spline
          scene={sceneUrl}
          onLoad={handleLoad}
          className={`w-full h-full transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </Suspense>
    </div>
  )
}
