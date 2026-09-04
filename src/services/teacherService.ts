/**
 * teacherService
 *
 * Handles all teacher-related data operations.
 * Mock teacher lookups are preserved for any legacy consumers.
 * Real backend integration added for the teacher dashboard student list.
 */

import type { Teacher, StudentListProgressResponse } from '../types'
import { apiClient } from './apiClient'

// ─── Mock Data (kept for legacy consumers) ────────────────────────────────────

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

// ─── Mock Service Functions ────────────────────────────────────────────────────

/** Fetch all teachers (mock). */
export async function fetchTeachers(): Promise<Teacher[]> {
  return Promise.resolve(MOCK_TEACHERS)
}

/** Fetch a single teacher by id (mock). */
export async function fetchTeacherById(id: string): Promise<Teacher | null> {
  const teacher = MOCK_TEACHERS.find((t) => t.id === id) ?? null
  return Promise.resolve(teacher)
}

// ─── Real Backend: Teacher Dashboard ──────────────────────────────────────────

/**
 * Fetch all students' progress summaries from the real backend.
 *
 * Endpoint:  GET /api/v1/progress/students
 * Auth:      Requires teacher JWT (Authorization: Bearer <token>)
 * Throws:    ApiError with status 401 (not authenticated) or 403 (not a teacher)
 *
 * Security: apiClient injects the JWT automatically. Never logs secrets.
 */
export async function fetchStudentsProgress(): Promise<StudentListProgressResponse> {
  return apiClient.get<StudentListProgressResponse>('/progress/students')
}
