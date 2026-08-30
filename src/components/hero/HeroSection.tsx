import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, GraduationCap, Globe, Mic, Layers } from 'lucide-react'
import { Button } from '../ui/Button'
import { SceneCanvas } from '../3d/SceneCanvas'
import { HeroLanguageSelector } from './HeroLanguageSelector'
import { useAppStore } from '../../store/useAppStore'
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations'

export function HeroSection() {
  const navigate = useNavigate()
  const { setSelectedRole, assistantState } = useAppStore()

  const handleStartLearning = () => {
    setSelectedRole('student')
    navigate('/student/language')
  }

  const handleEducatorPortal = () => {
    setSelectedRole('teacher')
    navigate('/teacher')
  }

  return (
    <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-8 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* ── 3D SceneCanvas Layer (Seamlessly Blended in Space) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <SceneCanvas
          state={assistantState.mode}
          showFloatingElements={true}
          showOrbitalParticles={true}
          showAmbientParticles={true}
          cameraPosition={[0, 0.1, 6.2]}
          interactive={false}
        />
        {/* Soft atmospheric gradient falloff */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05070B]/20 to-[#05070B]" />
      </div>

      {/* ── Central Hero Content (Layered atop 3D) ── */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        
        {/* Brand Intelligence Pill */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cinema-900/80 border border-cyan-500/25 backdrop-blur-2xl mb-6 shadow-glass-subtle"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-slate-200">
            VERNACULAR AI <span className="text-slate-500 font-normal">·</span> Next-Gen Regional Pedagogy
          </span>
        </motion.div>

        {/* Hero Display Typography */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl space-y-4 mb-4"
        >
          <motion.h1 variants={staggerItem} className="text-display">
            Intelligence in{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              your language.
            </span>
          </motion.h1>

          <motion.p variants={staggerItem} className="text-body sm:text-lg text-slate-300/90 max-w-2xl mx-auto text-balance">
            Learn smarter with AI that adapts to your regional mother tongue, your educational level, 
            and the way you naturally comprehend the world.
          </motion.p>
        </motion.div>

        {/* ── Contextual Subtle Floating 2D Badges flanking the 3D focal space ── */}
        <div className="relative w-full max-w-3xl h-36 sm:h-48 my-2 flex items-center justify-center pointer-events-none">
          {/* Left badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="absolute left-2 sm:left-6 top-6 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cinema-900/80 border border-cyan-500/20 backdrop-blur-xl shadow-glass-subtle"
          >
            <Globe size={13} className="text-cyan-400" />
            <span className="text-[11px] font-semibold text-slate-300">11 Indic Mother Tongues</span>
          </motion.div>

          {/* Right badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="absolute right-2 sm:right-6 top-8 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cinema-900/80 border border-violet-500/20 backdrop-blur-xl shadow-glass-subtle"
          >
            <Layers size={13} className="text-violet-400" />
            <span className="text-[11px] font-semibold text-slate-300">Primary → Professional</span>
          </motion.div>

          {/* Bottom badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="absolute bottom-2 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cinema-900/80 border border-emerald-500/20 backdrop-blur-xl shadow-glass-subtle"
          >
            <Mic size={13} className="text-emerald-400" />
            <span className="text-[11px] font-semibold text-slate-300">Voice-First Pedagogy</span>
          </motion.div>
        </div>

        {/* ── Language Selection Glass Strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full mb-8"
        >
          <HeroLanguageSelector />
        </motion.div>

        {/* ── Primary Action Controls ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md mx-auto"
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleStartLearning}
            icon={<ArrowRight size={18} />}
            iconPosition="right"
            className="shadow-glow-cyan text-base font-bold py-3.5"
          >
            Start Learning
          </Button>

          <Button
            variant="glass"
            size="lg"
            fullWidth
            onClick={handleEducatorPortal}
            icon={<GraduationCap size={18} />}
            iconPosition="left"
            className="text-base"
          >
            Educator Portal
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
