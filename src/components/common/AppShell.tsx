import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { useAppStore } from '../../store/useAppStore'
import { CinematicBackground } from '../background/CinematicBackground'
import { SceneCanvas } from '../3d/SceneCanvas'
import { ChatPanel } from '../chat/ChatPanel'

/**
 * AppShell — wraps authenticated/role-aware pages (/student/* and /teacher/*).
 * Combines cinematic background, 3D ambient layer, sleek topbar/sidebar, and floating assistant.
 */
export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { selectedRole, isDarkMode } = useAppStore()

  return (
    <div className={`relative flex h-screen overflow-hidden ${isDarkMode ? 'bg-[#05070B] text-slate-100' : 'bg-slate-950 text-slate-100'}`}>
      {/* Cinematic Ambient Background System */}
      <CinematicBackground showParticles showGlow showGrid />

      {/* 3D Scene Layer (Floating Ambient Assistant Core) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <SceneCanvas />
      </div>

      {/* Sidebar (Desktop / Tablet) */}
      {selectedRole && (
        <div className="relative z-20 shrink-0">
          <Sidebar
            mobileOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />

        {/* Page Content Viewport */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 lg:pb-8 relative z-10"
          id="main-content"
          tabIndex={-1}
        >
          <Outlet />
        </motion.main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="relative z-30">
        <MobileNav />
      </div>

      {/* Floating AI Assistant Chat Panel */}
      {selectedRole && <ChatPanel />}
    </div>
  )
}
