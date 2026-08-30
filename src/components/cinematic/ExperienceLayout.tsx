import { useState, useEffect, useRef, ReactNode } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { CinematicBackground } from '../background/CinematicBackground'
import { CinematicScrollCanvas } from './CinematicScrollCanvas'
import { FloatingNav } from '../navigation/FloatingNav'
import { ScrollContext } from './ScrollContext'

interface ExperienceLayoutProps {
  children: ReactNode
  totalSections?: number
  showNav?: boolean
  interactiveCanvas?: boolean
}

export function ExperienceLayout({
  children,
  totalSections = 6,
  showNav = true,
  interactiveCanvas = false,
}: ExperienceLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Track scroll progress of the main container (0 to 1)
  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Smooth out scroll progress for 60fps continuous interpolation
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    restDelta: 0.001,
  })

  const [currentProgress, setCurrentProgress] = useState(0)

  useEffect(() => {
    const unsub = smoothProgress.on('change', (v) => {
      setCurrentProgress(v)
      const sec = Math.min(totalSections - 1, Math.floor(v * totalSections))
      setActiveSection(sec)
    })
    return () => unsub()
  }, [smoothProgress, totalSections])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)

    return () => {
      window.removeEventListener('resize', checkMobile)
      mq.removeEventListener('change', handler)
    }
  }, [])

  return (
    <ScrollContext.Provider
      value={{
        progress: currentProgress,
        scrollY: scrollY.get(),
        activeSection,
        totalSections,
        isMobile,
        reducedMotion,
      }}
    >
      <div
        ref={containerRef}
        className="relative min-h-screen bg-[#F8F7F3] text-[#171717] selection:bg-indigo-100 selection:text-[#171717]"
      >
        {/* ── Fixed Ambient Warm Lighting ── */}
        <CinematicBackground showGlow />

        {/* ── Fixed Pinned 3D Spatial Canvas ── */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <CinematicScrollCanvas
            progress={currentProgress}
            interactive={interactiveCanvas}
          />
        </div>

        {/* ── Floating Minimal Header ── */}
        {showNav && <FloatingNav />}

        {/* ── Scroll Experience Track ── */}
        <div className="relative z-10 w-full">
          {children}
        </div>

        {/* ── Minimal Spatial Timeline Rail (Desktop only) ── */}
        {!isMobile && (
          <aside
            aria-label="Storyline sections"
            className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3 pointer-events-auto"
          >
            {Array.from({ length: totalSections }).map((_, i) => {
              const isActive = activeSection === i
              return (
                <button
                  key={i}
                  onClick={() => {
                    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
                    window.scrollTo({
                      top: (i / (totalSections - 1)) * scrollHeight,
                      behavior: 'smooth',
                    })
                  }}
                  className="group relative p-1.5 flex items-center justify-center cursor-pointer"
                  aria-label={`Scroll to chapter ${i + 1}`}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.4 : 1,
                      backgroundColor: isActive ? '#171717' : 'rgba(0,0,0,0.15)',
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      isActive ? 'shadow-sm' : 'group-hover:bg-black/40'
                    }`}
                  />
                  <span className="absolute right-6 px-2.5 py-1 rounded-lg bg-white/90 border border-black/[0.06] text-[10px] font-semibold text-[#171717] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-editorial">
                    {['Awakening', 'Intelligence', 'Language', 'Depth', 'Adaptive Demo', 'AI Tutor'][i] ?? `Scene ${i + 1}`}
                  </span>
                </button>
              )
            })}
          </aside>
        )}
      </div>
    </ScrollContext.Provider>
  )
}
