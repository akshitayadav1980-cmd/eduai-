import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, User, Hash, Phone, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { AuthPageLayout } from '../../components/auth/AuthPageLayout'
import { InputField } from '../../components/auth/InputField'
import { useAppStore } from '../../store/useAppStore'
import { ApiError } from '../../services/apiClient'

export function StudentLoginPage() {
  const navigate = useNavigate()
  const { isDarkMode, login, register, setAssistantState } = useAppStore()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  const [errors, setErrors] = useState<{
    name?: string
    studentId?: string
    password?: string
    phone?: string
    general?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Normalize studentId to a backend-valid username (alphanumeric + underscore)
  const sanitizeUsername = (raw: string) => {
    return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
  }

  const validate = () => {
    const newErrors: typeof errors = {}

    if (mode === 'register' && !name.trim()) {
      newErrors.name = 'Please enter your name.'
    }

    if (!studentId.trim()) {
      newErrors.studentId = 'Please enter your Student ID or username.'
    } else {
      const sanitized = sanitizeUsername(studentId)
      if (sanitized.length < 3) {
        newErrors.studentId = 'Student ID / username must be at least 3 characters.'
      }
    }

    if (!password) {
      newErrors.password = 'Please enter your password.'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.'
    }

    if (mode === 'register' && phone.trim() && !/^\+?[\d\s-]{8,15}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})

    const username = sanitizeUsername(studentId)

    try {
      let user
      if (mode === 'register') {
        user = await register(username, password, 'student')
      } else {
        user = await login(username, password)
      }

      if (user.role !== 'student') {
        throw new Error('This account does not have student access.')
      }

      setAssistantState({
        mode: 'success',
        message: `Welcome, ${user.username}! Initializing your personal workspace.`,
      })

      setIsSubmitting(false)
      setIsSuccess(true)
    } catch (err: any) {
      setIsSubmitting(false)
      const message = err instanceof ApiError ? err.message : err.message || 'Authentication failed. Please check your credentials.'
      setErrors({ general: message })
    }
  }

  return (
    <AuthPageLayout
      eyebrow="STUDENT"
      heading="Welcome to Vernacular AI."
      supportingText={mode === 'login' ? 'Sign in to access your vernacular workspace.' : "Let's personalize your learning experience."}
    >
      {isSuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-8 text-center space-y-4"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-1">
            <h3 className="font-display text-xl font-bold text-[#171717] dark:text-[#F5F5F5]">
              Profile Verified
            </h3>
            <p className="text-xs text-[#6F6F6A] dark:text-[#A3A39E]">
              Welcome back. Your vernacular profile is ready.
            </p>
          </div>

          <button
            onClick={() => navigate('/student/dashboard')}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer shadow-editorial ${
              isDarkMode
                ? 'bg-[#FFFFFF] text-[#171717] hover:bg-[#F5F5F5]'
                : 'bg-[#171717] text-[#FFFFFF] hover:bg-[#262626]'
            }`}
          >
            <span className={isDarkMode ? 'text-[#171717]' : 'text-[#FFFFFF]'}>Enter Learning Space</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General Error Banner */}
          {errors.general && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-500 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl p-1 bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setErrors({})
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-white/[0.1] text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-[#737373] hover:text-[#171717] dark:hover:text-[#F5F5F5]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setErrors({})
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-white/[0.1] text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-[#737373] hover:text-[#171717] dark:hover:text-[#F5F5F5]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Name Field (Register Mode Only) */}
          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <InputField
                label="Full Name"
                placeholder="e.g. Aarav Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                error={errors.name}
                icon={<User size={17} />}
                autoComplete="name"
              />
            </motion.div>
          )}

          {/* Student ID / Username */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InputField
              label={mode === 'login' ? 'Student ID or Username' : 'Desired Student ID / Username'}
              placeholder="e.g. aarav_sharma or stu2026"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value)
                if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: undefined }))
              }}
              error={errors.studentId}
              icon={<Hash size={17} />}
              autoComplete="username"
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <InputField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              error={errors.password}
              helperText={mode === 'register' ? 'Minimum 8 characters' : undefined}
              icon={<Lock size={17} />}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </motion.div>

          {/* Phone Field (Optional, for compatibility) */}
          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <InputField
                label="Phone Number (Optional)"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
                }}
                error={errors.phone}
                icon={<Phone size={17} />}
                autoComplete="tel"
              />
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="pt-2"
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-sm sm:text-base font-medium shadow-editorial hover:shadow-editorial-hover transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                isDarkMode
                  ? 'bg-[#FFFFFF] text-[#171717] hover:bg-[#F5F5F5]'
                  : 'bg-[#171717] text-[#FFFFFF] hover:bg-[#262626]'
              }`}
            >
              <span className={isDarkMode ? 'text-[#171717]' : 'text-[#FFFFFF]'}>
                {isSubmitting ? (mode === 'login' ? 'Signing in...' : 'Creating Account...') : mode === 'login' ? 'Sign In' : 'Create Student Profile'}
              </span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </motion.div>
        </form>
      )}
    </AuthPageLayout>
  )
}
