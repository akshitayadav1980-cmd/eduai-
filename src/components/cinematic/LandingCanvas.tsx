import { useEffect, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

import { AICore, STATE_TARGETS } from '../3d/AICore'
import { OrbitalParticles, AmbientParticles } from '../3d/Particles'
import { useAppStore } from '../../store/useAppStore'

interface MasterSceneRigProps {
  reducedMotion?: boolean
  isDarkMode?: boolean
}

function MasterSceneRig({ reducedMotion = false }: MasterSceneRigProps) {
  const coreGroupRef = useRef<THREE.Group>(null!)

  useFrame((state, delta) => {
    // Read normalized window scroll ratio (0 to 1)
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const scrollProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)

    // ── 1. Camera Movement with Scroll & Mouse Parallax ──
    let targetCamX = 0.0
    let targetCamY = 0.0
    let targetCamZ = 8.2

    // Parallax response to cursor
    if (!reducedMotion) {
      targetCamX = state.pointer.x * 0.35
      targetCamY = state.pointer.y * 0.25
    }

    // Scroll depth translation
    if (scrollProgress < 0.35) {
      // Hero
      const t = scrollProgress / 0.35
      targetCamZ = THREE.MathUtils.lerp(8.2, 7.6, t)
      targetCamY += THREE.MathUtils.lerp(0.0, -0.2, t)
    } else if (scrollProgress < 0.7) {
      // Student / Teacher
      const t = (scrollProgress - 0.35) / 0.35
      targetCamZ = THREE.MathUtils.lerp(7.6, 9.0, t)
      targetCamY += THREE.MathUtils.lerp(-0.2, 0.4, t)
    } else {
      // About & Closing
      const t = (scrollProgress - 0.7) / 0.3
      targetCamZ = THREE.MathUtils.lerp(9.0, 7.8, t)
      targetCamY += THREE.MathUtils.lerp(0.4, 0.8, t)
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, delta * 3)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, delta * 3)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamZ, delta * 3)
    state.camera.lookAt(0, 0, 0)

    // ── 2. AI Core Position & Scale ──
    if (coreGroupRef.current) {
      let coreTargetY = 0.0
      let coreTargetScale = 1.0

      if (scrollProgress < 0.35) {
        coreTargetY = 0.0
        coreTargetScale = 1.0
      } else if (scrollProgress < 0.7) {
        coreTargetY = 0.8
        coreTargetScale = 0.75
      } else {
        coreTargetY = 1.4
        coreTargetScale = 0.65
      }

      coreGroupRef.current.position.y = THREE.MathUtils.lerp(coreGroupRef.current.position.y, coreTargetY, delta * 3)
      coreGroupRef.current.scale.lerp(new THREE.Vector3(coreTargetScale, coreTargetScale, coreTargetScale), delta * 3)
    }
  })

  return (
    <group ref={coreGroupRef} position={[0, 0, 0]}>
      <AICore
        state={useAppStore.getState().assistantState.mode}
        scale={1}
        reducedMotion={reducedMotion}
      />
    </group>
  )
}

export function LandingCanvas() {
  const { isDarkMode, assistantState } = useAppStore()
  const activeState = assistantState.mode
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8.2], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]}
      >
        {/* ── Studio Lighting (Adjusted for Light vs Dark) ── */}
        {isDarkMode ? (
          <>
            <ambientLight intensity={0.4} color="#14141c" />
            <directionalLight position={[6, 8, 6]} intensity={1.2} color="#06b6d4" />
            <pointLight position={[-6, -3, -4]} intensity={0.8} color="#8b5cf6" />
            <pointLight position={[0, -5, 4]} intensity={0.4} color="#3b82f6" />
          </>
        ) : (
          <>
            <ambientLight intensity={0.7} color="#fafaf9" />
            <directionalLight position={[6, 8, 6]} intensity={1.6} color="#fff7ed" />
            <pointLight position={[-6, -3, -4]} intensity={0.9} color="#e0e7ff" />
            <pointLight position={[0, -5, 4]} intensity={0.5} color="#f3e8ff" />
          </>
        )}

        {/* ── Central Master Rig ── */}
        <MasterSceneRig reducedMotion={reducedMotion} isDarkMode={isDarkMode} />

        {/* ── Orbital Energy Particles ── */}
        <OrbitalParticles
          state={activeState}
          primaryColor={targetConfig.primary}
          reducedMotion={reducedMotion}
        />

        {/* ── Ambient Particles ── */}
        <AmbientParticles count={35} reducedMotion={reducedMotion} />

        {/* ── Restrained Studio Bloom ── */}
        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={isDarkMode ? 0.6 : 0.75}
            luminanceSmoothing={0.85}
            mipmapBlur
            intensity={isDarkMode ? 0.5 : 0.3}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
