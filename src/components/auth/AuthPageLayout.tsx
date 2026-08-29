import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthNav } from '../navigation/AuthNav'
import { AuthCanvas } from '../cinematic/AuthCanvas'
import { useAppStore } from '../../store/useAppStore'

interface AuthPageLayoutProps {
  eyebrow: string
  heading: string
  supportingText: string
  children: React.ReactNode
}

export function AuthPageLayout({
  eyebrow,
  heading,
  supportingText,
  children,
}: AuthPageLayoutProps) {
  const navigate = useNavigate()
  const { isDarkMode } = useAppStore()
  const [isExiting, setIsExiting] = useState(false)

  const handleBack = () => {
    setIsExiting(true)
    setTimeout(() => {
      navigate('/')
    }, 450)
  }

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden theme-transition ${
        isDarkMode ? 'bg-[#0A0A0C] text-[#F5F5F5]' : 'bg-[#F6F5F1] text-[#171717]'
      }`}
    >
      {/* ── Persistent Floating Auth Navbar ── */}
      <AuthNav onBack={handleBack} />

      {/* ── Subtle Atmospheric 3D AI Core Canvas ── */}
      <AuthCanvas />

      {/* ── Soft Background Radial Aura ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[850px] h-[650px] rounded-full blur-[150px] pointer-events-none"
          style={{
            background: isDarkMode
              ? 'radial-gradient(ellipse at center, rgba(6,182,212,0.06) 0%, rgba(139,92,246,0.04) 50%, transparent 80%)'
              : 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(241,241,238,0.45) 45%, rgba(246,245,241,0) 80%)',
          }}
        />
      </div>

      {/* ── Exact Visual Center Login Presentation ── */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 pt-24 pb-12 my-auto flex items-center justify-center">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={
              isExiting
                ? { opacity: 0, y: 20, scale: 0.96, filter: 'blur(4px)' }
                : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
            }
            transition={{
              duration: isExiting ? 0.45 : 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full max-w-lg"
          >
            <div
              className={`w-full p-8 sm:p-12 rounded-3xl border text-left theme-transition ${
                isDarkMode
                  ? 'bg-[#141418]/90 border-white/[0.08] shadow-2xl backdrop-blur-xl'
                  : 'bg-[#FAFAF8] border-black/[0.06] shadow-editorial-hover'
              }`}
            >
              {/* Header */}
              <div className="space-y-2 mb-8 text-center sm:text-left">
                <span
                  className={`text-[11px] font-bold tracking-[0.2em] uppercase block ${
                    eyebrow === 'STUDENT'
                      ? 'text-cyan-500'
                      : 'text-violet-500'
                  }`}
                >
                  {eyebrow}
                </span>
                
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
                  {heading}
                </h1>

                <p
                  className={`text-sm sm:text-base ${
                    isDarkMode ? 'text-[#A3A39E]' : 'text-[#6F6F6A]'
                  }`}
                >
                  {supportingText}
                </p>
              </div>

              {/* Form Content */}
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Minimal Footer ── */}
      <footer
        className={`relative z-10 w-full py-6 border-t text-center text-xs space-y-1 theme-transition ${
          isDarkMode
            ? 'border-white/[0.08] text-[#737373] bg-[#0A0A0C]'
            : 'border-black/[0.05] text-[#A3A39E] bg-[#F6F5F1]'
        }`}
      >
        <p className="font-medium text-xs text-inherit">Vernacular AI</p>
        <p className="text-[11px] opacity-60">"AI-powered vernacular learning." · © 2026</p>
      </footer>
    </div>
  )
}
