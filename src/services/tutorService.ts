/**
 * tutorService
 *
 * Connects to the real backend AI Tutor API:
 *   POST /api/v1/tutor/session  — initialize a tutoring session
 *   POST /api/v1/tutor/chat     — send a message in a multi-turn session
 *
 * Uses the central apiClient — JWT header is attached automatically.
 * Do NOT log tokens, passwords, or secrets.
 */

import { apiClient } from './apiClient'
import { toIsoLanguageCode } from './translationService'

// ── Backend request / response shapes ──────────────────────────────────────

export interface CreateSessionRequest {
  language: string        // ISO 639-3: kru | hin | eng
  education_level: string // primary | secondary | higher_secondary | college | professional
  topic?: string          // Optional topic to focus the session
}

export interface SessionResponse {
  session_id: string
  user_id: number
  username: string
  role: string
  language: string
  education_level: string
  topic?: string | null
  welcome_message: string
  created_at: string
  message_count: number
}

export interface BackendChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface TutorChatRequest {
  message: string
  session_id?: string | null
  language?: string | null
  education_level?: string | null
  history?: BackendChatMessage[] | null
}

export interface TutorChatResponse {
  session_id: string
  message: string          // the user's input echoed back
  response: string         // the AI tutor's answer
  language: string
  education_level: string
  method: string           // tutor_rag | tutor_llm | not_configured | ai_error
  retrieved_context: unknown[]
  context_count: number
  history: BackendChatMessage[]
  created_at: string
}

// ── Service functions ───────────────────────────────────────────────────────

/**
 * Initialize a new AI tutoring session.
 * Returns session_id and a welcome_message from the backend.
 */
export async function createTutorSession(
  languageId: string,
  educationLevel: string,
  topic?: string,
): Promise<SessionResponse> {
  const body: CreateSessionRequest = {
    language: toIsoLanguageCode(languageId),
    education_level: educationLevel,
    topic: topic ?? undefined,
  }
  return apiClient.post<SessionResponse>('/tutor/session', body)
}

/**
 * Send a message to the AI tutor within an existing session.
 * Passes conversation history for multi-turn context.
 * Returns the AI's response and the updated history.
 */
export async function chatWithTutor(
  message: string,
  sessionId: string | null,
  languageId: string,
  educationLevel: string,
  history: BackendChatMessage[],
): Promise<TutorChatResponse> {
  const body: TutorChatRequest = {
    message,
    session_id: sessionId ?? undefined,
    language: toIsoLanguageCode(languageId),
    education_level: educationLevel,
    history: history.length > 0 ? history : undefined,
  }
  return apiClient.post<TutorChatResponse>('/tutor/chat', body)
}
