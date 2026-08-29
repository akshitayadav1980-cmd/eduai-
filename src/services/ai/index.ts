import { AIService } from './types'
import { mockAIService } from './mockService'

// Export the active service implementation
// In later steps, this can be swapped with realAIService
export const aiService: AIService = mockAIService
export * from './types'
