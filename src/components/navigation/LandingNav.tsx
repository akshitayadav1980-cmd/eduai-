import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Search } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export function LandingNav() {
  const { voiceEnabled, setVoiceEnabled, isDarkMode, setIsDarkMode } = useAppStore()
  const [searchOpen, setSearchOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 px-6 sm:px-12 py-4 backdrop-blur-xl theme-transition ${
        isDarkMode
          ? 'bg-[#0A0A0C]/80 border-b border-white/[0.08] text-[#F5F5F5]'
          : 'bg-[#F6F5F1]/80 border-b border-black/[0.05] text-[#171717]'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* ── Left: Brand ── */}
        <button
          onClick={() => scrollToSection('hero')}
          className="group flex items-center gap-2 text-left focus:outline-none cursor-pointer"
          aria-label="Vernacular AI"
        >
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight">
            Vernacular AI
          </span>
        </button>

        {/* ── Center: Minimal Navigation (Scrolls to same page sections) ── */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide">
          <button
            onClick={() => scrollToSection('hero')}
            className={`transition-colors cursor-pointer ${
              isDarkMode ? 'text-[#A3A39E] hover:text-[#FFFFFF]' : 'text-[#6F6F6A] hover:text-[#171717]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => scrollToSection('roles')}
            className={`transition-colors cursor-pointer ${
              isDarkMode ? 'text-[#A3A39E] hover:text-[#FFFFFF]' : 'text-[#6F6F6A] hover:text-[#171717]'
            }`}
          >
            Pathway
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className={`transition-colors cursor-pointer ${
              isDarkMode ? 'text-[#A3A39E] hover:text-[#FFFFFF]' : 'text-[#6F6F6A] hover:text-[#171717]'
            }`}
          >
            About
          </button>
        </nav>

        {/* ── Right: Search, Voice & Dark Mode Toggles ── */}
        <div className="flex items-center gap-3.5">
          
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
            title="Search"
            aria-label="Search"
          >
            <Search size={14} />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Voice UI Toggle */}
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
            title="Toggle Voice Guidance"
          >
            <span className="font-semibold text-[10px] tracking-wider uppercase">VOICE</span>
            <span className={voiceEnabled ? 'text-cyan-500 font-bold' : 'text-[#A3A39E]'}>
              {voiceEnabled ? '● ON' : '○ OFF'}
            </span>

            {/* Subtle animated sound wave indicator when enabled */}
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

          {/* Dark Mode Toggle */}
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

        </div>

      </div>
    </motion.header>
  )
}
