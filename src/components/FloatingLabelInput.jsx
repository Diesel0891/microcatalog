import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/cn.js'

const spring = { type: 'spring', stiffness: 300, damping: 30 }

export default function FloatingLabelInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = ' ',
  error,
  id,
  as = 'input',
  rows = 3,
}) {
  const [isFocused, setIsFocused] = useState(false)
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  const isFloated = isFocused || value.length > 0

  const borderColor = error
    ? 'border-destructive'
    : isFocused
      ? 'border-primary/20'
      : 'border-border'

  const sharedProps = {
    id: inputId,
    value,
    onChange: (e) => onChange(e.target.value),
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    placeholder: ' ',
    'aria-invalid': Boolean(error),
    className: cn(
      'w-full bg-transparent text-foreground px-4 py-3.5 text-base outline-none font-sans placeholder:text-transparent',
      as === 'textarea' && 'resize-none',
    ),
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative rounded-2xl border bg-card transition-colors duration-200',
          borderColor,
        )}
      >
        {as === 'textarea' ? (
          <textarea {...sharedProps} rows={rows} />
        ) : (
          <input {...sharedProps} type={type} />
        )}
        <motion.label
          htmlFor={inputId}
          layout
          transition={spring}
          className={cn(
            'absolute pointer-events-none px-1 bg-card font-sans',
            isFloated
              ? 'top-0 left-3 -translate-y-1/2 text-xs text-primary'
              : 'top-1/2 left-4 -translate-y-1/2 text-sm text-muted-foreground',
          )}
        >
          {label}
        </motion.label>
      </div>
      {error ? <p className="text-xs text-destructive mt-1.5 font-sans">{error}</p> : null}
      {!error && placeholder.trim().length > 0 && value.length === 0 ? (
        <span className="sr-only">{placeholder}</span>
      ) : null}
    </div>
  )
}
