import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Volume2, Globe, Layers, Brain, CheckCircle2 } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { useAppStore } from '../../store/useAppStore'
import { getLanguageById } from '../../data/languages'
import { speechService } from '../../services/speech'

export type EducationLevel = 'Primary' | 'Secondary' | 'Higher Secondary' | 'College' | 'Professional'

interface ExplanationContent {
  level: EducationLevel
  badge: string
  calibration: string
  keywords: string[]
  explanations: Record<string, { question: string; text: string }>
}

const ADAPTIVE_DATA: Record<EducationLevel, ExplanationContent> = {
  Primary: {
    level: 'Primary',
    badge: 'Grades 1–5 · Foundation',
    calibration: 'Calibrated for visual & tangible real-world metaphors with simplified vocabulary.',
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
  Secondary: {
    level: 'Secondary',
    badge: 'Grades 6–10 · Conceptual',
    calibration: 'Calibrated for biochemical terminology, cellular organelles, and balanced reactions.',
    keywords: ['Chloroplast', 'Glucose', 'Carbon Dioxide', 'Cellular Energy'],
    explanations: {
      en: {
        question: 'Explain the mechanism of photosynthesis.',
        text: 'Photosynthesis is the endothermic biochemical process by which chlorophyll pigments in plant chloroplasts convert light energy into chemical energy, synthesizing glucose (C₆H₁₂O₆) from carbon dioxide and water.',
      },
      hi: {
        question: 'प्रकाश संश्लेषण की प्रक्रिया समझाइए।',
        text: 'प्रकाश संश्लेषण वह जैव-रासायनिक प्रक्रिया है जिसमें पौधों के क्लोरोप्लास्ट में मौजूद क्लोरोफिल प्रकाश ऊर्जा को रासायनिक ऊर्जा में बदलकर कार्बन डाइऑक्साइड और पानी से ग्लूकोज (ऊर्जा) बनाते हैं।',
      },
      mr: {
        question: 'प्रकाशसंश्लेषण प्रक्रिया स्पष्ट करा.',
        text: 'प्रकाशसंश्लेषण ही एक जैव-रासायनिक प्रक्रिया आहे ज्यामध्ये वनस्पतींच्या हरितलवकांमधील क्लोरोफिल सूर्यप्रकाशाचे रूपांतर रासायनिक उर्जेमध्ये करून ग्लुकोजची निर्मिती करते.',
      },
      bn: {
        question: 'সালোকসংশ্লেষ প্রক্রিয়ার ব্যাখ্যা দাও।',
        text: 'সালোকসংশ্লেষ হলো একটি জৈব-রাসায়নিক প্রক্রিয়া যার মাধ্যমে উদ্ভিদের ক্লোরোপ্লাস্টে থাকা ক্লোরোফিল আলোক শক্তিকে রাসায়নিক শক্তিতে রূপান্তর করে গ্লুকোজ তৈরি করে।',
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
  'Higher Secondary': {
    level: 'Higher Secondary',
    badge: 'Grades 11–12 · Advanced',
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
        question: 'प्रकाश अभिक्रिया आणि केल्विन चक्र स्पष्ट करा.',
        text: 'प्रकाशसंश्लेषण दोन टप्प्यांत घडते: थायलाकोइड पडद्यामधील प्रकाश-आश्रित अभिक्रिया ज्यात ATP आणि NADPH तयार होतात, आणि स्ट्रोमामधील केल्विन चक्र ज्याद्वारे CO₂ चे स्थिरीकरण होते.',
      },
      bn: {
        question: 'আলোক নির্ভর এবং কেলভিন চক্রের বর্ণনা দাও।',
        text: 'সালোকসংশ্লেষ দুটি স্তরে বিভক্ত: থাইলাকয়েড পর্দায় আলোক-নির্ভর বিক্রিয়ার মাধ্যমে ATP ও NADPH উৎপাদন, এবং স্ট্রোমায় কেলভিন চক্রের মাধ্যমে কার্বন ডাই অক্সাইড সংবন্ধন।',
      },
      ta: {
        question: 'ஒளி மற்றும் இருள் வினைகளை விவரிக்கவும்.',
        text: 'ஒளிச்சேர்க்கை இரண்டு நிலைகளைக் கொண்டுள்ளது: தைலகாய்டு படலத்தில் நிகழும் ஒளி வினைகள் (ATP & NADPH உருவாக்கம்) மற்றும் ஸ்ட்ரோமாவில் நிகழும் கால்வின் சுழற்சி.',
      },
      te: {
        question: 'కాంతి చర్యలు మరియు డార్క్ రియాక్షన్లను వివరించండి.',
        text: 'కిరణజన్య సంయోగక్రియ రెండు దశల్లో జరుగుతుంది: థైలాకాయిడ్ పొరలలో కాంతి ఆధారిత చర్యలు (ATP/NADPH ఉత్పత్తి) మరియు స్ట్రోమాలోని కాల్విన్ సైకిల్.',
      },
    },
  },
  College: {
    level: 'College',
    badge: 'Undergraduate · Specialized',
    calibration: 'Calibrated for biophysical electron transport, Z-scheme kinetics, and enzyme thermodynamics.',
    keywords: ['Photosystem I & II', 'RuBisCO Kinetics', 'Proton Gradient', 'Chemiosmosis'],
    explanations: {
      en: {
        question: 'Analyze the Z-scheme electron transport and chemiosmotic ATP synthesis.',
        text: 'Light absorption by P680 and P700 reaction centers drives non-cyclic electron flow through the cytochrome b₆f complex. This establishes a transmembrane electrochemical proton gradient (ΔpH) across the thylakoid lumen that powers CF₀-CF₁ ATP synthase.',
      },
      hi: {
        question: 'Z-स्कीम इलेक्ट्रॉन परिवहन तथा कीमियोस्मोसिस का विश्लेषण करें।',
        text: 'P680 तथा P700 अभिक्रिया केंद्रों द्वारा फोटॉन अवशोषण से साइटोक्रोम b₆f कॉम्प्लेक्स के माध्यम से नॉन-साइक्लिक इलेक्ट्रॉन प्रवाह होता है, जो थायलाकोइड ल्यूमेन में प्रोटॉन ग्रेडिएंट (ΔpH) स्थापित कर ATP सिंथेस को ऊर्जा प्रदान करता है।',
      },
      mr: {
        question: 'Z-स्कीम इलेक्ट्रॉन वहन प्रणालीचे विश्लेषण करा.',
        text: 'P680 आणि P700 अभिक्रिया केंद्रांद्वारे फोटॉन शोषणामुळे सायटोक्रोम b₆f कॉम्प्लेक्समधून इलेक्ट्रॉनचे वहन होते, ज्यामुळे थायलाकोइड ल्युमेनमध्ये प्रोटॉन प्रवणता निर्माण होऊन ATP ची निर्मिती होते.',
      },
      bn: {
        question: 'Z-স্কিম ইলেকট্রন পরিবহন এবং রাসায়নিক সংশ্লেষণ বিশ্লেষণ করো।',
        text: 'P680 ও P700 বিক্রিয়া কেন্দ্রে ফোটন শোষণের ফলে সাইটোক্রোম b₆f কমপ্লেক্সের মধ্য দিয়ে নন-সাইক্লিক ইলেকট্রন প্রবাহ ঘটে, যা থাইলাকয়েড লুমেনে প্রোটন গ্রেডিয়েন্ট তৈরি করে ATP সংশ্লেষ ঘটায়।',
      },
      ta: {
        question: 'Z-திட்ட எலக்ட்ரான் பரிமாற்றம் மற்றும் ATP தொகுப்பை ஆராய்க.',
        text: 'P680 மற்றும் P700 மையங்களில் ஃபோட்டான் உறிஞ்சுதலால் சைட்ரோக்ரோம் b₆f வழியாக எலக்ட்ரான் பாய்கிறது, இது புரோட்டான் சாய்வுநிலையை உருவாக்கி ATP உற்பத்தியைத் தூண்டுகிறது.',
      },
      te: {
        question: 'Z-స్కీమ్ ఎలక్ట్రాన్ రవాణా మరియు ATP సంశ్లేషణను విశ్లేషించండి.',
        text: 'P680 మరియు P700 వద్ద కాంతి శోషణ ద్వారా సైటోక్రోమ్ b₆f కాంప్లెక్స్ గుండా ఎలక్ట్రాన్ ప్రవాహం జరిగి, థైలాకాయిడ్ ల్యూమన్‌లో ప్రోటాన్ ప్రవణతను ఏర్పరిచి ATP సంశ్లేషణను నడుపుతుంది.',
      },
    },
  },
  Professional: {
    level: 'Professional',
    badge: 'Research & Applied Engineering',
    calibration: 'Calibrated for quantum coherence in LHC complexes and genetic engineering of C4/CAM synthetic pathways.',
    keywords: ['Quantum Coherence', 'LHCII Complexes', 'RuBisCO Oxygenase Ratio', 'Synthetic Carbon Fixation'],
    explanations: {
      en: {
        question: 'Examine quantum excitation transfer and catalytic optimizations in synthetic photosynthetic systems.',
        text: 'Excitonic coupling in trimeric LHCII complexes demonstrates room-temperature quantum coherence in Förster resonance energy transfer (FRET). Current bioengineering targets altering the carboxylation-to-oxygenation specificity of RuBisCO to circumvent photorespiratory energy penalties in transgenic crops.',
      },
      hi: {
        question: 'सिंथेटिक प्रकाश संश्लेषक प्रणालियों में क्वांटम ऊर्जा स्थानांतरण का विश्लेषण।',
        text: 'LHCII कॉम्प्लेक्स में एक्साइटोनिक कपलिंग FRET के अंतर्गत क्वांटम कोहेरेंस प्रदर्शित करती है। आधुनिक बायोइंजीनियरिंग ट्रांसजेनिक फसलों में प्रकाश-श्वसन (photorespiration) के नुकसान को कम करने हेतु RuBisCO की उत्प्रेरक दक्षता को पुनः इंजीनियर कर रही है।',
      },
      mr: {
        question: 'कृत्रिम प्रकाशसंश्लेषण प्रणालीतील क्वांटम कोहेरन्सचे परीक्षण.',
        text: 'LHCII कॉम्प्लेक्समधील एक्सायटॉनिक कपलिंग FRET अंतर्गत क्वांटम कोहेरन्स दर्शवते. आधुनिक बायोटेक्नॉलॉजी RuBisCO ची कार्यक्षमता वाढवून फोटोरेस्पिरेशनचे नुकसान कमी करण्यावर केंद्रित आहे.',
      },
      bn: {
        question: 'সিন্থেটিক ফটোসিন্থেটিক সিস্টেমে কোয়ান্টাম শক্তি রূপান্তরের গভীর বিশ্লেষণ।',
        text: 'LHCII কমপ্লেক্সে এক্সাইটোনিক কাপলিং কোয়ান্টাম সুসংগততা (quantum coherence) প্রদর্শন করে। বর্তমান বায়োইঞ্জিনিয়ারিং RuBisCO-এর কার্বক্সিলেশন দক্ষতা বাড়িয়ে রূপান্তরকামী ফসলের উৎপাদনশীলতা বৃদ্ধির লক্ষ্যে কাজ করছে।',
      },
      ta: {
        question: 'செயற்கை ஒளிச்சேர்க்கை அமைப்புகளில் குவாண்டம் ஆற்றல் பரிமாற்ற ஆய்வு.',
        text: 'LHCII அலகுகளில் ஃபோர்ஸ்டர் ஒத்ததிர்வு ஆற்றல் பரிமாற்றம் (FRET) மூலம் குவாண்டம் ஒத்திசைவு நிரூபிக்கப்பட்டுள்ளது. பயோ-இன்ஜினியரிங் மூலம் RuBisCO-வின் செயல்திறனை உயர்த்தி ஒளிச்சுவாச இழப்புகளைக் குறைக்க ஆராய்ச்சி நடக்கிறது.',
      },
      te: {
        question: 'సింథటిక్ కిరణజన్య సంయోగక్రియ వ్యవస్థలలో క్వాంటం ఎగ్జైటేషన్ బదిలీ విశ్లేషణ.',
        text: 'LHCII కాంప్లెక్స్‌లలో FRET ద్వారా క్వాంటం కోహెరెన్స్ ప్రదర్శించబడుతుంది. ఆధునిక బయోఇంజనీరింగ్ RuBisCO ఉత్ప్రేరక సామర్థ్యాన్ని పెంచి పంటల దిగుబడిని ఆప్టిమైజ్ చేయడంలో పరిశోధనలు చేస్తోంది.',
      },
    },
  },
}

export function AdaptiveLearningDemo() {
  const { selectedLanguageId, setSelectedLanguageId, setAssistantState } = useAppStore()
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>('Primary')

  // Fallback to English if active language doesn't have custom copy
  const activeLangId = ADAPTIVE_DATA[selectedLevel].explanations[selectedLanguageId]
    ? selectedLanguageId
    : 'en'

  const currentLang = getLanguageById(selectedLanguageId)
  const currentContent = ADAPTIVE_DATA[selectedLevel]
  const currentExplanation = currentContent.explanations[activeLangId] ?? currentContent.explanations.en

  const levels: EducationLevel[] = ['Primary', 'Secondary', 'Higher Secondary', 'College', 'Professional']

  const handleSpeak = async () => {
    setAssistantState({ mode: 'speaking', message: currentExplanation.text })
    try {
      await speechService.speak(currentExplanation.text, currentLang?.locale ?? 'en-IN')
    } catch (e) {
      console.warn(e)
    } finally {
      setAssistantState({ mode: 'idle', message: null })
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-glass-subtle">
          <Sparkles size={13} className="text-cyan-400" />
          Interactive Pedagogy Demonstration
        </div>
        <h2 className="text-heading sm:text-4xl font-extrabold text-white tracking-tight">
          One Question. <span className="gradient-text-cyan">Infinite Adaptations.</span>
        </h2>
        <p className="text-secondary sm:text-base max-w-xl mx-auto mt-2 text-slate-400">
          Switch education levels or languages below to see how Vernacular AI dynamically calibrates explanation depth, vocabulary, and conceptual frameworks.
        </p>
      </div>

      {/* Demo Container */}
      <GlassCard variant="highlighted" padding="lg" className="border-cyan-500/30">
        {/* Top Control Bar: Education Level Segments */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          {/* Level Segmented Buttons */}
          <div className="w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-cinema-900/90 border border-white/[0.08] backdrop-blur-xl">
              {levels.map((lvl) => {
                const isActive = selectedLevel === lvl
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={[
                      'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap',
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-cinema-950 font-bold shadow-glow-cyan'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]',
                    ].join(' ')}
                  >
                    {lvl}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Language Switcher Dropdown / Pills */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Globe size={14} className="text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium">Demo Language:</span>
            <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.07]">
              {['hi', 'en', 'mr', 'bn', 'ta', 'te'].map((code) => {
                const l = getLanguageById(code)
                if (!l) return null
                const isSelected = selectedLanguageId === code
                return (
                  <button
                    key={code}
                    onClick={() => setSelectedLanguageId(code)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {l.nativeName}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Question Prompt Header */}
        <div className="pt-6 pb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Brain size={13} /> Concept Query
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {currentContent.badge}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            "{currentExplanation.question}"
          </h3>
        </div>

        {/* Dynamic Explanation Content Box with Crossfade */}
        <div className="relative min-h-[140px] p-5 sm:p-6 rounded-2xl bg-cinema-900/70 border border-white/[0.06] backdrop-blur-2xl my-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedLevel}-${selectedLanguageId}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Explanation Text */}
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                {currentExplanation.text}
              </p>

              {/* Keywords / Concept Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.05]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                  Core Entities:
                </span>
                {currentContent.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/[0.07] border border-cyan-500/20 text-[11px] font-medium text-cyan-300"
                  >
                    <CheckCircle2 size={11} className="text-cyan-400" />
                    {kw}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer info: Calibration Rationale & Listen button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Layers size={13} className="text-violet-400 shrink-0" />
            <span>{currentContent.calibration}</span>
          </div>

          <button
            onClick={handleSpeak}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-cyan-500/15 border border-white/[0.08] hover:border-cyan-400/40 text-xs text-cyan-300 transition-all font-medium cursor-pointer shrink-0"
            title="Listen to Vernacular Speech"
          >
            <Volume2 size={14} />
            Listen (Audio AI)
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
