import { motion } from 'framer-motion'
import { Users, BookOpen, ArrowRight, ShieldCheck, School } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'

interface TeacherHomeSectionProps {
  onNavigateToStudents: () => void
  onNavigateToLessons: () => void
}

export function TeacherHomeSection({
  onNavigateToStudents,
  onNavigateToLessons,
}: TeacherHomeSectionProps) {
  const { currentTeacher, isDarkMode } = useAppStore()

  const teacherName = currentTeacher?.name || 'Dr. Priya Kulkarni'
  const teacherId = currentTeacher?.id || 'TCH-2026-09'
  const classNameAssigned = 'Class 8 — A'
  const schoolName = currentTeacher?.school || 'Vernacular Learning Academy'

  // Derive initials for avatar monogram
  const initials = teacherName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <section id="home" className="w-full max-w-6xl mx-auto space-y-10 pt-4 pb-16">
      
      {/* ── Editorial Header / Welcome ── */}
      <div className="space-y-2 text-left">
        <span
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase border ${
            isDarkMode
              ? 'bg-white/[0.04] border-white/[0.08] text-violet-400'
              : 'bg-white/70 border-black/[0.05] text-violet-700 shadow-subtle'
          }`}
        >
          TEACHER WORKSPACE
        </span>

        <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
          Welcome back.
        </h1>
        <p className={`text-sm sm:text-base ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
          Your multilingual teaching management environment is active.
        </p>
      </div>

      {/* ── Translucent Teacher Information & Class Overview Area ── */}
      <div
        className={`p-8 sm:p-10 rounded-3xl border text-left theme-transition backdrop-blur-xl ${
          isDarkMode
            ? 'bg-[#141418]/80 border-white/[0.08] shadow-2xl'
            : 'bg-white/70 border-black/[0.06] shadow-editorial'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-black/[0.06] dark:border-white/[0.08]">
          
          {/* Profile Monogram & Primary Info */}
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-cyan-500/20 border-2 border-violet-400/40 flex items-center justify-center font-display text-2xl sm:text-3xl font-bold text-violet-600 dark:text-violet-300 shadow-glow-cyan-subtle">
                {initials}
              </div>
              <div
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white border-2 border-white dark:border-[#141418]"
                title="Verified Educator"
              >
                <ShieldCheck size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
                  {teacherName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  Teacher
                </span>
              </div>

              <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
                ID: <span className="font-mono text-[#171717] dark:text-[#F5F5F5] font-semibold">{teacherId}</span>
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-[#737373]' : 'text-[#A3A39E]'}`}>
                {schoolName} · Vernacular Regional Education Portal
              </p>
            </div>
          </div>

          {/* Prominent Class Information */}
          <div className="flex items-center gap-4 self-start lg:self-auto px-5 py-3.5 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03]">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <School size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3A39E] block">
                ASSIGNED CLASS
              </span>
              <span className="font-display text-base font-bold text-[#171717] dark:text-[#F5F5F5]">
                {classNameAssigned}
              </span>
            </div>
          </div>

        </div>

        {/* ── Quick Shortcut Action Tiles ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8">
          
          {/* Tile 1: Jump to STUDENTS */}
          <motion.div
            whileHover={{ y: -2 }}
            onClick={onNavigateToStudents}
            className={`p-6 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
              isDarkMode
                ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] hover:border-cyan-400/30'
                : 'bg-white/60 hover:bg-white/90 border-black/[0.05] hover:border-cyan-500/30 shadow-subtle'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                <Users size={20} />
              </div>
              <ArrowRight size={16} className="text-[#A3A39E]" />
            </div>
            <h3 className="font-display text-lg font-bold tracking-tight mb-1">
              Class Roster & Accuracy
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
              View students enrolled in Class 8 — A, their native dialects, and multilingual comprehension metrics.
            </p>
          </motion.div>

          {/* Tile 2: Jump to LESSONS */}
          <motion.div
            whileHover={{ y: -2 }}
            onClick={onNavigateToLessons}
            className={`p-6 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
              isDarkMode
                ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] hover:border-violet-400/30'
                : 'bg-white/60 hover:bg-white/90 border-black/[0.05] hover:border-violet-500/30 shadow-subtle'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
                <BookOpen size={20} />
              </div>
              <ArrowRight size={16} className="text-[#A3A39E]" />
            </div>
            <h3 className="font-display text-lg font-bold tracking-tight mb-1">
              Curriculum & Lessons
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
              Feed educational info and review subject modules moving across regional languages.
            </p>
          </motion.div>

        </div>

      </div>

    </section>
  )
}
