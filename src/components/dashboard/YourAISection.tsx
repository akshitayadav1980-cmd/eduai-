import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Mic, History, ArrowRight, Sparkles,
  ChevronDown, Image as ImageIcon, Check, RefreshCw,
  Volume2, VolumeX
} from 'lucide-react'
import { LANGUAGES, getLanguageById } from '../../data/languages'
import { useAppStore } from '../../store/useAppStore'
import { chatWithTutor } from '../../services/tutorService'
import { ApiError } from '../../services/apiClient'

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

interface VisualConcept {
  keywords: string[]
  url: string
  title: string
  description: string
}

const DEFAULT_VISUAL: { url: string; title: string; description: string } = {
  url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
  title: 'Multilingual Concept Structure',
  description: 'Adaptive conceptual breakdown in regional language.',
}

const VISUAL_CONCEPTS: VisualConcept[] = [
  {
    keywords: ['mango', 'mangoes', 'mango tree', 'mangoes grow on trees', 'why do mangoes grow on trees', 'mango fruit', 'mangifera', 'आम', 'आम का पेड़', 'आम का वृक्ष', 'आम्र', 'आम कैसे उगते हैं', 'पेड़ पर आम'],
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
    title: 'Mango (Mangifera indica)',
    description: 'Tropical stone fruit structure with nutrient-rich pulp, seed, and tree growth cycle.',
  },
  {
    keywords: ['apple', 'apples', 'apple tree', 'pome', 'सेब', 'सेब का पेड़'],
    url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
    title: 'Apple (Malus domestica)',
    description: 'Pome fruit anatomy with core, seeds, and pectin-rich skin.',
  },
  {
    keywords: ['banana', 'bananas', 'banana tree', 'banana plant', 'केला', 'केले का पेड़', 'कदली'],
    url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
    title: 'Banana (Musa)',
    description: 'High-potassium elongated tropical fruit growing in hanging clusters.',
  },
  {
    keywords: ['water', 'waters', 'boil', 'boils', 'boiling', 'water boils', 'water boiling', 'boiling water', 'what happens when water boils', 'steam', 'evaporation', 'hot water', 'fluid dynamics', 'पानी', 'जल', 'पानी उबलना', 'उबलता पानी', 'पानी क्यों उबलता है', 'भाप', 'h2o', 'aqua', 'नीर'],
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
    title: 'Water Molecule & Fluid Dynamics (H₂O)',
    description: 'Polar covalent molecular bond, phase transitions, and boiling thermodynamics.',
  },
  {
    keywords: ['plant', 'plants', 'sprout', 'sprouting', 'flora', 'vegetation', 'botany', 'plant biology', 'पौधा', 'पौधे', 'वनस्पति', 'अंकुरण', 'पौधों'],
    url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80',
    title: 'Plant Biology & Sprout Growth',
    description: 'Autotrophic flora with shoot, root, and vascular nutrient transport systems.',
  },
  {
    keywords: ['tree', 'trees', 'forest', 'forests', 'woodland', 'arbor', 'canopy', 'पेड़', 'वृक्ष', 'पेड़', 'जंगल', 'वन', 'तरु', 'पेड़ों'],
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    title: 'Forest Tree Ecosystem (Arbor)',
    description: 'Woody perennial with elongated trunk, canopy foliage, and root networks.',
  },
  {
    keywords: ['flower', 'flowers', 'floral', 'pollination', 'petal', 'petals', 'blossom', 'फूल', 'पुष्प', 'कुसुम', 'परागकण', 'फूलों'],
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
    title: 'Floral Morphology & Pollination',
    description: 'Angiosperm reproductive structure featuring petals, stamen, and pistil.',
  },
  {
    keywords: ['sun', 'solar', 'sunlight', 'sun shine', 'sun shines', 'sun shining', 'solar energy', 'corona', 'fusion', 'सूर्य', 'सूरज', 'धूप', 'सौर ऊर्जा', 'रवि', 'दिनकर'],
    url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80',
    title: 'Solar Corona & Nuclear Fusion',
    description: 'G-type main-sequence star radiating electromagnetic and thermal energy.',
  },
  {
    keywords: ['moon', 'moons', 'lunar', 'moonlight', 'moon shine', 'moon shines', 'moon shining', 'why does the moon shine', 'tides', 'tidal', 'चंद्रमा', 'चाँद', 'चांद', 'चाँद चमकना', 'चांदनी', 'शशि', 'चाँद क्यों चमकता है'],
    url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=800&q=80',
    title: 'Lunar Surface & Tidal Gravitation',
    description: 'Natural satellite reflecting sunlight and governing terrestrial tidal cycles.',
  },
  {
    keywords: ['earth', 'globe', 'planet earth', 'day and night', 'day night cycle', 'earth rotation', 'rotation of earth', 'why do we have day and night', 'terrestrial', 'geosphere', 'biosphere', 'पृथ्वी', 'धरती', 'दिन और रात', 'दिन रात', 'भू', 'दिन और रात कैसे होते हैं'],
    url: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=800&q=80',
    title: 'Planet Earth (Geosphere & Biosphere)',
    description: 'Habitable planet featuring diurnal rotational day/night cycles and liquid hydrosphere.',
  },
  {
    keywords: ['solar system', 'planets', 'planetary orbits', 'orbit', 'orbits', 'celestial', 'सौर मंडल', 'सौरमंडल', 'ग्रह', 'कक्षा', 'ग्रहों'],
    url: 'https://images.unsplash.com/photo-1614728423169-3f65fd722b7e?auto=format&fit=crop&w=800&q=80',
    title: 'Solar System Planetary Orbits',
    description: 'Gravitationally bound system of the Sun and surrounding celestial bodies.',
  },
  {
    keywords: ['photosynthesis', 'photosynthesis help plants', 'how does photosynthesis help plants', 'how photosynthesis help plants', 'what does the plant need for it', 'what do plants need for it', 'what does a plant need for it', 'plant need for photosynthesis', 'plant need for it', 'plants making food', 'how plants make food', 'plant food', 'chloroplast', 'chlorophyll', 'प्रकाश संश्लेषण', 'प्रकाश-संश्लेषण', 'पौधे भोजन कैसे बनाते हैं', 'पौधों का भोजन'],
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    title: 'Photosynthesis & Chloroplast Reactions',
    description: 'Biological synthesis of glucose and oxygen from sunlight, water, and CO₂.',
  },
  {
    keywords: ['heart', 'hearts', 'cardiac', 'cardiovascular', 'blood circulation', 'circulation', 'pump blood', 'pumps blood', 'pumping blood', 'heart pump blood', 'heart pumps blood', 'how does the human heart pump blood', 'how the human heart pump blood', 'human heart', 'blood vessels', 'artery', 'vein', 'हृदय', 'दिल', 'रक्त', 'खून', 'रक्त संचार', 'हृदय रक्त', 'पंप', 'हृदय रक्त कैसे पंप करता है'],
    url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
    title: 'Human Cardiovascular System & Heart',
    description: 'Muscular organ propelling oxygenated blood through vascular circulation.',
  },
  {
    keywords: ['brain', 'brains', 'neural', 'neuron', 'neurons', 'thinking', 'thought', 'cognition', 'nervous system', 'memory', 'synapse', 'मस्तिष्क', 'दिमाग', 'न्यूरॉन', 'सोचना', 'स्मृति'],
    url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80',
    title: 'Human Brain & Neural Network Architecture',
    description: 'Central nervous system organ coordinating cognition, motor control, and sensory input.',
  },
  {
    keywords: ['human body', 'anatomy', 'body anatomy', 'physiology', 'musculoskeletal', 'skeleton', 'organs', 'मानव शरीर', 'शरीर', 'कंकाल', 'अंग प्रणाली'],
    url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
    title: 'Human Anatomy & Physiological Systems',
    description: 'Integrated musculoskeletal, circulatory, and organ systems maintaining biological homeostasis.',
  },
  {
    keywords: ['cat', 'cats', 'kitten', 'kittens', 'feline', 'cat breathing', 'cats need oxygen', 'why do cats need oxygen', 'cat oxygen', 'respiration', 'बिल्ली', 'बिल्लियां', 'बिल्ली सांस', 'ऑक्सीजन', 'बिल्ली को ऑक्सीजन क्यों चाहिए'],
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    title: 'Feline Biology & Respiration (Cat)',
    description: 'Mammalian respiratory mechanics and metabolic oxygen transport in felines.',
  },
  {
    keywords: ['dog', 'dogs', 'puppy', 'puppies', 'canine', 'hound', 'कुत्ता', 'कुत्ते', 'पिल्ला', 'श्वान'],
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    title: 'Canine Anatomy & Sensory Biology (Dog)',
    description: 'Domesticated carnivoran mammal with acute olfactory and cardiovascular adaptations.',
  },
  {
    keywords: ['computer', 'computers', 'laptop', 'software', 'cpu', 'hardware', 'microprocessor', 'programming', 'code', 'binary', 'कंप्यूटर', 'कम्प्यूटर', 'सॉफ्टवेयर'],
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    title: 'Computing Hardware & Microprocessor Logic',
    description: 'Programmable electronic machine executing binary computational instructions.',
  },
  {
    keywords: ['electricity', 'electric', 'electrical', 'voltage', 'current', 'charge', 'circuit', 'electrons', 'power grid', 'बिजली', 'विद्युत', 'धारा', 'करंट'],
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    title: 'Electric Current & Charge Transport',
    description: 'Flow of electric charge and electromagnetic potential difference through conductors.',
  },
  {
    keywords: ['fire', 'flame', 'flames', 'combustion', 'thermal energy', 'heat', 'burning', 'आग', 'अग्नि', 'ज्वाला', 'दहन'],
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    title: 'Combustion & Thermal Energy (Fire)',
    description: 'Rapid exothermic chemical oxidation releasing radiant heat and luminous flames.',
  },
  {
    keywords: ['air', 'wind', 'winds', 'atmosphere', 'atmospheric', 'air currents', 'oxygen gas', 'nitrogen', 'हवा', 'वायु', 'पवन', 'वायुमंडल'],
    url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80',
    title: 'Atmospheric Dynamics & Air Currents',
    description: 'Gaseous mixture of nitrogen, oxygen, and trace elements sustaining planetary climate.',
  },
  {
    keywords: ['soil', 'dirt', 'pedology', 'humus', 'topsoil', 'earth soil', 'minerals', 'मिट्टी', 'मृदा', 'उपजाऊ'],
    url: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=800&q=80',
    title: 'Pedology & Soil Horizons',
    description: 'Natural mineral and organic substrate supporting vegetative growth and microbiology.',
  },
  {
    keywords: ['mountain', 'mountains', 'peaks', 'peak', 'tectonic', 'orogeny', 'himalayas', 'elevation', 'पहाड़', 'पर्वत', 'पहाड़', 'शिखर', 'शैल'],
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    title: 'Tectonic Orogeny & Mountain Geomorphology',
    description: 'Prominent elevated geological landform created by continental plate collisions.',
  },
  {
    keywords: ['river', 'rivers', 'stream', 'streams', 'watershed', 'fluvial', 'waterway', 'नदी', 'जलधारा', 'सरिता', 'नदियां'],
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    title: 'River Fluvial System & Watershed',
    description: 'Natural ribbon of freshwater carving continental landscape toward sea basins.',
  },
  {
    keywords: ['animal', 'animals', 'wildlife', 'fauna', 'mammal', 'mammals', 'species', 'biodiversity', 'जानवर', 'पशु', 'जीव', 'जंतु', 'प्राणी'],
    url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=800&q=80',
    title: 'Kingdom Animalia & Wildlife Biodiversity',
    description: 'Multicellular eukaryotic organisms with sensory faculties and motile biology.',
  },
  {
    keywords: ['bird', 'birds', 'avian', 'flight', 'feathers', 'wings', 'ornithology', 'पक्षी', 'चिड़िया', 'चिड़िया', 'विहग', 'पंख'],
    url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=800&q=80',
    title: 'Avian Biology & Aerodynamic Flight',
    description: 'Feathered endothermic vertebrates adapted for aerodynamic locomotion.',
  },
  {
    keywords: ['fish', 'fishes', 'aquatic', 'ichthyology', 'gills', 'fins', 'marine life', 'swimming', 'मछली', 'मत्स्य', 'मीन', 'गलफड़े'],
    url: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?auto=format&fit=crop&w=800&q=80',
    title: 'Aquatic Ichthyology (Fish Biology)',
    description: 'Gill-bearing aquatic organisms thriving across marine and freshwater ecosystems.',
  },
  {
    keywords: ['gravity', 'gravitational', 'gravitation', 'gravity keep us on earth', 'how does gravity keep us on earth', 'how gravity keep us on earth', 'why objects fall', 'falling objects', 'objects fall', 'gravity pull', 'universal attraction', 'गुरुत्वाकर्षण', 'चीजें नीचे क्यों गिरती हैं', 'नीचे गिरना', 'गुरुत्व'],
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    title: 'Gravitational Curvature of Spacetime',
    description: 'Mass warping spatial geometry causing universal orbital attraction and planetary weight.',
  },
  {
    keywords: ['cell', 'cells', 'cellular', 'organelle', 'organelles', 'mitochondria', 'cytoplasm', 'membrane', 'cell division', 'biology cell', 'कोशिका', 'कोशिकाएं', 'कोशिका संरचना'],
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    title: 'Cellular Organelles & Membrane Dynamics',
    description: 'Mitochondria, nucleus, and cytoplasm coordinating life processes.',
  },
]

