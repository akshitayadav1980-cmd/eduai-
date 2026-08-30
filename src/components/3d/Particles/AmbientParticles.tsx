import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AmbientParticlesProps {
  count?: number
  reducedMotion?: boolean
}

export function AmbientParticles({ count = 80, reducedMotion = false }: AmbientParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null!)

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2
    }
    return [pos]
  }, [count])

  useFrame((_, delta) => {
    if (reducedMotion || !pointsRef.current) return

    pointsRef.current.rotation.y += delta * 0.015
    pointsRef.current.rotation.z += delta * 0.008
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#38bdf8"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
