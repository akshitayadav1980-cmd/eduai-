import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: string
  children: ReactNode
  placement?: TooltipPlacement
  delay?: number
}

const placementClasses: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export function Tooltip({ content, children, placement = 'top', delay = 400 }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  let timer: ReturnType<typeof setTimeout>

  const show = () => { timer = setTimeout(() => setVisible(true), delay) }
  const hide = () => { clearTimeout(timer); setVisible(false) }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            role="tooltip"
            className={[
              'absolute z-50 pointer-events-none whitespace-nowrap',
              'px-2.5 py-1.5 rounded-md text-xs font-medium',
              'bg-slate-800 text-slate-100 border border-white/10',
              'shadow-lg',
              placementClasses[placement],
            ].join(' ')}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
