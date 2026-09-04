import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  BookOpen,
  Globe,
  ArrowRight,
  ShieldCheck,
  Award,
  CheckCircle2,
  TrendingUp,
  Flame,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { getLanguageById } from '../../data/languages'
import { fetchMyProgress } from '../../services/studentService'
import type { StudentProgressSummary } from '../../types'
import { QuizModal } from '../quiz/QuizModal'

interface HomeSectionProps {
  onNavigateToYourAI: () => void
  onNavigateToLessons: () => void
}

export function HomeSection({ onNavigateToYourAI, onNavigateToLessons }: HomeSectionProps) {
  const { currentStudent, authUser, isDarkMode, selectedLanguageId, token } = useAppStore()

  const [progress, setProgress] = useState<StudentProgressSummary | null>(null)
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)

  const refreshProgress = () => {
    fetchMyProgress()
      .then((data) => setProgress(data))
      .catch(() => {})
  }

  // Fetch real progress from GET /api/v1/progress/me
  useEffect(() => {
    let isMounted = true
    if (!token) return

    setIsLoadingProgress(true)
    fetchMyProgress()
      .then((data) => {
        if (isMounted) setProgress(data)
      })
      .catch((err) => {
        // Safe fallback — don't crash the dashboard if progress isn't initialized yet
        console.warn('Could not load student progress summary:', err?.message || err)
      })
      .finally(() => {
        if (isMounted) setIsLoadingProgress(false)
      })

    return () => {
      isMounted = false
    }
  }, [token])

  // Derive dynamic student identity from authenticated backend user
  const studentName = authUser?.username || currentStudent?.name || 'Student'
  const studentId = authUser ? `STU-2026-${String(authUser.id).padStart(2, '0')}` : currentStudent?.id || 'STU-2026-01'
  const activeLanguage = getLanguageById(selectedLanguageId) || getLanguageById('hi')

  // Derive student initials for the avatar
  const initials = studentName
    .split(/[ _-]/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST'

  return (
    <section id="home" className="w-full max-w-6xl mx-auto space-y-10 pt-4 pb-16">
      {/* ── Editorial Header / Welcome ── */}
      <div className="space-y-2 text-left">
        <span
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase border ${
            isDarkMode
              ? 'bg-white/[0.04] border-white/[0.08] text-cyan-400'
              : 'bg-[#FAFAF8] border-black/[0.05] text-cyan-700 shadow-subtle'
          }`}
        >
          STUDENT WORKSPACE
        </span>

        <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
          Welcome back, {studentName}.
        </h1>
        <p className={`text-sm sm:text-base ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
          Your multilingual learning space is active and calibrated to your cognitive level.
        </p>
      </div>

      {/* ── Premium Student Information & Profile Area ── */}
      <div
        className={`p-8 sm:p-10 rounded-3xl border text-left theme-transition ${
          isDarkMode
            ? 'bg-[#141418]/80 border-white/[0.08] shadow-2xl backdrop-blur-xl'
            : 'bg-[#FAFAF8] border-black/[0.06] shadow-editorial'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-black/[0.06] dark:border-white/[0.08]">
          {/* Profile Avatar & Primary Info */}
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/10 to-violet-500/20 border-2 border-cyan-400/40 flex items-center justify-center font-display text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-300 shadow-glow-cyan-subtle">
                {initials}
              </div>
              <div
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white border-2 border-[#FAFAF8] dark:border-[#141418]"
                title="Active Profile Verified"
              >
                <ShieldCheck size={14} />
              </div>
            </div>

            {/* Name and Designation */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
                  {studentName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  {authUser?.role ? authUser.role.toUpperCase() : 'STUDENT'}
                </span>
              </div>

              <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
                ID: <span className="font-mono text-[#171717] dark:text-[#F5F5F5] font-semibold">{studentId}</span>
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-[#737373]' : 'text-[#A3A39E]'}`}>
                Cohort 2026 · Vernacular AI Network · Verified Learner
              </p>
            </div>
          </div>

          {/* Calibrated Language Badge */}
          <div className="flex items-center gap-3 self-start md:self-auto px-4 py-2.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03]">
            <Globe size={18} className="text-cyan-500 shrink-0" />
            <div className="text-xs">
              <span className={`block font-bold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                {activeLanguage?.nativeName || 'हिन्दी'} ({activeLanguage?.name || 'Hindi'})
              </span>
              <span className={`text-[10px] ${isDarkMode ? 'text-[#737373]' : 'text-[#A3A39E]'}`}>
                Active Dialect Engine
              </span>
            </div>
          </div>
        </div>

        {/* ── Real Progress Metrics Ribbon (GET /api/v1/progress/me) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-b border-black/[0.06] dark:border-white/[0.08]">
          {/* Metric 1: Total XP */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
            <div className="flex items-center gap-2 text-amber-500 mb-1.5">
              <Flame size={16} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6A] dark:text-[#A3A39E]">
                Total XP
              </span>
            </div>
            <p className="font-display text-2xl font-black tracking-tight text-[#171717] dark:text-[#F5F5F5]">
              {isLoadingProgress ? '...' : `${progress?.total_xp ?? 0} XP`}
            </p>
          </div>

          {/* Metric 2: Lessons Completed */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
            <div className="flex items-center gap-2 text-cyan-500 mb-1.5">
              <BookOpen size={16} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6A] dark:text-[#A3A39E]">
                Lessons
              </span>
            </div>
            <p className="font-display text-2xl font-black tracking-tight text-[#171717] dark:text-[#F5F5F5]">
              {isLoadingProgress ? '...' : progress?.lessons_completed ?? 0}
            </p>
          </div>

          {/* Metric 3: Quizzes Completed */}
          <div
            onClick={() => setIsQuizOpen(true)}
            className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] hover:border-emerald-500/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 size={16} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6A] dark:text-[#A3A39E]">
                  Quizzes
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                Take Quiz ↗
              </span>
            </div>
            <p className="font-display text-2xl font-black tracking-tight text-[#171717] dark:text-[#F5F5F5]">
              {isLoadingProgress ? '...' : progress?.quizzes_completed ?? 0}
            </p>
          </div>

          {/* Metric 4: Quiz Average */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
            <div className="flex items-center gap-2 text-violet-500 mb-1.5">
              <TrendingUp size={16} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6A] dark:text-[#A3A39E]">
                Quiz Average
              </span>
            </div>
            <p className="font-display text-2xl font-black tracking-tight text-[#171717] dark:text-[#F5F5F5]">
              {isLoadingProgress
                ? '...'
                : progress?.average_quiz_percentage
                ? `${progress.average_quiz_percentage.toFixed(0)}%`
                : '—'}
            </p>
          </div>
        </div>

        {/* ── Quick Shortcut Action Tiles ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8">
          {/* Tile 1: Jump to YOUR AI */}
          <motion.div
            whileHover={{ y: -2 }}
            onClick={onNavigateToYourAI}
            className={`p-6 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
              isDarkMode
                ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] hover:border-cyan-400/30'
                : 'bg-white/70 hover:bg-white border-black/[0.05] hover:border-cyan-500/30 shadow-subtle'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                <Sparkles size={20} />
              </div>
              <ArrowRight size={16} className="text-[#A3A39E]" />
            </div>
            <h3 className="font-display text-lg font-bold tracking-tight mb-1">
              Ask YOUR AI
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
              Translate and understand any concept in your mother tongue with visual synthesis.
            </p>
          </motion.div>

          {/* Tile 2: Jump to LESSONS */}
          <motion.div
            whileHover={{ y: -2 }}
            onClick={onNavigateToLessons}
            className={`p-6 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
              isDarkMode
                ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] hover:border-violet-400/30'
                : 'bg-white/70 hover:bg-white border-black/[0.05] hover:border-violet-500/30 shadow-subtle'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
                <BookOpen size={20} />
              </div>
              <ArrowRight size={16} className="text-[#A3A39E]" />
            </div>
            <h3 className="font-display text-lg font-bold tracking-tight mb-1">
              Explore Lessons
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
              Interactive subject marquees across Physics, Math, Chemistry, and Languages.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Real AI Quiz Modal ── */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        topic="General Science & Vernacular Concepts"
        onQuizCompleted={refreshProgress}
      />
    </section>
  )
}
