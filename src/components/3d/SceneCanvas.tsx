import { useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

import { AICore, STATE_TARGETS } from './AICore'
import { OrbitalParticles, AmbientParticles } from './Particles'
import { FloatingElement } from './FloatingElement'
import { useAppStore } from '../../store/useAppStore'
import type { AICoreState } from './AICore'

interface CameraRigProps {
  reducedMotion?: boolean
}

/**
 * CameraRig adds subtle, elegant mouse parallax without aggressive cursor following.
 */
function CameraRig({ reducedMotion = false }: CameraRigProps) {
  useFrame((state, delta) => {
    if (reducedMotion) return

    // Subtle pointer parallax
    const targetX = state.pointer.x * 0.45
    const targetY = state.pointer.y * 0.35 + 0.1

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, delta * 2.0)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, delta * 2.0)
    state.camera.lookAt(0, 0, 0)
  })

  return null
}

export interface SceneCanvasProps {
  state?: AICoreState
  audioLevel?: number
  scale?: number
  showFloatingElements?: boolean
  showOrbitalParticles?: boolean
  showAmbientParticles?: boolean
  cameraPosition?: [number, number, number]
  interactive?: boolean
  className?: string
}

export function SceneCanvas({
  state: propState,
  audioLevel = 0,
  scale = 1,
  showFloatingElements = true,
  showOrbitalParticles = true,
  showAmbientParticles = true,
  cameraPosition = [0, 0.1, 7.5],
  interactive = false,
  className = '',
}: SceneCanvasProps) {
  // Store fallback for assistant state
  const storeMode = useAppStore((s) => s.assistantState.mode)
  const activeState: AICoreState = propState ?? (storeMode as AICoreState) ?? 'idle'
  const targetConfig = STATE_TARGETS[activeState] ?? STATE_TARGETS.idle

  // Detect reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return (
    <div
      className={`w-full h-full absolute inset-0 ${interactive ? 'pointer-events-auto' : 'pointer-events-none'} ${className}`}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: cameraPosition, fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]} // Cap device pixel ratio for smooth 60fps
      >
        {/* ── Dark Cinematic Lighting Rig ── */}
        <ambientLight intensity={0.25} />
        <pointLight position={[6, 6, 6]} intensity={1.2} color="#06b6d4" />
        <pointLight position={[-6, -4, -5]} intensity={0.8} color="#8b5cf6" />
        <pointLight position={[0, -5, 4]} intensity={0.35} color="#3b82f6" />

        {/* ── Camera Parallax Controller ── */}
        <CameraRig reducedMotion={reducedMotion} />

        {/* ── 3D AI Core (Master Object) ── */}
        <AICore
          state={activeState}
          audioLevel={audioLevel}
          scale={scale}
          reducedMotion={reducedMotion}
        />

        {/* ── Orbital Particles ── */}
        {showOrbitalParticles && (
          <OrbitalParticles
            state={activeState}
            primaryColor={targetConfig.primary}
            reducedMotion={reducedMotion}
          />
        )}

        {/* ── Ambient Deep Particles ── */}
        {showAmbientParticles && (
          <AmbientParticles reducedMotion={reducedMotion} />
        )}

        {/* ── Subtle Secondary Floating Artifacts (Optional) ── */}
        {showFloatingElements && (
          <group>
            <FloatingElement
              position={[-3.8, 1.5, -2]}
              type="crystal"
              color="#06b6d4"
              emissiveColor="#0e7490"
              scale={0.35}
              speed={1.2}
              reducedMotion={reducedMotion}
            />
            <FloatingElement
              position={[3.8, -1.2, -2.5]}
              type="ring"
              color="#8b5cf6"
              emissiveColor="#7c3aed"
              scale={0.3}
              speed={1.4}
              reducedMotion={reducedMotion}
            />
            <FloatingElement
              position={[-2.8, -2.2, -1.5]}
              type="prism"
              color="#3b82f6"
              emissiveColor="#2563eb"
              scale={0.28}
              speed={1.0}
              reducedMotion={reducedMotion}
            />
            <FloatingElement
              position={[3.2, 2.2, -3]}
              type="cube"
              color="#10b981"
              emissiveColor="#059669"
              scale={0.25}
              speed={1.6}
              reducedMotion={reducedMotion}
            />
          </group>
        )}

        {/* ── Restrained Cinematic Post-Processing ── */}
        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.55}
            luminanceSmoothing={0.8}
            mipmapBlur
            intensity={1.1}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
