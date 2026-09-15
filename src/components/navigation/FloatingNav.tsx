import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export function FloatingNav() {
  const navigate = useNavigate()
  const { setSelectedRole } = useAppStore()

  const handleStart = () => {
    setSelectedRole('student')
    navigate('/tutor')
  }

  const handleScrollTo = (ratio: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({
      top: ratio * scrollHeight,
      behavior: 'smooth',
    })
  }

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 w-full px-6 sm:px-12 py-4 bg-[#0c0c0c]/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left: Clean Brand Identity */}
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2.5 text-left focus-visible:outline-none cursor-pointer"
          aria-label="Vernacular AI Home"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles size={16} />
          </div>
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent group-hover:text-white transition-colors">
            Vernacular AI
          </span>
        </button>

        {/* Center: Minimal Editorial Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-white/70">
          <button
            onClick={() => handleScrollTo(0.35)}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Languages
          </button>
          <button
            onClick={() => handleScrollTo(0.55)}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Experience
          </button>
          <button
            onClick={() => handleScrollTo(0.70)}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Adaptive Learning
          </button>
          <button
            onClick={() => handleScrollTo(0.88)}
            className="hover:text-white transition-colors cursor-pointer"
          >
            AI Tutor
          </button>
        </nav>

        {/* Right: Single Refined CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-white hover:bg-white/90 text-black text-xs sm:text-sm font-semibold shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 cursor-pointer"
          >
            <span>Start Learning</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </motion.header>
  )
}
