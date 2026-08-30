/**
 * translationService
 *
 * Handles text translation between supported languages.
 * Currently returns mock/echo responses; will connect to a real
 * translation backend (e.g. IndicTrans2 via FastAPI) in later steps.
 */

export interface TranslationRequest {
  text: string
  sourceLanguageId: string
  targetLanguageId: string
}

export interface TranslationResult {
  originalText: string
  translatedText: string
  sourceLanguageId: string
  targetLanguageId: string
}

/**
 * Translate text from one language to another (mock).
 * Returns the original text until a real backend is connected.
 */
export async function translateText(
  request: TranslationRequest,
): Promise<TranslationResult> {
  // TODO: connect to FastAPI / IndicTrans2 translation endpoint
  return Promise.resolve({
    originalText: request.text,
    translatedText: `[${request.targetLanguageId.toUpperCase()}] ${request.text}`,
    sourceLanguageId: request.sourceLanguageId,
    targetLanguageId: request.targetLanguageId,
  })
}
