import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { StudentSidebar, DashboardSectionId } from '../../components/dashboard/StudentSidebar'
import { DashboardNav } from '../../components/dashboard/DashboardNav'
import { HomeSection } from '../../components/dashboard/HomeSection'
import { YourAISection } from '../../components/dashboard/YourAISection'
import { LessonsSection } from '../../components/dashboard/LessonsSection'
import { LandingCanvas } from '../../components/cinematic/LandingCanvas'
import { useAppStore } from '../../store/useAppStore'

export function StudentDashboardPage() {
  const { isDarkMode } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<DashboardSectionId>('home')

  // Smooth scroll to section
  const handleScrollToSection = (sectionId: DashboardSectionId) => {
    setActiveSection(sectionId)
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Scroll spy to update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200

      const homeEl = document.getElementById('home')
      const yourAIEl = document.getElementById('your-ai')
      const lessonsEl = document.getElementById('lessons')

      if (lessonsEl && scrollPosition >= lessonsEl.offsetTop) {
        setActiveSection('lessons')
      } else if (yourAIEl && scrollPosition >= yourAIEl.offsetTop) {
        setActiveSection('your-ai')
      } else if (homeEl) {
        setActiveSection('home')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const sectionTitles: Record<DashboardSectionId, string> = {
    home: 'HOME',
    'your-ai': 'YOUR AI',
    lessons: 'LESSONS',
  }

  return (
    <div
      className={`relative min-h-screen w-full flex overflow-x-hidden theme-transition ${
        isDarkMode ? 'bg-[#0A0A0C] text-[#F5F5F5]' : 'bg-[#F6F5F1] text-[#171717]'
      }`}
    >
      {/* ── Persistent 3D AI Core in Background ── */}
      <LandingCanvas />

      {/* ── Background Subtle Ambient Aura ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-[5%] left-[30%] w-[900px] h-[700px] rounded-full blur-[150px] pointer-events-none"
          style={{
            background: isDarkMode
              ? 'radial-gradient(ellipse at center, rgba(6,182,212,0.05) 0%, rgba(139,92,246,0.03) 50%, transparent 80%)'
              : 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(241,241,238,0.45) 45%, rgba(246,245,241,0) 80%)',
          }}
        />
      </div>

      {/* ── Left Hamburger Sidebar ── */}
      <StudentSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeSection={activeSection}
        onSelectSection={handleScrollToSection}
      />

      {/* ── Main Dynamic Content Area ── */}
      <motion.div
        animate={{
          marginLeft: sidebarOpen ? 'min(340px, 85vw)' : '72px',
        }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex-1 flex flex-col min-w-0 transition-all"
      >
        {/* ── Sticky Top Nav ── */}
        <DashboardNav
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeSectionTitle={sectionTitles[activeSection]}
        />

        {/* ── Scrollable Learning Space Stream ── */}
        <main className="flex-1 px-4 sm:px-8 md:px-12 py-8 space-y-16">
          
          {/* Section 1: HOME */}
          <HomeSection
            onNavigateToYourAI={() => handleScrollToSection('your-ai')}
            onNavigateToLessons={() => handleScrollToSection('lessons')}
          />

          {/* Section 2: YOUR AI */}
          <YourAISection />

          {/* Section 3: LESSONS */}
          <LessonsSection />

        </main>

        {/* ── Minimal Dashboard Footer ── */}
        <footer
          className={`w-full py-6 border-t text-center text-xs space-y-1 theme-transition ${
            isDarkMode
              ? 'border-white/[0.08] text-[#737373] bg-[#0A0A0C]/80'
              : 'border-black/[0.05] text-[#A3A39E] bg-[#F6F5F1]/80'
          }`}
        >
          <p className="font-semibold text-xs text-inherit">Vernacular AI · Student Workspace</p>
          <p className="text-[11px] opacity-60">"AI-powered vernacular learning." · © 2026</p>
        </footer>
      </motion.div>
    </div>
  )
}
