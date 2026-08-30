import type { AICoreState } from '../../../types'

export type { AICoreState }

export interface AICoreProps {
  state?: AICoreState
  audioLevel?: number // 0 to 1 for speech reactivity
  scale?: number
  isInteractive?: boolean
  reducedMotion?: boolean
  className?: string
}

export interface StateColorTarget {
  primary: string
  emissive: string
  innerCore: string
  speed: number
  scale: number
  glowIntensity: number
}
