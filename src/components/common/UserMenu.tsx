import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Settings, ChevronDown, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { useAppStore } from '../../store/useAppStore'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { currentStudent, currentTeacher, selectedRole, reset } = useAppStore()

  const name = currentStudent?.name ?? currentTeacher?.name ?? 'Guest'
  const role = selectedRole === 'student' ? 'Student' : selectedRole === 'teacher' ? 'Teacher' : 'Visitor'

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    reset()
    navigate('/')
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5 transition-colors"
        aria-label="User menu"
        aria-expanded={open}
      >
        <Avatar name={name} size="sm" />
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-white leading-none">{name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{role}</p>
        </div>
        <ChevronDown
          size={14}
          className={`hidden md:block text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 glass rounded-xl border border-white/10 shadow-glass z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-sm font-semibold text-white">{name}</p>
              <p className="text-xs text-slate-500">{role}</p>
            </div>

            {/* Items */}
            <div className="p-1.5">
              <MenuItem icon={<User size={14} />} label="Profile" onClick={() => setOpen(false)} />
              <MenuItem icon={<Settings size={14} />} label="Settings" onClick={() => setOpen(false)} />
              <div className="my-1 h-px bg-white/8" />
              <MenuItem
                icon={<LogOut size={14} />}
                label="Switch Role"
                onClick={handleLogout}
                danger
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
        danger
          ? 'text-rose-400 hover:bg-rose-500/10'
          : 'text-slate-300 hover:text-white hover:bg-white/6',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}
