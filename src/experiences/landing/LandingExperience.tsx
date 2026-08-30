import { ExperienceLayout } from '../../components/cinematic/ExperienceLayout'
import { IntroScene } from './IntroScene'
import { CoreRevealScene } from './CoreRevealScene'
import { LanguageScene } from './LanguageScene'
import { EducationScene } from './EducationScene'
import { AdaptiveScene } from './AdaptiveScene'
import { TutorEntryScene } from './TutorEntryScene'

export function LandingExperience() {
  return (
    <ExperienceLayout totalSections={6} showNav={true} interactiveCanvas={false}>
      {/* Scene 1: Pitch Black Awakening (0.00 -> 0.15) */}
      <IntroScene />

      {/* Scene 2: Oversized Manifesto & Core Reveal (0.15 -> 0.35) */}
      <CoreRevealScene />

      {/* Scene 3: Spatial Mother Tongue Selection (0.35 -> 0.55) */}
      <LanguageScene />

      {/* Scene 4: Cognitive Depth & Education Calibration (0.55 -> 0.72) */}
      <EducationScene />

      {/* Scene 5: Adaptive Question Demonstration (0.72 -> 0.88) */}
      <AdaptiveScene />

      {/* Scene 6: Seamless AI Tutor Portal (0.88 -> 1.00) */}
      <TutorEntryScene />
    </ExperienceLayout>
  )
}
