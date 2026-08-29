import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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
      className="sticky top-0 z-40 w-full px-6 sm:px-12 py-4 bg-[#F8F7F3]/80 backdrop-blur-xl border-b border-black/[0.05] shadow-[0_2px_16px_rgba(0,0,0,0.02)]"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left: Clean Brand Identity */}
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2.5 text-left focus-visible:outline-none cursor-pointer"
          aria-label="Vernacular AI Home"
        >
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#171717] group-hover:text-indigo-950 transition-colors">
            Vernacular AI
          </span>
        </button>

        {/* Center: Minimal Editorial Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#525252]">
          <button
            onClick={() => handleScrollTo(0.35)}
            className="hover:text-[#171717] transition-colors cursor-pointer"
          >
            Languages
          </button>
          <button
            onClick={() => handleScrollTo(0.55)}
            className="hover:text-[#171717] transition-colors cursor-pointer"
          >
            Experience
          </button>
          <button
            onClick={() => handleScrollTo(0.70)}
            className="hover:text-[#171717] transition-colors cursor-pointer"
          >
            Adaptive Learning
          </button>
          <button
            onClick={() => handleScrollTo(0.88)}
            className="hover:text-[#171717] transition-colors cursor-pointer"
          >
            AI Tutor
          </button>
        </nav>

        {/* Right: Single Refined CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-[#171717] hover:bg-[#262626] text-white text-xs sm:text-sm font-medium shadow-editorial hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <span>Start Learning</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </motion.header>
  )
}
