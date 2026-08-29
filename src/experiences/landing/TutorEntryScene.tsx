import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send, Mic, ArrowRight, BookOpen, Layers, Globe,
  Sparkles, FileText, HelpCircle, Volume2
} from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { getLanguageById } from '../../data/languages'
import { getEducationLevelById } from '../../data/educationLevels'
import { useExperienceScroll } from '../../components/cinematic/ScrollContext'

export function TutorEntryScene() {
  const navigate = useNavigate()
  const { progress } = useExperienceScroll()
  const { selectedLanguageId, educationLevel, setSelectedRole } = useAppStore()
  const [queryInput, setQueryInput] = useState('')

  let opacity = 0
  if (progress >= 0.78) {
    opacity = Math.min(1, (progress - 0.78) / 0.12)
  }

  const lang = getLanguageById(selectedLanguageId)
  const levelInfo = getEducationLevelById(educationLevel)

  const handleLaunchTutor = (initialPrompt?: string) => {
    setSelectedRole('student')
    if (initialPrompt) {
      navigate(`/tutor?prompt=${encodeURIComponent(initialPrompt)}`)
    } else if (queryInput.trim()) {
      navigate(`/tutor?prompt=${encodeURIComponent(queryInput.trim())}`)
    } else {
      navigate('/tutor')
    }
  }

  return (
    <section
      style={{ opacity }}
      className={`min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-8 py-12 text-center transition-opacity duration-300 ${
        opacity > 0.05 ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div className="max-w-6xl mx-auto w-full space-y-6 pt-10 sm:pt-14">
        
        {/* Active Context Ribbon */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 border border-black/[0.06] text-xs text-[#525252] backdrop-blur-xl shadow-editorial">
          <Globe size={13} className="text-indigo-600" />
          <span className="font-semibold text-[#171717]">{lang?.nativeName ?? 'English'}</span>
          <span className="text-[#D4D4D4]">·</span>
          <Layers size={13} className="text-violet-600" />
          <span className="font-semibold text-[#171717]">{levelInfo.title}</span>
          <span className="text-[10px] text-[#737373]">({levelInfo.grades})</span>
        </div>

        {/* Section Header */}
        <div className="space-y-1.5">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#171717]">
            Integrated AI Tutor Workspace
          </h2>
          <p className="font-serif text-xs sm:text-base text-[#525252] max-w-md mx-auto">
            A persistent spatial interface wrapped around the central AI Core with real-time synthesis and dialect intelligence.
          </p>
        </div>

        {/* ── Panoramic Curved Glass HUD Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center text-left">
          
          {/* Left Pane: Chat Stream Preview */}
          <GlassCard variant="default" padding="md" className="space-y-3 shadow-editorial border-black/[0.08]">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-black/[0.06]">
              <span className="font-bold text-[#171717] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Live Vernacular Stream
              </span>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-semibold">ACTIVE</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF9F6] text-[#404040] border border-black/[0.05]">
                <p className="text-[10px] text-[#737373] font-semibold mb-0.5">STUDENT QUERY</p>
                <p>"Explain quantum photosynthesis in {lang?.name}."</p>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50/70 text-[#1e1b4b] border border-indigo-100">
                <p className="text-[10px] text-indigo-700 font-semibold mb-0.5">AI TUTOR SYNTHESIS</p>
                <p className="line-clamp-2">LHCII complex me quantum coherence photon transfer ki efficiency ko 99% tak badha deti hai...</p>
              </div>
            </div>
          </GlassCard>

          {/* Center Space: AI Core Presence */}
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
            <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-200/80 blur-sm" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#737373]">
              Living 3D Spatial Entity
            </span>
          </div>

          {/* Right Pane: Quick AI Study Tools */}
          <GlassCard variant="default" padding="md" className="space-y-3 shadow-editorial border-black/[0.08]">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-black/[0.06]">
              <span className="font-bold text-[#171717] flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                Cognitive Toolkit
              </span>
              <span className="text-[10px] text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full font-semibold">TOOLS</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleLaunchTutor('Speak explanation aloud')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-[#FAF9F6] hover:bg-indigo-50/80 border border-black/[0.05] text-[#404040] hover:text-indigo-900 transition-all text-left cursor-pointer"
              >
                <Volume2 size={13} className="text-indigo-600" />
                <span>Listen Audio</span>
              </button>

              <button
                onClick={() => handleLaunchTutor('Translate into mother tongue')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-[#FAF9F6] hover:bg-indigo-50/80 border border-black/[0.05] text-[#404040] hover:text-indigo-900 transition-all text-left cursor-pointer"
              >
                <Globe size={13} className="text-indigo-600" />
                <span>Translate</span>
              </button>

              <button
                onClick={() => handleLaunchTutor('Simplify for elementary level')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-[#FAF9F6] hover:bg-violet-50/80 border border-black/[0.05] text-[#404040] hover:text-violet-900 transition-all text-left cursor-pointer"
              >
                <Sparkles size={13} className="text-violet-600" />
                <span>Simplify</span>
              </button>

              <button
                onClick={() => handleLaunchTutor('Generate practice quiz')}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-[#FAF9F6] hover:bg-emerald-50/80 border border-black/[0.05] text-[#404040] hover:text-emerald-900 transition-all text-left cursor-pointer"
              >
                <HelpCircle size={13} className="text-emerald-600" />
                <span>Generate Quiz</span>
              </button>

              <button
                onClick={() => handleLaunchTutor('Make structured study notes')}
                className="col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#FAF9F6] hover:bg-indigo-50/80 border border-black/[0.05] text-[#404040] hover:text-indigo-900 transition-all cursor-pointer"
              >
                <FileText size={13} className="text-indigo-600" />
                <span>Make Structured Study Notes</span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* ── Query Input Console ── */}
        <div className="max-w-2xl mx-auto pt-2">
          <GlassCard variant="default" padding="sm" className="border-black/[0.08] shadow-editorial bg-white/95">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleLaunchTutor()
              }}
              className="flex items-center gap-2 p-1"
            >
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={`Ask anything in ${lang?.name ?? 'your language'}...`}
                className="flex-1 bg-transparent px-3 text-sm text-[#171717] placeholder:text-[#A3A3A3] outline-none"
              />

              <button
                type="button"
                onClick={() => handleLaunchTutor()}
                className="p-2 rounded-lg hover:bg-black/[0.04] text-[#737373] hover:text-[#171717] transition-colors cursor-pointer"
                title="Voice Input"
              >
                <Mic size={18} />
              </button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={<Send size={15} />}
                className="px-4"
              >
                Ask
              </Button>
            </form>
          </GlassCard>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleLaunchTutor()}
            icon={<ArrowRight size={18} />}
            iconPosition="right"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-medium shadow-editorial"
          >
            Launch Full Workspace
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setSelectedRole('student')
              navigate('/learning')
            }}
            icon={<BookOpen size={18} />}
            iconPosition="left"
            className="w-full sm:w-auto text-base"
          >
            Explore Learning Path
          </Button>
        </div>
      </div>
    </section>
  )
}
