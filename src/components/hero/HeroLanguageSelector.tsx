import { motion } from 'framer-motion'
import { LANGUAGES } from '../../data/languages'
import { useAppStore } from '../../store/useAppStore'
import { speechService } from '../../services/speech'
import type { Language } from '../../types'

interface HeroLanguageSelectorProps {
  onLanguageSelect?: (lang: Language) => void
  className?: string
}

export function HeroLanguageSelector({ onLanguageSelect, className = '' }: HeroLanguageSelectorProps) {
  const { selectedLanguageId, setSelectedLanguageId, voiceEnabled, setAssistantState } = useAppStore()

  const handleSelect = (lang: Language) => {
    setSelectedLanguageId(lang.id)
    onLanguageSelect?.(lang)

    if (voiceEnabled) {
      setAssistantState({ mode: 'speaking', message: lang.nativeName })
      speechService.speak(lang.nativeName, lang.locale).finally(() => {
        setAssistantState({ mode: 'idle', message: null })
      })
    }
  }

  return (
    <div className={`w-full flex flex-col items-center gap-3 ${className}`}>
      {/* Visual Subtitle */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Select Mother Tongue
        </span>
        <div className="h-px w-8 bg-white/10" />
      </div>

      {/* Glass Language Chips Strip */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-3xl mx-auto px-2"
        role="radiogroup"
        aria-label="Select platform language"
      >
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguageId === lang.id

          return (
            <motion.button
              key={lang.id}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(lang)}
              className={[
                'group relative flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer backdrop-blur-xl select-none',
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-violet-500/20 text-cyan-200 border border-cyan-400/50 shadow-glow-cyan font-semibold'
                  : 'bg-white/[0.035] hover:bg-white/[0.07] text-slate-300 hover:text-white border border-white/[0.07] hover:border-white/[0.16]',
              ].join(' ')}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
            >
              {/* Native Script text */}
              <span className={isSelected ? 'text-cyan-300' : 'text-white'}>
                {lang.nativeName}
              </span>

              {/* English name (subtle) */}
              <span className="text-[11px] text-slate-500 group-hover:text-slate-400 font-normal">
                {lang.name}
              </span>

              {/* Active selection dot */}
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan animate-pulse ml-0.5" />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
