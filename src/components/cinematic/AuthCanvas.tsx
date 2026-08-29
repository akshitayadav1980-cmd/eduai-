import { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

import { AICore, STATE_TARGETS } from '../3d/AICore'
import { OrbitalParticles, AmbientParticles } from '../3d/Particles'
import { useAppStore } from '../../store/useAppStore'

function CenteredAuthSceneRig({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const coreGroupRef = useRef<THREE.Group>(null!)

  useFrame((state, delta) => {
    // Subtle parallax response to cursor
    let targetCamX = 0.0
    let targetCamY = 0.0
    const targetCamZ = 8.0

    if (!reducedMotion) {
      targetCamX = state.pointer.x * 0.3
      targetCamY = state.pointer.y * 0.25
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, delta * 2.5)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, delta * 2.5)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamZ, delta * 2.5)
    state.camera.lookAt(0, 0.4, 0)

    if (coreGroupRef.current) {
      // Atmospheric background presence behind the centered card
      const targetCoreY = 1.3 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08
      coreGroupRef.current.position.x = THREE.MathUtils.lerp(coreGroupRef.current.position.x, 0, delta * 2)
      coreGroupRef.current.position.y = THREE.MathUtils.lerp(coreGroupRef.current.position.y, targetCoreY, delta * 2)
      coreGroupRef.current.scale.lerp(new THREE.Vector3(0.78, 0.78, 0.78), delta * 2)
    }
  })

  return (
    <group ref={coreGroupRef} position={[0, 1.3, -1.0]}>
      <AICore
        state={useAppStore.getState().assistantState.mode}
        scale={0.78}
        reducedMotion={reducedMotion}
      />
    </group>
  )
}

export function AuthCanvas() {
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
        camera={{ position: [0, 0.2, 8.0], fov: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]}
      >
        {/* Studio Lighting */}
        {isDarkMode ? (
          <>
            <ambientLight intensity={0.4} color="#14141c" />
            <directionalLight position={[4, 6, 6]} intensity={1.1} color="#06b6d4" />
            <pointLight position={[-6, -2, -3]} intensity={0.7} color="#8b5cf6" />
          </>
        ) : (
          <>
            <ambientLight intensity={0.7} color="#fafaf9" />
            <directionalLight position={[4, 6, 6]} intensity={1.5} color="#fff7ed" />
            <pointLight position={[-6, -2, -3]} intensity={0.8} color="#e0e7ff" />
          </>
        )}

        <CenteredAuthSceneRig reducedMotion={reducedMotion} />

        <OrbitalParticles
          state={activeState}
          primaryColor={targetConfig.primary}
          reducedMotion={reducedMotion}
        />

        <AmbientParticles count={25} reducedMotion={reducedMotion} />

        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={isDarkMode ? 0.6 : 0.75}
            luminanceSmoothing={0.85}
            mipmapBlur
            intensity={isDarkMode ? 0.45 : 0.25}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
