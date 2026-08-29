import { motion } from 'framer-motion'
import { Home, Sparkles, BookOpen, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export type DashboardSectionId = 'home' | 'your-ai' | 'lessons'

interface StudentSidebarProps {
  isOpen: boolean
  onToggle: () => void
  activeSection: DashboardSectionId
  onSelectSection: (section: DashboardSectionId) => void
}

const NAV_ITEMS: { id: DashboardSectionId; label: string; icon: typeof Home; subtitle: string }[] = [
  { id: 'home', label: 'HOME', icon: Home, subtitle: 'Student Overview' },
  { id: 'your-ai', label: 'YOUR AI', icon: Sparkles, subtitle: 'Adaptive Learning Assistant' },
  { id: 'lessons', label: 'LESSONS', icon: BookOpen, subtitle: 'Multilingual Curriculum' },
]

export function StudentSidebar({
  isOpen,
  onToggle,
  activeSection,
  onSelectSection,
}: StudentSidebarProps) {
  const { isDarkMode } = useAppStore()

  return (
    <>
      {/* ── Mobile Backdrop overlay ── */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ── Sidebar Container ── */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 'min(340px, 85vw)' : '72px',
        }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between py-6 px-3 border-r theme-transition select-none backdrop-blur-2xl ${
          isDarkMode
            ? 'bg-[#0A0A0C]/90 border-white/[0.08] text-[#F5F5F5]'
            : 'bg-[#FAFAF8]/95 border-black/[0.06] text-[#171717] shadow-editorial'
        }`}
      >
        {/* ── Top Header & Hamburger Control ── */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2 pt-1">
            {isOpen ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="font-display font-bold text-sm tracking-tight whitespace-nowrap">
                  Vernacular AI
                </span>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
              </div>
            )}

            <button
              onClick={onToggle}
              className={`p-2 rounded-xl border theme-transition cursor-pointer ${
                isDarkMode
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#A3A39E] hover:text-white'
                  : 'bg-black/[0.03] hover:bg-black/[0.06] border-black/[0.06] text-[#6F6F6A] hover:text-[#171717]'
              }`}
              title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
              aria-label={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {isOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
            </button>
          </div>

          {/* ── Sidebar Navigation List (Exactly 3 items: HOME, YOUR AI, LESSONS) ── */}
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-left transition-all duration-200 cursor-pointer relative ${
                    isActive
                      ? isDarkMode
                        ? 'bg-white/[0.08] text-cyan-400 border border-cyan-400/30 shadow-glow-cyan-subtle'
                        : 'bg-white text-cyan-800 border border-cyan-400/40 shadow-subtle'
                      : isDarkMode
                      ? 'text-[#A3A39E] hover:bg-white/[0.04] hover:text-white border border-transparent'
                      : 'text-[#6F6F6A] hover:bg-black/[0.03] hover:text-[#171717] border border-transparent'
                  }`}
                  title={item.label}
                >
                  {/* Left Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-cyan-500"
                    />
                  )}

                  <div className="shrink-0 flex items-center justify-center">
                    <Icon size={19} className={isActive ? 'text-cyan-500' : ''} />
                  </div>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col min-w-0 overflow-hidden"
                    >
                      <span className="font-display text-xs font-bold tracking-wider">
                        {item.label}
                      </span>
                      <span className={`text-[10px] truncate ${isDarkMode ? 'text-[#737373]' : 'text-[#A3A39E]'}`}>
                        {item.subtitle}
                      </span>
                    </motion.div>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* ── Bottom Sidebar Toggle / Rail helper ── */}
        <div className="px-2 pt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
          {isOpen ? (
            <div className="flex items-center justify-between text-[11px] text-[#A3A39E]">
              <span>Student Workspace</span>
              <span className="text-[10px] font-semibold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <button
                onClick={onToggle}
                className="text-[#A3A39E] hover:text-cyan-500 p-1 cursor-pointer"
                title="Expand"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  )
}
