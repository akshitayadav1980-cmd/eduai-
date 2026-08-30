import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Mic, History, ArrowRight, Sparkles,
  ChevronDown, Image as ImageIcon, Check, RefreshCw
} from 'lucide-react'
import { LANGUAGES, getLanguageById } from '../../data/languages'
import { useAppStore } from '../../store/useAppStore'

interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  translation?: string
  timestamp: string
  visualUrl?: string
  visualTitle?: string
  visualDescription?: string
}

interface HistoryItem {
  id: string
  title: string
  date: string
  sourceLang: string
  targetLang: string
  messages: ChatMessage[]
}

const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: 'hist-1',
    title: 'Photosynthesis in Kurukh & Hindi',
    date: 'Today, 10:24 AM',
    sourceLang: 'hi',
    targetLang: 'kru',
    messages: [
      {
        id: 'm-1',
        sender: 'user',
        text: 'प्रकाश संश्लेषण (Photosynthesis) पौधों में कैसे होता है?',
        timestamp: '10:24 AM',
      },
      {
        id: 'm-2',
        sender: 'ai',
        text: 'प्रकाश संश्लेषण वह प्रक्रिया है जिससे पौधे सूर्य के प्रकाश, पानी (H2O) और कार्बन डाइऑक्साइड (CO2) का उपयोग करके ग्लूकोज और ऑक्सीजन बनाते हैं।',
        translation: 'कुड़ुख अनुवाद: बिड़ी ती उज्जना गहि ताक़त ती मन-मसाक मंजा बिया काटी नु ग्लूकोज़ अरा ऑक्सीजन कमआना।',
        timestamp: '10:24 AM',
        visualUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
        visualTitle: 'Light-Dependent Reaction in Chloroplasts',
        visualDescription: 'Photon absorption in thylakoid membranes transferring ATP & NADPH energy.',
      },
    ],
  },
  {
    id: 'hist-2',
    title: "Newton's Laws of Motion",
    date: 'Yesterday, 4:15 PM',
    sourceLang: 'en',
    targetLang: 'hi',
    messages: [
      {
        id: 'm-3',
        sender: 'user',
        text: "Explain Newton's Third Law with practical examples.",
        timestamp: '4:15 PM',
      },
      {
        id: 'm-4',
        sender: 'ai',
        text: 'For every action, there is an equal and opposite reaction (F_AB = -F_BA).',
        translation: 'प्रत्येक क्रिया के बराबर और विपरीत दिशा में प्रतिक्रिया होती है। जैसे रॉकेट का थ्रस्ट गैसों को नीचे धकेलता है और रॉकेट ऊपर जाता है।',
        timestamp: '4:15 PM',
        visualUrl: 'https://images.unsplash.com/photo-1517976487507-59a5e0a6d0d0?auto=format&fit=crop&w=800&q=80',
        visualTitle: 'Action & Reaction Vectors in Propulsion',
        visualDescription: 'Downward exhaust force generating upward orbital momentum.',
      },
    ],
  },
  {
    id: 'hist-3',
    title: 'Structure of DNA & Genetic Code',
    date: '2 days ago',
    sourceLang: 'hi',
    targetLang: 'mr',
    messages: [
      {
        id: 'm-5',
        sender: 'user',
        text: 'डीएनए का डबल हेलिक्स मॉडल क्या है?',
        timestamp: '2 days ago',
      },
      {
        id: 'm-6',
        sender: 'ai',
        text: 'डीएनए की दोहरी सर्पिलाकार संरचना (Double Helix) वॉटसन और क्रिक ने 1953 में प्रस्तावित की थी।',
        translation: 'मराठी अनुवाद: डीएनए ची दुहेरी सर्पिलाकार रचना नायट्रोजन बेस (A-T, G-C) हायड्रोजन बंधांनी जोडलेली असते.',
        timestamp: '2 days ago',
        visualUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=800&q=80',
        visualTitle: 'DNA Double Helix Base Pairing',
        visualDescription: 'Hydrogen-bonded nucleotide chains forming genetic sequences.',
      },
    ],
  },
]

