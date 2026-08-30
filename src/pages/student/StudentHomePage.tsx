import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, Mic, Languages, Flame, Star, Brain,
  ArrowRight, TrendingUp, Clock, Zap, Globe, ChevronRight,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { GlowCard } from '../../components/ui/GlowCard'
import { useAppStore } from '../../store/useAppStore'
import { getLanguageById } from '../../data/languages'
import { MOCK_LESSONS, getNextLesson } from '../../data/mockLessons'
import { staggerContainer, staggerItem } from '../../utils/animations'
import { speechService } from '../../services/speech'

// ─── Quick action ─────────────────────────────────────────────────────────────
interface QuickActionProps {
  icon: React.ReactNode
  label: string
  description: string
  to: string
  color: 'cyan' | 'violet' | 'emerald' | 'amber'
}

const actionColors = {
  cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/25',    text: 'text-cyan-400',    hover: 'hover:bg-cyan-500/15' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/25',  text: 'text-violet-400',  hover: 'hover:bg-violet-500/15' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/15' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   text: 'text-amber-400',   hover: 'hover:bg-amber-500/15' },
}

function QuickAction({ icon, label, description, to, color }: QuickActionProps) {
  const navigate = useNavigate()
  const c = actionColors[color]
  return (
    <motion.button
      variants={staggerItem}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(to)}
      className={[
        'glass rounded-xl p-4 border text-left transition-all duration-200 w-full',
        c.border, c.hover,
      ].join(' ')}
      aria-label={label}
    >
      <div className={`inline-flex p-2.5 rounded-lg border mb-3 ${c.bg} ${c.border}`}>
        <span className={c.text}>{icon}</span>
      </div>
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </motion.button>
  )
}

