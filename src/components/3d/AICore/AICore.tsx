import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../../../store/useAppStore'
import { STATE_TARGETS } from './AICoreMaterials'
import { AICoreRings } from './AICoreRings'
import type { AICoreProps } from './types'

export function AICore({
  state: propState,
  audioLevel = 0,
  scale = 1,
  reducedMotion = false,
}: AICoreProps) {
  // Store fallback
  const storeMode = useAppStore((s) => s.assistantState.mode)
  const activeState = propState ?? (storeMode as keyof typeof STATE_TARGETS) ?? 'idle'
  const targetConfig = STATE_TARGETS[activeState] ?? STATE_TARGETS.idle

  // Mesh and Material Refs
  const groupRef = useRef<THREE.Group>(null!)
  const outerGlassRef = useRef<THREE.Mesh>(null!)
  const outerGlassMatRef = useRef<THREE.MeshPhysicalMaterial>(null!)

  const middleChromeRef = useRef<THREE.Mesh>(null!)
  const middleChromeMatRef = useRef<THREE.MeshStandardMaterial>(null!)

  const innerCrystalRef = useRef<THREE.Mesh>(null!)
  const innerCrystalMatRef = useRef<THREE.MeshStandardMaterial>(null!)

  const pointLightRef = useRef<THREE.PointLight>(null!)

  // Time tracker
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta

    if (!groupRef.current) return

    const speed = reducedMotion ? 0.05 : targetConfig.speed
    const t = timeRef.current

    // Subtle physical rotations
    if (outerGlassRef.current) {
      outerGlassRef.current.rotation.y += delta * speed * 0.3
      outerGlassRef.current.rotation.x += delta * speed * 0.15
    }

    if (middleChromeRef.current) {
      middleChromeRef.current.rotation.x += delta * speed * 0.4
      middleChromeRef.current.rotation.y += delta * speed * 0.5
    }

    if (innerCrystalRef.current) {
      innerCrystalRef.current.rotation.x -= delta * speed * 0.7
      innerCrystalRef.current.rotation.y -= delta * speed * 0.9
    }

    // Dynamic scale computation
    let dynamicScale = targetConfig.scale * scale

    if (!reducedMotion) {
      if (activeState === 'idle') {
        dynamicScale += Math.sin(t * 1.5) * 0.015
      } else if (activeState === 'listening') {
        dynamicScale += Math.sin(t * 4.0) * 0.035
      } else if (activeState === 'thinking') {
        dynamicScale += Math.sin(t * 7.0) * 0.025
      } else if (activeState === 'speaking') {
        const speechAmp = audioLevel > 0 ? audioLevel * 0.08 : 0.04
        dynamicScale += Math.sin(t * 10.0) * speechAmp
      } else if (activeState === 'success') {
        dynamicScale += Math.sin(t * 2.5) * 0.04
      }
    }

    // Smooth Lerp Group Scale
    const targetScaleVec = new THREE.Vector3(dynamicScale, dynamicScale, dynamicScale)
    groupRef.current.scale.lerp(targetScaleVec, delta * 5)

    // Inner Crystal Pulse
    if (innerCrystalRef.current && !reducedMotion) {
      const innerScale = 0.85 + Math.sin(t * 2.5) * 0.06
      innerCrystalRef.current.scale.setScalar(innerScale)
    }

    // Color Lerping for Light Environment
    const primaryColor = new THREE.Color(targetConfig.primary)
    const emissiveColor = new THREE.Color(targetConfig.emissive)
    const innerColor = new THREE.Color(targetConfig.innerCore)

    if (innerCrystalMatRef.current) {
      innerCrystalMatRef.current.color.lerp(innerColor, delta * 4)
      innerCrystalMatRef.current.emissive.lerp(emissiveColor, delta * 4)
      innerCrystalMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        innerCrystalMatRef.current.emissiveIntensity,
        targetConfig.glowIntensity * 0.8,
        delta * 3
      )
    }

    if (pointLightRef.current) {
      pointLightRef.current.color.lerp(primaryColor, delta * 3.5)
      pointLightRef.current.intensity = THREE.MathUtils.lerp(
        pointLightRef.current.intensity,
        targetConfig.glowIntensity * 1.2,
        delta * 3
      )
    }
  })

  return (
    <Float
      speed={reducedMotion ? 0 : activeState === 'idle' ? 1.0 : 1.8}
      rotationIntensity={reducedMotion ? 0 : 0.15}
      floatIntensity={reducedMotion ? 0 : 0.35}
    >
      <group ref={groupRef}>
        {/* Soft internal light */}
        <pointLight
          ref={pointLightRef}
          distance={6}
          decay={2}
          intensity={0.9}
          color={targetConfig.primary}
        />

        {/* ── Layer 1: Polished Physical Refractive Glass Sphere ── */}
        <mesh ref={outerGlassRef}>
          <sphereGeometry args={[1.25, 48, 48]} />
          <meshPhysicalMaterial
            ref={outerGlassMatRef}
            color="#ffffff"
            roughness={0.05}
            metalness={0.08}
            transmission={0.94}
            ior={1.52}
            thickness={1.2}
            transparent
            opacity={0.88}
            reflectivity={0.9}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>

        {/* ── Layer 2: Subtle Chrome / Titanium Wireframe Cage ── */}
        <mesh ref={middleChromeRef}>
          <icosahedronGeometry args={[1.05, 1]} />
          <meshStandardMaterial
            ref={middleChromeMatRef}
            color="#e4e4e7"
            wireframe
            roughness={0.12}
            metalness={0.95}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* ── Layer 3: Inner Energy Crystal Core ── */}
        <mesh ref={innerCrystalRef}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            ref={innerCrystalMatRef}
            color={targetConfig.innerCore}
            emissive={targetConfig.emissive}
            emissiveIntensity={0.6}
            roughness={0.15}
            metalness={0.85}
          />
        </mesh>

        {/* ── Layer 4: Platinum / Indigo Orbital Rings ── */}
        <AICoreRings
          state={activeState}
          primaryColor={targetConfig.primary}
          reducedMotion={reducedMotion}
        />
      </group>
    </Float>
  )
}
