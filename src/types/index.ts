// ─── User Roles ─────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'teacher' | null

// ─── Language ────────────────────────────────────────────────────────────────

export interface Language {
  id: string
  name: string        // English name
  nativeName: string  // Name in its own script
  locale: string      // BCP-47 locale tag
  script: string      // Unicode script name
}

// ─── Education Level ─────────────────────────────────────────────────────────

export type EducationLevel = 'primary' | 'secondary' | 'higher_secondary' | 'college' | 'professional'

export interface EducationLevelInfo {
  id: EducationLevel
  title: string
  grades: string
  description: string
  difficulty: number
}

// ─── Assistant ───────────────────────────────────────────────────────────────

export type AssistantMode = 'idle' | 'listening' | 'speaking' | 'thinking' | 'success' | 'error'

export type AICoreState = AssistantMode

export interface AssistantState {
  mode: AssistantMode
  message: string | null
  languageId: string | null
}

// ─── Student ─────────────────────────────────────────────────────────────────

export interface Student {
  id: string
  name: string
  phone?: string
  grade: number
  languageId: string
  progress: LearningProgress[]
  createdAt: string
}

// ─── Teacher ─────────────────────────────────────────────────────────────────

export interface Teacher {
  id: string
  name: string
  email?: string
  school: string
  languagesSupported: string[]   // Language ids
  studentIds: string[]
  createdAt: string
}

// ─── Learning Progress ───────────────────────────────────────────────────────

export type SkillArea = 'reading' | 'writing' | 'listening' | 'speaking' | 'translation'

export interface LearningProgress {
  studentId: string
  languageId: string
  skill: SkillArea
  score: number          // 0–100
  totalAttempts: number
  lastActivityAt: string
}

// ─── Content ─────────────────────────────────────────────────────────────────

export type ContentType = 'lesson' | 'exercise' | 'quiz' | 'story'

export interface ContentItem {
  id: string
  type: ContentType
  titleKey: string       // i18n key
  languageId: string
  grade: number
  createdByTeacherId: string
  createdAt: string
}

// ─── API / Service ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}
