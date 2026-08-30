import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, Play, RotateCcw, Activity } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { GlowCard } from '../../components/ui/GlowCard'
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations'

type RecordState = 'idle' | 'recording' | 'processing' | 'result'

export function StudentRecordPage() {
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [timer, setTimer] = useState(0)

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (recordState === 'recording') {
      interval = setInterval(() => setTimer((t) => t + 1), 1000)
    } else if (recordState === 'idle') {
      setTimer(0)
    }
    return () => clearInterval(interval)
  }, [recordState])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleRecord = () => {
    if (recordState === 'idle') setRecordState('recording')
    else if (recordState === 'recording') {
      setRecordState('processing')
      setTimeout(() => setRecordState('result'), 2000)
    }
  }

  const handleReset = () => {
    setRecordState('idle')
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-3xl mx-auto space-y-8"
    >
      <motion.div variants={fadeUp}>
        <PageHeader
          title="Practice Speaking"
          description="Read the sentence below aloud. The AI will evaluate your pronunciation."
        />
      </motion.div>

      <motion.div variants={staggerItem} className="text-center">
        <GlowCard glowColor="violet" padding="lg">
          <p className="text-sm text-violet-400 font-semibold mb-2 uppercase tracking-wider">Target Sentence</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            बिल्ली दूध पीती है।
          </h2>
          <p className="text-lg text-slate-400 italic">
            "The cat drinks milk."
          </p>
        </GlowCard>
      </motion.div>

      <motion.div variants={staggerItem} className="relative pt-12 pb-8">
        {/* Visualizer Area */}
        <div className="h-24 flex items-center justify-center gap-1.5 mb-12">
          {recordState === 'recording' ? (
            Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-emerald-400 rounded-full waveform-bar"
                style={{ animationDelay: `${Math.random()}s`, height: `${Math.max(20, Math.random() * 100)}%` }}
              />
            ))
          ) : (
            <div className="h-1 w-full max-w-sm bg-white/10 rounded-full" />
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6">
          <div className="text-3xl font-mono text-slate-300">
            {formatTime(timer)}
          </div>

          <div className="flex items-center gap-6">
            {recordState === 'result' ? (
              <>
                <IconButton label="Re-record" variant="glass" size="lg" onClick={handleReset}>
                  <RotateCcw size={20} />
                </IconButton>
                <IconButton label="Play back" variant="primary" size="lg">
                  <Play size={20} />
                </IconButton>
              </>
            ) : recordState === 'processing' ? (
              <div className="flex flex-col items-center text-cyan-400 gap-3">
                <Activity className="animate-spin" size={32} />
                <span className="text-sm">Analyzing pronunciation...</span>
              </div>
            ) : (
              <button
                onClick={handleRecord}
                className={[
                  'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300',
                  recordState === 'recording'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-[0_0_40px_rgba(244,63,94,0.3)] animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:bg-emerald-500/30 hover:scale-105',
                ].join(' ')}
                aria-label={recordState === 'idle' ? 'Start recording' : 'Stop recording'}
              >
                {recordState === 'idle' ? <Mic size={32} /> : <Square size={28} className="fill-current" />}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Result Area */}
      {recordState === 'result' && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <GlowCard glowColor="emerald" padding="lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400"><Activity size={20} /></span> Analysis
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Overall Pronunciation</span>
                <span className="text-emerald-400 font-bold">92% (Excellent)</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }} />
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Great job! You pronounced <span className="text-white font-semibold px-1 py-0.5 rounded bg-white/10">बिल्ली</span> and <span className="text-white font-semibold px-1 py-0.5 rounded bg-white/10">दूध</span> perfectly. Make sure to stress the 'ee' sound slightly longer next time.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Try Again
              </Button>
            </div>
          </GlowCard>
        </motion.div>
      )}
    </motion.div>
  )
}