function normalizeConceptText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'।?!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchDirectConcept(text: string): VisualConcept | null {
  const cleanQuery = normalizeConceptText(text)
  if (!cleanQuery) return null

  const paddedQuery = ` ${cleanQuery} `
  let bestMatch: VisualConcept | null = null
  let highestScore = 0

  for (const concept of VISUAL_CONCEPTS) {
    for (const rawKeyword of concept.keywords) {
      const cleanKeyword = normalizeConceptText(rawKeyword)
      if (!cleanKeyword) continue

      if (paddedQuery.includes(` ${cleanKeyword} `)) {
        const wordCount = cleanKeyword.split(' ').length
        // Multi-word phrase matches get boosted priority over single keywords
        const score = cleanKeyword.length + (wordCount > 1 ? wordCount * 20 : 0)

        if (score > highestScore) {
          highestScore = score
          bestMatch = concept
        }
      }
    }
  }

  return bestMatch
}

function resolveConversationalVisual(
  query: string,
  historyMessages: ChatMessage[],
  currentActiveVisual: { url: string; title: string; description: string } | null,
): { url: string; title: string; description: string } {
  // 1. First priority: Direct concept match in current user turn
  const direct = matchDirectConcept(query)
  if (direct) {
    return {
      url: direct.url,
      title: direct.title,
      description: direct.description,
    }
  }

  // 2. Second priority: Contextual follow-up — scan conversation history backwards for active topic
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    const msg = historyMessages[i]
    if (msg.visualUrl && msg.visualUrl !== DEFAULT_VISUAL.url) {
      return {
        url: msg.visualUrl,
        title: msg.visualTitle || 'Conceptual Visualization',
        description: msg.visualDescription || 'Adaptive conceptual model',
      }
    }
    const histMatch = matchDirectConcept(msg.text)
    if (histMatch) {
      return {
        url: histMatch.url,
        title: histMatch.title,
        description: histMatch.description,
      }
    }
  }

  // 3. Third priority: Preserve current active non-default visual
  if (currentActiveVisual && currentActiveVisual.url !== DEFAULT_VISUAL.url) {
    return currentActiveVisual
  }

  // 4. Default fallback for general unmapped inquiries
  return DEFAULT_VISUAL
}

