export interface VocabularyItem {
  id: string
  word: string
  meaning: string
  pronunciation: string
  exampleSentence: string
  audioUrl?: string
}

export interface Lesson {
  id: string
  title: string
  description: string
  languageId: string
  grade: number
  vocabulary: VocabularyItem[]
  content: string // markdown or structured content
}

export interface Question {
  id: string
  lessonId: string
  type: 'multiple-choice' | 'open-ended' | 'pronunciation'
  prompt: string
  correctAnswer: string
  options?: string[]
}

export interface Translation {
  sourceText: string
  targetText: string
  sourceLanguageId: string
  targetLanguageId: string
}

export interface Conversation {
  id: string
  studentId: string
  startedAt: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
}

export interface StudentProgress {
  studentId: string
  lessonId: string
  completed: boolean
  score: number
  lastActivityAt: string
}

export interface TeacherAnalytics {
  teacherId: string
  totalActiveStudents: number
  averageClassScore: number
  recentActivities: StudentProgress[]
}
