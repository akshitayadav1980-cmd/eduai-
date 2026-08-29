import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { AICoreState } from './types'

interface AICoreRingsProps {
  state?: AICoreState
  primaryColor?: string
  reducedMotion?: boolean
}

export function AICoreRings({ state = 'idle', primaryColor = '#06b6d4', reducedMotion = false }: AICoreRingsProps) {
  const ring1Ref = useRef<THREE.Mesh>(null!)
  const ring2Ref = useRef<THREE.Mesh>(null!)
  const ring3Ref = useRef<THREE.Mesh>(null!)

  const ring1MatRef = useRef<THREE.MeshStandardMaterial>(null!)
  const ring2MatRef = useRef<THREE.MeshStandardMaterial>(null!)
  const ring3MatRef = useRef<THREE.MeshStandardMaterial>(null!)

  useFrame((_, delta) => {
    if (reducedMotion) return

    // Speed multiplier depending on AI state
    const speedMult = state === 'thinking' ? 2.2 : state === 'listening' ? 1.5 : state === 'speaking' ? 1.2 : 0.8

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.25 * speedMult
      ring1Ref.current.rotation.y += delta * 0.35 * speedMult
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.3 * speedMult
      ring2Ref.current.rotation.z += delta * 0.2 * speedMult
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.x -= delta * 0.18 * speedMult
      ring3Ref.current.rotation.z -= delta * 0.28 * speedMult
    }

    // Color lerping
    const targetColor = new THREE.Color(primaryColor)
    if (ring1MatRef.current) ring1MatRef.current.color.lerp(targetColor, delta * 3)
    if (ring2MatRef.current) ring2MatRef.current.color.lerp(targetColor, delta * 3)
    if (ring3MatRef.current) ring3MatRef.current.color.lerp(targetColor, delta * 3)
  })

  return (
    <group>
      {/* Outer Gyroscopic Ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.9, 0.012, 16, 64]} />
        <meshStandardMaterial
          ref={ring1MatRef}
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Equatorial Ring 2 */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <torusGeometry args={[2.15, 0.008, 16, 64]} />
        <meshStandardMaterial
          ref={ring2MatRef}
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Orbit Ring 3 */}
      <mesh ref={ring3Ref} rotation={[-Math.PI / 4, Math.PI / 3, 0]}>
        <torusGeometry args={[2.4, 0.006, 16, 64]} />
        <meshStandardMaterial
          ref={ring3MatRef}
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.8}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  )
}
