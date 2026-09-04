import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle, CheckCircle2, XCircle, AlertCircle, ArrowRight,
  ArrowLeft, Sparkles, RotateCcw, Trophy, Loader2, X
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import {
  generateQuiz,
  evaluateQuiz,
  QuizQuestionPublic,
  QuizEvaluateResponse,
  AnswerSubmission,
} from '../../services/quizService'
import { recordActivity } from '../../services/studentService'
import { toIsoLanguageCode } from '../../services/translationService'
import { ApiError } from '../../services/apiClient'
import { useNavigate } from 'react-router-dom'

interface QuizModalProps {
  isOpen: boolean
  onClose: () => void
  topic: string
  onQuizCompleted?: () => void
}

type QuizPhase = 'generating' | 'answering' | 'evaluating' | 'results' | 'error'

export function QuizModal({ isOpen, onClose, topic, onQuizCompleted }: QuizModalProps) {
  const navigate = useNavigate()
  const { selectedLanguageId, educationLevel, isDarkMode, logout } = useAppStore()

  const [phase, setPhase] = useState<QuizPhase>('generating')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Quiz questions state
  const [quizId, setQuizId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<QuizQuestionPublic[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})

  // Evaluation results state
  const [evaluation, setEvaluation] = useState<QuizEvaluateResponse | null>(null)

  // Trigger quiz generation whenever modal opens with a new topic
  useEffect(() => {
    if (!isOpen) {
      setPhase('generating')
      setErrorMessage(null)
      setQuizId(null)
      setQuestions([])
      setCurrentIdx(0)
      setSelectedAnswers({})
      setEvaluation(null)
      return
    }

    let isMounted = true

    async function loadQuiz() {
      setPhase('generating')
      setErrorMessage(null)
      try {
        const res = await generateQuiz({
          topic: topic || 'General Science & Language',
          languageId: selectedLanguageId,
          educationLevel,
          difficulty: 'medium',
          numQuestions: 5,
        })

        if (!isMounted) return

        if (!res.questions || res.questions.length === 0) {
          setErrorMessage(res.message || 'No questions could be generated for this topic.')
          setPhase('error')
          return
        }

        setQuizId(res.quiz_id)
        setQuestions(res.questions)
        setCurrentIdx(0)
        setSelectedAnswers({})
        setPhase('answering')
      } catch (err) {
        if (!isMounted) return
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login/student')
          return
        }
        const msg = err instanceof ApiError ? err.message : 'Failed to generate quiz. Please try again.'
        setErrorMessage(msg)
        setPhase('error')
      }
    }

    loadQuiz()

    return () => {
      isMounted = false
    }
  }, [isOpen, topic, selectedLanguageId, educationLevel, logout, navigate])

  const handleSelectOption = (questionId: string, option: string) => {
    if (phase !== 'answering') return
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  const handleSubmitQuiz = async () => {
    if (!quizId || phase === 'evaluating') return

    const answersList: AnswerSubmission[] = questions.map((q) => ({
      question_id: q.id,
      selected_option: selectedAnswers[q.id] || '',
    }))

    setPhase('evaluating')
    setErrorMessage(null)

    try {
      const evalRes = await evaluateQuiz(quizId, answersList)
      setEvaluation(evalRes)
      setPhase('results')

      // Record quiz completion in student learning progress
      recordActivity({
        activity_type: 'quiz',
        activity_id: quizId,
        score: evalRes.score,
        percentage: evalRes.percentage,
        completed: true,
        language: toIsoLanguageCode(selectedLanguageId),
        education_level: educationLevel,
      }).catch(() => {})

      if (onQuizCompleted) {
        onQuizCompleted()
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login/student')
        return
      }
      const msg = err instanceof ApiError ? err.message : 'Evaluation failed. Please try again.'
      setErrorMessage(msg)
      setPhase('error')
    }
  }

  const handleRetry = () => {
    setPhase('generating')
    setErrorMessage(null)
    setQuizId(null)
    setQuestions([])
    setCurrentIdx(0)
    setSelectedAnswers({})
    setEvaluation(null)

    generateQuiz({
      topic: topic || 'General Science & Language',
      languageId: selectedLanguageId,
      educationLevel,
      difficulty: 'medium',
      numQuestions: 5,
    })
      .then((res) => {
        if (!res.questions || res.questions.length === 0) {
          setErrorMessage(res.message || 'No questions could be generated.')
          setPhase('error')
          return
        }
        setQuizId(res.quiz_id)
        setQuestions(res.questions)
        setCurrentIdx(0)
        setSelectedAnswers({})
        setPhase('answering')
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login/student')
          return
        }
        setErrorMessage(err instanceof ApiError ? err.message : 'Failed to generate quiz.')
        setPhase('error')
      })
  }

  if (!isOpen) return null

  const currentQ = questions[currentIdx]
  const allAnswered = questions.length > 0 && questions.every((q) => Boolean(selectedAnswers[q.id]))

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl ${
            isDarkMode
              ? 'bg-[#12141C]/95 border-white/[0.1] text-slate-100'
              : 'bg-[#FAFAF8]/98 border-black/[0.08] text-slate-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base tracking-tight">
                  Adaptive Vernacular Quiz
                </h3>
                <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                  Topic: <span className="text-cyan-400 font-medium">{topic}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Quiz"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Loading / Generating Phase */}
            {phase === 'generating' && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                  <Sparkles size={20} className="absolute inset-0 m-auto text-cyan-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="font-display font-bold text-base text-white">Generating Calibrated Quiz...</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Retrieving verified vocabulary and formulating level-appropriate questions via AI.
                  </p>
                </div>
              </div>
            )}

            {/* 2. Error Phase */}
            {phase === 'error' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-1 max-w-md">
                  <p className="font-bold text-base text-rose-300">Quiz Operation Failed</p>
                  <p className="text-xs text-slate-400">
                    {errorMessage || 'Unable to communicate with the quiz engine. Please try again.'}
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-cinema-950 font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium text-xs hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* 3. Answering Phase */}
            {phase === 'answering' && currentQ && (
              <div className="space-y-6">
                {/* Progress bar and counter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                    <span>Question {currentIdx + 1} of {questions.length}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono uppercase">
                      {currentQ.difficulty || 'medium'}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
                      style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <p className="text-base sm:text-lg font-bold leading-relaxed text-white">
                    {currentQ.question}
                  </p>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = selectedAnswers[currentQ.id] === opt
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-sm ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-glow-cyan-subtle font-semibold'
                            : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.08] text-slate-300'
                        }`}
                      >
                        <span className="flex-1">{opt}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-500 text-cinema-950 font-bold text-[10px]'
                              : 'border-white/20 bg-transparent'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 4. Evaluating Phase */}
            {phase === 'evaluating' && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                <Loader2 size={36} className="text-cyan-400 animate-spin" />
                <div className="space-y-1">
                  <p className="font-display font-bold text-base text-white">Evaluating Answers...</p>
                  <p className="text-xs text-slate-400">
                    Performing 100% deterministic scoring against verified answer keys.
                  </p>
                </div>
              </div>
            )}

            {/* 5. Results Phase */}
            {phase === 'results' && evaluation && (
              <div className="space-y-6">
                {/* Score Summary Card */}
                <div
                  className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left ${
                    evaluation.passed
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                        evaluation.passed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      <Trophy size={32} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <h4 className="font-display text-2xl font-extrabold text-white">
                          {evaluation.percentage.toFixed(0)}% Score
                        </h4>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            evaluation.passed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {evaluation.passed ? 'PASSED' : 'NEEDS PRACTICE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {evaluation.correct_answers} of {evaluation.total_questions} questions correct. Recorded in your learning progress.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Per-Question Review List */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Question Breakdown & Explanations
                  </h4>

                  {evaluation.results.map((r, i) => (
                    <div
                      key={r.question_id || i}
                      className={`p-4 rounded-2xl border text-xs space-y-2 ${
                        r.is_correct
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-rose-500/5 border-rose-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-slate-200 flex-1">
                          {i + 1}. {r.question}
                        </p>
                        {r.is_correct ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                            <CheckCircle2 size={15} /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400 font-bold shrink-0">
                            <XCircle size={15} /> Incorrect
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 pt-1 text-[11px]">
                        <p className="text-slate-400">
                          Your Answer: <span className={r.is_correct ? 'text-emerald-300 font-medium' : 'text-rose-300 font-medium'}>{r.selected_option || '(No answer)'}</span>
                        </p>
                        {!r.is_correct && (
                          <p className="text-slate-400">
                            Correct Answer: <span className="text-emerald-300 font-medium">{r.correct_answer}</span>
                          </p>
                        )}
                        {r.explanation && (
                          <p className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-300 italic mt-1.5">
                            💡 {r.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/10">
            {phase === 'answering' && (
              <>
                <button
                  onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {currentIdx < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Next
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={!allAnswered}
                      className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-cinema-950 font-bold text-xs disabled:opacity-40 transition-all cursor-pointer shadow-glow-cyan"
                    >
                      Submit Quiz
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                </div>
              </>
            )}

            {phase === 'results' && (
              <div className="w-full flex items-center justify-between">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Retake Quiz
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-cinema-950 font-bold text-xs transition-colors cursor-pointer shadow-glow-cyan"
                >
                  Done
                </button>
              </div>
            )}

            {(phase === 'generating' || phase === 'evaluating' || phase === 'error') && (
              <div className="w-full flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
