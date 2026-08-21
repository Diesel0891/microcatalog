import { useEffect } from 'react'
import { Check } from 'lucide-react'

/* ----------------------------------------------------------------------------
 * Infini v0 Visual Primitives
 * All styled for the dark OLED-black + gold theme.
 * ----------------------------------------------------------------------------*/

const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  goldPrimary: '#C5A059',
  goldSecondary: '#EADBB6',
  body: '#A0A5AD',
  hairlineGold: '#3A301A',
  hairlineObsidian: '#1A1A1A',
  viral: '#0099FF',
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/* 1. Hairline divider ------------------------------------------------------*/
export function Hairline({ tone = 'obsidian', className = '' }) {
  return (
    <div
      className={className}
      style={{
        height: '0.5px',
        backgroundColor: tone === 'gold' ? COLOR.hairlineGold : COLOR.hairlineObsidian,
      }}
    />
  )
}

/* 2. Status Badge — pill shape (A5 fix: all badges share identical pill) --*/
export function StatusBadge({ status }) {
  const label = status === 'available' ? 'Available' : status === 'reserved' ? 'Reserved' : 'Sold'
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase"
      style={{
        borderColor: COLOR.hairlineGold,
        color: COLOR.body,
        letterSpacing: '0.18em',
      }}
    >
      {label}
    </span>
  )
}

/* 3. New Badge -------------------------------------------------------------*/
export function NewBadge() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase"
      style={{
        backgroundColor: 'transparent',
        borderColor: COLOR.goldPrimary,
        color: COLOR.goldPrimary,
        letterSpacing: '0.16em',
      }}
    >
      New
    </span>
  )
}

/* 4. Squircle Button — pill shape (A4: matches filter chip geometry) ---------*/
export function SquircleButton({
  children,
  onClick,
  variant = 'ghost',
  className = '',
  ariaLabel,
  disabled,
  type = 'button',
  ariaPressed,
  style: externalStyle,
}) {
  const base =
    variant === 'solid'
      ? 'bg-infini-gold-primary text-black font-medium'
      : 'bg-transparent text-infini-gold-secondary border border-infini-hairline-gold'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full transition-all duration-300 disabled:opacity-40 ${base} ${className}`}
      style={{ transitionTimingFunction: EASE, ...externalStyle }}
    >
      {children}
    </button>
  )
}

/* 5. Scroll Position Indicator — right edge dots ---------------------------*/
export function ScrollPositionIndicator({ count, activeIndex, minProducts = 8 }) {
  if (count <= minProducts) return null
  return (
    <div
      className="pointer-events-none fixed right-2 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === activeIndex
        return (
          <span
            key={i}
            className="transition-all duration-300"
            style={{
              width: isActive ? '3px' : '3px',
              height: isActive ? '16px' : '3px',
              borderRadius: '9999px',
              backgroundColor: isActive ? COLOR.goldPrimary : 'rgba(197,160,89,0.25)',
              border: `0.5px solid ${COLOR.hairlineGold}`,
              transitionTimingFunction: EASE,
              opacity: isActive ? 1 : 0.7,
            }}
          />
        )
      })}
    </div>
  )
}

/* 6. Toast — auto-dismiss snackbar (A1: replaces persistent bar) -----------*/
export function Toast({ message, visible, onDismiss }) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onDismiss, 2000)
    return () => clearTimeout(t)
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-xs font-medium"
      style={{
        backgroundColor: COLOR.plate,
        borderColor: COLOR.hairlineGold,
        color: COLOR.goldSecondary,
        transitionTimingFunction: EASE,
        animation: 'fade-in-up 0.3s ease-out',
      }}
    >
      <span className="inline-flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5" style={{ color: COLOR.goldPrimary }} />
        {message}
      </span>
    </div>
  )
}

/* 7. Empty state for dark theme --------------------------------------------*/
export function CatalogEmptyState({ title, description }) {
  return (
    <div className="flex h-dvh items-center justify-center px-8 text-center" style={{ backgroundColor: COLOR.void }}>
      <p className="text-sm" style={{ color: COLOR.body }}>
        {description || title}
      </p>
    </div>
  )
}
