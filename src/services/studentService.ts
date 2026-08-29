/**
 * studentService
 *
 * Handles all student-related data operations.
 * Currently uses mock data; replace with real API calls in later steps.
 */

import type { Student, LearningProgress } from '../types'

// ─── Mock Data ────────────────────────────────────────────────────────────────

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

// ─── Service Functions ────────────────────────────────────────────────────────

/** Fetch all students (mock). */
export async function fetchStudents(): Promise<Student[]> {
  return Promise.resolve(MOCK_STUDENTS)
}

/** Fetch a single student by id (mock). */
export async function fetchStudentById(id: string): Promise<Student | null> {
  const student = MOCK_STUDENTS.find((s) => s.id === id) ?? null
  return Promise.resolve(student)
}

/** Fetch progress records for a student (mock). */
export async function fetchStudentProgress(
  studentId: string,
): Promise<LearningProgress[]> {
  const student = MOCK_STUDENTS.find((s) => s.id === studentId)
  return Promise.resolve(student?.progress ?? [])
}
