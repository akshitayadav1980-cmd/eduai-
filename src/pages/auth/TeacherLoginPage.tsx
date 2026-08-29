import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, User, Award, CheckCircle2 } from 'lucide-react'
import { AuthPageLayout } from '../../components/auth/AuthPageLayout'
import { InputField } from '../../components/auth/InputField'
import { useAppStore } from '../../store/useAppStore'

export function TeacherLoginPage() {
  const navigate = useNavigate()
  const { isDarkMode, setSelectedRole, setCurrentTeacher, setAssistantState } = useAppStore()

  const [name, setName] = useState('')
  const [teacherId, setTeacherId] = useState('')

  const [errors, setErrors] = useState<{ name?: string; teacherId?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = () => {
    const newErrors: { name?: string; teacherId?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Please enter your name.'
    }

    if (!teacherId.trim()) {
      newErrors.teacherId = 'Please enter your Teacher ID.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setSelectedRole('teacher')

    // Set active teacher state in store
    setCurrentTeacher({
      id: teacherId.trim(),
      name: name.trim(),
      email: `${teacherId.trim().toLowerCase()}@vernacular.edu`,
      school: 'Vernacular Learning Academy',
      languagesSupported: ['hi', 'mr', 'en'],
      studentIds: [],
      createdAt: new Date().toISOString(),
    })

    setAssistantState({
      mode: 'success',
      message: `Welcome, Professor ${name.trim()}! Preparing your educator toolkit.`,
    })

    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 600)
  }

  return (
    <AuthPageLayout
      eyebrow="TEACHER"
      heading="Welcome to Vernacular AI."
      supportingText="Let's personalize your teaching experience."
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
              Welcome, {name}. Your educator workspace is ready.
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
          {/* Staggered Inputs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <InputField
              label="Name"
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

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <InputField
              label="Teacher ID"
              placeholder="e.g. TCH-2026-09"
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

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
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
