import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Check, Globe, Sparkles, ArrowRight } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { LANGUAGES, getLanguageById } from '../../data/languages'
import { useAppStore } from '../../store/useAppStore'
import { speechService } from '../../services/speech'
import { useExperienceScroll } from '../../components/cinematic/ScrollContext'
import type { Language } from '../../types'

const CONFIRMATION_MESSAGES: Record<string, string> = {
  hi: 'नमस्ते! अब मैं आपकी मातृभाषा में सीखने में आपकी पूरी मदद करूँगा।',
  en: 'Welcome! I will now guide your learning journey in English.',
  mr: 'नमस्कार! आता मी तुम्हाला तुमच्या मातृभाषेत शिकण्यास मदत करेन.',
  bn: 'নমস্কার! এখন আমি আপনার মাতৃভাষায় শেখার ক্ষেত্রে সম্পূর্ণ সাহায্য করব।',
  ta: 'வணக்கம்! இப்போது நான் உங்கள் தாய்மொழியில் கற்க முழுமையாக உதவுவேன்.',
  te: 'నమస్కారం! ఇప్పుడు నేను మీ మాతృభాషలో నేర్చుకోవడంలో మీకు సహాయం చేస్తాను.',
  kn: 'ನಮಸ್ಕಾರ! ಈಗ ನಾನು ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಕಲಿಯಲು ಸಂಪೂರ್ಣವಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.',
  ml: 'നമസ്കാരം! ഇനി നിങ്ങളുടെ മാതൃഭാഷയിൽ പഠിക്കാൻ ഞാൻ നിങ്ങളെ സഹായിക്കും.',
  gu: 'નમસ્તે! હવે હું તમને તમારી માતૃભાષામાં શીખવામાં સંપૂર્ણ મદદ કરીશ.',
  pa: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਹੁਣ ਮੈਂ ਤੁਹਾਡੀ ਮਾਤ੍ਰਭਾਸ਼ਾ ਵਿੱਚ ਸਿੱਖਣ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰਾਂਗਾ।',
  or: 'ନମସ୍କାର! ଏବେ ମୁଁ ଆପଣଙ୍କ ମାତୃଭାଷାରେ ଶିଖିବାରେ ସାହାଯ୍ୟ କରିବି।',
}

export function LanguageScene() {
  const { progress } = useExperienceScroll()
  const { selectedLanguageId, setSelectedLanguageId, setAssistantState } = useAppStore()

  let opacity = 0
  if (progress >= 0.24 && progress <= 0.56) {
    if (progress < 0.34) {
      opacity = (progress - 0.24) / 0.10
    } else if (progress > 0.46) {
      opacity = 1 - (progress - 0.46) / 0.10
    } else {
      opacity = 1
    }
  }

  const selectedLang = getLanguageById(selectedLanguageId)
  const confirmationText = selectedLang
    ? (CONFIRMATION_MESSAGES[selectedLang.id] ?? `Selected ${selectedLang.name}.`)
    : null

  const handleSelect = (lang: Language) => {
    setSelectedLanguageId(lang.id)
    setAssistantState({ mode: 'success', message: `Selected ${lang.name}` })
    setTimeout(() => {
      setAssistantState({ mode: 'idle', message: null })
    }, 1500)
  }

  const handlePronounce = (e: React.MouseEvent, lang: Language) => {
    e.stopPropagation()
    speechService.speak(lang.nativeName, lang.locale)
  }

  const handleNextSection = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({
      top: 0.56 * scrollHeight,
      behavior: 'smooth',
    })
  }

  return (
    <section
      style={{ opacity }}
      className={`min-h-screen w-full flex flex-col items-center justify-center px-6 sm:px-12 py-12 text-center transition-opacity duration-300 ${
        opacity > 0.05 ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-2xl shadow-xl">
            <Globe size={14} className="text-cyan-400" />
            <span>Regional Language Intelligence</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            What language feels natural to you?
          </h2>
          <p className="font-serif text-base sm:text-lg text-white/70 max-w-md mx-auto">
            Choose your mother tongue. The AI recalibrates its syntax and vocabulary in real-time.
          </p>
        </div>

        {/* Floating Language Tiles */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4 max-w-3xl mx-auto pt-2"
          role="radiogroup"
          aria-label="Select your mother tongue"
        >
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguageId === lang.id

            return (
              <GlassCard
                key={lang.id}
                variant={isSelected ? 'highlighted' : 'interactive'}
                padding="md"
                onClick={() => handleSelect(lang)}
                className={`relative flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 bg-[#121622]/90 border-cyan-400/60 shadow-glow-cyan-subtle scale-[1.03] z-10'
                    : 'bg-[#0e1014]/70 border-white/10 hover:bg-[#151821]/80 hover:border-cyan-400/40'
                }`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(lang)
                  }
                }}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center text-black shadow-md font-bold"
                  >
                    <Check size={12} strokeWidth={3} />
                  </motion.div>
                )}

                <span className={`text-2xl sm:text-3xl font-black mb-1 tracking-tight ${isSelected ? 'text-white' : 'text-white/90'}`}>
                  {lang.nativeName}
                </span>

                <span className={`text-xs sm:text-sm font-medium ${isSelected ? 'text-cyan-300 font-semibold' : 'text-white/60'}`}>
                  {lang.name}
                </span>

                <button
                  type="button"
                  onClick={(e) => handlePronounce(e, lang)}
                  aria-label={`Hear ${lang.name} pronunciation`}
                  title={`Pronounce ${lang.nativeName}`}
                  className="mt-2.5 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                >
                  <Volume2 size={13} />
                </button>
              </GlassCard>
            )
          })}
        </div>

        {/* Localized Confirmation Strip */}
        <div className="min-h-[46px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {confirmationText && (
              <motion.div
                key={selectedLanguageId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0e1014]/90 border border-cyan-400/40 text-xs sm:text-sm text-white backdrop-blur-2xl shadow-2xl"
              >
                <Sparkles size={14} className="text-cyan-400 shrink-0" />
                <span>{confirmationText}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Next Step */}
        <div>
          <Button
            variant="primary"
            size="md"
            onClick={handleNextSection}
            icon={<ArrowRight size={16} />}
            iconPosition="right"
          >
            Calibrate Education Depth
          </Button>
        </div>
      </div>
    </section>
  )
}
