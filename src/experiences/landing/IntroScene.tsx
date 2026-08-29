import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useExperienceScroll } from '../../components/cinematic/ScrollContext'
import { useAppStore } from '../../store/useAppStore'

export function IntroScene() {
  const navigate = useNavigate()
  const { progress } = useExperienceScroll()
  const { setSelectedRole } = useAppStore()

  // Calculate local fade/opacity based on scroll progress (0.00 to 0.20)
  const opacity = Math.max(0, 1 - progress * 5.0)

  const handleStart = () => {
    setSelectedRole('student')
    navigate('/tutor')
  }

  const handleExploreScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({
      top: 0.35 * scrollHeight,
      behavior: 'smooth',
    })
  }

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-between px-6 sm:px-12 py-12 sm:py-16 text-center pointer-events-none">
      
      {/* ── Top Subtle Brand Tag (Clean & Understated) ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        style={{ opacity }}
        className="pt-4 sm:pt-6"
      >
        <span className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#737373]">
          Vernacular Intelligence
        </span>
      </motion.div>

      {/* ── Main Editorial Hero Composition (Generous Breathing Room) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.25 }}
        style={{ opacity }}
        className="max-w-4xl mx-auto space-y-6 my-auto pointer-events-auto"
      >
        {/* Dominant Primary Brand Title */}
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-[#171717] leading-[0.95] select-none">
          VERNACULAR AI
        </h1>

        {/* Elegant Secondary Headline */}
        <p className="font-serif text-2xl sm:text-4xl md:text-5xl font-normal text-[#404040] tracking-tight leading-tight">
          Intelligence in your language.
        </p>

        {/* Small Supporting Description */}
        <p className="text-sm sm:text-base md:text-lg text-[#737373] font-normal max-w-lg mx-auto leading-relaxed pt-1">
          AI-powered learning that adapts to your language and your level.
        </p>

        {/* Clean Minimal CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-6">
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#171717] hover:bg-[#262626] text-white text-sm sm:text-base font-medium shadow-editorial hover:shadow-xl transition-all duration-200 cursor-pointer"
          >
            <span>Start Learning</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={handleExploreScroll}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/80 hover:bg-white text-[#171717] text-sm sm:text-base font-medium border border-black/[0.08] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            Explore Experience
          </button>
        </div>
      </motion.div>

      {/* ── Bottom Scroll Invitation ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        style={{ opacity }}
        className="pb-4 sm:pb-6 flex flex-col items-center gap-1.5 cursor-pointer pointer-events-auto"
        onClick={handleExploreScroll}
      >
        <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#A3A3A3]">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[#737373]"
        >
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>
    </section>
  )
}