export function YourAISection() {
  const { isDarkMode, voiceEnabled, setVoiceEnabled } = useAppStore()

  // Languages selection state
  const [sourceLangId, setSourceLangId] = useState<string>('hi')
  const [targetLangId, setTargetLangId] = useState<string>('kru')
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showTargetDropdown, setShowTargetDropdown] = useState(false)

  // History panel toggle
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyList] = useState<HistoryItem[]>(INITIAL_HISTORY)

  // Active conversation state
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_HISTORY[0].messages)
  const [inputQuery, setInputQuery] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  // Current active visual response
  const latestAiMessage = [...messages].reverse().find((m) => m.sender === 'ai' && m.visualUrl)
  const activeVisual = latestAiMessage
    ? {
        url: latestAiMessage.visualUrl!,
        title: latestAiMessage.visualTitle || 'Conceptual Visualization',
        description: latestAiMessage.visualDescription || 'Dynamic synthesis model',
      }
    : null

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const sourceLang = getLanguageById(sourceLangId) || getLanguageById('hi')
  const targetLang = getLanguageById(targetLangId) || getLanguageById('kru')

  const handleSwapLanguages = () => {
    const temp = sourceLangId
    setSourceLangId(targetLangId)
    setTargetLangId(temp)
  }

  const handleSelectHistory = (item: HistoryItem) => {
    setSourceLangId(item.sourceLang)
    setTargetLangId(item.targetLang)
    setMessages(item.messages)
    setHistoryOpen(false)
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const query = inputQuery.trim()
    if (!query) return

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputQuery('')
    setIsThinking(true)

    // Simulate intelligent educational Vernacular AI response with dynamic visual
    setTimeout(() => {
      let aiText = `Here is the explanation for "${query}" synthesized for your learning level.`
      let translationText = `अनुवाद (${targetLang?.name || 'Kurukh'}): ${query} गहि माने अरा सांचा समझना।`
      let visualUrl = 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80'
      let visualTitle = 'Multilingual Concept Structure'
      let visualDesc = `Adaptive conceptual breakdown from ${sourceLang?.name} to ${targetLang?.name}.`

      if (/gravity|गुरुत्वाकर्षण/i.test(query)) {
        aiText = 'गुरुत्वाकर्षण (Gravity) ब्रह्मांड के किन्हीं दो द्रव्यमानों के बीच लगने वाला आकर्षण बल है।'
        translationText = 'कुड़ुख अनुवाद: गुरुत्वाकर्षण पृथ्वी गहि अद्दे ताक़त तली जेती हर चीज़ एड़ता तिन ख़िचड़ी।'
        visualUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
        visualTitle = 'Gravitational Curvature of Spacetime'
        visualDesc = 'Mass warping spatial geometry causing universal orbital attraction.'
      } else if (/cell|कोशिका/i.test(query)) {
        aiText = 'कोशिका (Cell) जीवन की सबसे छोटी संरचनात्मक और कार्यात्मक इकाई है।'
        translationText = 'कुड़ुख अनुवाद: सेल (कोशिका) उज्जना गहि सबसे सानी टुकड़ी तली।'
        visualUrl = 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'
        visualTitle = 'Cellular Organelles & Membrane Dynamics'
        visualDesc = 'Mitochondria, nucleus, and cytoplasm coordinating life processes.'
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiText,
        translation: translationText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        visualUrl,
        visualTitle,
        visualDescription: visualDesc,
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsThinking(false)
    }, 1100)
  }

  return (
    <section id="your-ai" className="w-full max-w-6xl mx-auto space-y-6 pt-4 pb-16">
      
      {/* ── Section Title ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase border ${
              isDarkMode
                ? 'bg-white/[0.04] border-white/[0.08] text-cyan-400'
                : 'bg-[#FAFAF8] border-black/[0.05] text-cyan-700 shadow-subtle'
            }`}
          >
            INTELLIGENT ADAPTIVE TUTOR
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            YOUR AI
          </h2>
          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
            Personal learning, translation, and concept synthesis across regional languages.
          </p>
        </div>

        {/* Top History Toggle Button */}
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold border theme-transition cursor-pointer self-start sm:self-auto ${
            historyOpen
              ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-400'
              : isDarkMode
              ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#F5F5F5]'
              : 'bg-[#FAFAF8] hover:bg-white border-black/[0.06] text-[#171717] shadow-subtle'
          }`}
          title="Conversation History"
        >
          <History size={15} />
          <span>HISTORY</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>
            {historyList.length}
          </span>
        </button>
      </div>

      {/* ── Collapsible History Panel ── */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`overflow-hidden p-4 rounded-3xl border text-left theme-transition ${
              isDarkMode
                ? 'bg-[#141418]/90 border-white/[0.08] shadow-2xl'
                : 'bg-[#FAFAF8] border-black/[0.06] shadow-editorial'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A3A39E]">
                Previous Conversations
              </span>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-xs text-[#A3A39E] hover:text-cyan-500 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {historyList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistory(item)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06]'
                      : 'bg-white hover:bg-white/90 border-black/[0.05] shadow-xs'
                  }`}
                >
                  <p className="font-display text-xs font-bold truncate mb-1 text-[#171717] dark:text-[#F5F5F5]">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#A3A39E]">
                    <span>{item.date}</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400">
                      {item.sourceLang.toUpperCase()} → {item.targetLang.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Compact Floating Language Selector Bar ── */}
      <div className="flex items-center justify-center gap-3 py-1 text-xs">
        
        {/* Source Language Floating Control */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSourceDropdown(!showSourceDropdown)
              setShowTargetDropdown(false)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-medium theme-transition cursor-pointer ${
              isDarkMode
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#F5F5F5]'
                : 'bg-[#FAFAF8] hover:bg-white border-black/[0.06] text-[#171717] shadow-subtle'
            }`}
          >
            <span className="font-bold text-cyan-600 dark:text-cyan-400">{sourceLang?.nativeName}</span>
            <span className="opacity-70">({sourceLang?.name})</span>
            <ChevronDown size={13} className="opacity-50" />
          </button>

          {showSourceDropdown && (
            <div
              className={`absolute left-0 top-full mt-2 w-48 max-h-56 overflow-y-auto rounded-2xl border z-50 p-1.5 shadow-2xl backdrop-blur-xl ${
                isDarkMode ? 'bg-[#141418] border-white/[0.08]' : 'bg-[#FAFAF8] border-black/[0.08]'
              }`}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setSourceLangId(lang.id)
                    setShowSourceDropdown(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    sourceLangId === lang.id
                      ? 'bg-cyan-500/15 text-cyan-400 font-bold'
                      : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{lang.nativeName} ({lang.name})</span>
                  {sourceLangId === lang.id && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap / Transition Indicator Arrow */}
        <button
          onClick={handleSwapLanguages}
          className={`p-2 rounded-full border theme-transition hover:rotate-180 transition-transform cursor-pointer ${
            isDarkMode
              ? 'bg-white/[0.03] border-white/[0.08] text-[#A3A39E]'
              : 'bg-[#FAFAF8] border-black/[0.06] text-[#6F6F6A] shadow-xs'
          }`}
          title="Swap Languages"
        >
          <ArrowRight size={14} className="text-cyan-500" />
        </button>

        {/* Target Language Floating Control */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTargetDropdown(!showTargetDropdown)
              setShowSourceDropdown(false)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-medium theme-transition cursor-pointer ${
              isDarkMode
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#F5F5F5]'
                : 'bg-[#FAFAF8] hover:bg-white border-black/[0.06] text-[#171717] shadow-subtle'
            }`}
          >
            <span className="font-bold text-violet-600 dark:text-violet-400">{targetLang?.nativeName}</span>
            <span className="opacity-70">({targetLang?.name})</span>
            <ChevronDown size={13} className="opacity-50" />
          </button>

          {showTargetDropdown && (
            <div
              className={`absolute right-0 top-full mt-2 w-48 max-h-56 overflow-y-auto rounded-2xl border z-50 p-1.5 shadow-2xl backdrop-blur-xl ${
                isDarkMode ? 'bg-[#141418] border-white/[0.08]' : 'bg-[#FAFAF8] border-black/[0.08]'
              }`}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setTargetLangId(lang.id)
                    setShowTargetDropdown(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    targetLangId === lang.id
                      ? 'bg-violet-500/15 text-violet-400 font-bold'
                      : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{lang.nativeName} ({lang.name})</span>
                  {targetLangId === lang.id && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Main Three-Part Composition: Centered Chat (Center) + Visual Frame (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── CENTER: Premium Frosted Chat Interface (lg:col-span-7) ── */}
        <div
          className={`lg:col-span-7 flex flex-col h-[560px] rounded-3xl border theme-transition backdrop-blur-xl overflow-hidden ${
            isDarkMode
              ? 'bg-[#141418]/85 border-white/[0.08] shadow-2xl'
              : 'bg-[#FAFAF8]/90 border-black/[0.06] shadow-editorial'
          }`}
        >
          {/* Chat Stream Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed transition-all ${
                    msg.sender === 'user'
                      ? isDarkMode
                        ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                        : 'bg-[#171717] text-[#FFFFFF] shadow-sm'
                      : isDarkMode
                      ? 'bg-white/[0.03] text-[#F5F5F5] border border-white/[0.06]'
                      : 'bg-white text-[#171717] border border-black/[0.05] shadow-xs'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1.5">
                      <Sparkles size={12} />
                      <span>YOUR AI SYNTHESIS</span>
                    </div>
                  )}

                  <p className="font-normal">{msg.text}</p>

                  {/* Vernacular Regional Translation */}
                  {msg.translation && (
                    <div className="mt-3 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08] text-xs font-serif italic text-cyan-800 dark:text-cyan-200">
                      {msg.translation}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-[#A3A39E] px-2 pt-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-start">
                <div
                  className={`rounded-2xl p-4 text-xs flex items-center gap-2 ${
                    isDarkMode ? 'bg-white/[0.04] text-cyan-300' : 'bg-white text-cyan-800 border border-black/[0.05]'
                  }`}
                >
                  <RefreshCw size={14} className="animate-spin text-cyan-500" />
                  <span>Synthesizing in {targetLang?.name}...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Console */}
          <div className="p-4 border-t border-black/[0.05] dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02]">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={`Ask anything in ${sourceLang?.name} (e.g. photosynthesis, gravity)...`}
                className={`flex-1 text-xs sm:text-sm px-4 py-3 rounded-2xl border outline-none transition-all ${
                  isDarkMode
                    ? 'bg-white/[0.04] border-white/[0.08] text-[#F5F5F5] placeholder:text-[#6F6F6A] focus:border-cyan-400/60'
                    : 'bg-white border-black/[0.06] text-[#171717] placeholder:text-[#A3A39E] focus:border-cyan-500/60 shadow-xs'
                }`}
              />

              {/* Voice Input Trigger */}
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
                  voiceEnabled
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-400'
                    : isDarkMode
                    ? 'bg-white/[0.04] border-white/[0.08] text-[#A3A39E]'
                    : 'bg-white border-black/[0.06] text-[#6F6F6A]'
                }`}
                title="Voice Input"
              >
                <Mic size={16} />
              </button>

              {/* Dark Send Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className={`flex items-center gap-1.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 shadow-sm ${
                  isDarkMode
                    ? 'bg-[#FFFFFF] text-[#171717] hover:bg-[#F5F5F5]'
                    : 'bg-[#171717] text-[#FFFFFF] hover:bg-[#262626]'
                }`}
              >
                <span className={isDarkMode ? 'text-[#171717]' : 'text-[#FFFFFF]'}>Send</span>
                <Send size={14} className={isDarkMode ? 'text-[#171717]' : 'text-[#FFFFFF]'} />
              </button>

            </form>
          </div>
        </div>

        {/* ── RIGHT: Dedicated Visual / Image Response Area (lg:col-span-5) ── */}
        <div
          className={`lg:col-span-5 flex flex-col h-[560px] rounded-3xl border theme-transition backdrop-blur-xl overflow-hidden p-6 text-left ${
            isDarkMode
              ? 'bg-[#141418]/85 border-white/[0.08] shadow-2xl'
              : 'bg-[#FAFAF8]/90 border-black/[0.06] shadow-editorial'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06] mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-cyan-500" />
              <span className="font-display text-xs font-bold uppercase tracking-wider text-[#171717] dark:text-[#F5F5F5]">
                Visual Response
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              SYNCED
            </span>
          </div>

          {activeVisual ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeVisual.url}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col justify-between"
              >
                <div className="relative rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] shadow-subtle group">
                  <img
                    src={activeVisual.url}
                    alt={activeVisual.title}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs font-bold leading-snug">{activeVisual.title}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] space-y-1.5 mt-4">
                  <p className="text-xs font-semibold text-[#171717] dark:text-[#F5F5F5]">
                    Concept Breakdown
                  </p>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'}`}>
                    {activeVisual.description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-60">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                <ImageIcon size={24} />
              </div>
              <p className="text-xs font-medium text-[#A3A39E]">
                Visual synthesis diagrams appear automatically as concepts are explained.
              </p>
            </div>
          )}
        </div>

      </div>

    </section>
  )
}
