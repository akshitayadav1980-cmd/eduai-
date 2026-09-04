import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, Sparkles, Trophy, ArrowRight, CheckCircle2,
  Clock, Play, Compass, Flame
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { FloatingNav } from '../../components/navigation/FloatingNav'
import { CinematicBackground } from '../../components/background/CinematicBackground'
import { useAppStore } from '../../store/useAppStore'
import { getLanguageById } from '../../data/languages'
import { getEducationLevelById } from '../../data/educationLevels'
import { recordActivity } from '../../services/studentService'
import { toIsoLanguageCode } from '../../services/translationService'

interface TopicNode {
  id: string
  title: string
  subject: string
  mastery: number
  status: 'completed' | 'in_progress' | 'recommended'
  timeEstimate: string
}

const LEARNING_PATH: TopicNode[] = [
  {
    id: 'topic-1',
    title: 'Photosynthesis & Solar Energy',
    subject: 'Biology',
    mastery: 92,
    status: 'completed',
    timeEstimate: '15 mins',
  },
  {
    id: 'topic-2',
    title: 'Cellular Respiration & ATP Cycle',
    subject: 'Biochemistry',
    mastery: 78,
    status: 'in_progress',
    timeEstimate: '20 mins',
  },
  {
    id: 'topic-3',
    title: 'Mitochondrial Membrane Kinetics',
    subject: 'Cellular Bio',
    mastery: 45,
    status: 'recommended',
    timeEstimate: '25 mins',
  },
  {
    id: 'topic-4',
    title: 'Quantum Electron Transport in Enzymes',
    subject: 'Biophysics',
    mastery: 10,
    status: 'recommended',
    timeEstimate: '30 mins',
  },
]

