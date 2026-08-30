import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Layers, GraduationCap, Brain, BookOpen, ChevronLeft, Globe } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { CinematicBackground } from '../../components/background/CinematicBackground'
import { SceneCanvas } from '../../components/3d/SceneCanvas'
import { useAppStore } from '../../store/useAppStore'
import { EDUCATION_LEVELS, getEducationLevelById } from '../../data/educationLevels'
import { getLanguageById } from '../../data/languages'
import { staggerContainer, fadeUp } from '../../utils/animations'
import type { EducationLevel } from '../../types'

// Dynamic icon mapping based on iconName string
const iconMap: Record<string, React.ComponentType<any>> = {
  Sparkles: Sparkles,
  BookOpen: BookOpen,
  Layers: Layers,
  GraduationCap: GraduationCap,
  Brain: Brain,
}

export function StudentEducationPage() {
  const navigate = useNavigate()
  const {
    selectedLanguageId,
    educationLevel,
    setEducationLevel,
    setAssistantState,
    assistantState,
  } = useAppStore()

  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>(educationLevel)
  const [showWelcome, setShowWelcome] = useState(false)

  const handleSelectLevel = (level: EducationLevel) => {
    setSelectedLevel(level)
    setEducationLevel(level)

    // Trigger subtle AI Core confirmation pulse
    setAssistantState({ mode: 'success', message: `Selected ${level}` })
    setTimeout(() => {
      setAssistantState({ mode: 'idle', message: null })
    }, 1500)
  }

  const handleContinue = () => {
    // Show personalized welcome state briefly
    setShowWelcome(true)
  }

  const handleConfirmWelcome = () => {
    navigate('/student/home')
  }

  const activeLang = getLanguageById(selectedLanguageId)
  const activeLevelConfig = getEducationLevelById(selectedLevel)

  return (
    <div className="relative min-h-screen bg-[#05070B] text-slate-100 flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* ── Global Cinematic Background System ── */}
      <CinematicBackground showParticles showGlow showGrid />

      {/* ── 3D Scene Layer (Central AI Core) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 sm:opacity-50" aria-hidden="true">
        <SceneCanvas
          state={assistantState.mode}
          showFloatingElements={false}
          showOrbitalParticles={true}
          showAmbientParticles={false}
          cameraPosition={[0, 0, 7.5]}
        />
      </div>

      {/* ── Top Header Navigation ── */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => navigate('/student/language')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          Back to Language
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cinema-900/80 border border-white/[0.08] text-xs text-slate-400 backdrop-blur-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Step 2 of 2 · Education Level</span>
        </div>
      </div>

      {/* ── Main Onboarding Container ── */}
      <main className="relative z-10 max-w-5xl mx-auto w-full flex-1 flex flex-col items-center justify-center my-6">
        <AnimatePresence mode="wait">
          {!showWelcome ? (
            <motion.div
              key="selection-step"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center"
            >
              {/* Step Heading */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-center max-w-xl mx-auto mb-8 space-y-2"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-semibold uppercase tracking-wider shadow-glass-subtle mb-1">
                  <Layers size={13} className="text-violet-400" />
                  Cognitive Calibration
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  How do you want to learn?
                </h1>
                <p className="text-body sm:text-base text-slate-400 text-balance">
                  Choose the level that best matches your learning style and goals.
                </p>
              </motion.div>

              {/* Education Level Grid */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full mb-10"
                role="radiogroup"
                aria-label="Select your education level"
              >
                {EDUCATION_LEVELS.map((lvl) => {
                  const isSelected = selectedLevel === lvl.id
                  const Icon = iconMap[lvl.iconName] || BookOpen

                  return (
                    <GlassCard
                      key={lvl.id}
                      variant={isSelected ? 'highlighted' : 'interactive'}
                      padding="md"
                      onClick={() => handleSelectLevel(lvl.id)}
                      className={`relative flex flex-col justify-between text-left group cursor-pointer transition-all duration-300 min-h-[220px] md:min-h-[260px] ${
                        isSelected ? 'ring-2 ring-cyan-400 shadow-glow-cyan md:scale-105 z-10' : 'opacity-70 hover:opacity-100'
                      }`}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectLevel(lvl.id)
                        }
                      }}
                    >
                      <div>
                        {/* Header: Icon & Grade Range */}
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className={`p-2.5 rounded-xl border ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-glow-subtle'
                                : 'bg-white/[0.04] border-white/[0.08] text-slate-400 group-hover:text-white'
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {lvl.grades}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className={`text-base sm:text-lg font-bold tracking-tight mb-1.5 ${
                          isSelected ? 'text-cyan-200' : 'text-white'
                        }`}>
                          {lvl.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          {lvl.description}
                        </p>
                      </div>

                      {/* Difficulty Indicator Bar */}
                      <div className="w-full pt-3 border-t border-white/[0.05]">
                        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500 mb-1.5">
                          <span>COMPLEXITY</span>
                          <span className={isSelected ? 'text-cyan-400' : ''}>LVL {lvl.difficulty}</span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((step) => (
                            <div
                              key={step}
                              className={`h-1.5 flex-1 rounded-full transition-all ${
                                step <= lvl.difficulty
                                  ? isSelected
                                    ? 'bg-cyan-400 shadow-glow-sm'
                                    : 'bg-slate-400'
                                  : 'bg-white/[0.06]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}
              </motion.div>

              {/* ── Continue Button ── */}
              <div className="w-full max-w-xs mx-auto">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleContinue}
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                  className="shadow-glow-cyan text-base font-bold py-3.5"
                >
                  Continue to Welcome →
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="welcome-step"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md mx-auto"
            >
              <GlassCard variant="highlighted" padding="xl" className="text-center space-y-6">
                {/* 3D Orb/Badge Representation */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/25 via-blue-600/10 to-violet-500/25 blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-cinema-900 border border-cyan-400/40 shadow-glow-cyan flex items-center justify-center">
                    <Sparkles size={32} className="text-cyan-300" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
                    Configuration Complete
                  </span>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    You're ready!
                  </h2>
                </div>

                {/* Configuration Summary Badge */}
                <div className="p-4 rounded-xl bg-cinema-950/80 border border-white/[0.06] backdrop-blur-xl text-left space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.05]">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider">LEARNING SETTINGS</span>
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Globe size={16} className="text-cyan-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Mother Tongue</p>
                      <p className="text-sm font-semibold text-white">
                        {activeLang ? `${activeLang.nativeName} (${activeLang.name})` : 'English'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Layers size={16} className="text-violet-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Pedagogical Calibration</p>
                      <p className="text-sm font-semibold text-white">
                        {activeLevelConfig.title} · <span className="text-xs text-slate-400 font-normal">{activeLevelConfig.grades}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  {activeLevelConfig.subtext}
                </p>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleConfirmWelcome}
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                  className="shadow-glow-cyan text-base font-bold py-3.5"
                >
                  Enter AI Tutor 🚀
                </Button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-4 text-xs text-slate-400">
        Vernacular AI · Cognitive Calibrated Learning
      </footer>
    </div>
  )
}
