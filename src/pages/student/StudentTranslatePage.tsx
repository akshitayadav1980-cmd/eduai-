import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Mic, Volume2, Copy, Sparkles, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { Select } from '../../components/ui/Select'
import { useAppStore } from '../../store/useAppStore'
import { LANGUAGES, getLanguageById } from '../../data/languages'
import { translateText } from '../../services/translationService'
import { staggerContainer, staggerItem, fadeUp } from '../../utils/animations'

export function StudentTranslatePage() {
  const { selectedLanguageId } = useAppStore()
  
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState(selectedLanguageId ?? 'hi')
  const [sourceText, setSourceText] = useState('')
  const [targetText, setTargetText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)

  const languageOptions = LANGUAGES.map(l => ({ value: l.id, label: l.name }))
  const sLangInfo = getLanguageById(sourceLang)
  const tLangInfo = getLanguageById(targetLang)

  const handleSwap = () => {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setSourceText(targetText)
    setTargetText(sourceText)
  }

  const handleTranslate = async () => {
    if (!sourceText.trim()) return
    
    setIsTranslating(true)
    try {
      const result = await translateText({
        text: sourceText,
        sourceLanguageId: sourceLang,
        targetLanguageId: targetLang,
      })
      setTargetText(result.translatedText)
    } catch (error) {
      console.error(error)
      setTargetText('Error translating text.')
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Translator"
          description="Instantly translate between English and Indian regional languages."
          action={
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400 font-medium">
              <Sparkles size={12} /> Powered by IndicTrans2
            </div>
          }
        />
      </motion.div>

      <motion.div variants={staggerItem} className="glass rounded-2xl border border-white/10 overflow-hidden shadow-card">
        {/* Language Selection Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-b border-white/10 bg-surface-2/50">
          <div className="flex-1 w-full">
            <Select
              options={languageOptions}
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              aria-label="Source Language"
            />
          </div>
          
          <IconButton label="Swap languages" variant="ghost" size="md" onClick={handleSwap}>
            <ArrowLeftRight size={18} />
          </IconButton>
          
          <div className="flex-1 w-full">
            <Select
              options={languageOptions}
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              aria-label="Target Language"
            />
          </div>
        </div>

        {/* Translation Panes */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Source Area */}
          <div className="p-5 flex flex-col h-[300px]">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="flex-1 w-full bg-transparent resize-none outline-none text-white text-lg placeholder-slate-500"
              dir={sLangInfo?.id === 'ur' ? 'rtl' : 'ltr'}
            />
            <div className="flex items-center justify-between pt-4 mt-auto">
              <div className="flex gap-2">
                <IconButton label="Speak" variant="ghost" size="sm">
                  <Volume2 size={16} />
                </IconButton>
                <IconButton label="Use microphone" variant="ghost" size="sm">
                  <Mic size={16} />
                </IconButton>
              </div>
              <span className="text-xs text-slate-500">{sourceText.length} / 500</span>
            </div>
          </div>

          {/* Target Area */}
          <div className="p-5 flex flex-col h-[300px] bg-cyan-500/[0.02]">
            <div className="flex-1 relative">
              {isTranslating && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-2/50 backdrop-blur-sm rounded-lg">
                  <Loader2 size={32} className="text-cyan-400 animate-spin mb-3" />
                  <span className="text-sm text-cyan-300 font-medium">Translating...</span>
                </div>
              )}
              <textarea
                value={targetText}
                readOnly
                placeholder="Translation will appear here..."
                className="w-full h-full bg-transparent resize-none outline-none text-cyan-50 text-lg placeholder-slate-600 font-medium"
                dir={tLangInfo?.id === 'ur' ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="flex items-center justify-between pt-4 mt-auto">
              <div className="flex gap-2">
                <IconButton label="Listen to translation" variant="ghost" size="sm" disabled={!targetText}>
                  <Volume2 size={16} />
                </IconButton>
                <IconButton label="Copy translation" variant="ghost" size="sm" disabled={!targetText}>
                  <Copy size={16} />
                </IconButton>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-white/10 bg-surface-2/50 flex justify-end">
          <Button
            variant="primary"
            onClick={handleTranslate}
            loading={isTranslating}
            disabled={!sourceText.trim()}
          >
            Translate Now
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
