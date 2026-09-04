import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sun, Moon, Search, Menu, LogOut } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

interface DashboardNavProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  activeSectionTitle?: string
}

export function DashboardNav({
  sidebarOpen,
  onToggleSidebar,
  activeSectionTitle = 'HOME',
}: DashboardNavProps) {
  const navigate = useNavigate()
  const { voiceEnabled, setVoiceEnabled, isDarkMode, setIsDarkMode, logout, authUser } = useAppStore()
  const [searchOpen, setSearchOpen] = useState(false)

  const handleLogout = () => {
    const role = authUser?.role
    logout()
    if (role === 'teacher') {
      navigate('/login/teacher')
    } else {
      navigate('/login/student')
    }
  }

  return (
    <header
      className={`sticky top-0 inset-x-0 z-30 px-6 sm:px-10 py-3.5 backdrop-blur-xl theme-transition border-b ${
        isDarkMode
          ? 'bg-[#0A0A0C]/80 border-white/[0.08] text-[#F5F5F5]'
          : 'bg-[#F6F5F1]/85 border-black/[0.05] text-[#171717]'
      }`}
    >
      <div className="flex items-center justify-between">
        
        {/* ── Left: Hamburger Toggle & Title ── */}
        <div className="flex items-center gap-3.5 sm:gap-5">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-xl border theme-transition cursor-pointer ${
                isDarkMode
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#A3A39E] hover:text-white'
                  : 'bg-black/[0.03] hover:bg-black/[0.06] border-black/[0.06] text-[#6F6F6A] hover:text-[#171717]'
              }`}
              title="Open Navigation"
              aria-label="Open Navigation"
            >
              <Menu size={16} />
            </button>
          )}

          <Link
            to="/"
            className="font-display text-base sm:text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            Vernacular AI
          </Link>

          <span className="text-black/20 dark:text-white/20 text-xs hidden sm:inline">/</span>

          <span
            className={`text-xs font-semibold uppercase tracking-wider hidden sm:inline ${
              isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
            }`}
          >
            {activeSectionTitle}
          </span>
        </div>

        {/* ── Right: Search, Voice & Dark Mode Toggles ── */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          
          {/* Search Button */}
          <button
            onClick={() => setSearchOpen((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border theme-transition cursor-pointer ${
              searchOpen
                ? isDarkMode
                  ? 'bg-white/[0.08] border-white/20 text-[#F5F5F5]'
                  : 'bg-[#FFFFFF] border-black/[0.08] text-[#171717] shadow-subtle'
                : isDarkMode
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#A3A39E] hover:text-[#F5F5F5]'
                : 'bg-black/[0.03] hover:bg-black/[0.06] border-black/[0.06] text-[#6F6F6A] hover:text-[#171717]'
            }`}
            title="Search Learning Materials"
            aria-label="Search"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Voice Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium border theme-transition cursor-pointer ${
              voiceEnabled
                ? isDarkMode
                  ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-glow-cyan-subtle'
                  : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-700'
                : isDarkMode
                ? 'bg-white/[0.04] border-white/[0.08] text-[#A3A39E] hover:text-[#F5F5F5]'
                : 'bg-black/[0.03] border-black/[0.06] text-[#6F6F6A] hover:text-[#171717]'
            }`}
            title="Toggle Voice Mode"
          >
            <span className="font-semibold text-[10px] tracking-wider uppercase">VOICE</span>
            <span className={voiceEnabled ? 'text-cyan-500 font-bold' : 'text-[#A3A39E]'}>
              {voiceEnabled ? '● ON' : '○ OFF'}
            </span>

            {voiceEnabled && (
              <span className="flex items-center gap-0.5 ml-0.5" aria-hidden="true">
                <motion.span
                  animate={{ height: [4, 10, 4] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-0.5 bg-cyan-500 rounded-full"
                />
                <motion.span
                  animate={{ height: [6, 14, 6] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                  className="w-0.5 bg-cyan-400 rounded-full"
                />
                <motion.span
                  animate={{ height: [4, 8, 4] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                  className="w-0.5 bg-cyan-500 rounded-full"
                />
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border theme-transition cursor-pointer ${
              isDarkMode
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#F5F5F5]'
                : 'bg-black/[0.03] hover:bg-black/[0.06] border-black/[0.06] text-[#171717]'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-600" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border theme-transition cursor-pointer ${
              isDarkMode
                ? 'bg-white/[0.04] hover:bg-rose-500/15 hover:border-rose-500/30 text-[#A3A39E] hover:text-rose-400 border-white/[0.08]'
                : 'bg-black/[0.03] hover:bg-rose-50 hover:border-rose-300 text-[#6F6F6A] hover:text-rose-600 border-black/[0.06]'
            }`}
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>

        </div>

      </div>
    </header>
  )
}
