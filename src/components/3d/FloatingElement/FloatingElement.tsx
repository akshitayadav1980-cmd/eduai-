import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import * as THREE from 'three'

export type FloatingElementType = 'crystal' | 'ring' | 'cube' | 'prism'

export interface FloatingElementProps {
  position: [number, number, number]
  type?: FloatingElementType
  color?: string
  emissiveColor?: string
  label?: string
  scale?: number
  speed?: number
  reducedMotion?: boolean
}

export function FloatingElement({
  position,
  type = 'crystal',
  color = '#06b6d4',
  emissiveColor = '#3b82f6',
  label,
  scale = 0.4,
  speed = 1.5,
  reducedMotion = false,
}: FloatingElementProps) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (reducedMotion || !meshRef.current) return

    meshRef.current.rotation.x += delta * 0.2 * speed
    meshRef.current.rotation.y += delta * 0.3 * speed
  })

  const renderGeometry = () => {
    switch (type) {
      case 'ring':
        return <torusGeometry args={[0.6, 0.08, 16, 32]} />
      case 'cube':
        return <boxGeometry args={[0.7, 0.7, 0.7]} />
      case 'prism':
        return <coneGeometry args={[0.5, 0.9, 4]} />
      case 'crystal':
      default:
        return <octahedronGeometry args={[0.6, 0]} />
    }
  }

  return (
    <Float
      position={position}
      speed={reducedMotion ? 0 : speed}
      rotationIntensity={reducedMotion ? 0 : 0.4}
      floatIntensity={reducedMotion ? 0 : 0.8}
    >
      <group scale={scale}>
        <mesh ref={meshRef}>
          {renderGeometry()}
          <meshStandardMaterial
            color={color}
            emissive={emissiveColor}
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Optional Clean Floating 3D HTML Label */}
        {label && (
          <Html position={[0, -0.9, 0]} center distanceFactor={10} className="pointer-events-none select-none">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cinema-900/80 border border-white/10 text-slate-300 backdrop-blur-md whitespace-nowrap shadow-sm">
              {label}
            </span>
          </Html>
        )}
      </group>
    </Float>
  )
}
