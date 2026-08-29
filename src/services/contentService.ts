/**
 * contentService
 *
 * Handles retrieval and management of learning content
 * (lessons, exercises, quizzes, stories).
 * Currently uses mock data; replace with real API calls in later steps.
 */

import type { ContentItem } from '../types'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONTENT: ContentItem[] = [
  {
    id: 'content-001',
    type: 'lesson',
    titleKey: 'lesson.intro_alphabets',
    languageId: 'hi',
    grade: 1,
    createdByTeacherId: 'teacher-001',
    createdAt: new Date().toISOString(),
  },
]

// ─── Service Functions ────────────────────────────────────────────────────────

/** Fetch content items filtered by language and grade (mock). */
export async function fetchContent(
  languageId?: string,
  grade?: number,
): Promise<ContentItem[]> {
  let results = MOCK_CONTENT
  if (languageId) results = results.filter((c) => c.languageId === languageId)
  if (grade !== undefined) results = results.filter((c) => c.grade === grade)
  return Promise.resolve(results)
}

/** Fetch a single content item by id (mock). */
export async function fetchContentById(id: string): Promise<ContentItem | null> {
  const item = MOCK_CONTENT.find((c) => c.id === id) ?? null
  return Promise.resolve(item)
}
