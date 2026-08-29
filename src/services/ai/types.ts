export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface ChatRequest {
  message: string
  languageId?: string
  studentId?: string
  context?: Record<string, any>
}

export interface ChatResponse {
  message: ChatMessage
  suggestedActions?: string[]
}

export interface AIService {
  chat(request: ChatRequest): Promise<ChatResponse>
}
