/**
 * translationService
 *
 * Connects to POST /api/v1/translation/translate.
 * Automatically maps frontend language codes (hi, en, kru) to ISO 639-3 (hin, eng, kru).
 */

import { apiClient } from './apiClient'

export interface TranslationRequest {
  text: string
  sourceLanguageId: string
  targetLanguageId: string
}

export interface TranslationMatch {
  entry_id: string
  source_text: string
  translated_text: string
  part_of_speech?: string | null
  category?: string | null
  verified_by_native_speaker?: boolean
}

export interface TranslationResult {
  originalText: string
  translatedText: string
  sourceLanguageId: string
  targetLanguageId: string
  method?: string
  matches?: TranslationMatch[]
  message?: string | null
}

interface BackendTranslationResponse {
  original_text: string
  translated_text: string
  source_language: string
  target_language: string
  method: string
  matches: TranslationMatch[]
  message: string | null
}

// Map frontend codes to backend ISO 639-3 codes (hin, eng, kru)
const TO_ISO639_3: Record<string, string> = {
  hi: 'hin',
  hin: 'hin',
  en: 'eng',
  eng: 'eng',
  kru: 'kru',
  kur: 'kru',
}

export function toIsoLanguageCode(code: string): string {
  const norm = code.trim().toLowerCase()
  return TO_ISO639_3[norm] || norm
}

/**
 * Translate text via POST /api/v1/translation/translate.
 * Removes mock echo response and queries verified PostgreSQL dictionary + Groq fallback.
 */
export async function translateText(
  request: TranslationRequest,
): Promise<TranslationResult> {
  const source_language = toIsoLanguageCode(request.sourceLanguageId)
  const target_language = toIsoLanguageCode(request.targetLanguageId)

  const response = await apiClient.post<BackendTranslationResponse>(
    '/translation/translate',
    {
      text: request.text.trim(),
      source_language,
      target_language,
    },
  )

  return {
    originalText: response.original_text,
    translatedText: response.translated_text || response.message || response.original_text,
    sourceLanguageId: request.sourceLanguageId,
    targetLanguageId: request.targetLanguageId,
    method: response.method,
    matches: response.matches,
    message: response.message,
  }
}
