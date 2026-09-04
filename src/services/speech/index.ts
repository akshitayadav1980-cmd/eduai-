/**
 * Unified Speech Service for Vernacular AI.
 *
 * Connects real backend voice endpoints:
 *   POST /api/v1/voice/tts — Text-to-speech synthesis (plays base64 MP3)
 *   POST /api/v1/voice/stt — Speech-to-text Groq Whisper transcription (via recorded audio)
 *
 * Preserves browser-native fallbacks:
 *   - Web Speech API (speechSynthesis) for offline or unconfigured TTS
 *   - Web Speech API (SpeechRecognition) for quick client-side STT / unsupported audio
 *
 * Secrets: never logs tokens, passwords, or secret payloads.
 */

import {
  synthesizeSpeech,
  playAudioBase64,
  stopAudioPlayback,
  transcribeAudio,
  startAudioRecording,
  AudioRecorderSession,
} from '../voiceService'

export interface SpeechService {
  speak(text: string, languageId?: string): Promise<void>
  stopSpeaking(): void
  listen(
    onResult: (text: string) => void,
    onError: (err: any) => void,
    languageId?: string
  ): () => void
}

export const speechService: SpeechService = {
  /**
   * Speak text:
   * 1. Attempts real backend TTS (POST /api/v1/voice/tts).
   * 2. If synthesized (method === 'tts'), plays the returned base64 audio.
   * 3. If backend is not configured, language unsupported (e.g. Kurukh),
   *    or provider returns error, seamlessly falls back to browser speechSynthesis.
   */
  speak: async (text: string, languageId: string = 'hi-IN'): Promise<void> => {
    speechService.stopSpeaking()

    const trimmed = text?.trim()
    if (!trimmed) return

    // 1. Try real backend TTS
    try {
      const response = await synthesizeSpeech(trimmed, languageId)
      if (response.method === 'tts' && response.audio_base64) {
        await playAudioBase64(response.audio_base64, response.audio_format || 'audio/mpeg')
        return
      }
    } catch {
      // Backend TTS unreachable or error — proceed to browser fallback
    }

    // 2. Fallback: browser SpeechSynthesis
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve()
        return
      }

      const utterance = new SpeechSynthesisUtterance(trimmed)
      utterance.lang = languageId
      utterance.rate = 0.9

      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    })
  },

  /**
   * Stop any active audio playback (both backend audio element and browser speech).
   */
  stopSpeaking: () => {
    stopAudioPlayback()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  },

  /**
   * Listen for user speech:
   * 1. Starts recording microphone audio via MediaRecorder to send to backend STT (Groq Whisper).
   * 2. Also initializes browser SpeechRecognition as an immediate fallback / voice-activity detector.
   * 3. When recording completes, sends audio to POST /api/v1/voice/stt for transcription.
   * 4. Returns an abort/stop function that finishes recording and triggers transcription.
   */
  listen: (
    onResult: (text: string) => void,
    onError: (err: any) => void,
    languageId?: string
  ): (() => void) => {
    let isFinished = false
    let fallbackTranscript = ''

    // ── Setup Browser SpeechRecognition Fallback ──────────────────────────────
    const SpeechRec =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null

    let recognition: any = null
    if (SpeechRec) {
      try {
        recognition = new SpeechRec()
        recognition.continuous = false
        recognition.interimResults = false
        if (languageId) {
          recognition.lang = languageId
        }

        recognition.onresult = (event: any) => {
          const t = event.results?.[0]?.[0]?.transcript
          if (t) {
            fallbackTranscript = t
          }
        }
        recognition.onerror = () => {
          // Non-fatal if browser recognition errors; backend STT recording is still running
        }
        recognition.start()
      } catch {
        recognition = null
      }
    }

    // ── Setup Real Backend STT Recording ──────────────────────────────────────
    let recorderSession: AudioRecorderSession | null = null
    let autoStopTimer: any = null

    const finishWithTranscript = (transcript: string) => {
      if (isFinished) return
      isFinished = true
      clearTimeout(autoStopTimer)

      if (recognition) {
        try {
          recognition.stop()
        } catch {}
      }

      const clean = transcript.trim()
      if (clean) {
        onResult(clean)
      } else if (fallbackTranscript.trim()) {
        onResult(fallbackTranscript.trim())
      } else {
        onError(new Error('No speech was detected.'))
      }
    }

    startAudioRecording(
      async (audioBlob: Blob) => {
        try {
          // Send to real backend STT
          const sttRes = await transcribeAudio(
            audioBlob,
            languageId || 'hin',
            'recording.webm'
          )

          if (sttRes.method === 'stt' && sttRes.transcript && sttRes.transcript.trim()) {
            finishWithTranscript(sttRes.transcript)
            return
          }

          // If backend STT returned unsupported_language, not_configured, etc.
          if (fallbackTranscript) {
            finishWithTranscript(fallbackTranscript)
          } else if (sttRes.message) {
            onError(new Error(sttRes.message))
          } else {
            onError(new Error('Transcription was not possible.'))
          }
        } catch (err: any) {
          if (fallbackTranscript) {
            finishWithTranscript(fallbackTranscript)
          } else {
            onError(err)
          }
        }
      },
      (recErr) => {
        // If media recorder failed to start, use fallback transcript if available
        if (fallbackTranscript) {
          finishWithTranscript(fallbackTranscript)
        } else {
          onError(recErr)
        }
      }
    )
      .then((session) => {
        recorderSession = session
        // Auto-stop after 8 seconds of continuous recording
        autoStopTimer = setTimeout(() => {
          if (!isFinished && recorderSession) {
            recorderSession.stop()
          }
        }, 8000)
      })
      .catch((recStartErr) => {
        // Microphone permission denied or not supported
        if (!recognition) {
          onError(recStartErr)
        }
      })

    // Return abort function
    return () => {
      clearTimeout(autoStopTimer)
      if (recorderSession) {
        recorderSession.stop()
      }
      if (recognition) {
        try {
          recognition.stop()
        } catch {}
      }
    }
  },
}
