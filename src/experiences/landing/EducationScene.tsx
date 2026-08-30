import { Layers, ArrowRight, BookOpen, GraduationCap, Brain, Sparkles } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { EDUCATION_LEVELS } from '../../data/educationLevels'
import { useAppStore } from '../../store/useAppStore'
import { useExperienceScroll } from '../../components/cinematic/ScrollContext'
import type { EducationLevel } from '../../types'

const iconMap: Record<string, React.ComponentType<any>> = {
  Sparkles: Sparkles,
  BookOpen: BookOpen,
  Layers: Layers,
  GraduationCap: GraduationCap,
  Brain: Brain,
}

export function EducationScene() {
  const { progress } = useExperienceScroll()
  const { educationLevel, setEducationLevel, setAssistantState } = useAppStore()

  let opacity = 0
  if (progress >= 0.42 && progress <= 0.72) {
    if (progress < 0.52) {
      opacity = (progress - 0.42) / 0.10
    } else if (progress > 0.62) {
      opacity = 1 - (progress - 0.62) / 0.10
    } else {
      opacity = 1
    }
  }

  const handleSelect = (level: EducationLevel) => {
    setEducationLevel(level)
    setAssistantState({ mode: 'success', message: `Calibrated to ${level}` })
    setTimeout(() => {
      setAssistantState({ mode: 'idle', message: null })
    }, 1500)
  }

  const handleNextSection = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({
      top: 0.72 * scrollHeight,
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
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-black/[0.06] text-[#525252] text-xs font-semibold uppercase tracking-wider backdrop-blur-xl shadow-sm">
            <Layers size={13} className="text-violet-600" />
            <span>Cognitive Depth Calibration</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#171717]">
            How deeply do you want to understand?
          </h2>
          <p className="font-serif text-base sm:text-lg text-[#525252] max-w-md mx-auto">
            Choose your learning level. The AI shifts from simple analogies to rigorous technical depth.
          </p>
        </div>

        {/* Education Level Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4 w-full pt-2"
          role="radiogroup"
          aria-label="Select your education level"
        >
          {EDUCATION_LEVELS.map((lvl) => {
            const isSelected = educationLevel === lvl.id
            const Icon = iconMap[lvl.iconName] || BookOpen

            return (
              <GlassCard
                key={lvl.id}
                variant={isSelected ? 'highlighted' : 'interactive'}
                padding="md"
                onClick={() => handleSelect(lvl.id)}
                className={`relative flex flex-col justify-between text-left group cursor-pointer transition-all duration-300 min-h-[220px] md:min-h-[250px] ${
                  isSelected ? 'ring-2 ring-indigo-600 bg-white/95 shadow-editorial md:scale-105 z-10' : 'opacity-85 hover:opacity-100'
                }`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(lvl.id)
                  }
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                          : 'bg-black/[0.03] border-black/[0.06] text-[#737373] group-hover:text-[#171717]'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                      {lvl.grades}
                    </span>
                  </div>

                  <h3 className={`text-base font-bold tracking-tight mb-1 ${
                    isSelected ? 'text-[#171717]' : 'text-[#262626]'
                  }`}>
                    {lvl.title}
                  </h3>

                  <p className="text-xs text-[#525252] leading-relaxed">
                    {lvl.description}
                  </p>
                </div>

                {/* Complexity Meters */}
                <div className="w-full pt-3 border-t border-black/[0.06]">
                  <div className="flex items-center justify-between text-[9px] font-semibold text-[#737373] mb-1">
                    <span>DEPTH</span>
                    <span className={isSelected ? 'text-indigo-600 font-bold' : ''}>LVL {lvl.difficulty}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          step <= lvl.difficulty
                            ? isSelected
                              ? 'bg-indigo-600'
                              : 'bg-[#A3A3A3]'
                            : 'bg-black/[0.06]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>

        {/* Action */}
        <div>
          <Button
            variant="primary"
            size="md"
            onClick={handleNextSection}
            icon={<ArrowRight size={16} />}
            iconPosition="right"
          >
            See Adaptive Demonstration
          </Button>
        </div>
      </div>
    </section>
  )
}
