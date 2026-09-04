import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LandingExperience } from './experiences/landing'
import { StudentLoginPage } from './pages/auth/StudentLoginPage'
import { TeacherLoginPage } from './pages/auth/TeacherLoginPage'
import { StudentDashboardPage } from './pages/student/StudentDashboardPage'
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Single Premium Cinematic Landing Page ──────────────────── */}
        <Route path="/" element={<LandingExperience />} />

        {/* ── Dedicated Cinematic Login Experiences ───────────────────── */}
        <Route path="/login/student" element={<StudentLoginPage />} />
        <Route path="/login/teacher" element={<TeacherLoginPage />} />

        {/* ── Student Learning Space / Dashboard ─────────────────────── */}
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

        {/* ── Teacher Learning Space / Dashboard ─────────────────────── */}
        <Route path="/teacher/dashboard" element={<TeacherDashboardPage />} />
        <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />

        {/* ── Aliases ─────────────────────────────────────────────────── */}
        <Route path="/student/login" element={<Navigate to="/login/student" replace />} />
        <Route path="/teacher/login" element={<Navigate to="/login/teacher" replace />} />
        <Route path="/tutor" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/learning" element={<Navigate to="/student/dashboard" replace />} />

        {/* ── Fallback Route ─────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
