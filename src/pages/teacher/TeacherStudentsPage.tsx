import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, MoreHorizontal, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Avatar } from '../../components/ui/Avatar'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { MOCK_STUDENTS, getAverageScore } from '../../data/mockStudents'
import { LANGUAGES } from '../../data/languages'
import { fadeUp, staggerContainer } from '../../utils/animations'

export function TeacherStudentsPage() {
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')

  const languageOptions = [{ value: 'all', label: 'All Languages' }, ...LANGUAGES.map(l => ({ value: l.id, label: l.name }))]

  const filteredStudents = MOCK_STUDENTS.map(student => {
    const score = getAverageScore(student.id)
    return { ...student, averageScore: score }
  }).filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchLang = langFilter === 'all' || s.languageId === langFilter
    return matchSearch && matchLang
  }).sort((a, b) => b.averageScore - a.averageScore)

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-6"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Students Directory"
          description="Monitor progress and performance across all your language classes."
        />
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="glass rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search by student name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={16} />}
            aria-label="Search students"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select 
            options={languageOptions} 
            value={langFilter} 
            onChange={(e) => setLangFilter(e.target.value)}
            prefix={<Filter size={14} className="opacity-70" />}
            aria-label="Filter by language"
          />
        </div>
      </motion.div>

      {/* Students Table / List */}
      <motion.div variants={fadeUp} className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-surface-2/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Student</th>
                <th className="p-4">Language</th>
                <th className="p-4">Grade</th>
                <th className="p-4 min-w-[200px]">Average Progress</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((student, i) => (
                <motion.tr 
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size="sm" className="ring-1 ring-white/10" />
                      <div>
                        <p className="text-sm font-bold text-white">{student.name}</p>
                        <p className="text-xs text-slate-500">ID: {student.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 uppercase tracking-wider">
                      {student.languageId}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-300">{student.grade}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Score</span>
                        <span className="font-semibold text-white">{student.averageScore}%</span>
                      </div>
                      <ProgressBar 
                        value={student.averageScore} 
                        size="sm" 
                        color={student.averageScore > 80 ? 'emerald' : student.averageScore > 50 ? 'cyan' : 'amber'} 
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    {student.averageScore > 80 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={12} /> Excellent</span>
                    ) : student.averageScore > 50 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-cyan-400"><TrendingUp size={12} /> On Track</span>
                    ) : student.averageScore > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400"><AlertCircle size={12} /> Needs Help</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">New</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors" aria-label={`Manage ${student.name}`}>
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
