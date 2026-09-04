import { AIService, ChatRequest, ChatResponse } from './types'
import { chatWithTutor } from '../tutorService'

/**
 * Real AI service adapter.
 * Implements the AIService interface by delegating to the real backend tutor API.
 * Session management and history are handled externally by TutorExperience.
 * This adapter is used for one-off calls where no session context is available.
 */
const realAIService: AIService = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const result = await chatWithTutor(
      request.message,
      null,                           // no session — backend creates one automatically
      request.languageId ?? 'en',
      (request.context?.educationLevel as string) ?? 'secondary',
      [],
    )
    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
      },
      suggestedActions: [],
    }
  },
}

// Active service — real backend, not mock
export const aiService: AIService = realAIService

// Keep mock exported for tests / dev usage if imported directly
export { mockAIService } from './mockService'
export * from './types'
