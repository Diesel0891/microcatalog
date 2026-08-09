import { useState, useRef, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

/**
 * Premium floating label input component.
 *
 * Label starts as placeholder text inside the input. On focus or when
 * value exists, it springs upward and shrinks into a permanent label.
 * Supports text inputs, textareas, validation errors, helper text,
 * and auto-expanding textareas.
 *
 * @module FloatingLabel
 */

/**
 * Render a floating label input or textarea.
 *
 * @param {Object} props
 * @param {string} props.label - The field label (e.g. "Shop Name")
 * @param {string} props.value - Controlled value
 * @param {(e: React.ChangeEvent) => void} props.onChange - Change handler
 * @param {() => void} [props.onBlur] - Optional blur handler
 * @param {'text'|'tel'|'email'|'textarea'} [props.type='text'] - Input type
 * @param {string} [props.error] - Error message (renders in red)
 * @param {string} [props.helper] - Helper text (renders below, muted)
 * @param {boolean} [props.required=false] - Shows red asterisk
 * @param {boolean} [props.autoExpand=false] - Auto-expands textarea height
 * @param {number} [props.maxLength] - Character limit
 * @param {boolean} [props.disabled=false] - Disables input
 * @param {string} [props.className=''] - Additional Tailwind classes
 * @returns {JSX.Element}
 */
export default function FloatingLabel({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  error,
  helper,
  required = false,
  autoExpand = false,
  maxLength,
  disabled = false,
  className = '',
}) {
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef(null)

  const isActive = isFocused || (value && value.toString().length > 0)

  // Auto-expand textarea to fit content
  useEffect(() => {
    if (autoExpand && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value, autoExpand])

  const inputClasses = [
    'w-full bg-white border rounded-xl px-3 text-sm transition-all duration-200',
    'focus:outline-none focus:ring-0',
    error
      ? 'border-red-300 focus:border-red-500 bg-red-50/30'
      : isFocused
      ? 'border-copper-400'
      : 'border-stone-200 hover:border-stone-300',
    autoExpand
      ? 'resize-none overflow-hidden min-h-[80px] pt-5 pb-2'
      : 'pt-5 pb-2',
    disabled ? 'opacity-50 cursor-not-allowed bg-stone-50' : '',
    className,
  ].join(' ')

  const labelClasses = [
    'absolute left-3 pointer-events-none transition-all duration-300 ease-spring',
    isActive
      ? 'top-1 text-[10px] font-semibold tracking-wide text-copper-600'
      : 'top-3 text-sm text-charcoal-400',
  ].join(' ')

  return (
    <div className="relative">
      {type === 'textarea' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur?.(e)
          }}
          maxLength={maxLength}
          disabled={disabled}
          className={inputClasses}
          rows={1}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur?.(e)
          }}
          maxLength={maxLength}
          disabled={disabled}
          className={inputClasses}
        />
      )}

      <label className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}

      {helper && !error && (
        <p className="text-charcoal-400 text-xs mt-1.5">{helper}</p>
      )}
    </div>
  )
}

