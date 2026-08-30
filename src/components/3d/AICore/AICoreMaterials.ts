import type { AICoreState, StateColorTarget } from './types'

export const STATE_TARGETS: Record<AICoreState, StateColorTarget> = {
  idle: {
    primary: '#4f46e5',      // Soft Indigo
    emissive: '#6366f1',     // Indigo Glow
    innerCore: '#4338ca',    // Deep Indigo
    speed: 0.35,
    scale: 1.0,
    glowIntensity: 0.45,
  },
  listening: {
    primary: '#0d9488',      // Muted Teal
    emissive: '#14b8a6',     // Soft Teal
    innerCore: '#0f766e',    // Deep Teal
    speed: 0.55,
    scale: 1.06,
    glowIntensity: 0.6,
  },
  thinking: {
    primary: '#7c3aed',      // Muted Violet
    emissive: '#8b5cf6',     // Violet Glow
    innerCore: '#6d28d9',    // Deep Violet
    speed: 1.0,
    scale: 1.02,
    glowIntensity: 0.7,
  },
  speaking: {
    primary: '#2563eb',      // Royal Blue
    emissive: '#3b82f6',     // Sky Accent
    innerCore: '#1d4ed8',    // Deep Ocean
    speed: 0.5,
    scale: 1.04,
    glowIntensity: 0.65,
  },
  success: {
    primary: '#059669',      // Refined Emerald
    emissive: '#10b981',     // Soft Emerald
    innerCore: '#047857',    // Deep Forest
    speed: 0.45,
    scale: 1.08,
    glowIntensity: 0.7,
  },
  error: {
    primary: '#e11d48',      // Soft Crimson
    emissive: '#f43f5e',     // Rose Glow
    innerCore: '#be123c',    // Deep Rose
    speed: 0.25,
    scale: 0.96,
    glowIntensity: 0.5,
  },
}
