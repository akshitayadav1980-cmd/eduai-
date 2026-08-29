import { NavLink } from 'react-router-dom'
import { Home, BookOpen, Globe, Mic, Languages, FileText, Users } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { ReactNode } from 'react'

interface MobileNavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const studentItems: MobileNavItem[] = [
  { to: '/student',           label: 'Home',      icon: <Home size={20} />,     end: true },
  { to: '/student/learn',     label: 'Learn',     icon: <BookOpen size={20} /> },
  { to: '/student/record',    label: 'Voice',     icon: <Mic size={20} /> },
  { to: '/student/translate', label: 'Translate', icon: <Languages size={20} /> },
  { to: '/student/language',  label: 'Language',  icon: <Globe size={20} /> },
]

const teacherItems: MobileNavItem[] = [
  { to: '/teacher',           label: 'Dashboard', icon: <Home size={20} />,     end: true },
  { to: '/teacher/content',   label: 'Content',   icon: <FileText size={20} /> },
  { to: '/teacher/students',  label: 'Students',  icon: <Users size={20} /> },
]

export function MobileNav() {
  const { selectedRole } = useAppStore()
  const items = selectedRole === 'teacher' ? teacherItems : studentItems

  // Only render for student/teacher routes
  if (!selectedRole) return null

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 surface-1 border-t border-white/8"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors min-h-[56px]',
                isActive ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 hover:text-slate-300',
              ].join(' ')
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
