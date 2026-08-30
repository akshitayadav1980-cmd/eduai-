import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Globe, Layers, ArrowRight, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '../../components/ui/GlassCard'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'
import { getLanguageById } from '../../data/languages'
import { speechService } from '../../services/speech'
import { useExperienceScroll } from '../../components/cinematic/ScrollContext'
import type { EducationLevel } from '../../types'

interface DemoPayload {
  level: EducationLevel
  levelLabel: string
  badge: string
  calibration: string
  keywords: string[]
  explanations: Record<string, { question: string; text: string }>
}

const DEMO_CONCEPTS: Record<EducationLevel, DemoPayload> = {
  primary: {
    level: 'primary',
    levelLabel: 'Primary',
    badge: 'Grades 1–5 · Visual Metaphors',
    calibration: 'Calibrated for visual & tangible real-world metaphors with simplified everyday vocabulary.',
    keywords: ['Sunlight (धूप)', 'Water (पानी)', 'Leaves (पत्तियां)', 'Food (भोजन)'],
    explanations: {
      en: {
        question: 'What is photosynthesis?',
        text: 'Plants make their own delicious food using sunlight, water from the soil, and air. The green leaves act like tiny solar kitchens that give off fresh oxygen for us to breathe! 🌱',
      },
      hi: {
        question: 'प्रकाश संश्लेषण (Photosynthesis) क्या है?',
        text: 'पौधे धूप, पानी और हवा की मदद से अपना भोजन खुद बनाते हैं। हरी पत्तियां नन्ही रसोई की तरह काम करती हैं और हमें सांस लेने के लिए ताज़ा ऑक्सीजन देती हैं! 🌱',
      },
      mr: {
        question: 'प्रकाशसंश्लेषण म्हणजे काय?',
        text: 'वनस्पती सूर्यप्रकाश, पाणी आणि हवेच्या मदतीने स्वतःचे अन्न स्वतः तयार करतात. हिरवी पाने छोट्या स्वयंपाकघरासारखी काम करतात आणि आपल्याला शुद्ध ऑक्सिजन देतात! 🌱',
      },
      bn: {
        question: 'সালোকসংশ্লেষ (Photosynthesis) কী?',
        text: 'উদ্ভিদ সূর্যালোক, মাটি থেকে জল এবং বাতাস ব্যবহার করে নিজের খাবার নিজে তৈরি করে। সবুজ পাতাগুলো ছোট রান্নঘরের মতো কাজ করে এবং আমাদের জন্য অক্সিজেন তৈরি করে! 🌱',
      },
      ta: {
        question: 'ஒளிச்சேர்க்கை என்றால் என்ன?',
        text: 'தாவரங்கள் சூரிய ஒளி, நீர் மற்றும் காற்றைப் பயன்படுத்தி தங்களுக்கான உணவைத் தாங்களே தயாரிக்கின்றன. பச்சை இலைகள் சமையலறை போல செயல்பட்டு நமக்கு தூய ஆக்ஸிஜனைத் தருகின்றன! 🌱',
      },
      te: {
        question: 'కిరణజన్య సంయోగక్రియ అంటే ఏమిటి?',
        text: 'మొక్కలు సూర్యరశ్మి, నీరు మరియు గాలిని ఉపయోగించి తమ ఆహారాన్ని తామే తయారు చేసుకుంటాయి. ఆకుపచ్చని ఆకులు చిన్న వంటగదిలా పనిచేసి మనకు ప్రాణవాయువును అందిస్తాయి! 🌱',
      },
    },
  },
  secondary: {
    level: 'secondary',
    levelLabel: 'Secondary',
    badge: 'Grades 6–10 · Conceptual Formulae',
    calibration: 'Calibrated for biochemical terminology, cellular organelles, and balanced chemical transformations.',
    keywords: ['Chloroplast', 'Glucose', 'Carbon Dioxide', 'Cellular Energy'],
    explanations: {
      en: {
        question: 'Explain the mechanism of photosynthesis.',
        text: 'Photosynthesis is the endothermic biochemical process by which chlorophyll pigments in plant chloroplasts convert light energy into chemical energy, synthesizing glucose (C₆H₁₂O₆) from carbon dioxide and water.',
      },
      hi: {
        question: 'प्रकाश संश्लेषण की प्रक्रिया समझाइए।',
        text: 'प्रकाश संश्लेषण वह जैव-रासायनिक प्रक्रिया है जिसमें पौधों के क्लोरोप्लास्ट में मौजूद क्लोरोफिल प्रकाश ऊर्जा को रासायनिक ऊर्जा में बदलकर कार्बन डाइऑक्साइड और पानी से ग्लूकोज बनाते हैं।',
      },
      mr: {
        question: 'प्रकाशसंश्लेषण प्रक्रिया स्पष्ट करा.',
        text: 'प्रकाशसंश्लेषण ही एक जैव-रासायनिक प्रक्रिया आहे ज्यामध्ये वनस्पतींच्या हरितलवकांमधील क्लोरोफिल सूर्यप्रकाशाचे रूपांतर रासायनिक उर्जेमध्ये करून ग्लुकोजची निर्मिती करते.',
      },
      bn: {
        question: 'সালোকসংশ্লেষ প্রক্রিয়ার ব্যাখ্যা দাও।',
        text: 'সালোকসংশ্লেষ হলো একটি জৈব-রাসায়নিক प्रक्रिया যার মাধ্যমে উদ্ভিদের ক্লোরোপ্লাস্টে থাকা ক্লোরোফিল আলোক শক্তিকে রাসায়নিক শক্তিতে রূপান্তর করে গ্লুকোজ তৈরি করে।',
      },
      ta: {
        question: 'ஒளிச்சேர்க்கை செயல்முறையை விளக்குக.',
        text: 'ஒளிச்சேர்க்கை என்பது தாவரங்களின் குளோரோபிளாஸ்டில் உள்ள பச்சையம் ஒளி ஆற்றலை வேதி ஆற்றலாக மாற்றி குளுக்கோஸை உற்பத்தி செய்யும் உயிரி-வேதியியல் செயல்முறையாகும்.',
      },
      te: {
        question: 'కిరణజన్య సంయోగక్రియ విధానాన్ని వివరించండి.',
        text: 'కిరణజన్య సంయోగక్రియ అనేది క్లోరోఫిల్ సహాయంతో కాంతి శక్తిని రసాయన శక్తిగా మార్చి గ్లూకోజ్ తయారుచేసే జీవ రసాయన ప్రక్రియ.',
      },
    },
  },
  higher_secondary: {
    level: 'higher_secondary',
    levelLabel: 'Higher Sec',
    badge: 'Grades 11–12 · Molecular Pathways',
    calibration: 'Calibrated for molecular reaction pathways, light & dark phases, and thylakoid photolysis.',
    keywords: ['Thylakoid Membrane', 'Calvin Cycle', 'Photolysis', 'ATP / NADPH'],
    explanations: {
      en: {
        question: 'Describe light reactions and dark reactions in photosynthesis.',
        text: 'Photosynthesis comprises two coupled phases: light-dependent reactions in the thylakoid membrane generating ATP and NADPH via water photolysis, and the light-independent Calvin Cycle in the stroma fixing CO₂ into triose phosphates via RuBisCO.',
      },
      hi: {
        question: 'प्रकाशिक और अप्रकाशिक अभिक्रियाओं का वर्णन करें।',
        text: 'प्रकाश संश्लेषण दो चरणों में होता है: थायलाकोइड झिल्ली में प्रकाश-निर्भर अभिक्रियाएं जो जल अपघटन (Photolysis) द्वारा ATP और NADPH बनाती हैं, तथा स्ट्रोमा में केल्विन चक्र जो CO₂ का स्थिरीकरण करता है।',
      },
      mr: {
        question: 'प्रकाशसंश्लेषण मधील प्रकाश आणि अप्रकाश अभिक्रिया स्पष्ट करा.',
        text: 'प्रकाशसंश्लेषण दोन टप्प्यांत घडते: थायलाकॉइड पडद्यामध्ये प्रकाश-अवलंबित अभिक्रिया आणि स्ट्रोमामध्ये केल्व्हिन चक्र.',
      },
      bn: {
        question: 'আলোক নির্ভর ও আলোক নিরপেক্ষ বিক্রিয়ার বর্ণনা দাও।',
        text: 'সালোকসংশ্লেষ দুটি দশায় ঘটে: থাইলাকয়েড ঝিল্লিতে আলোক-নির্ভর দশা এবং স্ট্রোমায় কেলভিন চক্র।',
      },
      ta: {
        question: 'ஒளி மற்றும் இருள் வினைகளை விளக்குக.',
        text: 'ஒளிச்சேர்க்கை தைலகாய்டு சவ்வில் ஒளி வினைகள் மற்றும் ஸ்ட்ரோமாவில் கால்வின் சுழற்சி என இரண்டு நிலைகளைக் கொண்டுள்ளது.',
      },
      te: {
        question: 'కాంతి మరియు నిష్కాంతి చర్యలను వివరించండి.',
        text: 'కిరణజన్య సంయోగక్రియ థైలకాయిడ్ పొరలలో కాంతి చర్యలు మరియు స్ట్రోమాలో కెల్విన్ చక్రం ద్వారా జరుగుతుంది.',
      },
    },
  },
  college: {
    level: 'college',
    levelLabel: 'College',
    badge: 'Undergraduate · Biophysical Kinetics',
    calibration: 'Calibrated for quantum resonance energy transfer, Z-scheme redox potentials, and RuBisCO kinetics.',
    keywords: ['Photosystem II / I', 'Resonance Transfer', 'RuBisCO Oxygenase', 'Chemiosmosis'],
    explanations: {
      en: {
        question: 'Analyze quantum coherence and non-photochemical quenching in Photosystem II.',
        text: 'Exciton migration across light-harvesting antenna complexes (LHCII) exhibits ultrafast Förster resonance energy transfer to P680 reaction centers with ~98% quantum efficiency. Non-photochemical quenching (NPQ) modulates thermal dissipation under high photon flux.',
      },
      hi: {
        question: 'फोटोसिस्टम II में क्वांटम रेजोनेंस और इलेक्ट्रॉन प्रवाह का विश्लेषण करें।',
        text: 'LHCII एंटीना कॉम्प्लेक्स में एक्सिटॉन ट्रांसफर P680 रिएक्शन सेंटर तक ~98% क्वांटम दक्षता से ऊर्जा स्थानांतरित करता है। उच्च प्रकाश तीव्रता में NPQ थर्मल ऊर्जा के रूप में अतिरिक्त ऊर्जा को सुरक्षित नष्ट करता है।',
      },
      mr: {
        question: 'फोटोसिस्टम II मधील क्वांटम ऊर्जा हस्तांतरणाचे विश्लेषण करा.',
        text: 'LHCII कॉम्प्लेक्समधील एक्सायटॉन ऊर्जा P680 रिॲक्शन सेंटरपर्यंत ~98% कार्यक्षमतेने पोहोचते.',
      },
      bn: {
        question: 'ফটোসিস্টেম II-এ কোয়ান্টাম এনার্জি স্থানান্তরের বিশ্লেষণ কর।',
        text: 'LHCII অ্যান্টেনা কমপ্লেক্সে এক্সাইটন মাইগ্রেশন P680 বিক্রিয়া কেন্দ্রে শক্তি স্থানান্তর করে।',
      },
      ta: {
        question: 'ஒளிஅமைப்பு II-ல் குவாண்டம் ஆற்றல் பரிமாற்றத்தை பகுப்பாய்வு செய்க.',
        text: 'LHCII ஆன்டெனா வளாகத்தில் எக்சைட்டான் பரிமாற்றம் P680 மையத்திற்கு ~98% செயல்திறனுடன் ஆற்றலை மாற்றுகிறது.',
      },
      te: {
        question: 'ఫోటోసిస్టమ్ II లో క్వాంటమ్ ఎనర్జీ బదిలీని విశ్లేషించండి.',
        text: 'LHCII కాంప్లెక్స్‌లో ఎక్సైటాన్ మైగ్రేషన్ P680 రియాక్షన్ సెంటర్‌కు శక్తిని బదిలీ చేస్తుంది.',
      },
    },
  },
  professional: {
    level: 'professional',
    levelLabel: 'Professional',
    badge: 'Research & Applied · Synthetic Biology',
    calibration: 'Calibrated for synthetic carbon fixation pathways, artificial photocatalytic water splitting, and metabolic engineering.',
    keywords: ['CETCH Cycle', 'Artificial Leaf', 'Quantum Electrodynamics', 'Electrocatalytic CO2'],
    explanations: {
      en: {
        question: 'Evaluate synthetic carbon-fixing bypasses to overcome RuBisCO oxygenation.',
        text: 'Engineering non-natural carbon-concentrating mechanisms via in-vitro enzyme cascades (such as the CETCH cycle) achieves a 20% higher ATP-to-biomass conversion efficiency compared to natural C3 pathways, circumventing photorespiration losses.',
      },
      hi: {
        question: 'RuBisCO की सीमाओं को दूर करने के लिए सिंथेटिक कार्बन फिक्सेशन का मूल्यांकन करें।',
        text: 'सिंथेटिक एंजाइम कैस्केड (जैसे CETCH चक्र) द्वारा इन-विट्रो कार्बन-कंसंट्रेटिंग सिस्टम प्राकृतिक C3 मार्गों की तुलना में 20% अधिक ATP-से-बायोमास दक्षता प्राप्त करते हैं, जिससे फोटोरेस्पिरेशन का नुकसान समाप्त होता है।',
      },
      mr: {
        question: 'सिंथेटिक कार्बन फिक्सेशन मेकॅनिझमचे मूल्यांकन करा.',
        text: 'CETCH सायकलसारखे सिंथेटिक एन्झाईम पाथवे नैसर्गिक C3 पाथवेपेक्षा 20% अधिक कार्यक्षमतेने काम करतात.',
      },
      bn: {
        question: 'কৃত্রিম কার্বন ফিক্সেশন প্রক্রিয়ার মূল্যায়ন কর।',
        text: 'সিন্থেটিক এনজাইম ক্যাসকেড (যেমন CETCH চক্র) প্রাকৃতিক C3 পথের তুলনায় 20% বেশি দক্ষতা অর্জন করে।',
      },
      ta: {
        question: 'செயற்கை கார்பன் நிலைநிறுத்த முறையை மதிப்பீடு செய்க.',
        text: 'செயற்கை என்சைம் தொடர்கள் (CETCH சுழற்சி போன்றவை) இயற்கை C3 வழிகளை விட 20% அதிக செயல்திறனை அளிக்கின்றன.',
      },
      te: {
        question: 'సింథటిక్ కార్బన్ ఫిక్సేషన్ ప్రక్రియను అంచనా వేయండి.',
        text: 'CETCH సైకిల్ వంటి సింథటిక్ ఎంజైమ్ మార్గాలు సహజ C3 కంటే 20% ఎక్కువ సామర్థ్యాన్ని అందిస్తాయి.',
      },
    },
  },
}

