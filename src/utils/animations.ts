import type { Variants, Transition } from 'framer-motion'

// ─── Apple / Cinematic Transitions ──────────────────────────────────────────

export const cinematicEase = [0.16, 1, 0.3, 1] as const

export const smoothSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
  mass: 0.8,
}

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
  mass: 1,
}

export const snappySpring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
}

export const slowEase: Transition = {
  duration: 0.65,
  ease: [0.16, 1, 0.3, 1],
}

export const mediumEase: Transition = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1],
}

// ─── Page Transitions ─────────────────────────────────────────────────────────

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
}

// ─── Fade & Slide Animations ──────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
}

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── Stagger Container ────────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.02,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
}

export const staggerItemLeft: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── Floating & Hover Physics ─────────────────────────────────────────────────

export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -3, scale: 1.008, transition: smoothSpring },
}

export const floatingElement: Variants = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

export const modalPanel: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: smoothSpring,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.18 },
  },
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export const sidebarVariants: Variants = {
  closed: { x: '-100%', transition: smoothSpring },
  open: { x: 0, transition: smoothSpring },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}
