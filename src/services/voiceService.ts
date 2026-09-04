/**
 * Voice Service — Client for real backend STT and TTS endpoints.
 *
 * Endpoints:
 *   POST /api/v1/voice/stt — Groq Whisper audio transcription
 *   POST /api/v1/voice/tts — Text-to-speech audio synthesis
 *
 * Preserves centralized apiClient authentication, token handling, and proxying.
 * Never logs tokens, secrets, or audio payloads.
 */

import { apiClient } from './apiClient'
import { toIsoLanguageCode } from './translationService'
import type { STTResponse, TTSResponse } from '../types'

// ── Global Audio Playback State ───────────────────────────────────────────────

let currentAudio: HTMLAudioElement | null = null

/**
 * Stop any ongoing backend TTS audio playback.
 */
export function stopAudioPlayback(): void {
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.currentTime = 0
    } catch {
      // Ignore pause errors
    }
    currentAudio = null
  }
}

/**
 * Play base64-encoded audio returned by the backend TTS endpoint.
 */
export async function playAudioBase64(
  base64Audio: string,
  mimeType: string = 'audio/mpeg'
): Promise<void> {
  stopAudioPlayback()

  return new Promise((resolve, reject) => {
    try {
      const audioUrl = `data:${mimeType};base64,${base64Audio}`
      const audio = new Audio(audioUrl)
      currentAudio = audio

      audio.onended = () => {
        currentAudio = null
        resolve()
      }

      audio.onerror = (e) => {
        currentAudio = null
        reject(e)
      }

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          currentAudio = null
          reject(err)
        })
      }
    } catch (err) {
      currentAudio = null
      reject(err)
    }
  })
}

// ── TTS Synthesis ─────────────────────────────────────────────────────────────

/**
 * Synthesise speech using the backend POST /api/v1/voice/tts endpoint.
 *
 * Accepts frontend language code (e.g. 'hi', 'en', 'kru') and maps it to ISO 639-3 ('hin', 'eng', 'kru').
 */
export async function synthesizeSpeech(
  text: string,
  languageCode: string
): Promise<TTSResponse> {
  const trimmed = text.trim().slice(0, 500)
  if (!trimmed) {
    throw new Error('Text to synthesise cannot be empty.')
  }

  const isoLang = toIsoLanguageCode(languageCode)

  return apiClient.post<TTSResponse>('/voice/tts', {
    text: trimmed,
    language: isoLang,
  })
}

// ── STT Transcription ─────────────────────────────────────────────────────────

/**
 * Transcribe recorded audio using the backend POST /api/v1/voice/stt endpoint.
 *
 * Accepts an audio Blob, forms a multipart/form-data request, and sends it to the backend.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  languageCode: string,
  filename: string = 'recording.webm'
): Promise<STTResponse> {
  const isoLang = toIsoLanguageCode(languageCode)

  const formData = new FormData()
  formData.append(
    'audio',
    audioBlob,
    filename
  )
  formData.append('language', isoLang)

  return apiClient.post<STTResponse>('/voice/stt', formData)
}

// ── Microphone Recording Helper ───────────────────────────────────────────────

export interface AudioRecorderSession {
  stop: () => void
}

/**
 * Start recording audio from the user's microphone using browser MediaRecorder.
 * Calls onComplete with the audio Blob when recording finishes.
 */
export async function startAudioRecording(
  onComplete: (blob: Blob) => void,
  onError: (err: any) => void
): Promise<AudioRecorderSession> {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('Microphone access is not supported in this browser.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  
  // Prefer common formats supported by backend STT
  let mimeType = 'audio/webm'
  if (typeof MediaRecorder.isTypeSupported === 'function') {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus'
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      mimeType = 'audio/webm'
    } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
      mimeType = 'audio/ogg;codecs=opus'
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4'
    }
  }

  const mediaRecorder = new MediaRecorder(stream, { mimeType })
  const chunks: BlobPart[] = []

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data)
    }
  }

  mediaRecorder.onstop = () => {
    // Release microphone track
    stream.getTracks().forEach((track) => track.stop())

    const audioBlob = new Blob(chunks, { type: mimeType.split(';')[0] })
    onComplete(audioBlob)
  }

  mediaRecorder.onerror = (e: any) => {
    stream.getTracks().forEach((track) => track.stop())
    onError(e.error || e)
  }

  // Collect data in chunks
  mediaRecorder.start(250)

  return {
    stop: () => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
    },
  }
}
