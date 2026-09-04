import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Send, Mic, Volume2, Globe, Layers, Sparkles,
  HelpCircle, ArrowRight, AlertCircle,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { GlassCard } from '../../components/ui/GlassCard'
import { CinematicBackground } from '../../components/background/CinematicBackground'
import { SceneCanvas } from '../../components/3d/SceneCanvas'
import { FloatingNav } from '../../components/navigation/FloatingNav'
import { useAppStore } from '../../store/useAppStore'
import { getLanguageById } from '../../data/languages'
import { getEducationLevelById } from '../../data/educationLevels'
import { speechService } from '../../services/speech'
import { createTutorSession, chatWithTutor } from '../../services/tutorService'
import type { BackendChatMessage } from '../../services/tutorService'
import { ApiError } from '../../services/apiClient'
import type { ChatMessage } from '../../services/ai'
import { QuizModal } from '../../components/quiz/QuizModal'

export function TutorExperience() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('prompt')

  const {
    selectedLanguageId,
    educationLevel,
    assistantState,
    setAssistantState,
    voiceEnabled,
    logout,
  } = useAppStore()

  const lang = getLanguageById(selectedLanguageId)
  const levelInfo = getEducationLevelById(educationLevel)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [backendHistory, setBackendHistory] = useState<BackendChatMessage[]>([])
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [quizTopic, setQuizTopic] = useState('')

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `नमस्ते! I am your Vernacular AI Tutor. I am calibrated for ${lang?.name ?? 'your language'} at ${levelInfo.title} level (${levelInfo.grades}). Ask me any concept or lesson!`,
      timestamp: new Date().toISOString(),
    },
  ])

  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isProcessing, errorMessage])

  // Initialize Tutor Session on mount or when language/level changes
  useEffect(() => {
    let isMounted = true
    async function initSession() {
      try {
        const session = await createTutorSession(selectedLanguageId, educationLevel)
        if (!isMounted) return
        setSessionId(session.session_id)
        if (session.welcome_message) {
          setMessages((prev) =>
            prev.length <= 1
              ? [
                  {
                    id: 'welcome-msg',
                    role: 'assistant',
                    content: session.welcome_message,
                    timestamp: session.created_at || new Date().toISOString(),
                  },
                ]
              : prev
          )
        }
      } catch (err) {
        if (!isMounted) return
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login/student')
          return
        }
        // If unauthenticated or network failure, keep initial greeting
      }
    }

    initSession()

    return () => {
      isMounted = false
    }
  }, [selectedLanguageId, educationLevel, logout, navigate])

  // Handle initial prompt from URL if present
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim())
    }
  }, [initialQuery])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return

    const userText = text.trim()
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsProcessing(true)
    setErrorMessage(null)
    setAssistantState({ mode: 'thinking', message: 'Synthesizing vernacular response...' })
    speechService.stopSpeaking()

    try {
      // Send chat request to real backend AI Tutor API
      const res = await chatWithTutor(
        userText,
        sessionId,
        selectedLanguageId,
        educationLevel,
        backendHistory,
      )

      if (res.session_id && !sessionId) {
        setSessionId(res.session_id)
      }

      if (res.history && res.history.length > 0) {
        setBackendHistory(res.history)
      } else {
        setBackendHistory((prev) => [
          ...prev,
          { role: 'user', content: userText, timestamp: new Date().toISOString() },
          { role: 'assistant', content: res.response, timestamp: res.created_at || new Date().toISOString() },
        ])
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.response,
        timestamp: res.created_at || new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])
      setAssistantState({ mode: 'speaking', message: 'Speaking...' })

      if (voiceEnabled) {
        try {
          await speechService.speak(res.response, lang?.locale ?? 'en-IN')
        } catch (e) {
          console.warn('TTS playback error', e)
        }
      }

      setAssistantState({ mode: 'idle', message: null })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login/student')
        return
      }
      const msg = err instanceof ApiError ? err.message : 'Could not connect to AI Tutor.'
      setErrorMessage(msg)
      setAssistantState({ mode: 'error', message: 'Could not connect' })
      setTimeout(() => setAssistantState({ mode: 'idle', message: null }), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  const [micStopFn, setMicStopFn] = useState<(() => void) | null>(null)

  const handleMic = () => {
    if (assistantState.mode === 'listening') {
      if (micStopFn) {
        micStopFn()
        setMicStopFn(null)
      }
      setAssistantState({ mode: 'idle' })
      return
    }

    setAssistantState({ mode: 'listening', message: 'Listening in ' + (lang?.name ?? 'your language') })
    speechService.stopSpeaking()

    const stop = speechService.listen(
      (transcript) => {
        setInputValue(transcript)
        setAssistantState({ mode: 'idle', message: null })
        setMicStopFn(null)
        handleSendMessage(transcript)
      },
      () => {
        setAssistantState({ mode: 'error' })
        setMicStopFn(null)
        setTimeout(() => setAssistantState({ mode: 'idle', message: null }), 2500)
      },
      lang?.id
    )
    setMicStopFn(() => stop)
  }

  const handleSpeakMessage = (text: string) => {
    setAssistantState({ mode: 'speaking', message: 'Playing audio...' })
    speechService.speak(text, lang?.locale ?? 'en-IN').finally(() => {
      setAssistantState({ mode: 'idle', message: null })
    })
  }

  const handleAction = (actionType: 'simplify' | 'quiz' | 'translate' | 'more', originalText: string) => {
    if (actionType === 'simplify') {
      handleSendMessage(`Can you simplify this for a younger learner in ${lang?.name}? "${originalText.slice(0, 100)}..."`)
    } else if (actionType === 'quiz') {
      const topicText = originalText.slice(0, 100).replace(/\n/g, ' ').trim()
      setQuizTopic(topicText || 'General Science')
      setIsQuizOpen(true)
    } else if (actionType === 'translate') {
      handleSendMessage(`Translate this explanation entirely into ${lang?.nativeName}: "${originalText.slice(0, 100)}..."`)
    } else if (actionType === 'more') {
      handleSendMessage(`Explain more advanced depth and practical applications of this in ${lang?.name}.`)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#05070B] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-white overflow-hidden">
      {/* ── Fixed Background ── */}
      <CinematicBackground showParticles showGlow showGrid />

      {/* ── Fixed Top Navigation ── */}
      <FloatingNav />

      {/* ── Top-Center Living 3D AI Core Companion ── */}
      <div className="relative z-10 w-full pt-4 pb-2 flex flex-col items-center justify-center">
        <div className="relative w-40 h-28 sm:w-48 sm:h-32 flex items-center justify-center">
          <SceneCanvas
            state={assistantState.mode}
            showFloatingElements={false}
            showOrbitalParticles={true}
            showAmbientParticles={false}
            cameraPosition={[0, 0.3, 6.0]}
          />
        </div>

        {/* Active Context Glass Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1 rounded-full bg-cinema-900/90 border border-cyan-500/30 backdrop-blur-xl text-xs shadow-glass-subtle mt-1">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <Globe size={13} className="text-cyan-400" />
            <span>{lang?.nativeName ?? 'English'}</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5 text-violet-300 font-medium">
            <Layers size={13} className="text-violet-400" />
            <span>{levelInfo.title}</span>
            <span className="text-[10px] text-slate-500 font-normal">({levelInfo.grades})</span>
          </div>
          <button
            onClick={() => navigate('/student/language')}
            className="text-[10px] uppercase font-bold text-cyan-400 hover:text-cyan-200 underline ml-1 cursor-pointer"
          >
            Reconfigure
          </button>
        </div>
      </div>

      {/* ── Central Conversation Stream ── */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 flex flex-col overflow-y-auto space-y-4 py-4 no-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed backdrop-blur-2xl shadow-glass ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm shadow-glow-cyan'
                    : 'glass-card text-slate-200 rounded-tl-sm border-white/[0.08]'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/[0.05] text-[11px] text-cyan-300 font-semibold">
                    <Sparkles size={12} className="text-cyan-400" />
                    <span>Vernacular AI Tutor</span>
                  </div>
                )}

                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Assistant Response Quick Action Toolbar */}
                {!isUser && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/[0.06] text-[11px]">
                    <button
                      onClick={() => handleSpeakMessage(msg.content)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-200 transition-colors cursor-pointer"
                      title="Speak audio"
                    >
                      <Volume2 size={12} className="text-cyan-400" />
                      Listen
                    </button>
                    <button
                      onClick={() => handleAction('simplify', msg.content)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-violet-500/20 text-slate-300 hover:text-violet-200 transition-colors cursor-pointer"
                      title="Simplify explanation"
                    >
                      <Sparkles size={12} className="text-violet-400" />
                      Simplify
                    </button>
                    <button
                      onClick={() => handleAction('quiz', msg.content)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-200 transition-colors cursor-pointer"
                      title="Generate quiz"
                    >
                      <HelpCircle size={12} className="text-emerald-400" />
                      Quiz Me
                    </button>
                    <button
                      onClick={() => handleAction('more', msg.content)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-blue-500/20 text-slate-300 hover:text-blue-200 transition-colors cursor-pointer"
                      title="Ask for deeper concepts"
                    >
                      <ArrowRight size={12} className="text-blue-400" />
                      Deeper Depth
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] w-fit text-xs text-cyan-300 backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AI is synthesizing vernacular response...</span>
          </div>
        )}

        {/* Clean Error Message */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 w-fit text-xs text-red-300 backdrop-blur-xl">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* ── Fixed Bottom Query Input Console ── */}
      <div className="relative z-20 max-w-4xl w-full mx-auto px-4 pb-6 pt-2">
        <GlassCard variant="highlighted" padding="sm" className="border-cyan-500/30 shadow-glow-cyan">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(inputValue)
            }}
            className="flex items-center gap-2 p-1"
          >
            <button
              type="button"
              onClick={handleMic}
              disabled={isProcessing}
              className={`p-2.5 rounded-xl border transition-all ${
                assistantState.mode === 'listening'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-400 animate-pulse'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08]'
              }`}
              title="Voice recording in regional dialect"
            >
              <Mic size={18} />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask in ${lang?.name ?? 'your language'} (e.g. 'Explain gravity')...`}
              disabled={isProcessing}
              className="flex-1 bg-transparent px-3 text-sm text-white placeholder:text-slate-500 outline-none"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputValue.trim() || isProcessing}
              icon={<Send size={15} />}
              className="px-4 shadow-glow-subtle"
            >
              Send
            </Button>
          </form>
        </GlassCard>
      </div>

      {/* ── Real AI Quiz Modal ── */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        topic={quizTopic}
      />
    </div>
  )
}
