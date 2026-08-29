import { Menu, Bell, Sparkles, Volume2, VolumeX, Sun, Moon } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { Tooltip } from '../ui/Tooltip'
import { UserMenu } from './UserMenu'
import { useAppStore } from '../../store/useAppStore'
import { getLanguageById } from '../../data/languages'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { selectedLanguageId, educationLevel, assistantState, voiceEnabled, setVoiceEnabled, isDarkMode, setIsDarkMode } = useAppStore()
  const lang = getLanguageById(selectedLanguageId)

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 surface-1 border-b border-white/6 backdrop-blur-md">
      {/* Mobile hamburger */}
      <Tooltip content="Open menu" placement="bottom">
        <IconButton
          label="Open navigation"
          variant="ghost"
          size="md"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu size={20} />
        </IconButton>
      </Tooltip>

      {/* AI assistant status indicator */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/8 text-xs">
        <span
          className={[
            'h-1.5 w-1.5 rounded-full',
            assistantState.mode === 'idle' ? 'bg-slate-600' :
            assistantState.mode === 'listening' ? 'bg-emerald-400 animate-pulse' :
            assistantState.mode === 'speaking' ? 'bg-cyan-400 animate-pulse' :
            'bg-violet-400 animate-pulse',
          ].join(' ')}
          aria-hidden="true"
        />
        <Sparkles size={11} className="text-slate-500" aria-hidden="true" />
        <span className="text-slate-500">
          AI {assistantState.mode === 'idle' ? 'Ready' : assistantState.mode}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Language & Depth indicator */}
      {lang && (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg glass border border-white/8 text-xs">
          <span className="font-semibold text-cyan-400">{lang.nativeName}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 capitalize">{educationLevel.replace('_', ' ')}</span>
        </div>
      )}

      {/* Voice toggle */}
      <Tooltip content={voiceEnabled ? 'Voice On' : 'Voice Off'} placement="bottom">
        <IconButton
          label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          variant="ghost"
          size="md"
          onClick={() => setVoiceEnabled(!voiceEnabled)}
        >
          {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-slate-600" />}
        </IconButton>
      </Tooltip>

      {/* Theme toggle */}
      <Tooltip content={isDarkMode ? 'Light mode' : 'Dark mode'} placement="bottom">
        <IconButton
          label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          variant="ghost"
          size="md"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>
      </Tooltip>

      {/* Notifications */}
      <Tooltip content="Notifications" placement="bottom">
        <IconButton label="Notifications" variant="ghost" size="md">
          <Bell size={18} />
        </IconButton>
      </Tooltip>

      {/* User menu */}
      <UserMenu />
    </header>
  )
}
