import { create } from 'zustand'
import type { UserRole, AssistantState, Student, Teacher, EducationLevel, AuthUser, TokenResponse } from '../types'
import { DEFAULT_LANGUAGE_ID } from '../data/languages'
import { apiClient, clearStoredToken, getStoredToken, setStoredToken } from '../services/apiClient'

// ─── Store Shape ─────────────────────────────────────────────────────────────

interface AppState {
  // Authentication state
  token: string | null
  authUser: AuthUser | null
  isAuthLoading: boolean
  login: (username: string, password: string) => Promise<AuthUser>
  register: (username: string, password: string, role: 'student' | 'teacher') => Promise<AuthUser>
  logout: () => void
  restoreSession: () => Promise<AuthUser | null>

  // Role selection
  selectedRole: UserRole
  setSelectedRole: (role: UserRole) => void

  // Language selection
  selectedLanguageId: string
  setSelectedLanguageId: (id: string) => void

  // Education Level selection
  educationLevel: EducationLevel
  setEducationLevel: (level: EducationLevel) => void

  // Active student (synced with authUser if student)
  currentStudent: Student | null
  setCurrentStudent: (student: Student | null) => void

  // Active teacher (synced with authUser if teacher)
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

export const useAppStore = create<AppState>((set, get) => ({
  // Authentication initial values
  token: getStoredToken(),
  authUser: null,
  isAuthLoading: false,

  login: async (username: string, password: string) => {
    set({ isAuthLoading: true })
    try {
      const tokenRes = await apiClient.post<TokenResponse>('/auth/login', {
        username: username.trim().toLowerCase(),
        password,
      })

      setStoredToken(tokenRes.access_token)

      // Fetch user profile from /auth/me
      const me = await apiClient.get<AuthUser>('/auth/me')

      // Sync active student or teacher state
      if (me.role === 'student') {
        const studentObj: Student = {
          id: String(me.id),
          name: me.username,
          grade: 10,
          languageId: get().selectedLanguageId || 'hi',
          progress: [],
          createdAt: me.created_at,
        }
        set({
          token: tokenRes.access_token,
          authUser: me,
          selectedRole: 'student',
          currentStudent: studentObj,
          isAuthLoading: false,
        })
      } else {
        const teacherObj: Teacher = {
          id: String(me.id),
          name: me.username,
          email: `${me.username}@vernacular.edu`,
          school: 'Vernacular Learning Academy',
          languagesSupported: ['hi', 'mr', 'en'],
          studentIds: [],
          createdAt: me.created_at,
        }
        set({
          token: tokenRes.access_token,
          authUser: me,
          selectedRole: 'teacher',
          currentTeacher: teacherObj,
          isAuthLoading: false,
        })
      }

      return me
    } catch (err) {
      set({ isAuthLoading: false })
      throw err
    }
  },

  register: async (username: string, password: string, role: 'student' | 'teacher') => {
    set({ isAuthLoading: true })
    try {
      await apiClient.post<AuthUser>('/auth/register', {
        username: username.trim().toLowerCase(),
        password,
        role,
      })

      // Immediately log in with new credentials
      return await get().login(username, password)
    } catch (err) {
      set({ isAuthLoading: false })
      throw err
    }
  },

  logout: () => {
    try {
      apiClient.post('/auth/logout').catch(() => {})
    } catch {}
    clearStoredToken()
    set({
      token: null,
      authUser: null,
      currentStudent: null,
      currentTeacher: null,
      selectedRole: null,
      assistantState: initialAssistantState,
    })
  },

  restoreSession: async () => {
    const token = getStoredToken()
    if (!token) {
      set({ token: null, authUser: null, isAuthLoading: false })
      return null
    }

    set({ isAuthLoading: true })
    try {
      const me = await apiClient.get<AuthUser>('/auth/me')

      if (me.role === 'student') {
        set({
          token,
          authUser: me,
          selectedRole: 'student',
          currentStudent: {
            id: String(me.id),
            name: me.username,
            grade: 10,
            languageId: get().selectedLanguageId || 'hi',
            progress: [],
            createdAt: me.created_at,
          },
          isAuthLoading: false,
        })
      } else {
        set({
          token,
          authUser: me,
          selectedRole: 'teacher',
          currentTeacher: {
            id: String(me.id),
            name: me.username,
            email: `${me.username}@vernacular.edu`,
            school: 'Vernacular Learning Academy',
            languagesSupported: ['hi', 'mr', 'en'],
            studentIds: [],
            createdAt: me.created_at,
          },
          isAuthLoading: false,
        })
      }

      return me
    } catch (err) {
      // Invalid/expired token — clear safely
      clearStoredToken()
      set({
        token: null,
        authUser: null,
        currentStudent: null,
        currentTeacher: null,
        isAuthLoading: false,
      })
      return null
    }
  },

  // Role selection
  selectedRole: 'student',
  setSelectedRole: (role) => set({ selectedRole: role }),

  // Language selection
  selectedLanguageId: DEFAULT_LANGUAGE_ID,
  setSelectedLanguageId: (id) => set({ selectedLanguageId: id }),

  // Education Level selection
  educationLevel: 'secondary',
  setEducationLevel: (level) => set({ educationLevel: level }),

  // Active student
  currentStudent: null,
  setCurrentStudent: (student) => set({ currentStudent: student }),

  // Active teacher
  currentTeacher: null,
  setCurrentTeacher: (teacher) => set({ currentTeacher: teacher }),

  // AI assistant state
  assistantState: initialAssistantState,
  setAssistantState: (partial) =>
    set((state) => ({
      assistantState: { ...state.assistantState, ...partial },
    })),

  // Voice guidance toggle
  voiceEnabled: true,
  setVoiceEnabled: (v) => set({ voiceEnabled: v }),

  // Theme toggle (Light mode is DEFAULT)
  isDarkMode: false,
  setIsDarkMode: (v) => set({ isDarkMode: v }),

  // Reset everything
  reset: () => {
    clearStoredToken()
    set({
      token: null,
      authUser: null,
      selectedRole: null,
      selectedLanguageId: DEFAULT_LANGUAGE_ID,
      educationLevel: 'secondary',
      currentStudent: null,
      currentTeacher: null,
      assistantState: initialAssistantState,
    })
  },
}))

// Auto-restore session if token exists on startup
if (typeof window !== 'undefined' && getStoredToken()) {
  useAppStore.getState().restoreSession().catch(() => {})
}
