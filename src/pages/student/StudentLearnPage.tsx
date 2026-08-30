import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2, Mic, ChevronRight, ChevronLeft, CheckCircle2,
  BookOpen, Star, MessageSquare
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { GlowCard } from '../../components/ui/GlowCard'
import { useAppStore } from '../../store/useAppStore'
import { getNextLesson } from '../../data/mockLessons'
import { fadeUp, fadeIn } from '../../utils/animations'

export function StudentLearnPage() {
  const { selectedLanguageId } = useAppStore()
  const lesson = getNextLesson(selectedLanguageId) ?? getNextLesson('hi')
  
  const [currentStep, setCurrentStep] = useState(0)
  const steps = ['vocabulary', 'pronunciation', 'comprehension', 'complete']
  
  const isComplete = currentStep === steps.length - 1

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        No lessons available.
      </div>
    )
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1)
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1)
  }

  const progressPercent = (currentStep / (steps.length - 1)) * 100

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-6rem)]">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BookOpen size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{lesson.title}</h1>
            <p className="text-sm text-slate-400">{lesson.nativeTitle}</p>
          </div>
        </div>
        
        <ProgressBar
          value={progressPercent}
          color="cyan"
          size="md"
        />
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {steps[currentStep] === 'vocabulary' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">New Words</h2>
                  <p className="text-slate-400">Let's learn some new vocabulary today.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lesson.vocabulary?.map((vocab, i) => (
                    <GlowCard key={i} glowColor="cyan" hover padding="lg" className="flex flex-col items-center text-center">
                      <button className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 hover:bg-cyan-500/20 transition-colors">
                        <Volume2 size={24} />
                      </button>
                      <h3 className="text-3xl font-bold text-white mb-1">{vocab.word}</h3>
                      <p className="text-sm text-cyan-400 mb-3">{vocab.pronunciation}</p>
                      <p className="text-lg font-medium text-slate-300 mb-4">{vocab.meaning}</p>
                      <div className="w-full p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-slate-400 italic">"{vocab.example}"</p>
                      </div>
                    </GlowCard>
                  ))}
                </div>
              </div>
            )}

            {steps[currentStep] === 'pronunciation' && (
              <div className="flex flex-col items-center text-center max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-white mb-2">Your Turn to Speak</h2>
                <p className="text-slate-400 mb-10">Read the word below aloud.</p>
                
                <div className="p-8 rounded-3xl glass border border-emerald-500/30 w-full relative overflow-hidden mb-8 shadow-glow-emerald">
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                  
                  <h3 className="text-5xl font-bold text-white mb-2">{lesson.vocabulary?.[0]?.word}</h3>
                  <p className="text-emerald-400 font-medium mb-8">{lesson.vocabulary?.[0]?.meaning}</p>
                  
                  <button className="relative w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto hover:bg-emerald-500/30 transition-colors group">
                    <div className="absolute inset-0 rounded-full border border-emerald-500/50 animate-ping opacity-20 group-hover:opacity-100" />
                    <Mic size={32} />
                  </button>
                  <p className="text-xs text-slate-500 mt-4">Tap to record</p>
                </div>
              </div>
            )}

            {steps[currentStep] === 'comprehension' && (
              <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
                <h2 className="text-2xl font-bold text-white mb-8">What does this mean?</h2>
                
                <div className="w-full p-8 rounded-2xl glass mb-8 text-center">
                  <span className="text-4xl font-bold text-white">{lesson.vocabulary?.[1]?.word}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {['Dog', 'Bird', 'Cat', 'Cow'].map((option) => (
                    <button
                      key={option}
                      className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 text-white font-medium transition-all duration-200"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {steps[currentStep] === 'complete' && (
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 shadow-glow-emerald">
                  <CheckCircle2 size={48} className="text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Lesson Complete!</h2>
                <p className="text-slate-400 mb-8">You've successfully finished {lesson.title}.</p>
                
                <div className="flex gap-4">
                  <div className="px-6 py-4 rounded-2xl glass border border-amber-500/20 flex flex-col items-center">
                    <Star className="text-amber-400 mb-1" size={24} />
                    <span className="text-2xl font-bold text-white">+{lesson.xpReward}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">XP Earned</span>
                  </div>
                  <div className="px-6 py-4 rounded-2xl glass border border-cyan-500/20 flex flex-col items-center">
                    <MessageSquare className="text-cyan-400 mb-1" size={24} />
                    <span className="text-2xl font-bold text-white">{lesson.vocabulary?.length ?? 4}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">New Words</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={currentStep === 0 || isComplete}
          icon={<ChevronLeft size={16} />}
          iconPosition="left"
        >
          Previous
        </Button>
        
        {!isComplete ? (
          <Button
            variant="primary"
            onClick={handleNext}
            icon={<ChevronRight size={16} />}
            iconPosition="right"
          >
            Next
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={() => window.history.back()}
          >
            Back to Dashboard
          </Button>
        )}
      </motion.div>
    </div>
  )
}
