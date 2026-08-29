import type { EducationLevel, EducationLevelInfo } from '../types'

export interface EducationLevelConfig extends EducationLevelInfo {
  tagline: string
  subtext: string
  difficultyLabel: string
  badgeColor: 'cyan' | 'blue' | 'violet' | 'emerald' | 'amber'
  iconName: string
}

export const EDUCATION_LEVELS: EducationLevelConfig[] = [
  {
    id: 'primary',
    title: 'Primary',
    grades: 'Grades 1–5',
    tagline: 'Foundation & Visual Metaphors',
    description: 'Simple words, visual stories, tangible examples, and gentle audio encouragement.',
    subtext: 'Focuses on intuitive nature analogies, foundational vocabulary, and conversational tone.',
    difficulty: 1,
    difficultyLabel: 'Level 1 · Elementary',
    badgeColor: 'emerald',
    iconName: 'Sparkles',
  },
  {
    id: 'secondary',
    title: 'Secondary',
    grades: 'Grades 6–10',
    tagline: 'Structured & Conceptual',
    description: 'Structured explanations, core definitions, basic scientific formulas, and relatable real-world examples.',
    subtext: 'Connects basic concepts to everyday phenomena with clear step-by-step reasoning.',
    difficulty: 2,
    difficultyLabel: 'Level 2 · Middle & High School',
    badgeColor: 'cyan',
    iconName: 'BookOpen',
  },
  {
    id: 'higher_secondary',
    title: 'Higher Secondary',
    grades: 'Grades 11–12',
    tagline: 'Academic Rigor & Mechanisms',
    description: 'Detailed academic theories, molecular mechanisms, mathematical derivations, and board examination depth.',
    subtext: 'Deep-dives into reaction pathways, physical laws, and rigorous conceptual breakdowns.',
    difficulty: 3,
    difficultyLabel: 'Level 3 · Pre-University',
    badgeColor: 'blue',
    iconName: 'Layers',
  },
  {
    id: 'college',
    title: 'College',
    grades: 'Undergraduate',
    tagline: 'Specialized & Analytical',
    description: 'Specialized technical terminology, kinetics, biochemical/physical kinetics, and analytical proofs.',
    subtext: 'Rigorous undergraduate-level clarity with domain-specific terminology and research context.',
    difficulty: 4,
    difficultyLabel: 'Level 4 · University Degree',
    badgeColor: 'violet',
    iconName: 'GraduationCap',
  },
  {
    id: 'professional',
    title: 'Professional',
    grades: 'Postgrad & Research',
    tagline: 'Advanced & Applied Systems',
    description: 'Advanced applied paradigms, quantum/bioengineering concepts, research-grade synthesis, and industry applications.',
    subtext: 'Expert-level discussion exploring cutting-edge developments, trade-offs, and multidisciplinary synthesis.',
    difficulty: 5,
    difficultyLabel: 'Level 5 · Advanced Research',
    badgeColor: 'amber',
    iconName: 'Brain',
  },
]

export function getEducationLevelById(id: EducationLevel): EducationLevelConfig {
  return EDUCATION_LEVELS.find((l) => l.id === id) ?? EDUCATION_LEVELS[1] // fallback to secondary
}

export const DEFAULT_EDUCATION_LEVEL: EducationLevel = 'secondary'
