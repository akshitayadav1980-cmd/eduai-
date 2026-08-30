import type { Student, LearningProgress } from '../types'

export const MOCK_PROGRESS: LearningProgress[] = [
  { studentId: 'student-001', languageId: 'hi', skill: 'reading',     score: 78, totalAttempts: 24, lastActivityAt: '2026-08-25T10:30:00Z' },
  { studentId: 'student-001', languageId: 'hi', skill: 'writing',     score: 62, totalAttempts: 18, lastActivityAt: '2026-08-24T14:00:00Z' },
  { studentId: 'student-001', languageId: 'hi', skill: 'listening',   score: 85, totalAttempts: 30, lastActivityAt: '2026-08-26T09:00:00Z' },
  { studentId: 'student-001', languageId: 'hi', skill: 'speaking',    score: 55, totalAttempts: 12, lastActivityAt: '2026-08-23T11:00:00Z' },
  { studentId: 'student-001', languageId: 'hi', skill: 'translation', score: 70, totalAttempts: 20, lastActivityAt: '2026-08-27T08:00:00Z' },
  { studentId: 'student-002', languageId: 'ta', skill: 'reading',     score: 90, totalAttempts: 40, lastActivityAt: '2026-08-27T07:00:00Z' },
  { studentId: 'student-002', languageId: 'ta', skill: 'writing',     score: 75, totalAttempts: 28, lastActivityAt: '2026-08-26T16:00:00Z' },
  { studentId: 'student-002', languageId: 'ta', skill: 'listening',   score: 88, totalAttempts: 35, lastActivityAt: '2026-08-27T06:00:00Z' },
  { studentId: 'student-003', languageId: 'bn', skill: 'reading',     score: 45, totalAttempts: 10, lastActivityAt: '2026-08-20T12:00:00Z' },
  { studentId: 'student-003', languageId: 'bn', skill: 'speaking',    score: 38, totalAttempts: 8,  lastActivityAt: '2026-08-19T09:00:00Z' },
]

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'student-001',
    name: 'Aarav Sharma',
    grade: 3,
    languageId: 'hi',
    progress: MOCK_PROGRESS.filter((p) => p.studentId === 'student-001'),
    createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'student-002',
    name: 'Kavitha Rajan',
    grade: 4,
    languageId: 'ta',
    progress: MOCK_PROGRESS.filter((p) => p.studentId === 'student-002'),
    createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'student-003',
    name: 'Ritam Das',
    grade: 2,
    languageId: 'bn',
    progress: MOCK_PROGRESS.filter((p) => p.studentId === 'student-003'),
    createdAt: '2026-06-15T00:00:00Z',
  },
  {
    id: 'student-004',
    name: 'Preethi Nair',
    grade: 3,
    languageId: 'ml',
    progress: [],
    createdAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'student-005',
    name: 'Suresh Patel',
    grade: 5,
    languageId: 'gu',
    progress: [],
    createdAt: '2026-07-10T00:00:00Z',
  },
  {
    id: 'student-006',
    name: 'Ananya Singh',
    grade: 4,
    languageId: 'hi',
    progress: [],
    createdAt: '2026-07-15T00:00:00Z',
  },
]

/** Compute average score across all progress records for a student */
export function getAverageScore(studentId: string): number {
  const records = MOCK_PROGRESS.filter((p) => p.studentId === studentId)
  if (!records.length) return 0
  return Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length)
}
