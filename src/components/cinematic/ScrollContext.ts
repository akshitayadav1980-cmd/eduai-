import { createContext, useContext } from 'react'

export interface ScrollContextType {
  progress: number // 0 to 1
  scrollY: number
  activeSection: number
  totalSections: number
  isMobile: boolean
  reducedMotion: boolean
}

export const ScrollContext = createContext<ScrollContextType>({
  progress: 0,
  scrollY: 0,
  activeSection: 0,
  totalSections: 6,
  isMobile: false,
  reducedMotion: false,
})

export const useExperienceScroll = () => useContext(ScrollContext)
