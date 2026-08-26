import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../lib/cn.js'

const spring = { type: 'spring', stiffness: 300, damping: 30 }

export default function FloatingLabelSelect({
  label,
  value,
  options,
  onChange,
  error,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const containerRef = useRef(null)
  const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, '-')}`
  const isFloated = isOpen || value.length > 0
  const selectedOption = options.find((o) => o.value === value)

  const borderColor = error
    ? 'border-[#b91c1c]'
    : isOpen
      ? 'border-[#3A301A]'
      : 'border-[#1A1A1A]'

  useEffect(() => {
    if (!isOpen) return

    function updateRect() {
      const el = containerRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.bottom + 6, left: r.left, width: r.width })
    }

    updateRect()

    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    function handleScroll() {
      setIsOpen(false)
    }

    document.addEventListener('mousedown', handleOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', updateRect)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [isOpen])

  return (
    <div className="w-full" ref={containerRef}>
      <button
        type="button"
        id={selectId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'relative w-full rounded-2xl border bg-[#0B0B0B] text-left transition-colors duration-200',
          borderColor,
        )}
      >
        <span className="flex w-full items-center justify-between px-4 py-3.5 text-base text-[#F0EDE4] font-sans">
          <span className={cn(!selectedOption && 'text-transparent')}>
            {selectedOption?.label ?? '.'}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              'text-[#A0A5AD] transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </span>
        <motion.label
          layout
          transition={spring}
          className={cn(
            'absolute pointer-events-none px-1 bg-[#0B0B0B] font-sans',
            isFloated
              ? 'top-0 left-3 -translate-y-1/2 text-xs text-[#C5A059]'
              : 'top-1/2 left-4 -translate-y-1/2 text-sm text-[#A0A5AD]',
          )}
        >
          {label}
        </motion.label>
      </button>
      {error ? <p className="text-xs text-[#b91c1c] mt-1.5 font-sans">{error}</p> : null}
      {isOpen && rect
        ? createPortal(
            <div
              role="listbox"
              style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width }}
              className="z-50 max-h-64 overflow-auto rounded-xl border border-[#1A1A1A] bg-[#0B0B0B] shadow-[0_12px_32px_rgba(0,0,0,0.3)] p-1"
            >
              {options.map((option) => {
                const selected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-sans transition-colors',
                      selected
                        ? 'bg-[#3A301A]/30 text-[#C5A059]'
                        : 'text-[#A0A5AD] hover:bg-[#1A1A1A]',
                    )}
                  >
                    {option.label}
                    {selected ? <Check size={14} /> : null}
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
