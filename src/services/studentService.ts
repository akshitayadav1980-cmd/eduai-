/**
 * studentService
 *
 * Handles student data operations and progress tracking.
 * Connects to /api/v1/progress/me and /api/v1/progress/record.
 */

import { apiClient } from './apiClient'
import type {
  Student,
  LearningProgress,
  StudentProgressSummary,
  RecordActivityPayload,
  ActivityResponse,
} from '../types'

// ─── Real Backend Progress Operations ─────────────────────────────────────────

/**
 * Fetch authenticated student's cumulative learning progress summary.
 * Endpoint: GET /api/v1/progress/me
 */
export async function fetchMyProgress(): Promise<StudentProgressSummary> {
  return apiClient.get<StudentProgressSummary>('/progress/me')
}

/**
 * Record a completed learning activity (quiz, lesson, or practice session).
 * Endpoint: POST /api/v1/progress/record
 */
export async function recordActivity(
  payload: RecordActivityPayload,
): Promise<ActivityResponse> {
  return apiClient.post<ActivityResponse>('/progress/record', payload)
}

// ─── Legacy / Compatibility Stubs ─────────────────────────────────────────────

const MOCK_STUDENTS: Student[] = [
  {
    id: 'student-001',
    name: 'Aarav Sharma',
    grade: 3,
    languageId: 'hi',
    progress: [],
    createdAt: new Date().toISOString(),
  },
]

export async function fetchStudents(): Promise<Student[]> {
  return Promise.resolve(MOCK_STUDENTS)
}

export async function fetchStudentById(id: string): Promise<Student | null> {
  const student = MOCK_STUDENTS.find((s) => s.id === id) ?? null
  return Promise.resolve(student)
}

export async function fetchStudentProgress(
  studentId: string,
): Promise<LearningProgress[]> {
  const student = MOCK_STUDENTS.find((s) => s.id === studentId)
  return Promise.resolve(student?.progress ?? [])
}
