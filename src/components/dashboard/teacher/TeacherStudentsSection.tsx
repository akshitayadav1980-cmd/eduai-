import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, Sparkles } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'

interface StudentRecord {
  id: string
  name: string
  motherTongue: string
  motherTongueScript?: string
  accuracies: {
    language: string
    percentage: number
  }[]
}

const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'STU-2026-01',
    name: 'Aarav Sharma',
    motherTongue: 'Hindi',
    motherTongueScript: 'हिन्दी',
    accuracies: [
      { language: 'Hindi', percentage: 94 },
      { language: 'English', percentage: 88 },
      { language: 'Marathi', percentage: 78 },
    ],
  },
  {
    id: 'STU-2026-02',
    name: 'Pooja Soren',
    motherTongue: 'Kurukh',
    motherTongueScript: 'कुड़ुख',
    accuracies: [
      { language: 'Kurukh', percentage: 96 },
      { language: 'Hindi', percentage: 86 },
      { language: 'English', percentage: 80 },
    ],
  },
  {
    id: 'STU-2026-03',
    name: 'Rohan Deshmukh',
    motherTongue: 'Marathi',
    motherTongueScript: 'मराठी',
    accuracies: [
      { language: 'Marathi', percentage: 92 },
      { language: 'Hindi', percentage: 90 },
      { language: 'English', percentage: 84 },
    ],
  },
  {
    id: 'STU-2026-04',
    name: 'Ananya Mukhopadhyay',
    motherTongue: 'Bengali',
    motherTongueScript: 'বাংলা',
    accuracies: [
      { language: 'Bengali', percentage: 95 },
      { language: 'Hindi', percentage: 82 },
      { language: 'English', percentage: 90 },
    ],
  },
  {
    id: 'STU-2026-05',
    name: 'Karthik Subramanian',
    motherTongue: 'Tamil',
    motherTongueScript: 'தமிழ்',
    accuracies: [
      { language: 'Tamil', percentage: 97 },
      { language: 'English', percentage: 91 },
      { language: 'Hindi', percentage: 76 },
    ],
  },
  {
    id: 'STU-2026-06',
    name: 'Jaspreet Kaur',
    motherTongue: 'Punjabi',
    motherTongueScript: 'ਪੰਜਾਬੀ',
    accuracies: [
      { language: 'Punjabi', percentage: 93 },
      { language: 'Hindi', percentage: 89 },
      { language: 'English', percentage: 85 },
    ],
  },
]

export function TeacherStudentsSection() {
  const { isDarkMode } = useAppStore()
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS)

  // Add Student Modal / Form state
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [newName, setNewName] = useState('')
  const [newId, setNewId] = useState('')
  const [newMotherTongue, setNewMotherTongue] = useState('Hindi')
  const [newAccuracyPrimary, setNewAccuracyPrimary] = useState(90)
  const [newAccuracySecondary, setNewAccuracySecondary] = useState(82)

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newId.trim()) return

    const newStudentItem: StudentRecord = {
      id: newId.trim().toUpperCase(),
      name: newName.trim(),
      motherTongue: newMotherTongue,
      accuracies: [
        { language: newMotherTongue, percentage: Number(newAccuracyPrimary) },
        { language: 'English', percentage: Number(newAccuracySecondary) },
        { language: 'Hindi', percentage: 80 },
      ],
    }

    setStudents((prev) => [...prev, newStudentItem])
    setIsAddingStudent(false)
    setNewName('')
    setNewId('')
  }

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
          COHORT ENROLLMENT & METRICS
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          Your students
        </h2>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
          Multilingual performance benchmarks across Class 8 — A.
        </p>
      </div>

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
                <th className="py-4 px-6">MOTHER TONGUE</th>
                <th className="py-4 px-6">ACCURACY</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] text-xs sm:text-sm">
              {students.map((student) => (
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
                    {student.id}
                  </td>

                  {/* Mother Tongue */}
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03]">
                      <span className="font-semibold">{student.motherTongue}</span>
                      {student.motherTongueScript && (
                        <span className="text-[11px] text-[#A3A39E]">
                          ({student.motherTongueScript})
                        </span>
                      )}
                    </span>
                  </td>

                  {/* Accuracy in Common Supported Languages */}
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap items-center gap-4">
                      {student.accuracies.map((acc) => (
                        <div key={acc.language} className="flex items-center gap-2 min-w-[90px]">
                          <span className="text-[11px] text-[#6F6F6A] dark:text-[#A3A39E]">
                            {acc.language}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#171717] dark:text-[#F5F5F5]">
                            {acc.percentage}%
                          </span>
                          {/* Thin elegant progress bar */}
                          <div className="w-12 h-1 bg-black/[0.06] dark:bg-white/[0.08] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${acc.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}

              {/* ── VERY LAST ROW: Add Student Info ── */}
              <tr>
                <td colSpan={4} className="p-0">
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
