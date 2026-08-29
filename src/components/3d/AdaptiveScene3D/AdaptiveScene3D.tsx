import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function createBlockTexture(letter: string, bgColor: string, textColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, 128, 128)

    // Subtle refined border
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.strokeRect(6, 6, 116, 116)

    // Letter
    ctx.font = 'bold 64px sans-serif'
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(letter, 64, 66)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

export interface AdaptiveScene3DProps {
  scrollProgress: number
  reducedMotion?: boolean
}

export function AdaptiveScene3D({ scrollProgress, reducedMotion = false }: AdaptiveScene3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const leftBlocksRef = useRef<THREE.Group>(null)
  const rightNetworkRef = useRef<THREE.Group>(null)

  // ─── 1. Left Side: Warm Pastel Wooden Educational Blocks ────────────────────
  const blockGeo = useMemo(() => new THREE.BoxGeometry(0.65, 0.65, 0.65), [])
  const blockTextures = useMemo(() => {
    return [
      createBlockTexture('A', '#E0E7FF', '#312e81'),
      createBlockTexture('B', '#EDE9FE', '#4c1d95'),
      createBlockTexture('C', '#FEF3C7', '#78350f'),
      createBlockTexture('1', '#D1FAE5', '#064e3b'),
      createBlockTexture('2', '#FCE7F3', '#831843'),
    ]
  }, [])

  const blockPositions: [number, number, number][] = [
    [-3.2, 0.8, -0.2],  // Top A
    [-3.2, 0.1, -0.2],  // Mid B
    [-3.2, -0.6, -0.2], // Low C
    [-3.9, -0.6, -0.2], // Left 1
    [-2.5, -0.6, -0.2], // Right 2
  ]

  // ─── 2. Right Side: Refined Indigo Knowledge Network ────────────────────────
  const nodeGeo = useMemo(() => new THREE.SphereGeometry(0.07, 16, 16), [])
  const nodeMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#4f46e5',
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0,
    })
  }, [])

  const networkNodes: [number, number, number][] = useMemo(() => {
    return [
      [2.5, 1.0, -0.2],
      [3.3, 0.6, 0.1],
      [3.9, 1.2, -0.3],
      [2.2, 0.0, 0.2],
      [3.1, -0.2, -0.1],
      [4.0, 0.1, 0.3],
      [2.6, -0.9, -0.2],
      [3.5, -0.8, 0.1],
    ]
  }, [])

  const lineGeo = useMemo(() => {
    const points: THREE.Vector3[] = []
    const nodeVecs = networkNodes.map((p) => new THREE.Vector3(...p))
    for (let i = 0; i < nodeVecs.length; i++) {
      for (let j = i + 1; j < nodeVecs.length; j++) {
        if (nodeVecs[i].distanceTo(nodeVecs[j]) < 1.4) {
          points.push(nodeVecs[i], nodeVecs[j])
        }
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [networkNodes])

  const lineMat = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: '#818cf8',
      transparent: true,
      opacity: 0,
    })
  }, [])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    let opacity = 0
    let scale = 0
    const p = scrollProgress

    if (p >= 0.54 && p <= 0.84) {
      if (p < 0.64) {
        const t = (p - 0.54) / 0.10
        opacity = THREE.MathUtils.smoothstep(t, 0, 1)
        scale = THREE.MathUtils.lerp(0.3, 1.0, opacity)
      } else if (p > 0.74) {
        const t = (p - 0.74) / 0.10
        opacity = 1 - THREE.MathUtils.smoothstep(t, 0, 1)
        scale = THREE.MathUtils.lerp(1.0, 0.5, t)
      } else {
        opacity = 1
        scale = 1
      }
    }

    groupRef.current.scale.set(scale, scale, scale)
    nodeMat.opacity = opacity * 0.95
    lineMat.opacity = opacity * 0.5

    const time = state.clock.getElapsedTime()

    if (leftBlocksRef.current && !reducedMotion) {
      leftBlocksRef.current.children.forEach((b, i) => {
        b.rotation.y = Math.sin(time * 0.6 + i) * 0.05
        b.rotation.x = Math.cos(time * 0.4 + i) * 0.03
      })
    }

    if (rightNetworkRef.current && !reducedMotion) {
      rightNetworkRef.current.rotation.y += delta * 0.15
      rightNetworkRef.current.rotation.z = Math.sin(time * 0.4) * 0.03
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Left: Primary Pastel 3D Blocks ── */}
      <group ref={leftBlocksRef}>
        {blockPositions.map((pos, idx) => (
          <mesh key={idx} geometry={blockGeo} position={pos}>
            <meshStandardMaterial
              map={blockTextures[idx % blockTextures.length]}
              roughness={0.25}
              metalness={0.05}
            />
          </mesh>
        ))}
      </group>

      {/* ── Right: Professional Holographic Network ── */}
      <group ref={rightNetworkRef} position={[0.4, 0, 0]}>
        <lineSegments geometry={lineGeo} material={lineMat} />
        {networkNodes.map((pos, idx) => (
          <mesh key={idx} geometry={nodeGeo} material={nodeMat} position={pos} />
        ))}
      </group>
    </group>
  )
}