export function LearningSpace() {
  const navigate = useNavigate()
  const { selectedLanguageId, educationLevel } = useAppStore()
  const lang = getLanguageById(selectedLanguageId)
  const levelInfo = getEducationLevelById(educationLevel)

  const [activeTab, setActiveTab] = useState<'path' | 'lessons' | 'progress'>('path')

  return (
    <div className="relative min-h-screen bg-[#05070B] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-white">
      {/* ── Ambient Background ── */}
      <CinematicBackground showParticles showGlow showGrid />

      {/* ── Top Floating Navigation ── */}
      <FloatingNav />

      <main className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8">
        
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Compass size={12} className="text-cyan-400" />
              Cognitive Path · {lang?.nativeName ?? 'English'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your Learning Space
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Personalized curriculum calibrated for <span className="text-cyan-300 font-medium">{levelInfo.title} ({levelInfo.grades})</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/tutor')}
              icon={<Sparkles size={16} />}
              className="shadow-glow-cyan"
            >
              Ask AI Tutor
            </Button>
          </div>
        </div>

        {/* Space Navigation Switcher */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          {[
            { id: 'path', label: 'Adaptive Learning Path', icon: Compass },
            { id: 'progress', label: 'Cognitive Mastery Progress', icon: Trophy },
            { id: 'lessons', label: 'Vernacular Lesson Modules', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-glass-subtle'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Content View 1: Spatial Journey Learning Path ── */}
        {activeTab === 'path' && (
          <div className="space-y-6">
            {/* Daily Streak & Overview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GlassCard variant="highlighted" padding="md" className="border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Flame size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500">Learning Streak</p>
                    <p className="text-xl font-extrabold text-white">5 Days Active</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard variant="highlighted" padding="md" className="border-violet-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500">Mastery Index</p>
                    <p className="text-xl font-extrabold text-white">82% Verified</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard variant="highlighted" padding="md" className="border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500">Calibrated Depth</p>
                    <p className="text-xl font-extrabold text-white">{levelInfo.title}</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Visual Node-Based Learning Journey */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400" />
                Adaptive Sequence Pipeline
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-violet-500/20">
                {LEARNING_PATH.map((node, idx) => {
                  const isDone = node.status === 'completed'
                  const isCurrent = node.status === 'in_progress'

                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className="relative"
                    >
                      {/* Timeline Marker Ring */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-cyan-500 text-cinema-950 border-cyan-300 font-bold shadow-glow-cyan'
                            : isCurrent
                            ? 'bg-cinema-900 border-cyan-400 text-cyan-400 animate-pulse shadow-glow-subtle'
                            : 'bg-cinema-950 border-white/20 text-slate-500'
                        }`}
                      >
                        {isDone ? <CheckCircle2 size={14} /> : <span className="text-xs">{idx + 1}</span>}
                      </div>

                      {/* Journey Card */}
                      <GlassCard
                        variant={isCurrent ? 'highlighted' : 'default'}
                        padding="md"
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                          isCurrent ? 'border-cyan-400/40 shadow-glow-cyan' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-cyan-400">{node.subject}</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock size={11} /> {node.timeEstimate}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[10px] font-bold uppercase">
                                Recommended Next
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-white">{node.title}</h4>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Mastery</p>
                            <p className="text-sm font-extrabold text-white">{node.mastery}%</p>
                          </div>

                          <Button
                            variant={isCurrent ? 'primary' : 'glass'}
                            size="sm"
                            onClick={() => {
                              // Fire-and-forget: record lesson start without blocking navigation
                              recordActivity({
                                activity_type: 'lesson',
                                activity_id: node.id,
                                completed: true,
                                language: toIsoLanguageCode(selectedLanguageId),
                                education_level: educationLevel,
                              }).catch(() => {}) // Silently ignore if unauthenticated
                              navigate(`/tutor?prompt=${encodeURIComponent(`Explain ${node.title} in ${lang?.name}`)}`)
                            }}
                            icon={<Play size={13} />}
                          >
                            {isDone ? 'Review' : 'Learn'}
                          </Button>
                        </div>
                      </GlassCard>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Content View 2: Progress Metrics ── */}
        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard variant="highlighted" padding="lg">
              <h3 className="text-lg font-bold text-white mb-4">Dialect & Linguistic Comprehension</h3>
              <div className="space-y-4">
                {[
                  { skill: 'Vernacular Vocabulary', score: 94 },
                  { skill: 'Scientific Conceptual Accuracy', score: 86 },
                  { skill: 'Speech Pronunciation', score: 90 },
                  { skill: 'Retention & Quick Quizzes', score: 82 },
                ].map((s) => (
                  <div key={s.skill} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{s.skill}</span>
                      <span className="text-cyan-400">{s.score}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard variant="highlighted" padding="lg">
              <h3 className="text-lg font-bold text-white mb-4">Adaptive Level Performance</h3>
              <p className="text-xs text-slate-400 mb-4">
                Your comprehension has advanced across calibrated depth levels:
              </p>
              <div className="p-4 rounded-xl bg-cinema-900/90 border border-white/[0.06] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Current Setting:</span>
                  <span className="font-bold text-cyan-300">{levelInfo.title}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Mother Tongue:</span>
                  <span className="font-bold text-cyan-300">{lang?.nativeName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Next Recommended Benchmark:</span>
                  <span className="font-bold text-violet-300">Higher Secondary Pathways</span>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── Content View 3: Modules ── */}
        {activeTab === 'lessons' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {['Plant Physiology', 'Chemical Thermodynamics', 'Electromagnetism', 'Quantum Mechanics', 'Algorithmic Systems', 'Biotechnology'].map((title) => (
              <GlassCard key={title} variant="interactive" padding="md" className="space-y-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit">
                  <BookOpen size={18} />
                </div>
                <h4 className="text-base font-bold text-white">{title}</h4>
                <p className="text-xs text-slate-400">
                  Comprehensive modular lesson translated and verified in {lang?.name}.
                </p>
                <Button
                  variant="glass"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    // Fire-and-forget: record lesson completion without blocking navigation
                    recordActivity({
                      activity_type: 'lesson',
                      activity_id: title.toLowerCase().replace(/ /g, '-'),
                      completed: true,
                      language: toIsoLanguageCode(selectedLanguageId),
                      education_level: educationLevel,
                    }).catch(() => {}) // Silently ignore if unauthenticated
                    navigate(`/tutor?prompt=${encodeURIComponent(`Teach me ${title} in ${lang?.name}`)}`)
                  }}
                  icon={<ArrowRight size={14} />}
                  iconPosition="right"
                >
                  Start Lesson
                </Button>
              </GlassCard>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
