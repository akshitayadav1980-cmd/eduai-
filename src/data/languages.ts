import type { Language } from '../types'

export const LANGUAGES: Language[] = [
  {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    locale: 'en-IN',
    script: 'Latin',
  },
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    locale: 'hi-IN',
    script: 'Devanagari',
  },
  {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    locale: 'mr-IN',
    script: 'Devanagari',
  },
  {
    id: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    locale: 'bn-IN',
    script: 'Bengali',
  },
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    locale: 'ta-IN',
    script: 'Tamil',
  },
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    locale: 'te-IN',
    script: 'Telugu',
  },
  {
    id: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    locale: 'kn-IN',
    script: 'Kannada',
  },
  {
    id: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    locale: 'ml-IN',
    script: 'Malayalam',
  },
  {
    id: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    locale: 'gu-IN',
    script: 'Gujarati',
  },
  {
    id: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    locale: 'pa-IN',
    script: 'Gurmukhi',
  },
  {
    id: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    locale: 'or-IN',
    script: 'Odia',
  },
  {
    id: 'kru',
    name: 'Kurukh',
    nativeName: 'कुड़ुख',
    locale: 'kru-IN',
    script: 'Devanagari / Tolong Siki',
  },
]

/** Look up a language by its id. Returns undefined if not found. */
export function getLanguageById(id: string): Language | undefined {
  return LANGUAGES.find((lang) => lang.id === id)
}

/** Default fallback language */
export const DEFAULT_LANGUAGE_ID = 'en'