const DEMO_PROMPTS = [
  '🌱 What is photosynthesis?',
  '🥭 How do mangoes grow?',
  '🐱 Why do cats need oxygen?',
  '❤️ How does the heart work?',
]

function renderInlineFormatting(line: string, keyPrefix: string): React.ReactNode {
  // Parse **bold** tokens safely
  const parts = line.split(/(\*\*.*?\*\*)/g)
  return (
    <span key={keyPrefix}>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          return (
            <strong key={`${keyPrefix}-b-${idx}`} className="font-semibold text-cyan-600 dark:text-cyan-300">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <span key={`${keyPrefix}-t-${idx}`}>{part}</span>
      })}
    </span>
  )
}

function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null

  // Split text into paragraph blocks
  const blocks = text.split(/\n\s*\n/)

  return (
    <div className="space-y-2">
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        if (lines.length === 0) return null

        // Check if block is a bullet list (lines start with * or - or •)
        const isBulletList = lines.every((l) => /^[*•-]\s+/.test(l))
        if (isBulletList) {
          return (
            <ul key={`b-${bIdx}`} className="list-disc list-inside space-y-1 pl-1 text-left">
              {lines.map((line, lIdx) => {
                const cleaned = line.replace(/^[*•-]\s+/, '')
                return (
                  <li key={`li-${bIdx}-${lIdx}`} className="leading-relaxed">
                    {renderInlineFormatting(cleaned, `li-${bIdx}-${lIdx}`)}
                  </li>
                )
              })}
            </ul>
          )
        }

        // Check if block is a numbered list (lines start with 1. 2. etc.)
        const isNumberedList = lines.every((l) => /^\d+\.\s+/.test(l))
        if (isNumberedList) {
          return (
            <ol key={`ol-${bIdx}`} className="list-decimal list-inside space-y-1 pl-1 text-left">
              {lines.map((line, lIdx) => {
                const cleaned = line.replace(/^\d+\.\s+/, '')
                return (
                  <li key={`oli-${bIdx}-${lIdx}`} className="leading-relaxed">
                    {renderInlineFormatting(cleaned, `oli-${bIdx}-${lIdx}`)}
                  </li>
                )
              })}
            </ol>
          )
        }

        // Normal paragraph with line breaks if any
        return (
          <p key={`p-${bIdx}`} className="leading-relaxed text-left">
            {lines.map((line, lIdx) => (
              <React.Fragment key={`pl-${bIdx}-${lIdx}`}>
                {lIdx > 0 && <br />}
                {renderInlineFormatting(line, `pl-${bIdx}-${lIdx}`)}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

export function YourAISection() {
  const { isDarkMode, voiceEnabled, setVoiceEnabled, educationLevel } = useAppStore()

  // Languages selection state
  const [sourceLangId, setSourceLangId] = useState<string>('hi')
  const [targetLangId, setTargetLangId] = useState<string>('kru')
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showTargetDropdown, setShowTargetDropdown] = useState(false)

  // History panel toggle & session tracking
  const [sessionId, setSessionId] = useState<string | null>(null)
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

  // Visual Image loading & error state
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (activeVisual?.url) {
      setImageLoading(true)
      setImageError(false)
    }
  }, [activeVisual?.url])

  // Speech synthesis state & control
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)

  const handleToggleSpeak = (msgId: string, textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    try {
      if (speakingMsgId === msgId) {
        window.speechSynthesis.cancel()
        setSpeakingMsgId(null)
        return
      }

      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(textToSpeak)

      const langMap: Record<string, string> = {
        hi: 'hi-IN',
        kru: 'hi-IN',
        en: 'en-US',
        bn: 'bn-IN',
        te: 'te-IN',
        mr: 'mr-IN',
        ta: 'ta-IN',
        gu: 'gu-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        pa: 'pa-IN',
        or: 'or-IN',
        as: 'as-IN',
        ur: 'ur-IN',
        sa: 'hi-IN',
        ne: 'ne-NP',
      }
      const targetCode = langMap[targetLangId] || 'en-US'
      utterance.lang = targetCode

      const voices = window.speechSynthesis.getVoices()
      const matchedVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith(targetCode.toLowerCase().slice(0, 2))
      )
      if (matchedVoice) {
        utterance.voice = matchedVoice
      }

      utterance.onend = () => setSpeakingMsgId(null)
      utterance.onerror = () => setSpeakingMsgId(null)

      setSpeakingMsgId(msgId)
      window.speechSynthesis.speak(utterance)
    } catch {
      setSpeakingMsgId(null)
    }
  }

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

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
    setSessionId(null)
    setSourceLangId(item.sourceLang)
    setTargetLangId(item.targetLang)
    setMessages(item.messages)
    setHistoryOpen(false)
  }

  const handleSendMessage = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault()
    const query = (overrideQuery || inputQuery).trim()
    if (!query || isThinking) return

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    // Capture existing history snapshot before updating messages state
    const priorHistory = messages.map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
      timestamp: new Date().toISOString(),
    }))

    setMessages((prev) => [...prev, userMsg])
    setInputQuery('')
    setIsThinking(true)

    // Context-aware visual resolution: checks query first, then history topic
    const visual = resolveConversationalVisual(query, messages, activeVisual)
    const visualUrl = visual.url
    const visualTitle = visual.title
    const visualDesc = visual.description || `Adaptive conceptual breakdown in ${targetLang?.name || 'regional language'}.`

    try {
      const res = await chatWithTutor(
        query,
        sessionId,
        targetLangId,
        educationLevel,
        priorHistory,
      )

      if (res.session_id && !sessionId) {
        setSessionId(res.session_id)
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.response,
        translation: res.language ? `Calibration: ${res.language.toUpperCase()} · ${res.education_level}` : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        visualUrl,
        visualTitle,
        visualDescription: visualDesc,
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Unable to connect to AI Tutor.'
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: errorMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        visualUrl,
        visualTitle,
        visualDescription: visualDesc,
      }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setIsThinking(false)
    }
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
                    <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={12} />
                        <span>YOUR AI SYNTHESIS</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSpeak(msg.id, msg.text)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          speakingMsgId === msg.id
                            ? 'bg-cyan-500 text-white border-cyan-400 animate-pulse'
                            : isDarkMode
                            ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#A3A39E] hover:text-cyan-400'
                            : 'bg-black/[0.03] hover:bg-black/[0.06] border-black/[0.05] text-[#6F6F6A] hover:text-cyan-600'
                        }`}
                        title={speakingMsgId === msg.id ? 'Stop audio' : 'Listen aloud'}
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX size={11} />
                            <span className="text-[9px] font-mono">STOP</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={11} />
                            <span className="text-[9px] font-mono">LISTEN</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {msg.sender === 'ai' ? (
                    renderFormattedText(msg.text)
                  ) : (
                    <p className="font-normal">{msg.text}</p>
                  )}

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
          <div className="p-4 border-t border-black/[0.05] dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] space-y-2.5">
            {/* Quick Demo Suggestion Pills */}
            {messages.filter((m) => m.sender === 'user').length <= 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-left scrollbar-none">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#A3A39E] shrink-0 mr-1 hidden sm:inline">
                  SUGGESTED:
                </span>
                {DEMO_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendMessage(undefined, prompt)}
                    disabled={isThinking}
                    className={`shrink-0 text-[11px] px-3 py-1.5 rounded-full border transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap ${
                      isDarkMode
                        ? 'bg-white/[0.04] hover:bg-white/[0.09] hover:border-cyan-400/40 border-white/[0.08] text-[#F5F5F5]'
                        : 'bg-[#FAFAF8] hover:bg-white hover:border-cyan-500/40 border-black/[0.06] text-[#171717] shadow-xs'
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

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
                <div className="relative rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] shadow-subtle group min-h-[256px] bg-black/5 dark:bg-white/[0.02]">
                  {/* Skeleton Placeholder while loading */}
                  {imageLoading && !imageError && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/5 dark:bg-white/[0.03] animate-pulse">
                      <ImageIcon size={28} className="text-cyan-500/40 mb-2 animate-bounce" />
                      <span className="text-[11px] font-medium text-[#A3A39E]">Loading visual model...</span>
                    </div>
                  )}

                  {/* Graceful Fallback if image fails */}
                  {imageError ? (
                    <div className="w-full h-64 flex flex-col items-center justify-center p-6 text-center bg-cyan-500/[0.03] border border-cyan-500/20 rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-3">
                        <ImageIcon size={22} />
                      </div>
                      <p className="text-xs font-bold text-[#171717] dark:text-[#F5F5F5] mb-1">
                        {activeVisual.title}
                      </p>
                      <p className="text-[11px] text-[#A3A39E] max-w-xs">
                        {activeVisual.description}
                      </p>
                    </div>
                  ) : (
                    <>
                      <img
                        src={activeVisual.url}
                        alt={activeVisual.title}
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          setImageLoading(false)
                          setImageError(true)
                        }}
                        className={`w-full h-64 object-cover transition-all duration-500 group-hover:scale-105 ${
                          imageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-xs font-bold leading-snug">{activeVisual.title}</p>
                      </div>
                    </>
                  )}
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