export function AdaptiveScene() {
  const { progress } = useExperienceScroll()
  const { educationLevel, setEducationLevel, selectedLanguageId, setSelectedLanguageId, setAssistantState } = useAppStore()
  const [selectedDemoLevel, setSelectedDemoLevel] = useState<EducationLevel>(educationLevel)

  let opacity = 0
  if (progress >= 0.58 && progress <= 0.84) {
    if (progress < 0.66) {
      opacity = (progress - 0.58) / 0.08
    } else if (progress > 0.76) {
      opacity = 1 - (progress - 0.76) / 0.08
    } else {
      opacity = 1
    }
  }

  const currentLevel = selectedDemoLevel || educationLevel || 'primary'
  const currentContent = DEMO_CONCEPTS[currentLevel] ?? DEMO_CONCEPTS.primary
  const currentExplanation =
    currentContent.explanations[selectedLanguageId] ??
    currentContent.explanations.en ??
    currentContent.explanations.hi

  const handleLevelChange = (lvl: EducationLevel) => {
    setSelectedDemoLevel(lvl)
    setEducationLevel(lvl)
    setAssistantState({ mode: 'thinking', message: `Adapting to ${lvl}` })
    setTimeout(() => {
      setAssistantState({ mode: 'idle', message: null })
    }, 1000)
  }

  const handleSpeak = () => {
    if (!currentExplanation) return
    const lang = getLanguageById(selectedLanguageId)
    speechService.speak(currentExplanation.text, lang?.locale || 'en-IN')
  }

  const handleNextSection = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({
      top: 0.88 * scrollHeight,
      behavior: 'smooth',
    })
  }

  const levels: EducationLevel[] = ['primary', 'secondary', 'higher_secondary', 'college', 'professional']

  return (
    <section
      style={{ opacity }}
      className={`min-h-screen w-full flex flex-col items-center justify-center px-6 sm:px-12 py-12 text-center transition-opacity duration-300 ${
        opacity > 0.05 ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-black/[0.06] text-[#525252] text-xs font-semibold uppercase tracking-wider backdrop-blur-xl shadow-sm">
            <span>Adaptive Intelligence</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#171717]">
            Same question. Different level-appropriate explanation.
          </h2>
          <p className="font-serif text-base sm:text-lg text-[#525252] max-w-lg mx-auto">
            Experience how Vernacular AI instantly shifts explanation models from elementary stories to research mechanics.
          </p>
        </div>

        {/* Interactive Adaptive Demo Console */}
        <GlassCard variant="default" padding="lg" className="text-left border-black/[0.08] shadow-editorial">
          
          {/* Level Switcher Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F5F4EF] border border-black/[0.06] overflow-x-auto no-scrollbar w-full sm:w-auto">
              {levels.map((lvl) => {
                const isActive = currentLevel === lvl
                return (
                  <button
                    key={lvl}
                    onClick={() => handleLevelChange(lvl)}
                    className={[
                      'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap',
                      isActive
                        ? 'bg-[#171717] text-white font-semibold shadow-sm'
                        : 'text-[#525252] hover:text-[#171717] hover:bg-white/60',
                    ].join(' ')}
                  >
                    {DEMO_CONCEPTS[lvl].levelLabel}
                  </button>
                )
              })}
            </div>

            {/* Language Selection Pills */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Globe size={13} className="text-indigo-600 shrink-0" />
              <div className="flex items-center gap-1 bg-[#F5F4EF] p-1 rounded-lg border border-black/[0.06]">
                {['hi', 'en', 'mr', 'bn', 'ta', 'te'].map((code) => {
                  const l = getLanguageById(code)
                  if (!l) return null
                  const isSelected = selectedLanguageId === code
                  return (
                    <button
                      key={code}
                      onClick={() => setSelectedLanguageId(code)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-[#171717] text-white font-semibold shadow-xs'
                          : 'text-[#525252] hover:text-[#171717]'
                      }`}
                    >
                      {l.nativeName}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Question Prompt */}
          <div className="pt-4 pb-2">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Depth Calibration & Vernacular Translation
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentContent.badge}
              </span>
            </div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#171717] tracking-tight">
              "{currentExplanation.question}"
            </h3>
          </div>

          {/* Dynamic Explanation Crossfade */}
          <div className="relative min-h-[110px] p-4 sm:p-5 rounded-xl bg-[#FAF9F6] border border-black/[0.05] my-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentLevel}-${selectedLanguageId}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <p className="text-xs sm:text-sm text-[#262626] leading-relaxed">
                  {currentExplanation.text}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-black/[0.05]">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-[#737373]">
                    Keywords:
                  </span>
                  {currentContent.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-black/[0.06] text-[10px] font-medium text-[#404040] shadow-xs"
                    >
                      <CheckCircle2 size={10} className="text-indigo-600" />
                      {kw}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 text-[11px] text-[#737373]">
            <div className="flex items-center gap-1.5">
              <Layers size={12} className="text-violet-600 shrink-0" />
              <span>{currentContent.calibration}</span>
            </div>

            <button
              onClick={handleSpeak}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F5F4EF] border border-black/[0.08] text-xs text-[#171717] transition-all font-medium cursor-pointer shadow-xs shrink-0"
              title="Listen to Vernacular Audio"
            >
              <Volume2 size={13} className="text-indigo-600" />
              <span>Audio Voice</span>
            </button>
          </div>
        </GlassCard>

        {/* Continue to Tutor Scene */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleNextSection}
            icon={<ArrowRight size={16} />}
            iconPosition="right"
          >
            Enter Full AI Tutor
          </Button>
        </div>
      </div>
    </section>
  )
}
