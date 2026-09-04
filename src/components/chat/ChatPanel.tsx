import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, X, MessageSquare, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { useAppStore } from '../../store/useAppStore'
import { aiService } from '../../services/ai'
import { speechService } from '../../services/speech'
import type { ChatMessage } from '../../services/ai'

export function ChatPanel() {
  const { assistantState, setAssistantState, selectedLanguageId, educationLevel } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Hello! How can I help you today?', timestamp: new Date().toISOString() }
  ])
  const [inputValue, setInputValue] = useState('')
  const [errorText, setErrorText] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text: string) => {
    if (!text.trim() || assistantState.mode === 'thinking' || assistantState.mode === 'speaking') return

    // User Message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setErrorText(null)
    setAssistantState({ mode: 'thinking', message: 'Processing...' })
    speechService.stopSpeaking()

    try {
      const response = await aiService.chat({
        message: text.trim(),
        languageId: selectedLanguageId,
        context: { educationLevel },
      })
      
      setMessages(prev => [...prev, response.message])
      setAssistantState({ mode: 'speaking', message: 'Responding...' })
      
      try {
        await speechService.speak(response.message.content)
      } catch (err) {
        console.warn('Speech synthesis failed/unsupported', err)
      }
      
      setAssistantState({ mode: 'idle', message: null })
    } catch {
      setErrorText('Failed to connect to the assistant. Please try again.')
      setAssistantState({ mode: 'error', message: 'Connection failed' })
      
      // Auto-recover from error state
      setTimeout(() => {
        setAssistantState({ mode: 'idle', message: null })
        setErrorText(null)
      }, 3000)
    }
  }

  const [micStopFn, setMicStopFn] = useState<(() => void) | null>(null)

  const handleMicClick = () => {
    if (assistantState.mode === 'listening') {
      if (micStopFn) {
        micStopFn()
        setMicStopFn(null)
      }
      setAssistantState({ mode: 'idle' })
      return
    }

    setAssistantState({ mode: 'listening', message: 'Listening...' })
    setErrorText(null)
    speechService.stopSpeaking()

    const stop = speechService.listen(
      (text) => {
        setInputValue(text)
        setAssistantState({ mode: 'idle', message: null })
        setMicStopFn(null)
        handleSend(text)
      },
      () => {
        setErrorText('Speech recognition failed. Try typing.')
        setAssistantState({ mode: 'error' })
        setMicStopFn(null)
        setTimeout(() => {
          setAssistantState({ mode: 'idle', message: null })
          setErrorText(null)
        }, 3000)
      },
      selectedLanguageId
    )
    setMicStopFn(() => stop)
  }

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-glow-cyan flex items-center justify-center transition-colors"
            aria-label="Open AI Assistant"
          >
            <MessageSquare size={24} />
          </button>
        </motion.div>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-sm h-[500px] glass border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-surface-1/50 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="font-semibold text-white">Vercel Assistant</h3>
              </div>
              <IconButton label="Close chat" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </IconButton>
            </div>

            {/* Error Banner */}
            {errorText && (
              <div className="bg-rose-500/20 border-b border-rose-500/30 p-2 flex items-center justify-center gap-2 text-xs text-rose-300">
                <AlertCircle size={14} /> {errorText}
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={[
                      'max-w-[85%] rounded-2xl p-3 text-sm',
                      msg.role === 'user' 
                        ? 'bg-cyan-600 text-white rounded-tr-sm'
                        : 'bg-white/10 text-slate-200 rounded-tl-sm border border-white/5'
                    ].join(' ')}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {assistantState.mode === 'thinking' && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-surface-2/50">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={assistantState.mode === 'thinking' || assistantState.mode === 'speaking'}
                  className={[
                    'shrink-0 p-2 rounded-full transition-colors',
                    assistantState.mode === 'listening'
                      ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  ].join(' ')}
                >
                  <Mic size={20} />
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-500 px-2"
                  disabled={assistantState.mode === 'thinking' || assistantState.mode === 'speaking'}
                />
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm" 
                  disabled={!inputValue.trim() || assistantState.mode === 'thinking' || assistantState.mode === 'speaking'}
                  className="px-3"
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
