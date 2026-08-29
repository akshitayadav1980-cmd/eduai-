---
name: react-spline
description: >-
  Build, embed, and interact with 3D Spline scenes in React and Next.js applications using @splinetool/react-spline.
  Includes patterns for lazy loading, event listening, bi-directional variable binding, scroll-driven animations, and responsive fallbacks.
---

# React Spline 3D Integration Skill

This skill provides guidelines, best practices, and code patterns for integrating interactive **Spline 3D** scenes into React, Next.js, and Vite applications using `@splinetool/react-spline`.

---

## 1. Installation

```bash
npm install @splinetool/react-spline @splinetool/runtime
```

---

## 2. Core Patterns

### Pattern A: Lazy Loading & Suspense
Spline's runtime is heavy (~1.5MB+). Always lazy-load it with `React.lazy` and `Suspense` to avoid blocking the main bundle.

```tsx
'use client'

import React, { Suspense, lazy, useRef, useState, useCallback } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineApp {
  findObjectByName: (name: string) => any
  findObjectById: (id: string) => any
  getAllObjects: () => any[]
  addEventListener: (event: string, callback: (e: any) => void) => void
  removeEventListener: (event: string, callback: (e: any) => void) => void
  emitEvent: (event: string, objectName: string) => void
  getVariable: (name: string) => any
  setVariable: (name: string, value: any) => void
}
```

---

### Pattern B: Event Handling & Bi-directional State Sync

```tsx
export function InteractiveSplineScene({ sceneUrl }: { sceneUrl: string }) {
  const splineRef = useRef<SplineApp | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [score, setScore] = useState(0)

  const handleLoad = useCallback((app: SplineApp) => {
    splineRef.current = app
    setIsLoaded(true)

    // Listen to 3D object clicks
    app.addEventListener('mouseDown', (e: any) => {
      console.log('Clicked 3D object:', e.target.name)
      if (e.target.name === 'Coin') {
        setScore((prev) => prev + 1)
      }
    })

    // Listen to 3D object hovers
    app.addEventListener('mouseHover', () => {
      document.body.style.cursor = 'pointer'
    })
  }, [])

  // Sync React state -> Spline variable
  React.useEffect(() => {
    if (splineRef.current && isLoaded) {
      splineRef.current.setVariable('score', score)
    }
  }, [score, isLoaded])

  // Trigger external events inside Spline
  const trigger3DAction = (eventName: string, targetObjectName: string) => {
    splineRef.current?.emitEvent(eventName, targetObjectName)
  }

  return (
    <div className="relative w-full h-screen">
      <Suspense fallback={<div className="animate-spin" />}>
        <Spline
          scene={sceneUrl}
          onLoad={handleLoad}
          className={`w-full h-full transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </Suspense>
    </div>
  )
}
```

---

### Pattern C: Scroll-Driven 3D Interpolation

Bind normalized window scroll progress ($0 \to 1$) to a Spline variable:

```tsx
React.useEffect(() => {
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
```

---

### Pattern D: Mobile Fallback & Performance Guardrails

```tsx
const isMobile = window.innerWidth < 768

if (isMobile && fallbackImage) {
  return (
    <div className="relative w-full h-screen">
      <img src={fallbackImage} alt="3D scene preview" className="w-full h-full object-cover" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60">
        Interactive 3D optimized for desktop
      </div>
    </div>
  )
}
```
