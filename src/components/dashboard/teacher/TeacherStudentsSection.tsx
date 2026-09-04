import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, Sparkles, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { fetchStudentsProgress } from '../../../services/teacherService'
import { ApiError } from '../../../services/apiClient'
import type { StudentProgressListItem } from '../../../types'

// ─── Local display shape (decoupled from both mock and backend schema) ─────────

interface StudentRow {
  /** Display key — backend student_id as string */
  id: string
  name: string
  quizAccuracy: number
  lessonsCompleted: number
  quizzesCompleted: number
  totalXp: number
}

function toStudentRow(item: StudentProgressListItem): StudentRow {
  return {
    id: String(item.student_id),
    name: item.username,
    quizAccuracy: Math.round(item.average_quiz_percentage),
    lessonsCompleted: item.lessons_completed,
    quizzesCompleted: item.quizzes_completed,
    totalXp: item.total_xp,
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TeacherStudentsSection() {
  const { isDarkMode, authUser, logout } = useAppStore()

  // ── Backend data state ──────────────────────────────────────────────────────
  const [students, setStudents] = useState<StudentRow[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isForbidden, setIsForbidden] = useState(false)

  // ── Local "Add Student Info" modal state (UI-only, no backend write) ────────
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [newName, setNewName] = useState('')
  const [newId, setNewId] = useState('')
  const [newMotherTongue, setNewMotherTongue] = useState('Hindi')
  const [newAccuracyPrimary, setNewAccuracyPrimary] = useState(90)
  const [newAccuracySecondary, setNewAccuracySecondary] = useState(82)

  // ── Fetch from backend ──────────────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setIsForbidden(false)

    try {
      const data = await fetchStudentsProgress()
      setStudents(data.students.map(toStudentRow))
      setTotalStudents(data.total_students)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          logout()
          return
        }
        if (err.status === 403) {
          setIsForbidden(true)
          return
        }
        setError(err.message || 'Failed to load student data.')
      } else {
        setError('Unexpected error loading students.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    if (authUser?.role === 'teacher') {
      loadStudents()
    }
  }, [authUser, loadStudents])

  // ── Add Student Info handler (local UI state only) ──────────────────────────
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newId.trim()) return

    const localRow: StudentRow = {
      id: newId.trim().toUpperCase(),
      name: newName.trim(),
      quizAccuracy: Number(newAccuracyPrimary),
      lessonsCompleted: 0,
      quizzesCompleted: 0,
      totalXp: 0,
    }

    setStudents((prev) => [...prev, localRow])
    setIsAddingStudent(false)
    setNewName('')
    setNewId('')
  }

  // ── Render: 403 Forbidden ───────────────────────────────────────────────────
  if (isForbidden) {
    return (
      <section id="students" className="w-full max-w-6xl mx-auto space-y-6 pt-4 pb-16 text-left">
        <div className="space-y-1">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase border ${
              isDarkMode
                ? 'bg-white/[0.04] border-white/[0.08] text-violet-400'
                : 'bg-white/70 border-black/[0.05] text-violet-700 shadow-subtle'
            }`}
          >
            COHORT ENROLLMENT &amp; METRICS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Your students
          </h2>
        </div>
        <div
          className={`flex items-center gap-3 p-5 rounded-2xl border ${
            isDarkMode
              ? 'bg-red-900/20 border-red-400/20 text-red-300'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-sm font-medium">
            Access denied. This section is only available to verified teachers.
          </p>
        </div>
      </section>
    )
  }

  // ── Render: Main ────────────────────────────────────────────────────────────
  return (
    <section id="students" className="w-full max-w-6xl mx-auto space-y-6 pt-4 pb-16 text-left">

      {/* ── Editorial Heading ── */}
      <div className="space-y-1">
        <span
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase border ${
            isDarkMode
              ? 'bg-white/[0.04] border-white/[0.08] text-violet-400'
              : 'bg-white/70 border-black/[0.05] text-violet-700 shadow-subtle'
          }`}
        >
          COHORT ENROLLMENT &amp; METRICS
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          Your students
        </h2>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
          {isLoading
            ? 'Loading student progress…'
            : error
            ? 'Could not load student data.'
            : `${totalStudents} registered student${totalStudents !== 1 ? 's' : ''} · real-time progress data`}
        </p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          className={`flex items-center justify-between gap-3 p-4 rounded-2xl border ${
            isDarkMode
              ? 'bg-amber-900/20 border-amber-400/20 text-amber-300'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="text-xs font-medium">{error}</span>
          </div>
          <button
            onClick={loadStudents}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isDarkMode
                ? 'border-amber-400/30 hover:bg-amber-400/10'
                : 'border-amber-300 hover:bg-amber-100'
            }`}
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* ── Premium Translucent Student Table Container ── */}
      <div
        className={`w-full rounded-3xl border theme-transition backdrop-blur-xl overflow-hidden ${
          isDarkMode
            ? 'bg-[#141418]/80 border-white/[0.08] shadow-2xl'
            : 'bg-white/75 border-black/[0.06] shadow-editorial'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">

            {/* Table Header */}
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08] text-[11px] uppercase tracking-wider font-semibold text-[#A3A39E]">
                <th className="py-4 px-6">STUDENT NAME</th>
                <th className="py-4 px-6">STUDENT ID</th>
                <th className="py-4 px-6">LESSONS</th>
                <th className="py-4 px-6">QUIZZES</th>
                <th className="py-4 px-6">AVG QUIZ SCORE</th>
                <th className="py-4 px-6">TOTAL XP</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-xs sm:text-sm">

              {/* Loading skeleton rows */}
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td className="py-4 px-6" colSpan={6}>
                      <div className="flex items-center gap-3">
                        <Loader2
                          size={14}
                          className="animate-spin text-[#A3A39E] shrink-0"
                        />
                        <div
                          className={`h-3 rounded-full animate-pulse ${
                            isDarkMode ? 'bg-white/[0.06]' : 'bg-black/[0.05]'
                          }`}
                          style={{ width: `${60 + (i % 3) * 15}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}

              {/* Real student rows */}
              {!isLoading &&
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  >
                    {/* Student Name */}
                    <td className="py-4 px-6 font-semibold text-[#171717] dark:text-[#F5F5F5]">
                      {student.name}
                    </td>

                    {/* Student ID */}
                    <td className="py-4 px-6 font-mono text-xs text-[#6F6F6A] dark:text-[#A3A39E]">
                      #{student.id}
                    </td>

                    {/* Lessons completed */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03]">
                        {student.lessonsCompleted}
                      </span>
                    </td>

                    {/* Quizzes completed */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03]">
                        {student.quizzesCompleted}
                      </span>
                    </td>

                    {/* Quiz accuracy progress bar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 min-w-[90px]">
                        <span className="font-mono text-xs font-bold text-[#171717] dark:text-[#F5F5F5]">
                          {student.quizAccuracy}%
                        </span>
                        {/* Thin elegant progress bar */}
                        <div className="w-12 h-1 bg-black/[0.06] dark:bg-white/[0.08] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${Math.min(100, student.quizAccuracy)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Total XP */}
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400">
                        {student.totalXp.toLocaleString()} XP
                      </span>
                    </td>
                  </tr>
                ))}

              {/* Empty state */}
              {!isLoading && !error && students.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 px-6 text-center text-xs text-[#A3A39E]"
                  >
                    No student activity recorded yet.
                  </td>
                </tr>
              )}

              {/* ── VERY LAST ROW: Add Student Info ── */}
              {!isLoading && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <button
                      onClick={() => setIsAddingStudent(true)}
                      className={`w-full py-4 px-6 flex items-center justify-center gap-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        isDarkMode
                          ? 'bg-white/[0.02] hover:bg-white/[0.05] text-cyan-400 border-t border-white/[0.06]'
                          : 'bg-black/[0.01] hover:bg-black/[0.03] text-cyan-700 border-t border-black/[0.05]'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-500">
                        <Plus size={13} />
                      </div>
                      <span>Add Student Info</span>
                    </button>
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>
      </div>

      {/* ── Add Student Info Modal ── */}
      <AnimatePresence>
        {isAddingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border text-left shadow-2xl backdrop-blur-2xl ${
                isDarkMode ? 'bg-[#141418] border-white/[0.08] text-[#F5F5F5]' : 'bg-[#FAFAF8] border-black/[0.08] text-[#171717]'
              }`}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-cyan-500" />
                  <h3 className="font-display text-base font-bold">Add Student Info</h3>
                </div>
                <button
                  onClick={() => setIsAddingStudent(false)}
                  className="p-1 rounded-lg text-[#A3A39E] hover:text-[#171717] dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddStudentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-[#6F6F6A] dark:text-[#A3A39E]">
                    Student Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Vikram Rathore"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.04] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#6F6F6A] dark:text-[#A3A39E]">
                    Student ID
                  </label>
                  <input
                    type="text"
                    required
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="e.g. STU-2026-07"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.04] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#6F6F6A] dark:text-[#A3A39E]">
                    Mother Tongue
                  </label>
                  <select
                    value={newMotherTongue}
                    onChange={(e) => setNewMotherTongue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.04] outline-none"
                  >
                    <option value="Kurukh">Kurukh (कुड़ुख)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                    <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                    <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                    <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold mb-1 text-[#6F6F6A] dark:text-[#A3A39E]">
                      Native Accuracy (%)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={newAccuracyPrimary}
                      onChange={(e) => setNewAccuracyPrimary(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.04] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[#6F6F6A] dark:text-[#A3A39E]">
                      English Accuracy (%)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={newAccuracySecondary}
                      onChange={(e) => setNewAccuracySecondary(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.04] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingStudent(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium border border-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] shadow-sm flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Save Student</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  )
}
