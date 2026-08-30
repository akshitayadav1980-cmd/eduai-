import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  Sparkles,
  Mic,
  Languages,
  BarChart3,
  Users,
  Brain,
  FileText,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { GlassCard } from '../components/ui/GlassCard'
import { CinematicBackground } from '../components/background/CinematicBackground'
import { useAppStore } from '../store/useAppStore'
import type { UserRole } from '../types'
import { staggerContainer, staggerItem } from '../utils/animations'

interface RoleCardProps {
  role: 'student' | 'teacher'
  title: string
  tagline: string
  description: string
  features: string[]
  icon: React.ReactNode
  accentColor: 'cyan' | 'violet'
  route: string
}

function RoleCard({ role, title, tagline, description, features, icon, accentColor, route }: RoleCardProps) {
  const navigate = useNavigate()
  const setSelectedRole = useAppStore((s) => s.setSelectedRole)
  const isCyan = accentColor === 'cyan'

  const handleSelect = () => {
    setSelectedRole(role as UserRole)
    navigate(route)
  }

  return (
    <GlassCard
      variant="interactive"
      padding="xl"
      onClick={handleSelect}
      className="group cursor-pointer flex flex-col justify-between"
      role="button"
      tabIndex={0}
      aria-label={`Select ${title} role`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleSelect()
      }}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div
            className={`p-4 rounded-2xl border ${
              isCyan
                ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300'
                : 'bg-violet-500/10 border-violet-500/25 text-violet-300'
            } group-hover:scale-105 transition-transform duration-300`}
          >
            {icon}
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              isCyan
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                : 'bg-violet-500/10 text-violet-300 border-violet-500/20'
            }`}
          >
            {role === 'student' ? 'For Students' : 'For Educators'}
          </span>
        </div>

        {/* Title */}
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">{title}</h2>
          <p className={`text-sm font-medium ${isCyan ? 'text-cyan-400' : 'text-violet-400'}`}>{tagline}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed mb-6">{description}</p>

        {/* Feature list */}
        <ul className="space-y-2.5 mb-8" aria-label={`${title} features`}>
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${isCyan ? 'bg-cyan-400' : 'bg-violet-400'}`}
                aria-hidden="true"
              />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <Button
        variant={isCyan ? 'primary' : 'secondary'}
        fullWidth
        icon={<ArrowRight size={16} />}
        iconPosition="right"
        onClick={(e) => {
          e.stopPropagation()
          handleSelect()
        }}
        aria-label={`Continue as ${title}`}
      >
        Continue as {title}
      </Button>
    </GlassCard>
  )
}

export function RoleSelectPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-[#05070B] text-slate-100 flex flex-col overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Background */}
      <CinematicBackground showParticles showGlow showGrid />

      {/* Back nav */}
      <div className="relative z-20 p-6 max-w-7xl mx-auto w-full">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none"
          aria-label="Back to home"
        >
          <ChevronLeft size={16} />
          Back to Vernacular AI
        </button>
      </div>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="w-full">
          {/* Header */}
          <motion.div variants={staggerItem} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300 shadow-glass-subtle">
              <Sparkles size={12} className="text-cyan-400" aria-hidden="true" />
              Vernacular AI Experience Selection
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
              Choose your path
            </h1>
            <p className="text-slate-400 max-w-md mx-auto text-sm sm:text-base">
              Personalized intelligence tailored specifically for learners and educators.
            </p>
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <RoleCard
              role="student"
              title="Student Space"
              tagline="Learn in your mother tongue"
              description="Interactive lessons, pronunciation coaching, and real-time concept translation in regional languages."
              features={[
                'Adaptive regional lessons & vocabulary',
                'Vernacular voice pronunciation feedback',
                'Real-time multi-dialect translation',
                'Gamified progress streaks & mastery metrics',
                'Interactive AI teaching companion',
              ]}
              icon={<BookOpen size={28} />}
              accentColor="cyan"
              route="/student/language"
            />
            <RoleCard
              role="teacher"
              title="Educator Portal"
              tagline="Empower regional classrooms"
              description="Author multilingual curricula, track learner mastery trends, and harness AI pedagogical intelligence."
              features={[
                'AI multilingual curriculum generator',
                'Student comprehension & skill analytics',
                'Classroom language diversity insights',
                'Custom lesson & exercise authoring',
                'Real-time student progress tracking',
              ]}
              icon={<GraduationCap size={28} />}
              accentColor="violet"
              route="/teacher"
            />
          </div>

          {/* Icon strip */}
          <motion.div
            variants={staggerItem}
            className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap pt-6 border-t border-white/[0.05]"
          >
            {[
              { icon: <Brain size={15} />, label: 'Neural Pedagogy' },
              { icon: <Mic size={15} />, label: 'Regional STT/TTS' },
              { icon: <Languages size={15} />, label: 'Indic Translation' },
              { icon: <BarChart3 size={15} />, label: 'Mastery Metrics' },
              { icon: <Users size={15} />, label: 'Class Management' },
              { icon: <FileText size={15} />, label: 'Lesson Studio' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="text-cyan-400/70" aria-hidden="true">
                  {icon}
                </span>
                {label}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
