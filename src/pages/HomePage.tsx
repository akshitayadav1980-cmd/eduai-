import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe,
  Mic,
  GraduationCap,
  BookOpen,
  ChevronRight,
  Zap,
  Layers,
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { CinematicBackground } from '../components/background/CinematicBackground'
import { FloatingNav } from '../components/navigation/FloatingNav'
import { HeroSection, AdaptiveLearningDemo } from '../components/hero'
import { LANGUAGES } from '../data/languages'
import { useAppStore } from '../store/useAppStore'
import { fadeUp, staggerContainer } from '../utils/animations'

export function HomePage() {
  const navigate = useNavigate()
  const { setSelectedRole } = useAppStore()

  const handleStartStudent = () => {
    setSelectedRole('student')
    navigate('/student/language')
  }

  const handleStartTeacher = () => {
    setSelectedRole('teacher')
    navigate('/teacher')
  }

  return (
    <div className="relative min-h-screen bg-[#05070B] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-white overflow-x-hidden">
      {/* ── Global Cinematic Background System ── */}
      <CinematicBackground showParticles showGlow showGrid />

      {/* ── Floating Top Navigation ── */}
      <FloatingNav />

      {/* ── Signature Hero Section (Layered 3D + Typography + Language Selector + CTA) ── */}
      <HeroSection />

      {/* ── Continuation: Adaptive Concept & Interactive Demo ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28 my-12">
        
        {/* ── Section 2: "Learn Differently" ── */}
        <section className="space-y-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="text-center max-w-3xl mx-auto space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider shadow-glass-subtle">
              <Layers size={13} className="text-violet-400" />
              Pedagogical Innovation
            </div>
            <h2 className="text-heading sm:text-4xl font-extrabold text-white tracking-tight">
              Learn differently. <span className="gradient-text">One question, infinite ways to understand.</span>
            </h2>
            <p className="text-secondary sm:text-base text-slate-400">
              Traditional education forces every child into one uniform explanation. Vernacular AI calibrates the depth, dialect, and metaphors to exactly match the learner's background.
            </p>
          </motion.div>

          {/* 3 Core Innovation Pillars */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <GlassCard variant="interactive" padding="lg">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 w-fit mb-5 text-cyan-400 shadow-glow-subtle">
                <Globe size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Regional Mother Tongue</h3>
              <p className="text-secondary leading-relaxed text-slate-300">
                11 official Indian languages supported with authentic regional scripts, natural phrasing, and culturally tuned metaphors.
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs font-medium text-cyan-400">
                Hindi · Bengali · Tamil · Telugu · Marathi + 6 more
              </div>
            </GlassCard>

            <GlassCard variant="interactive" padding="lg">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 w-fit mb-5 text-blue-400 shadow-glow-subtle">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Adaptive Cognitive Scaling</h3>
              <p className="text-secondary leading-relaxed text-slate-300">
                From tangible visual stories for early primary learners to advanced molecular pathways for undergraduate researchers.
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs font-medium text-blue-400">
                Primary → Secondary → Higher Sec → College → Pro
              </div>
            </GlassCard>

            <GlassCard variant="interactive" padding="lg">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 w-fit mb-5 text-emerald-400 shadow-glow-subtle">
                <Mic size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Voice & Pronunciation AI</h3>
              <p className="text-secondary leading-relaxed text-slate-300">
                Children speak directly into the app. The AI understands regional dialects, transcribes speech, and offers encouraging audio coaching.
              </p>
              <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs font-medium text-emerald-400">
                Real-Time Audio Coaching & Instant Evaluation
              </div>
            </GlassCard>
          </motion.div>
        </section>

        {/* ── Section 3: Live Interactive Adaptive Explanation Demo ── */}
        <section>
          <AdaptiveLearningDemo />
        </section>

        {/* ── Section 4: Role Selection Spaces ── */}
        <section className="space-y-8">
          <div className="text-center">
            <span className="text-label text-cyan-400">Tailored Ecosystem</span>
            <h2 className="text-heading sm:text-3xl font-bold text-white mt-1">
              Choose your dedicated space
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Student Experience Card */}
            <GlassCard
              variant="interactive"
              padding="xl"
              onClick={handleStartStudent}
              className="group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform duration-300">
                  <BookOpen size={28} />
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  For Students
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                Student Learning Space
              </h3>
              <p className="text-body text-slate-400 mb-6">
                Interactive vernacular lessons, voice practice, pronunciation scoring, and personalized AI tutoring in your mother tongue.
              </p>
              <div className="flex items-center text-sm font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                Enter Student Space <ChevronRight size={16} className="ml-1" />
              </div>
            </GlassCard>

            {/* Teacher Experience Card */}
            <GlassCard
              variant="interactive"
              padding="xl"
              onClick={handleStartTeacher}
              className="group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 group-hover:scale-105 transition-transform duration-300">
                  <GraduationCap size={28} />
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  For Educators
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-violet-200 transition-colors">
                Teacher Intelligence Portal
              </h3>
              <p className="text-body text-slate-400 mb-6">
                Create multilingual curriculum content, track class mastery trends, and view AI pedagogical recommendations.
              </p>
              <div className="flex items-center text-sm font-semibold text-violet-400 group-hover:translate-x-1 transition-transform">
                Enter Educator Portal <ChevronRight size={16} className="ml-1" />
              </div>
            </GlassCard>
          </div>
        </section>

        {/* ── Supported Indian Languages Strip ── */}
        <section className="pt-8 border-t border-white/[0.06] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Official Indian Vernacular Languages Supported
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
            {LANGUAGES.map((lang) => (
              <span
                key={lang.id}
                className="px-3 py-1 rounded-xl bg-white/[0.025] border border-white/[0.05] text-xs text-slate-400"
              >
                <span className="text-slate-200 font-medium">{lang.nativeName}</span> · {lang.name}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* ── Clean Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 Vernacular AI · Mother Tongue-Based Primary Education · SIH 2026</p>
      </footer>
    </div>
  )
}
