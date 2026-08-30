import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Atom, Calculator, FlaskConical, Dna, Languages, Cpu, Globe2, Compass, BookOpen, UploadCloud, X, Check } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'

interface TeacherSubjectItem {
  id: string
  name: string
  nativeName: string
  icon: React.ElementType
  chaptersCount: number
}

const ROW_1_SUBJECTS: TeacherSubjectItem[] = [
  { id: 'phy', name: 'Physics', nativeName: 'भौतिक विज्ञान', icon: Atom, chaptersCount: 14 },
  { id: 'math', name: 'Mathematics', nativeName: 'गणित', icon: Calculator, chaptersCount: 16 },
  { id: 'chem', name: 'Chemistry', nativeName: 'रसायन विज्ञान', icon: FlaskConical, chaptersCount: 12 },
  { id: 'hin', name: 'Hindi', nativeName: 'हिन्दी साहित्य', icon: Languages, chaptersCount: 18 },
  { id: 'bio', name: 'Biology', nativeName: 'जीव विज्ञान', icon: Dna, chaptersCount: 15 },
  { id: 'san', name: 'Sanskrit', nativeName: 'संस्कृतम्', icon: BookOpen, chaptersCount: 10 },
]

const ROW_2_SUBJECTS: TeacherSubjectItem[] = [
  { id: 'urd', name: 'Urdu', nativeName: 'اردو ادب', icon: Languages, chaptersCount: 12 },
  { id: 'eng', name: 'English Literature', nativeName: 'English', icon: BookOpen, chaptersCount: 15 },
  { id: 'cs', name: 'Computer Science', nativeName: 'संगणक विज्ञान', icon: Cpu, chaptersCount: 11 },
  { id: 'geo', name: 'Geography', nativeName: 'भूगोल', icon: Globe2, chaptersCount: 13 },
  { id: 'env', name: 'Environmental Science', nativeName: 'पर्यावरण विज्ञान', icon: Compass, chaptersCount: 9 },
  { id: 'chem2', name: 'Applied Chemistry', nativeName: 'प्रायोगिक रसायन', icon: FlaskConical, chaptersCount: 8 },
]

