import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Volume2, ArrowRight, Globe, Sparkles, ChevronLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { CinematicBackground } from '../../components/background/CinematicBackground'
import { SceneCanvas } from '../../components/3d/SceneCanvas'
import { useAppStore } from '../../store/useAppStore'
import { LANGUAGES, getLanguageById } from '../../data/languages'
import { speechService } from '../../services/speech'
import { staggerContainer, fadeUp } from '../../utils/animations'
import type { Language } from '../../types'

// Localized welcome confirmation messages
const CONFIRMATION_MESSAGES: Record<string, string> = {
  hi: 'नमस्ते! अब मैं आपकी मातृभाषा में सीखने में आपकी पूरी मदद करूँगा।',
  en: 'Welcome! I will now guide your learning in English.',
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

export function StudentLanguagePage() {
  const navigate = useNavigate()
  const {
    selectedLanguageId,
    setSelectedLanguageId,
    setAssistantState,
    assistantState,
  } = useAppStore()

  const [selectedLang, setSelectedLang] = useState<Language | undefined>(
    () => getLanguageById(selectedLanguageId)
  )

  const handleSelectLanguage = (lang: Language) => {
    setSelectedLang(lang)
    setSelectedLanguageId(lang.id)

    // Trigger subtle AI Core confirmation pulse
    setAssistantState({ mode: 'success', message: `Selected ${lang.name}` })
    setTimeout(() => {
      setAssistantState({ mode: 'idle', message: null })
    }, 1500)
  }

  const handlePronounce = (e: React.MouseEvent, lang: Language) => {
    e.stopPropagation()
    speechService.speak(lang.nativeName, lang.locale)
  }

  const handleContinue = () => {
    if (!selectedLanguageId) return
    navigate('/student/education-level')
  }

  const confirmationText = selectedLang
    ? (CONFIRMATION_MESSAGES[selectedLang.id] ?? `Selected ${selectedLang.name}. Ready to proceed.`)
    : null

  return (
    <div className="relative min-h-screen bg-[#05070B] text-slate-100 flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* ── Global Cinematic Background System ── */}
      <CinematicBackground showParticles showGlow showGrid />

      {/* ── 3D Scene Layer (Subtle Center AI Presence) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 sm:opacity-50" aria-hidden="true">
        <SceneCanvas
          state={assistantState.mode}
          showFloatingElements={false}
          showOrbitalParticles={true}
          showAmbientParticles={false}
          cameraPosition={[0, 0, 7.5]}
        />
      </div>

      {/* ── Top Header Navigation ── */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          Back to Home
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cinema-900/80 border border-white/[0.08] text-xs text-slate-400 backdrop-blur-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Step 1 of 2 · Language</span>
        </div>
      </div>

      {/* ── Main Onboarding Container ── */}
      <main className="relative z-10 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center my-6">
        
        {/* Step Heading */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center max-w-xl mx-auto mb-8 space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold uppercase tracking-wider shadow-glass-subtle mb-1">
            <Globe size={13} className="text-cyan-400" />
            Vernacular AI Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Choose your language
          </h1>
          <p className="text-body sm:text-base text-slate-400 text-balance">
            "Let's learn in a language that feels natural to you."
          </p>
        </motion.div>

        {/* Language Cards Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 w-full mb-6"
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
                onClick={() => handleSelectLanguage(lang)}
                className={`relative flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-cyan-400 shadow-glow-cyan' : ''
                }`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectLanguage(lang)
                  }
                }}
              >
                {/* Active check badge */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-cinema-950 shadow-glow-subtle font-bold"
                  >
                    <Check size={12} strokeWidth={3.5} />
                  </motion.div>
                )}

                {/* Native Script Display */}
                <span className={`text-2xl sm:text-3xl font-extrabold mb-1 tracking-tight ${isSelected ? 'text-cyan-200' : 'text-white'}`}>
                  {lang.nativeName}
                </span>

                {/* English name and script badge */}
                <span className={`text-xs sm:text-sm font-medium ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {lang.name}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{lang.script}</span>

                {/* Explicit Audio Pronunciation Button */}
                <button
                  type="button"
                  onClick={(e) => handlePronounce(e, lang)}
                  aria-label={`Play ${lang.name} pronunciation`}
                  title={`Pronounce ${lang.nativeName}`}
                  className="mt-3 p-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer border border-transparent hover:border-cyan-500/30"
                >
                  <Volume2 size={13} />
                </button>
              </GlassCard>
            )
          })}
        </motion.div>

        {/* ── Localized Confirmation Banner ── */}
        <div className="w-full max-w-xl min-h-[64px] flex items-center justify-center mb-8">
          <AnimatePresence mode="wait">
            {selectedLang && confirmationText && (
              <motion.div
                key={selectedLang.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="w-full text-center p-3.5 rounded-2xl bg-cinema-900/90 border border-cyan-500/30 backdrop-blur-2xl shadow-glass-subtle"
              >
                <div className="flex items-center justify-center gap-2 text-cyan-300 text-xs sm:text-sm font-medium">
                  <Sparkles size={14} className="text-cyan-400 shrink-0" />
                  <span>{confirmationText}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Continue Action Button ── */}
        <div className="w-full max-w-xs mx-auto">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!selectedLanguageId}
            onClick={handleContinue}
            icon={<ArrowRight size={18} />}
            iconPosition="right"
            className="shadow-glow-cyan text-base font-bold py-3.5"
          >
            Continue to Education Level
          </Button>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-4 text-xs text-slate-400">
        Vernacular AI · Personalized Regional Onboarding
      </footer>
    </div>
  )
}
