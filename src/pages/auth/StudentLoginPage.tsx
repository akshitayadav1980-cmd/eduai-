import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, User, Hash, Phone, CheckCircle2 } from 'lucide-react'
import { AuthPageLayout } from '../../components/auth/AuthPageLayout'
import { InputField } from '../../components/auth/InputField'
import { useAppStore } from '../../store/useAppStore'

export function StudentLoginPage() {
  const navigate = useNavigate()
  const { isDarkMode, setSelectedRole, setCurrentStudent, setAssistantState } = useAppStore()

  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [phone, setPhone] = useState('')

  const [errors, setErrors] = useState<{ name?: string; studentId?: string; phone?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = () => {
    const newErrors: { name?: string; studentId?: string; phone?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Please enter your name.'
    }

    if (!studentId.trim()) {
      newErrors.studentId = 'Please enter your Student ID.'
    }

    if (!phone.trim()) {
      newErrors.phone = 'Please enter your phone number.'
    } else if (!/^\+?[\d\s-]{8,15}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setSelectedRole('student')

    // Set active student state in store
    setCurrentStudent({
      id: studentId.trim(),
      name: name.trim(),
      phone: phone.trim(),
      grade: 10,
      languageId: 'hi',
      progress: [],
      createdAt: new Date().toISOString(),
    })

    setAssistantState({
      mode: 'success',
      message: `Welcome, ${name.trim()}! Initializing your personal workspace.`,
    })

    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 600)
  }

  return (
    <AuthPageLayout
      eyebrow="STUDENT"
      heading="Welcome to Vernacular AI."
      supportingText="Let's personalize your learning experience."
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
              Welcome, {name}. Your vernacular profile is ready.
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
          {/* Staggered Inputs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <InputField
              label="Name"
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

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <InputField
              label="Student ID"
              placeholder="e.g. STU-2026-88"
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

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <InputField
              label="Phone Number"
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

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
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
                {isSubmitting ? 'Personalizing...' : 'Continue'}
              </span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </motion.div>
        </form>
      )}
    </AuthPageLayout>
  )
}
