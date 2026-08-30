/**
 * Speech Service Abstraction
 * Currently uses Web Speech API as a mock/fallback.
 * Can be replaced with advanced STT/TTS models later.
 */

export interface SpeechService {
  speak(text: string, languageId?: string): Promise<void>
  stopSpeaking(): void
  listen(onResult: (text: string) => void, onError: (err: any) => void): () => void
}

export const speechService: SpeechService = {
  speak: async (text: string, languageId: string = 'hi-IN') => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.warn('TTS not supported in this browser')
        resolve()
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = languageId
      utterance.rate = 0.9

      utterance.onend = () => resolve()
      utterance.onerror = (e) => reject(e)

      window.speechSynthesis.cancel() // Stop previous
      window.speechSynthesis.speak(utterance)
    })
  },

  stopSpeaking: () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  },

  listen: (onResult, onError) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      onError(new Error('Speech recognition not supported in this browser.'))
      return () => {}
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
    }

    recognition.onerror = (event: any) => {
      onError(event.error)
    }

    recognition.start()

    // Return an abort function
    return () => {
      recognition.stop()
    }
  }
}
