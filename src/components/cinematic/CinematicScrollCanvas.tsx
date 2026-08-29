import { useEffect, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

import { AICore, STATE_TARGETS } from '../3d/AICore'
import { OrbitalParticles, AmbientParticles } from '../3d/Particles'
import { FloatingElement } from '../3d/FloatingElement'
import { LanguageShards } from '../3d/LanguageFragments/LanguageShards'
import { EducationRings } from '../3d/EducationRings/EducationRings'
import { AdaptiveScene3D } from '../3d/AdaptiveScene3D/AdaptiveScene3D'
import { useAppStore } from '../../store/useAppStore'
import { useExperienceScroll } from './ScrollContext'
import type { AICoreState } from '../3d/AICore'

interface MasterSceneRigProps {
  scrollProgress: number
  audioLevel?: number
  reducedMotion?: boolean
}

/**
 * MasterSceneRig continuously interpolates Camera and AI Core coordinates across all 6 scenes.
 */
function MasterSceneRig({ scrollProgress, audioLevel = 0, reducedMotion = false }: MasterSceneRigProps) {
  const coreGroupRef = useRef<THREE.Group>(null!)
  const activeLevel = useAppStore((s) => s.educationLevel)

  useFrame((state, delta) => {
    const p = THREE.MathUtils.clamp(scrollProgress, 0, 1)

    // ── 1. Continuous Camera Trajectory ──────────────────────────────────────
    let targetCamX = 0.0
    let targetCamY = 0.0
    let targetCamZ = 8.5
    let lookTargetY = 0.0

    if (p < 0.15) {
      // Scene 1: Hero Awakening
      const t = p / 0.15
      targetCamZ = THREE.MathUtils.lerp(8.8, 7.6, t)
      targetCamY = THREE.MathUtils.lerp(-0.1, 0.0, t)
      lookTargetY = 0.0
    } else if (p < 0.30) {
      // Scene 2: Manifesto
      const t = (p - 0.15) / 0.15
      targetCamZ = THREE.MathUtils.lerp(7.6, 7.0, t)
      targetCamY = THREE.MathUtils.lerp(0.0, 0.2, t)
      lookTargetY = 0.1
    } else if (p < 0.48) {
      // Scene 3: Language Intelligence
      const t = (p - 0.30) / 0.18
      targetCamZ = THREE.MathUtils.lerp(7.0, 6.8, t)
      targetCamY = THREE.MathUtils.lerp(0.2, 0.35, t)
      lookTargetY = 0.2
    } else if (p < 0.62) {
      // Scene 4: Education Rings
      const t = (p - 0.48) / 0.14
      targetCamZ = THREE.MathUtils.lerp(6.8, 8.2, t)
      targetCamY = THREE.MathUtils.lerp(0.35, -0.1, t)
      lookTargetY = -0.1
    } else if (p < 0.80) {
      // Scene 5: Adaptive Learning
      const t = (p - 0.62) / 0.18
      targetCamZ = THREE.MathUtils.lerp(8.2, 6.5, t)
      targetCamY = THREE.MathUtils.lerp(-0.1, 0.1, t)
      lookTargetY = 0.0
    } else {
      // Scene 6: AI Tutor Workspace
      const t = (p - 0.80) / 0.20
      targetCamZ = THREE.MathUtils.lerp(6.5, 5.8, t)
      targetCamY = THREE.MathUtils.lerp(0.1, 0.85, t)
      lookTargetY = 0.65
    }

    // Subtle parallax in light environment
    if (!reducedMotion) {
      targetCamX += state.pointer.x * 0.2
      targetCamY += state.pointer.y * 0.15
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, delta * 3)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, delta * 3)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamZ, delta * 3)
    state.camera.lookAt(0, lookTargetY, 0)

    // ── 2. AI Core Transform ─────────────────────────────────────────────────
    if (coreGroupRef.current) {
      let coreTargetY = 0.0
      let coreTargetZ = 0.0
      let coreTargetScale = 1.0

      if (p < 0.15) {
        coreTargetY = 0.0
        coreTargetScale = THREE.MathUtils.lerp(0.9, 1.0, p / 0.15)
      } else if (p < 0.30) {
        coreTargetY = 0.1
        coreTargetScale = 1.0
      } else if (p < 0.48) {
        coreTargetY = 0.25
        coreTargetScale = 0.95
      } else if (p < 0.62) {
        let ringY = 0.0
        if (activeLevel === 'primary') ringY = 1.6
        else if (activeLevel === 'secondary') ringY = 0.8
        else if (activeLevel === 'higher_secondary') ringY = 0.0
        else if (activeLevel === 'college') ringY = -0.8
        else if (activeLevel === 'professional') ringY = -1.6

        coreTargetY = ringY
        coreTargetScale = 0.72
        coreTargetZ = 0.4
      } else if (p < 0.80) {
        coreTargetY = 0.0
        coreTargetScale = 0.85
        coreTargetZ = 0.0
      } else {
        const t = (p - 0.80) / 0.20
        coreTargetY = THREE.MathUtils.lerp(0.0, 1.3, t)
        coreTargetScale = THREE.MathUtils.lerp(0.85, 0.75, t)
        coreTargetZ = 0.0
      }

      coreGroupRef.current.position.y = THREE.MathUtils.lerp(coreGroupRef.current.position.y, coreTargetY, delta * 3)
      coreGroupRef.current.position.z = THREE.MathUtils.lerp(coreGroupRef.current.position.z, coreTargetZ, delta * 3)
      coreGroupRef.current.scale.lerp(new THREE.Vector3(coreTargetScale, coreTargetScale, coreTargetScale), delta * 3)
    }
  })

  return (
    <group ref={coreGroupRef} position={[0, 0, 0]}>
      <AICore
        state={useAppStore.getState().assistantState.mode}
        audioLevel={audioLevel}
        scale={1}
        reducedMotion={reducedMotion}
      />
    </group>
  )
}

