import { ArrowRight, Globe, Layers } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useExperienceScroll } from '../../components/cinematic/ScrollContext'

export function CoreRevealScene() {
  const { progress } = useExperienceScroll()

  // Calculate visibility curve for Scene 2 (active around progress 0.15 - 0.35)
  let opacity = 0
  if (progress >= 0.08 && progress <= 0.40) {
    if (progress < 0.20) {
      opacity = (progress - 0.08) / 0.12
    } else if (progress > 0.28) {
      opacity = 1 - (progress - 0.28) / 0.12
    } else {
      opacity = 1
    }
  }

  const handleStart = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({
      top: 0.35 * scrollHeight,
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
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Subtle Spatial Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-black/[0.06] text-[#525252] text-xs font-semibold uppercase tracking-wider backdrop-blur-xl shadow-sm">
          <span>The Spatial AI Core</span>
        </div>

        {/* Minimal Editorial Statement */}
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#171717] leading-[1.05]">
          A new medium for learning.
        </h2>

        {/* Supporting Copy */}
        <p className="font-serif text-lg sm:text-2xl text-[#525252] font-normal max-w-xl mx-auto leading-relaxed text-balance">
          An AI environment that understands your regional mother tongue and adapts explanations to your educational level.
        </p>

        {/* Minimal Context Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/80 border border-black/[0.06] text-xs font-medium text-[#404040] shadow-sm">
            <Globe size={14} className="text-indigo-600" />
            <span>11 Indic Languages</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/80 border border-black/[0.06] text-xs font-medium text-[#404040] shadow-sm">
            <Layers size={14} className="text-violet-600" />
            <span>Primary → Professional</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            icon={<ArrowRight size={18} />}
            iconPosition="right"
            className="px-8 py-3.5 text-base"
          >
            Explore Languages
          </Button>
        </div>
      </div>
    </section>
  )
}
