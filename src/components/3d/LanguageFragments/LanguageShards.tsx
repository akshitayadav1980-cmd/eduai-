import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ShardItem {
  text: string
  lang: string
  radius: number
  angle: number
  y: number
  rotSpeed: number
  tilt: [number, number, number]
  texture: THREE.CanvasTexture
}

const SHARD_TEXTS = [
  { text: 'ज्ञान', lang: 'Hindi' },
  { text: 'दवावा', lang: 'Sanskrit' },
  { text: 'বাঘ', lang: 'Bengali' },
  { text: 'தமிழ்', lang: 'Tamil' },
  { text: 'తెలుగు', lang: 'Telugu' },
  { text: 'ವೃಕ್ಷ', lang: 'Kannada' },
  { text: 'प्रकाश', lang: 'Hindi' },
  { text: 'શિક્ષણ', lang: 'Gujarati' },
  { text: 'ਪੰਜਾਬੀ', lang: 'Punjabi' },
  { text: 'ଶିକ୍ଷା', lang: 'Odia' },
  { text: 'മലയാളം', lang: 'Malayalam' },
  { text: 'विद्या', lang: 'Marathi' },
]

function createTextTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Crystal Frosted White/Ivory Glass Surface
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
    ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 18)
    ctx.fill()
    
    // Subtle refined border
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.stroke()

    // Crisp Dark Charcoal Indic Typography
    ctx.font = 'bold 42px sans-serif'
    ctx.fillStyle = '#171717'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export interface LanguageShardsProps {
  scrollProgress: number
  reducedMotion?: boolean
}

export function LanguageShards({ scrollProgress, reducedMotion = false }: LanguageShardsProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Generate memoized shards with textures and spatial orbit data
  const shards: ShardItem[] = useMemo(() => {
    return SHARD_TEXTS.map((item, idx) => {
      const angle = (idx / SHARD_TEXTS.length) * Math.PI * 2
      const radius = 2.4 + (idx % 3) * 0.45
      const y = ((idx % 5) - 2) * 0.55
      const rotSpeed = 0.2 + (idx % 3) * 0.12
      const tilt: [number, number, number] = [
        (Math.random() - 0.5) * 0.35,
        (Math.random() - 0.5) * 0.35,
        (Math.random() - 0.5) * 0.35,
      ]
      const texture = createTextTexture(item.text)
      return { ...item, radius, angle, y, rotSpeed, tilt, texture }
    })
  }, [])

  // Reusable geometry and physical glass material
  const geometry = useMemo(() => new THREE.PlaneGeometry(0.92, 0.46), [])
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      transparent: true,
      opacity: 0,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.85,
      ior: 1.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }, [])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    let opacity = 0
    let scale = 0
    const p = scrollProgress

    if (p >= 0.20 && p <= 0.54) {
      if (p < 0.32) {
        const t = (p - 0.20) / 0.12
        opacity = THREE.MathUtils.smoothstep(t, 0, 1)
        scale = THREE.MathUtils.lerp(0.2, 1.0, opacity)
      } else if (p > 0.44) {
        const t = (p - 0.44) / 0.10
        opacity = 1 - THREE.MathUtils.smoothstep(t, 0, 1)
        scale = THREE.MathUtils.lerp(1.0, 1.3, t)
      } else {
        opacity = 1
        scale = 1
      }
    }

    groupRef.current.scale.set(scale, scale, scale)
    glassMaterial.opacity = opacity * 0.95

    // Physical orbit animation with varied depth
    const time = state.clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const shard = shards[i]
      if (!shard) return

      const currentAngle = shard.angle + (reducedMotion ? 0 : time * shard.rotSpeed * 0.4)
      const x = Math.cos(currentAngle) * shard.radius
      const z = Math.sin(currentAngle) * shard.radius

      child.position.x = THREE.MathUtils.lerp(child.position.x, x, delta * 3.5)
      child.position.y = THREE.MathUtils.lerp(child.position.y, shard.y + Math.sin(time * 0.8 + i) * 0.06, delta * 3.5)
      child.position.z = THREE.MathUtils.lerp(child.position.z, z, delta * 3.5)

      child.lookAt(0, child.position.y * 0.5, 0)
      child.rotation.x += shard.tilt[0]
      child.rotation.y += shard.tilt[1]
      child.rotation.z += shard.tilt[2]
    })
  })

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {shards.map((shard, idx) => (
        <mesh key={idx} geometry={geometry}>
          <primitive object={glassMaterial} attach="material" map={shard.texture} />
        </mesh>
      ))}
    </group>
  )
}
