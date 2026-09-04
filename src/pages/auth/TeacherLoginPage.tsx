import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, User, Award, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { AuthPageLayout } from '../../components/auth/AuthPageLayout'
import { InputField } from '../../components/auth/InputField'
import { useAppStore } from '../../store/useAppStore'
import { ApiError } from '../../services/apiClient'

export function TeacherLoginPage() {
  const navigate = useNavigate()
  const { isDarkMode, login, register, logout, setAssistantState } = useAppStore()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [password, setPassword] = useState('')

  const [errors, setErrors] = useState<{
    name?: string
    teacherId?: string
    password?: string
    general?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const sanitizeUsername = (raw: string) => {
    return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
  }

  const validate = () => {
    const newErrors: typeof errors = {}

    if (mode === 'register' && !name.trim()) {
      newErrors.name = 'Please enter your name.'
    }

    if (!teacherId.trim()) {
      newErrors.teacherId = 'Please enter your Teacher ID or username.'
    } else {
      const sanitized = sanitizeUsername(teacherId)
      if (sanitized.length < 3) {
        newErrors.teacherId = 'Teacher ID / username must be at least 3 characters.'
      }
    }

    if (!password) {
      newErrors.password = 'Please enter your password.'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})

    const username = sanitizeUsername(teacherId)

    try {
      let user
      if (mode === 'register') {
        user = await register(username, password, 'teacher')
      } else {
        user = await login(username, password)
      }

      // Role-aware security check
      if (user.role !== 'teacher') {
        logout()
        throw new Error('Access denied: This account has student privileges, not educator privileges.')
      }

      setAssistantState({
        mode: 'success',
        message: `Welcome, Professor ${user.username}! Preparing your educator toolkit.`,
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
      eyebrow="TEACHER"
      heading="Welcome to Vernacular AI."
      supportingText={mode === 'login' ? 'Sign in to access your educator workspace.' : "Let's personalize your teaching experience."}
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
              Credentials Verified
            </h3>
            <p className="text-xs text-[#6F6F6A] dark:text-[#A3A39E]">
              Welcome back. Your educator workspace is ready.
            </p>
          </div>

          <button
            onClick={() => navigate('/teacher/dashboard')}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer shadow-editorial ${
              isDarkMode
                ? 'bg-[#FFFFFF] text-[#171717] hover:bg-[#F5F5F5]'
                : 'bg-[#171717] text-[#FFFFFF] hover:bg-[#262626]'
            }`}
          >
            <span className={isDarkMode ? 'text-[#171717]' : 'text-[#FFFFFF]'}>Enter Educator Space</span>
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
              Register Educator
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
                placeholder="e.g. Dr. Priya Kulkarni"
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

          {/* Teacher ID / Username */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InputField
              label={mode === 'login' ? 'Teacher ID or Username' : 'Desired Teacher ID / Username'}
              placeholder="e.g. priya_kulkarni or tch2026"
              value={teacherId}
              onChange={(e) => {
                setTeacherId(e.target.value)
                if (errors.teacherId) setErrors((prev) => ({ ...prev, teacherId: undefined }))
              }}
              error={errors.teacherId}
              icon={<Award size={17} />}
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
                {isSubmitting ? (mode === 'login' ? 'Verifying...' : 'Registering...') : mode === 'login' ? 'Enter Educator Space' : 'Create Educator Account'}
              </span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </motion.div>
        </form>
      )}
    </AuthPageLayout>
  )
}