export function TeacherLessonsSection() {
  const { isDarkMode } = useAppStore()
  const [isRow1Paused, setIsRow1Paused] = useState(false)
  const [isRow2Paused, setIsRow2Paused] = useState(false)
  const [activeFeedingSubject, setActiveFeedingSubject] = useState<TeacherSubjectItem | null>(null)
  const [feedTopicTitle, setFeedTopicTitle] = useState('')
  const [feedContent, setFeedContent] = useState('')
  const [feedSaved, setFeedSaved] = useState(false)

  const handleSaveFeed = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedTopicTitle.trim()) return
    setFeedSaved(true)
    setTimeout(() => {
      setFeedSaved(false)
      setActiveFeedingSubject(null)
      setFeedTopicTitle('')
      setFeedContent('')
    }, 900)
  }

  return (
    <section id="lessons" className="w-full max-w-6xl mx-auto space-y-8 pt-4 pb-24 text-left">
      
      {/* ── Section Title ── */}
      <div className="space-y-1">
        <span
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase border ${
            isDarkMode
              ? 'bg-white/[0.04] border-white/[0.08] text-violet-400'
              : 'bg-white/70 border-black/[0.05] text-violet-700 shadow-subtle'
          }`}
        >
          CURRICULUM ARCHITECTURE
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
          LESSONS
        </h2>
        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
          Select any subject module below to feed localized pedagogical information and lesson materials.
        </p>
      </div>

      {/* ── Continuous Moving Subject Marquee Rows ── */}
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
            {/* Duplicated list for seamless infinite loop */}
            {[...ROW_1_SUBJECTS, ...ROW_1_SUBJECTS].map((subject, idx) => {
              const Icon = subject.icon
              return (
                <div
                  key={`${subject.id}-${idx}`}
                  onClick={() => setActiveFeedingSubject(subject)}
                  className={`group w-64 p-5 rounded-3xl border text-left shrink-0 transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-xl ${
                    isDarkMode
                      ? 'bg-[#141418]/85 hover:bg-[#1c1c22] border-white/[0.08] hover:border-violet-400/40 shadow-lg'
                      : 'bg-white/75 hover:bg-white border-black/[0.06] hover:border-violet-500/40 shadow-subtle hover:shadow-editorial'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-violet-600 dark:text-violet-400">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-mono text-[#A3A39E]">
                      {subject.chaptersCount} Modules
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                    {subject.nativeName}
                  </p>
                  <h3 className="font-display text-base font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5] mb-2">
                    {subject.name}
                  </h3>

                  {/* Subtle "Feed the info" secondary instruction */}
                  <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#A3A39E] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      Feed the info
                    </span>
                    <span className="text-[10px] text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      +
                    </span>
                  </div>
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
            {/* Duplicated list for seamless infinite loop */}
            {[...ROW_2_SUBJECTS, ...ROW_2_SUBJECTS].map((subject, idx) => {
              const Icon = subject.icon
              return (
                <div
                  key={`${subject.id}-${idx}`}
                  onClick={() => setActiveFeedingSubject(subject)}
                  className={`group w-64 p-5 rounded-3xl border text-left shrink-0 transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-xl ${
                    isDarkMode
                      ? 'bg-[#141418]/85 hover:bg-[#1c1c22] border-white/[0.08] hover:border-cyan-400/40 shadow-lg'
                      : 'bg-white/75 hover:bg-white border-black/[0.06] hover:border-cyan-500/40 shadow-subtle hover:shadow-editorial'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-cyan-600 dark:text-cyan-400">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-mono text-[#A3A39E]">
                      {subject.chaptersCount} Modules
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                    {subject.nativeName}
                  </p>
                  <h3 className="font-display text-base font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5] mb-2">
                    {subject.name}
                  </h3>

                  {/* Subtle "Feed the info" secondary instruction */}
                  <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#A3A39E] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      Feed the info
                    </span>
                    <span className="text-[10px] text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      +
                    </span>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>

      </div>

      {/* ── Feed the Info Modal ── */}
      <AnimatePresence>
        {activeFeedingSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border text-left shadow-2xl backdrop-blur-2xl ${
                isDarkMode ? 'bg-[#141418] border-white/[0.08] text-[#F5F5F5]' : 'bg-[#FAFAF8] border-black/[0.08] text-[#171717]'
              }`}
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 block">
                    CURRICULUM INGESTION
                  </span>
                  <h3 className="font-display text-lg font-bold">
                    Feed Info: {activeFeedingSubject.name} ({activeFeedingSubject.nativeName})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveFeedingSubject(null)}
                  className="p-1 rounded-lg text-[#A3A39E] hover:text-[#171717] dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {feedSaved ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                    <Check size={24} />
                  </div>
                  <p className="font-display text-sm font-bold">Curriculum Info Synchronized</p>
                  <p className="text-xs text-[#A3A39E]">
                    Available across student regional dialect synthesis pipelines.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveFeed} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-[#6F6F6A] dark:text-[#A3A39E]">
                      Chapter / Topic Title
                    </label>
                    <input
                      type="text"
                      required
                      value={feedTopicTitle}
                      onChange={(e) => setFeedTopicTitle(e.target.value)}
                      placeholder="e.g. Chapter 4: Electric Currents & Vernacular Analogies"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.04] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-[#6F6F6A] dark:text-[#A3A39E]">
                      Pedagogical Notes / Key Explanations
                    </label>
                    <textarea
                      rows={4}
                      value={feedContent}
                      onChange={(e) => setFeedContent(e.target.value)}
                      placeholder="Enter specific dialect nuances, examples, or vernacular memory tricks for Class 8..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-white/[0.04] outline-none resize-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl border border-dashed border-black/15 dark:border-white/15 flex items-center justify-center gap-2 text-center text-[#A3A39E] cursor-pointer hover:border-violet-500 transition-colors">
                    <UploadCloud size={16} />
                    <span>Attach PDF / Audio Notes (Optional)</span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveFeedingSubject(null)}
                      className="px-4 py-2 rounded-xl text-xs font-medium border border-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl text-xs font-medium bg-[#171717] dark:bg-white text-white dark:text-[#171717] shadow-sm flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>Feed Curriculum Info</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  )
}
