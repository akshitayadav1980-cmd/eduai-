import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { AICoreState } from '../AICore/types'

interface OrbitalParticlesProps {
  count?: number
  state?: AICoreState
  primaryColor?: string
  reducedMotion?: boolean
}

export function OrbitalParticles({
  count = 60,
  state = 'idle',
  primaryColor = '#22d3ee',
  reducedMotion = false,
}: OrbitalParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null!)
  const matRef = useRef<THREE.PointsMaterial>(null!)

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Create an orbital torus/disc distribution around the core
      const radius = 2.0 + Math.random() * 1.6
      const angle = Math.random() * Math.PI * 2
      const yOffset = (Math.random() - 0.5) * 0.9

      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = yOffset
      pos[i * 3 + 2] = Math.sin(angle) * radius

      sz[i] = Math.random() * 1.5 + 0.6
    }
    return [pos, sz]
  }, [count])

  useFrame((_, delta) => {
    if (reducedMotion || !pointsRef.current) return

    const speed = state === 'thinking' ? 0.45 : state === 'listening' ? 0.25 : state === 'speaking' ? 0.2 : 0.12

    pointsRef.current.rotation.y += delta * speed
    pointsRef.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.15

    if (matRef.current) {
      matRef.current.color.lerp(new THREE.Color(primaryColor), delta * 3)
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.045}
        color={primaryColor}
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
