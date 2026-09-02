import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const spring = { type: 'spring', stiffness: 300, damping: 30 }

export default function DeleteUndoToast({ message, visible, onUndo, onDismiss }) {
  const timerRef = useRef(null)

  function startTimer() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onDismiss()
    }, 5000)
  }

  useEffect(() => {
    if (visible) {
      startTimer()
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={spring}
          onMouseEnter={() => {
            if (timerRef.current) clearTimeout(timerRef.current)
          }}
          onMouseLeave={startTimer}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full border border-border bg-card px-4 py-2.5 flex items-center gap-3 shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
        >
          <span className="text-xs text-foreground font-sans">{message}</span>
          <button
            type="button"
            onClick={onUndo}
            className="text-xs font-medium text-primary font-sans active:scale-[0.97]"
          >
            Undo
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
