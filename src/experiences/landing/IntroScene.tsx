import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
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
      
      {/* ── Top Subtle Brand Tag ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        style={{ opacity }}
        className="pt-4 sm:pt-6"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold tracking-[0.2em] uppercase backdrop-blur-2xl shadow-2xl">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Vernacular Intelligence
        </span>
      </motion.div>

      {/* ── Main Editorial Hero Composition ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.25 }}
        style={{ opacity }}
        className="max-w-5xl mx-auto space-y-6 my-auto pointer-events-auto"
      >
        {/* Dominant Primary Brand Title */}
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.95] select-none">
          <span className="animate-shiny inline-block bg-gradient-to-r from-white via-cyan-200 to-indigo-300 bg-clip-text text-transparent">
            VERNACULAR AI
          </span>
        </h1>

        {/* Elegant Secondary Headline */}
        <p className="font-serif text-2xl sm:text-4xl md:text-5xl font-normal text-white/90 tracking-tight leading-tight drop-shadow-md">
          Intelligence in your language.
        </p>

        {/* Small Supporting Description */}
        <p className="text-sm sm:text-base md:text-lg text-white/70 font-normal max-w-lg mx-auto leading-relaxed pt-1">
          AI-powered learning that adapts to your language and your level.
        </p>

        {/* Clean Minimal CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white hover:bg-white/90 text-black text-sm sm:text-base font-bold shadow-2xl hover:shadow-cyan-500/30 transition-all duration-200 cursor-pointer"
          >
            <span>Start Learning</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={handleExploreScroll}
            className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm sm:text-base font-semibold border border-white/20 backdrop-blur-2xl shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer"
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
        <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-white/50">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-white/70"
        >
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>
    </section>
  )
}
