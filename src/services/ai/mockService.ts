import { AIService, ChatRequest, ChatResponse } from './types'

export const mockAIService: AIService = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Simulate network latency (1-2 seconds)
    const latency = Math.floor(Math.random() * 1000) + 1000
    await new Promise((resolve) => setTimeout(resolve, latency))

    // Simulate occasional error for testing error states
    if (request.message.toLowerCase().includes('error')) {
      throw new Error('Simulated AI service failure')
    }

    const responses = [
      "That's a great question! Let's explore it together.",
      "You're making excellent progress. Try pronouncing it one more time.",
      "In Hindi, we say 'Namaste' as a respectful greeting. Would you like to practice?",
      "Good job! Let's move on to the next lesson.",
      "I am your virtual learning assistant. How can I help you today?"
    ]

    const responseText = responses[Math.floor(Math.random() * responses.length)]

    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
      },
      suggestedActions: ['Tell me more', 'Next lesson'],
    }
  }
}