// ─── Lesson card (compact) ────────────────────────────────────────────────────
function LessonCard({ lesson }: { lesson: ReturnType<typeof getNextLesson> & {} }) {
  const navigate = useNavigate()
  const typeColor: Record<string, string> = {
    vocabulary: 'cyan', story: 'violet', pronunciation: 'emerald',
    grammar: 'amber', conversation: 'rose',
  }
  const color = (typeColor[lesson.type] ?? 'cyan') as 'cyan' | 'violet' | 'emerald' | 'amber'

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ x: 2 }}
      className="glass rounded-xl border border-white/8 p-4 flex items-center gap-4 hover:border-white/15 transition-all duration-200 cursor-pointer"
      onClick={() => navigate('/student/learn')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate('/student/learn') }}
      aria-label={`Open lesson: ${lesson.title}`}
    >
      <div className={`shrink-0 p-2.5 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
        <BookOpen size={16} className={`text-${color}-400`} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-white truncate">{lesson.title}</p>
          {lesson.completed && <Badge variant="emerald" size="sm">Done</Badge>}
        </div>
        <p className="text-xs text-slate-500 truncate">{lesson.nativeTitle}</p>
        {lesson.progress > 0 && lesson.progress < 100 && (
          <ProgressBar value={lesson.progress} size="xs" color={color} className="mt-2" />
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs text-slate-500">{lesson.durationMinutes}m</p>
        <p className="text-xs text-amber-400 font-medium mt-0.5">+{lesson.xpReward} XP</p>
      </div>
      <ChevronRight size={14} className="shrink-0 text-slate-600" aria-hidden="true" />
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function StudentHomePage() {
  const navigate = useNavigate()
  const { selectedLanguageId, currentStudent, voiceEnabled, setAssistantState } = useAppStore()
  const lang = getLanguageById(selectedLanguageId)
  const studentName = currentStudent?.name ?? 'Learner'
  const nextLesson = getNextLesson(selectedLanguageId)

  // Greet on mount if voice is on
  useEffect(() => {
    if (voiceEnabled) {
      const msg = `Welcome back, ${studentName}! Ready to learn today?`
      setAssistantState({ mode: 'speaking', message: msg })
      speechService.speak(msg).finally(() => setAssistantState({ mode: 'idle', message: null }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mock values
  const streak = 7
  const totalXP = 340
  const overallProgress = 62
  const lessonsForLang = MOCK_LESSONS.filter((l) => l.languageId === selectedLanguageId).slice(0, 4)
  const fallbackLessons = MOCK_LESSONS.slice(0, 4)
  const displayLessons = lessonsForLang.length ? lessonsForLang : fallbackLessons

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* ── Header greeting ───────────────────────────────────────────── */}
      <motion.div variants={staggerItem}>
        <PageHeader
          title={`${greeting}, ${studentName.split(' ')[0]}! 👋`}
          description={lang ? `Continuing your ${lang.name} journey — keep going!` : 'Ready to learn today?'}
          action={
            <Badge variant="cyan" dot>
              <Flame size={11} className="mr-1 text-amber-400" />
              {streak} day streak
            </Badge>
          }
        />
      </motion.div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <StatCard
          label="Overall Progress"
          value={`${overallProgress}%`}
          icon={<TrendingUp size={18} />}
          color="cyan"
          trend="up"
          trendValue="8% this week"
        />
        <StatCard
          label="Total XP"
          value={totalXP}
          icon={<Star size={18} />}
          color="amber"
          trend="up"
          trendValue="+60 today"
        />
        <StatCard
          label="Lessons Done"
          value={displayLessons.filter((l) => l.completed).length}
          icon={<BookOpen size={18} />}
          color="emerald"
        />
        <StatCard
          label="Streak"
          value={`${streak} days`}
          icon={<Flame size={18} />}
          color="violet"
          trend="up"
          trendValue="Personal best!"
        />
      </motion.div>

      {/* ── Main content grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Current / next lesson banner */}
          {nextLesson && (
            <motion.div variants={staggerItem}>
              <GlowCard glowColor="cyan" padding="lg" className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none rounded-xl" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={13} className="text-cyan-400" aria-hidden="true" />
                      <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Continue Learning</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-0.5 truncate">{nextLesson.title}</h3>
                    <p className="text-sm text-slate-400 mb-1">{nextLesson.nativeTitle}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1"><Clock size={11} /> {nextLesson.durationMinutes} min</span>
                      <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> +{nextLesson.xpReward} XP</span>
                    </div>
                    <ProgressBar
                      value={nextLesson.progress}
                      color="cyan"
                      size="sm"
                      showLabel
                      label="Progress"
                      className="mb-4 max-w-xs"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<ArrowRight size={14} />}
                      iconPosition="right"
                      onClick={() => navigate('/student/learn')}
                    >
                      {nextLesson.progress > 0 ? 'Resume Lesson' : 'Start Lesson'}
                    </Button>
                  </div>
                  <div className="shrink-0 hidden sm:flex p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                    <Brain size={40} className="text-cyan-400" aria-hidden="true" />
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          )}

          {/* Recent / all lessons */}
          <motion.div variants={staggerItem}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300">
                {lang ? `${lang.name} Lessons` : 'Lessons'}
              </h2>
              <button
                onClick={() => navigate('/student/learn')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <motion.div variants={staggerContainer} className="space-y-2.5">
              {displayLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-5">

          {/* Skill progress ring cluster */}
          <motion.div variants={staggerItem} className="glass rounded-xl border border-white/8 p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Skill Progress</h3>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <ProgressRing value={78} size={72} color="#06b6d4" label="Read" showLabel />
              <ProgressRing value={62} size={72} color="#8b5cf6" label="Write" showLabel />
              <ProgressRing value={85} size={72} color="#10b981" label="Listen" showLabel />
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
              <ProgressRing value={55} size={72} color="#f59e0b" label="Speak" showLabel />
              <ProgressRing value={70} size={72} color="#06b6d4" label="Translate" showLabel />
              <div className="w-[72px]" aria-hidden="true" />
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div variants={staggerItem}>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Quick Actions</h3>
            <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-2.5">
              <QuickAction
                icon={<BookOpen size={18} />}
                label="Learn"
                description="Continue lessons"
                to="/student/learn"
                color="cyan"
              />
              <QuickAction
                icon={<Mic size={18} />}
                label="Record"
                description="Practice speaking"
                to="/student/record"
                color="emerald"
              />
              <QuickAction
                icon={<Languages size={18} />}
                label="Translate"
                description="Real-time translation"
                to="/student/translate"
                color="violet"
              />
              <QuickAction
                icon={<Globe size={18} />}
                label="Language"
                description="Switch language"
                to="/student/language"
                color="amber"
              />
            </motion.div>
          </motion.div>

          {/* Language badge */}
          {lang && (
            <motion.div
              variants={staggerItem}
              className="glass rounded-xl border border-white/8 p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-slate-500">Active Language</p>
                <p className="text-lg font-bold text-white mt-0.5">{lang.nativeName}</p>
                <p className="text-xs text-slate-500">{lang.name} · {lang.script} script</p>
              </div>
              <button
                onClick={() => navigate('/student/language')}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                aria-label="Change language"
              >
                Change →
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
