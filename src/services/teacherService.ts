/**
 * teacherService
 *
 * Handles all teacher-related data operations.
 * Currently uses mock data; replace with real API calls in later steps.
 */

import type { Teacher } from '../types'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TEACHERS: Teacher[] = [
  {
    id: 'teacher-001',
    name: 'Priya Nair',
    school: 'Government Primary School, Pune',
    languagesSupported: ['hi', 'mr', 'en'],
    studentIds: ['student-001'],
    createdAt: new Date().toISOString(),
  },
]

// ─── Service Functions ────────────────────────────────────────────────────────

/** Fetch all teachers (mock). */
export async function fetchTeachers(): Promise<Teacher[]> {
  return Promise.resolve(MOCK_TEACHERS)
}

/** Fetch a single teacher by id (mock). */
export async function fetchTeacherById(id: string): Promise<Teacher | null> {
  const teacher = MOCK_TEACHERS.find((t) => t.id === id) ?? null
  return Promise.resolve(teacher)
}
