/**
 * quizService
 *
 * Connects to the real backend Quiz Generation & Evaluation API:
 *   POST /api/v1/quizzes/generate  — generate a grounded, adaptive quiz
 *   POST /api/v1/quizzes/evaluate  — deterministically evaluate submitted answers
 *
 * Uses the central apiClient — Authorization header is attached automatically.
 * Do NOT log tokens, passwords, or secrets.
 */

import { apiClient } from './apiClient'
import { toIsoLanguageCode } from './translationService'

// ── Backend Schema Definitions ──────────────────────────────────────────────

export interface QuizQuestionPublic {
  id: string
  question: string
  options: string[]
  type: string
  difficulty: string
}

export interface GenerateQuizRequest {
  topic: string
  language?: string
  education_level?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  num_questions?: number
}

export interface GenerateQuizResponse {
  quiz_id: string
  topic: string
  language: string
  education_level: string
  difficulty: string
  total_questions: number
  questions: QuizQuestionPublic[]
  method: string
  retrieved_context: unknown[]
  context_count: number
  message?: string | null
  created_at: string
}

export interface AnswerSubmission {
  question_id: string
  selected_option: string
}

export interface QuizEvaluateRequest {
  quiz_id?: string | null
  answers: AnswerSubmission[]
}

export interface QuestionResult {
  question_id: string
  question: string
  selected_option?: string | null
  correct_answer: string
  is_correct: boolean
  explanation?: string | null
}

export interface QuizEvaluateResponse {
  quiz_id?: string | null
  total_questions: number
  correct_answers: number
  incorrect_answers: number
  score: number
  percentage: number
  passed: boolean
  results: QuestionResult[]
}

// ── Service Functions ───────────────────────────────────────────────────────

export interface GenerateQuizParams {
  topic: string
  languageId?: string
  educationLevel?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  numQuestions?: number
}

/**
 * Generate a real educational quiz from the backend.
 * Uses Groq LLM grounded in verified regional vocabulary (PostgreSQL RAG).
 */
export async function generateQuiz(
  params: GenerateQuizParams,
): Promise<GenerateQuizResponse> {
  const body: GenerateQuizRequest = {
    topic: params.topic.trim(),
    language: toIsoLanguageCode(params.languageId || 'hin'),
    education_level: params.educationLevel || 'secondary',
    difficulty: params.difficulty || 'medium',
    num_questions: params.numQuestions || 5,
  }

  return apiClient.post<GenerateQuizResponse>('/quizzes/generate', body)
}

/**
 * Submit student answers for deterministic evaluation.
 * Returns score, percentage, passed status, and per-question pedagogical explanations.
 */
export async function evaluateQuiz(
  quizId: string,
  answers: AnswerSubmission[],
): Promise<QuizEvaluateResponse> {
  const body: QuizEvaluateRequest = {
    quiz_id: quizId,
    answers,
  }

  return apiClient.post<QuizEvaluateResponse>('/quizzes/evaluate', body)
}
