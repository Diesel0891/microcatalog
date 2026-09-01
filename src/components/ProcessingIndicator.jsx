import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, RotateCcw, Check } from "lucide-react"
import { cn } from "../lib/cn.js"

const STATUS_MESSAGES = {
  preparing_photo: "Preparing your photo…",
  uploading: "Uploading your photo…",
  analyzing: "Looking at your photo…",
  applying_details: "Adding product details…",
  ready: "Ready to edit",
  timeout: "Still working — this is taking a little longer than usual.",
}

const spring = { type: "spring", stiffness: 300, damping: 30 }

export default function ProcessingIndicator({ state, error, onRetry }) {
  const message = error?.message || STATUS_MESSAGES[state] || ""

  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        {state === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10"
          >
            <AlertCircle className="size-4 text-destructive" />
          </motion.div>
        ) : state === "ready" ? (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft"
          >
            <Check className="size-4 text-success" />
          </motion.div>
        ) : (
          <motion.div
            key="spinner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            className="flex size-8 shrink-0 items-center justify-center"
          >
            <span className="processing-dot" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          state === "error" ? "text-destructive" : "text-foreground"
        )}>
          {message}
        </p>
      </div>

      {state === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 active:scale-[0.97]"
        >
          <RotateCcw className="size-3.5" />
          Try again
        </button>
      )}
    </div>
  )
}
