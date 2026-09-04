export type UserRole = 'student' | 'teacher' | null

export interface AuthUser {
  id: number
  username: string
  role: 'student' | 'teacher'
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  role: 'student' | 'teacher'
}

export interface StudentProgressSummary {
  user_id: number
  username: string
  role: string
  total_activities: number
  completed_activities: number
  quizzes_completed: number
  lessons_completed: number
  practice_sessions: number
  average_quiz_percentage: number
  total_xp: number
}

export interface RecordActivityPayload {
  activity_type: 'quiz' | 'lesson' | 'practice'
  activity_id?: string
  score?: number
  percentage?: number
  completed?: boolean
  language?: string
  education_level?: string
}

export interface ActivityResponse {
  id: string
  user_id: number
  activity_type: string
  activity_id?: string
  score?: number
  percentage?: number
  completed: boolean
  language?: string
  education_level?: string
  xp_earned: number
  created_at: string
}

// ─── Teacher Progress ─────────────────────────────────────────────────────────

export interface StudentProgressListItem {
  student_id: number
  username: string
  total_activities: number
  lessons_completed: number
  quizzes_completed: number
  average_quiz_percentage: number
  total_xp: number
}

export interface StudentListProgressResponse {
  students: StudentProgressListItem[]
  total_students: number
}

// ─── Voice (STT & TTS) ───────────────────────────────────────────────────────

export interface STTResponse {
  transcript: string
  language: string
  detected_language?: string | null
  method:
    | 'stt'
    | 'unsupported_language'
    | 'not_configured'
    | 'invalid_audio'
    | 'unsupported_format'
    | 'provider_error'
    | 'timeout'
  provider?: string
  model?: string | null
  message?: string | null
}

export interface TTSRequest {
  text: string
  language: 'hin' | 'eng' | 'kru' | string
}

export interface TTSResponse {
  text: string
  language: string
  method: 'tts' | 'unsupported_language' | 'not_configured' | 'provider_error'
  audio_base64?: string | null
  audio_format?: string | null
  message?: string | null
  provider?: string
}


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