export interface CinematicScrollCanvasProps {
  progress?: number
  state?: AICoreState
  audioLevel?: number
  className?: string
  interactive?: boolean
}

export function CinematicScrollCanvas({
  progress: directProgress,
  state: propState,
  audioLevel = 0,
  className = '',
  interactive = false,
}: CinematicScrollCanvasProps) {
  const scrollCtx = useExperienceScroll()
  const activeProgress = directProgress !== undefined ? directProgress : scrollCtx.progress

  const storeMode = useAppStore((s) => s.assistantState.mode)
  const activeState: AICoreState = propState ?? (storeMode as AICoreState) ?? 'idle'
  const targetConfig = STATE_TARGETS[activeState] ?? STATE_TARGETS.idle

  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div
      className={`w-full h-full absolute inset-0 ${interactive ? 'pointer-events-auto' : 'pointer-events-none'} ${className}`}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]}
      >
        {/* ── Warm Studio 3-Point Gallery Lighting ── */}
        <ambientLight intensity={0.65} color="#fafaf9" />
        <directionalLight position={[6, 8, 6]} intensity={1.5} color="#fff7ed" />
        <pointLight position={[-6, -3, -4]} intensity={0.8} color="#e0e7ff" />
        <pointLight position={[0, -5, 4]} intensity={0.5} color="#f3e8ff" />

        {/* ── Master Continuous Scene & Core Rig ── */}
        <MasterSceneRig
          scrollProgress={activeProgress}
          audioLevel={audioLevel}
          reducedMotion={reducedMotion}
        />

        {/* ── Scene 3: Translucent Language Shards ── */}
        <LanguageShards scrollProgress={activeProgress} reducedMotion={reducedMotion} />

        {/* ── Scene 4: Architectural Education Rings ── */}
        <EducationRings scrollProgress={activeProgress} reducedMotion={reducedMotion} />

        {/* ── Scene 5: Adaptive Blocks ↔ Knowledge Network ── */}
        <AdaptiveScene3D scrollProgress={activeProgress} reducedMotion={reducedMotion} />

        {/* ── Dynamic Orbital Particles ── */}
        <OrbitalParticles
          state={activeState}
          primaryColor={targetConfig.primary}
          reducedMotion={reducedMotion}
        />

        {/* ── Ambient Floating Particles ── */}
        <AmbientParticles count={45} reducedMotion={reducedMotion} />

        {/* ── Subtle Floating Crystal Relics ── */}
        <group>
          <FloatingElement
            position={[-3.8, 2.0, -2.5]}
            type="crystal"
            color="#6366f1"
            emissiveColor="#4f46e5"
            scale={0.28}
            speed={1.0}
            reducedMotion={reducedMotion}
          />
          <FloatingElement
            position={[3.8, -1.8, -2.5]}
            type="ring"
            color="#8b5cf6"
            emissiveColor="#7c3aed"
            scale={0.24}
            speed={1.1}
            reducedMotion={reducedMotion}
          />
        </group>

        {/* ── Restrained Studio Bloom ── */}
        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.7}
            luminanceSmoothing={0.85}
            mipmapBlur
            intensity={0.35}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
