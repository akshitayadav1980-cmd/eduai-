import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../../../store/useAppStore'
import type { EducationLevel } from '../../../types'

interface RingConfig {
  id: EducationLevel
  label: string
  y: number
  radius: number
  tubeRadius: number
  color: string
}

const RINGS_DATA: RingConfig[] = [
  { id: 'primary', label: 'Primary', y: 1.6, radius: 1.9, tubeRadius: 0.055, color: '#0d9488' },
  { id: 'secondary', label: 'Secondary', y: 0.8, radius: 2.1, tubeRadius: 0.06, color: '#4f46e5' },
  { id: 'higher_secondary', label: 'Higher Secondary', y: 0.0, radius: 2.3, tubeRadius: 0.065, color: '#6366f1' },
  { id: 'college', label: 'College', y: -0.8, radius: 2.5, tubeRadius: 0.07, color: '#7c3aed' },
  { id: 'professional', label: 'Professional', y: -1.6, radius: 2.7, tubeRadius: 0.075, color: '#171717' },
]

export interface EducationRingsProps {
  scrollProgress: number
  reducedMotion?: boolean
}

export function EducationRings({ scrollProgress, reducedMotion = false }: EducationRingsProps) {
  const groupRef = useRef<THREE.Group>(null)
  const activeLevel = useAppStore((s) => s.educationLevel)

  const geometries = useMemo(() => {
    return RINGS_DATA.map((r) => new THREE.TorusGeometry(r.radius, r.tubeRadius, 16, 64))
  }, [])

  const materials = useMemo(() => {
    return RINGS_DATA.map((r) => {
      return new THREE.MeshPhysicalMaterial({
        color: r.color,
        emissive: r.color,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0,
        roughness: 0.1,
        metalness: 0.2,
        transmission: 0.75,
        depthWrite: false,
      })
    })
  }, [])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    let opacity = 0
    let scale = 0
    const p = scrollProgress

    if (p >= 0.38 && p <= 0.68) {
      if (p < 0.48) {
        const t = (p - 0.38) / 0.10
        opacity = THREE.MathUtils.smoothstep(t, 0, 1)
        scale = THREE.MathUtils.lerp(0.4, 1.0, opacity)
      } else if (p > 0.60) {
        const t = (p - 0.60) / 0.08
        opacity = 1 - THREE.MathUtils.smoothstep(t, 0, 1)
        scale = THREE.MathUtils.lerp(1.0, 0.6, t)
      } else {
        opacity = 1
        scale = 1
      }
    }

    groupRef.current.scale.set(scale, scale, scale)

    const time = state.clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const ring = RINGS_DATA[i]
      const mat = materials[i]
      if (!ring || !mat) return

      const isSelected = activeLevel === ring.id
      mat.opacity = opacity * (isSelected ? 0.9 : 0.35)
      mat.emissiveIntensity = isSelected ? 0.4 : 0.1

      if (!reducedMotion) {
        child.rotation.x = Math.PI / 2.3 + Math.sin(time * 0.4 + i) * 0.03
        child.rotation.z += delta * (0.1 + i * 0.03) * (i % 2 === 0 ? 1 : -1)
      } else {
        child.rotation.x = Math.PI / 2.3
      }
    })
  })

  return (
    <group ref={groupRef} position={[0, 0.0, 0]}>
      {RINGS_DATA.map((ring, idx) => (
        <mesh
          key={ring.id}
          geometry={geometries[idx]}
          material={materials[idx]}
          position={[0, ring.y, 0]}
        />
      ))}
    </group>
  )
}
