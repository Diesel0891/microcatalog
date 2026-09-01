import { cn } from '../lib/cn.js'

/**
 * ProductField — persistent-label form input for the product editor.
 *
 * Requirements:
 * - Label is ALWAYS visible above the input (never floating/disappearing).
 * - Required fields show a red asterisk.
 * - Optional fields show '(Optional)' in muted text.
 * - Errors appear below the field with aria-describedby linkage.
 * - Values are preserved on validation failure.
 * - Appropriate type/inputMode for mobile keyboards.
 *
 * @param {Object} props
 * @param {string} props.label — Visible field label
 * @param {string} props.value — Current input value
 * @param {function} props.onChange — (value) => void
 * @param {boolean} [props.required] — Show red asterisk
 * @param {boolean} [props.optional] — Show '(Optional)' suffix
 * @param {string} [props.type='text'] — HTML input type
 * @param {string} [props.inputMode] — Mobile keyboard mode
 * @param {string} [props.placeholder] — Placeholder text
 * @param {string} [props.error] — Error message to display
 * @param {string} [props.id] — Explicit id (auto-generated from label if omitted)
 * @param {'input'|'textarea'} [props.as='input'] — Render as textarea
 * @param {number} [props.rows=3] — textarea rows
 * @param {boolean} [props.disabled] — Disable input
 * @param {string} [props.helperText] — Helper text below input (shown when no error)
 */
export default function ProductField({
  label,
  value,
  onChange,
  required = false,
  optional = false,
  type = 'text',
  inputMode,
  placeholder,
  error,
  id,
  as = 'input',
  rows = 3,
  disabled = false,
  helperText,
  onBlur,
}) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
  const errorId = `${inputId}-error`
  const helperId = `${inputId}-helper`

  const hasError = Boolean(error && error.trim().length > 0)

  const borderColor = hasError
    ? 'border-destructive'
    : 'border-border focus:border-primary/40'

  return (
    <div className="w-full mb-4 last:mb-0">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-foreground mb-1.5"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true"> *</span>
        )}
        {optional && !required && (
          <span className="ml-1 text-muted-foreground font-normal"> (Optional)</span>
        )}
      </label>

      <div
        className={cn(
          'relative rounded-2xl border bg-card transition-colors duration-200',
          borderColor,
          disabled && 'opacity-50',
        )}
      >
        {as === 'textarea' ? (
          <textarea
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full bg-transparent text-foreground px-4 py-3.5 text-base outline-none font-sans resize-none placeholder:text-muted-foreground/50',
              disabled && 'cursor-not-allowed',
            )}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            inputMode={inputMode}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full bg-transparent text-foreground px-4 py-3.5 text-base outline-none font-sans placeholder:text-muted-foreground/50',
              disabled && 'cursor-not-allowed',
            )}
          />
        )}
      </div>

      {hasError ? (
        <p
          id={errorId}
          className="mt-1.5 text-xs text-destructive font-sans error-banner-enter"
        >
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-muted-foreground font-sans">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
