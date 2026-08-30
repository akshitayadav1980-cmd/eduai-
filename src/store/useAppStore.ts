import { create } from 'zustand'
import type { UserRole, AssistantState, Student, Teacher, EducationLevel } from '../types'
import { DEFAULT_LANGUAGE_ID } from '../data/languages'

// ─── Store Shape ─────────────────────────────────────────────────────────────

interface AppState {
  // Role selection
  selectedRole: UserRole
  setSelectedRole: (role: UserRole) => void

  // Language selection
  selectedLanguageId: string
  setSelectedLanguageId: (id: string) => void

  // Education Level selection
  educationLevel: EducationLevel
  setEducationLevel: (level: EducationLevel) => void

  // Active student
  currentStudent: Student | null
  setCurrentStudent: (student: Student | null) => void

  // Active teacher
  currentTeacher: Teacher | null
  setCurrentTeacher: (teacher: Teacher | null) => void

  // AI assistant state
  assistantState: AssistantState
  setAssistantState: (state: Partial<AssistantState>) => void

  // Voice guidance toggle
  voiceEnabled: boolean
  setVoiceEnabled: (v: boolean) => void

  // Theme toggle (Light mode is DEFAULT)
  isDarkMode: boolean
  setIsDarkMode: (v: boolean) => void

  // Reset everything
  reset: () => void
}

// ─── Initial Values ───────────────────────────────────────────────────────────

const initialAssistantState: AssistantState = {
  mode: 'idle',
  message: null,
  languageId: null,
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  selectedRole: 'student',
  setSelectedRole: (role) => set({ selectedRole: role }),

  selectedLanguageId: DEFAULT_LANGUAGE_ID,
  setSelectedLanguageId: (id) => set({ selectedLanguageId: id }),

  educationLevel: 'secondary',
  setEducationLevel: (level) => set({ educationLevel: level }),

  currentStudent: null,
  setCurrentStudent: (student) => set({ currentStudent: student }),

  currentTeacher: null,
  setCurrentTeacher: (teacher) => set({ currentTeacher: teacher }),

  assistantState: initialAssistantState,
  setAssistantState: (partial) =>
    set((state) => ({
      assistantState: { ...state.assistantState, ...partial },
    })),

  voiceEnabled: true,
  setVoiceEnabled: (v) => set({ voiceEnabled: v }),

  isDarkMode: false, // Default to light mode
  setIsDarkMode: (v) => set({ isDarkMode: v }),

  reset: () =>
    set({
      selectedRole: null,
      selectedLanguageId: DEFAULT_LANGUAGE_ID,
      educationLevel: 'secondary',
      currentStudent: null,
      currentTeacher: null,
      assistantState: initialAssistantState,
    }),
}))
