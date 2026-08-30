import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, BookOpen, Globe, Mic, Languages, BarChart3,
  GraduationCap, FileText, Users, X, Sparkles, Layers
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { ReactNode } from 'react'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const studentNav: NavItem[] = [
  { to: '/student/home',            label: 'Home',        icon: <Home size={18} />,       end: true },
  { to: '/student/language',        label: 'Language',    icon: <Globe size={18} /> },
  { to: '/student/education-level', label: 'Level',       icon: <Layers size={18} /> },
  { to: '/student/learn',           label: 'Learn',       icon: <BookOpen size={18} /> },
  { to: '/student/record',          label: 'Voice',       icon: <Mic size={18} /> },
  { to: '/student/translate',       label: 'Translate',   icon: <Languages size={18} /> },
]

const teacherNav: NavItem[] = [
  { to: '/teacher',            label: 'Dashboard',   icon: <Home size={18} />,       end: true },
  { to: '/teacher/content',    label: 'Content',     icon: <FileText size={18} /> },
  { to: '/teacher/students',   label: 'Students',    icon: <Users size={18} /> },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { selectedRole } = useAppStore()
  const nav = selectedRole === 'teacher' ? teacherNav : studentNav

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/8">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600">
          <Sparkles size={16} className="text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">VidyaVani</p>
          <p className="text-[10px] text-slate-500 mt-0.5">AI Learning Platform</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          {selectedRole === 'teacher' ? <GraduationCap size={11} /> : <BookOpen size={11} />}
          {selectedRole === 'teacher' ? 'Teacher Mode' : 'Student Mode'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto no-scrollbar" aria-label="Main navigation">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              ['sidebar-item', isActive ? 'active' : ''].filter(Boolean).join(' ')
            }
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Coming soon entries */}
      <div className="px-2 pb-2 mt-auto">
        {selectedRole === 'student' && (
          <div className="sidebar-item opacity-50 cursor-not-allowed" aria-disabled="true">
            <BarChart3 size={18} aria-hidden="true" />
            <span>Progress</span>
            <span className="ml-auto text-[9px] font-semibold bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          </div>
        )}
        {selectedRole === 'teacher' && (
          <div className="sidebar-item opacity-50 cursor-not-allowed" aria-disabled="true">
            <BarChart3 size={18} aria-hidden="true" />
            <span>Analytics</span>
            <span className="ml-auto text-[9px] font-semibold bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          </div>
        )}
      </div>

      {/* Bottom brand line */}
      <div className="px-4 py-4 border-t border-white/8">
        <p className="text-[10px] text-slate-700 text-center">SIH 2026 · Team VidyaVani</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 shrink-0 h-screen sticky top-0 surface-1 border-r border-white/6">
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 surface-1 border-r border-white/6 flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
