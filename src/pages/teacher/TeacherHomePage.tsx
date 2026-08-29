import { motion } from 'framer-motion'
import {
  Users, BookOpen, TrendingUp, Activity, 
  ChevronRight, Calendar, Globe
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts'
import { PageHeader } from '../../components/common/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { GlowCard } from '../../components/ui/GlowCard'
import { Badge } from '../../components/ui/Badge'
import { useAppStore } from '../../store/useAppStore'
import { MOCK_STUDENTS, getAverageScore } from '../../data/mockStudents'
import { MOCK_CONTENT } from '../../data/mockContent'
import { staggerContainer, staggerItem, fadeUp } from '../../utils/animations'

// Mock chart data
const performanceData = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 68 },
  { name: 'Wed', score: 74 },
  { name: 'Thu', score: 72 },
  { name: 'Fri', score: 81 },
  { name: 'Sat', score: 85 },
  { name: 'Sun', score: 88 },
]

const languageDistribution = [
  { name: 'Hindi', students: 45, color: '#06b6d4' },
  { name: 'Tamil', students: 28, color: '#8b5cf6' },
  { name: 'Bengali', students: 15, color: '#10b981' },
  { name: 'Marathi', students: 10, color: '#f59e0b' },
]

export function TeacherHomePage() {
  const { currentTeacher } = useAppStore()
  const teacherName = currentTeacher?.name ?? 'Educator'

  const totalStudents = 124 // Mock total
  const activeStudents = 89
  const completedLessons = 342
  
  // Calculate average progress from mock students
  const avgScores = MOCK_STUDENTS.map(s => getAverageScore(s.id)).filter(s => s > 0)
  const averageProgress = Math.round(avgScores.reduce((a, b) => a + b, 0) / (avgScores.length || 1))

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-6"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          title={`Welcome back, ${teacherName}`}
          description="Here's what's happening in your classes today."
          action={
            <div className="flex gap-2">
              <Badge variant="cyan" dot>Live Sync</Badge>
            </div>
          }
        />
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={totalStudents}
          icon={<Users size={18} />}
          color="cyan"
          trend="up"
          trendValue="+12 this month"
        />
        <StatCard
          label="Active Today"
          value={activeStudents}
          icon={<Activity size={18} />}
          color="emerald"
        />
        <StatCard
          label="Completed Lessons"
          value={completedLessons}
          icon={<BookOpen size={18} />}
          color="violet"
          trend="up"
          trendValue="24 today"
        />
        <StatCard
          label="Avg. Progress"
          value={`${averageProgress}%`}
          icon={<TrendingUp size={18} />}
          color="amber"
          trend="up"
          trendValue="+5% vs last week"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <GlowCard padding="lg" glowColor="cyan" className="h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Class Performance</h3>
                <p className="text-sm text-slate-400">Average score progression over the last 7 days</p>
              </div>
              <select className="bg-surface-2/60 border border-white/10 rounded-lg text-sm text-slate-300 px-3 py-1.5 focus:outline-none focus:border-cyan-500/50">
                <option>Last 7 Days</option>
                <option>This Month</option>
                <option>This Semester</option>
              </select>
            </div>
            
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(6,182,212,0.3)', borderRadius: '8px' }}
                    itemStyle={{ color: '#cffafe' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#030712', stroke: '#06b6d4', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#06b6d4', stroke: '#030712' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlowCard>
        </motion.div>

        {/* Language Distribution */}
        <motion.div variants={staggerItem}>
          <GlowCard padding="lg" glowColor="violet" className="h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-white mb-1">Language Distribution</h3>
            <p className="text-sm text-slate-400 mb-6">Students per vernacular language</p>
            
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageDistribution} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 13 }}
                    width={70}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(139,92,246,0.3)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="students" radius={[0, 4, 4, 0]} barSize={24}>
                    {languageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlowCard>
        </motion.div>
      </div>

      {/* Recent Activity & Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={staggerItem} className="glass rounded-xl border border-white/8 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Recent Activity</h3>
            <button className="text-xs text-cyan-400 hover:text-cyan-300">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { text: "Aarav Sharma completed 'Animals Around Us'", time: "10 min ago", icon: <CheckCircle2 size={14} className="text-emerald-400" /> },
              { text: "Kavitha Rajan earned 50 XP in Tamil", time: "1 hour ago", icon: <Star size={14} className="text-amber-400" /> },
              { text: "New lesson 'Shapes' published to Hindi class", time: "2 hours ago", icon: <BookOpen size={14} className="text-cyan-400" /> },
            ].map((act, i) => (
              <div key={i} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                <div className="mt-0.5 p-1.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                  {act.icon}
                </div>
                <div>
                  <p className="text-sm text-slate-300">{act.text}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Calendar size={10} /> {act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="glass rounded-xl border border-white/8 p-5">
          <h3 className="font-bold text-white mb-4">Content Overview</h3>
          <div className="space-y-3">
            {MOCK_CONTENT.slice(0, 4).map(content => (
              <div key={content.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/5 text-slate-300 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-colors`}>
                    {content.type === 'lesson' ? <BookOpen size={16} /> : <Activity size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{content.titleKey}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Globe size={10} /> {content.languageId.toUpperCase()} · Grade {content.grade}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Temporary icon import fallback for the mock activity list
import { CheckCircle2, Star } from 'lucide-react'
