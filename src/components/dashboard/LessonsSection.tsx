import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Atom, Calculator, FlaskConical, Dna, Languages, Cpu, Globe2, Compass } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

interface SubjectItem {
  id: string
  name: string
  nativeName: string
  icon: React.ElementType
  chaptersCount: number
  color: string
}

const ROW_1_SUBJECTS: SubjectItem[] = [
  { id: 'phy', name: 'Physics', nativeName: 'भौतिक विज्ञान', icon: Atom, chaptersCount: 14, color: 'cyan' },
  { id: 'math', name: 'Mathematics', nativeName: 'गणित', icon: Calculator, chaptersCount: 16, color: 'indigo' },
  { id: 'chem', name: 'Chemistry', nativeName: 'रसायन विज्ञान', icon: FlaskConical, chaptersCount: 12, color: 'violet' },
  { id: 'hin', name: 'Hindi', nativeName: 'हिन्दी साहित्य', icon: Languages, chaptersCount: 18, color: 'amber' },
  { id: 'bio', name: 'Biology', nativeName: 'जीव विज्ञान', icon: Dna, chaptersCount: 15, color: 'emerald' },
  { id: 'san', name: 'Sanskrit', nativeName: 'संस्कृतम्', icon: BookOpen, chaptersCount: 10, color: 'rose' },
]

const ROW_2_SUBJECTS: SubjectItem[] = [
  { id: 'urd', name: 'Urdu', nativeName: 'اردو ادب', icon: Languages, chaptersCount: 12, color: 'emerald' },
  { id: 'eng', name: 'English Literature', nativeName: 'English', icon: BookOpen, chaptersCount: 15, color: 'blue' },
  { id: 'cs', name: 'Computer Science', nativeName: 'संगणक विज्ञान', icon: Cpu, chaptersCount: 11, color: 'cyan' },
  { id: 'geo', name: 'Geography', nativeName: 'भूगोल', icon: Globe2, chaptersCount: 13, color: 'amber' },
  { id: 'env', name: 'Environmental Science', nativeName: 'पर्यावरण विज्ञान', icon: Compass, chaptersCount: 9, color: 'teal' },
  { id: 'chem2', name: 'Applied Chemistry', nativeName: 'प्रायोगिक रसायन', icon: FlaskConical, chaptersCount: 8, color: 'violet' },
]

export function LessonsSection() {
  const { isDarkMode } = useAppStore()
  const [isRow1Paused, setIsRow1Paused] = useState(false)
  const [isRow2Paused, setIsRow2Paused] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null)

  return (
    <section id="lessons" className="w-full max-w-6xl mx-auto space-y-8 pt-4 pb-24 text-left">
      
      {/* ── Section Title ── */}
      <div className="space-y-1">
        <span
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase border ${
            isDarkMode
              ? 'bg-white/[0.04] border-white/[0.08] text-cyan-400'
              : 'bg-[#FAFAF8] border-black/[0.05] text-cyan-700 shadow-subtle'
          }`}
        >
          CURRICULUM ARCHITECTURE
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          LESSONS
        </h2>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
          Multilingual subject modules with level-appropriate vernacular translations.
        </p>
      </div>

      {/* ── Selected Subject Detail Ribbon ── */}
      {selectedSubject && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-2xl border flex items-center justify-between gap-4 theme-transition ${
            isDarkMode ? 'bg-cyan-500/10 border-cyan-400/30' : 'bg-cyan-50/80 border-cyan-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500 text-white font-bold">
              <selectedSubject.icon size={20} />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">
                {selectedSubject.name} ({selectedSubject.nativeName})
              </p>
              <p className="text-xs text-[#6F6F6A] dark:text-[#A3A39E]">
                {selectedSubject.chaptersCount} chapters available in your active regional dialect.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedSubject(null)}
            className="text-xs text-[#A3A39E] hover:text-cyan-500 cursor-pointer"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* ── Continuous Moving Subject Marquee Container ── */}
      <div className="space-y-6 overflow-hidden py-4">
        
        {/* ── ROW 1: Moves RIGHT -> LEFT ── */}
        <div
          className="relative w-full overflow-hidden"
          onMouseEnter={() => setIsRow1Paused(true)}
          onMouseLeave={() => setIsRow1Paused(false)}
          onTouchStart={() => setIsRow1Paused(true)}
          onTouchEnd={() => setIsRow1Paused(false)}
        >
          <motion.div
            animate={{
              x: isRow1Paused ? undefined : ['0%', '-50%'],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 28,
                ease: 'linear',
              },
            }}
            className="flex gap-4 w-max cursor-grab active:cursor-grabbing"
          >
            {/* Duplicated list to create seamless infinite loop */}
            {[...ROW_1_SUBJECTS, ...ROW_1_SUBJECTS].map((subject, idx) => {
              const Icon = subject.icon
              return (
                <div
                  key={`${subject.id}-${idx}`}
                  onClick={() => setSelectedSubject(subject)}
                  className={`w-64 p-5 rounded-3xl border text-left shrink-0 transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#141418]/90 hover:bg-[#1c1c22] border-white/[0.08] hover:border-cyan-400/40 shadow-lg'
                      : 'bg-[#FAFAF8] hover:bg-white border-black/[0.06] hover:border-cyan-500/40 shadow-subtle hover:shadow-editorial'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-cyan-600 dark:text-cyan-400">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-mono text-[#A3A39E]">
                      {subject.chaptersCount} Ch.
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                    {subject.nativeName}
                  </p>
                  <h3 className="font-display text-base font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
                    {subject.name}
                  </h3>
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* ── ROW 2: Moves LEFT -> RIGHT ── */}
        <div
          className="relative w-full overflow-hidden"
          onMouseEnter={() => setIsRow2Paused(true)}
          onMouseLeave={() => setIsRow2Paused(false)}
          onTouchStart={() => setIsRow2Paused(true)}
          onTouchEnd={() => setIsRow2Paused(false)}
        >
          <motion.div
            animate={{
              x: isRow2Paused ? undefined : ['-50%', '0%'],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 32,
                ease: 'linear',
              },
            }}
            className="flex gap-4 w-max cursor-grab active:cursor-grabbing"
          >
            {/* Duplicated list to create seamless infinite loop */}
            {[...ROW_2_SUBJECTS, ...ROW_2_SUBJECTS].map((subject, idx) => {
              const Icon = subject.icon
              return (
                <div
                  key={`${subject.id}-${idx}`}
                  onClick={() => setSelectedSubject(subject)}
                  className={`w-64 p-5 rounded-3xl border text-left shrink-0 transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#141418]/90 hover:bg-[#1c1c22] border-white/[0.08] hover:border-violet-400/40 shadow-lg'
                      : 'bg-[#FAFAF8] hover:bg-white border-black/[0.06] hover:border-violet-500/40 shadow-subtle hover:shadow-editorial'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-violet-600 dark:text-violet-400">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-mono text-[#A3A39E]">
                      {subject.chaptersCount} Ch.
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                    {subject.nativeName}
                  </p>
                  <h3 className="font-display text-base font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
                    {subject.name}
                  </h3>
                </div>
              )
            })}
          </motion.div>
        </div>

      </div>

    </section>
  )
}
