import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, ChevronDown, X, Minus, Plus, Trash2 } from 'lucide-react'

const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  goldPrimary: '#C5A059',
  goldSecondary: '#EADBB6',
  body: '#A0A5AD',
  hairlineGold: '#3A301A',
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export default function CatalogInquiryTray({
  items,
  shopName,
  onRemove,
  onQuantityChange,
  onSend,
  onClear,
  isOverlayActive,
}) {
  const safeItems = Array.isArray(items) ? items : []
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showScrollCue, setShowScrollCue] = useState(true)
  const [scrolledOnce, setScrolledOnce] = useState(false)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (isOverlayActive) setExpanded(false)
  }, [isOverlayActive])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !expanded) return
    const handle = () => {
      const max = el.scrollHeight - el.clientHeight
      setScrollProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0)
      if (el.scrollTop > 10 && !scrolledOnce) {
        setScrolledOnce(true)
        setShowScrollCue(false)
      }
    }
    handle()
    el.addEventListener('scroll', handle)
    return () => el.removeEventListener('scroll', handle)
  }, [expanded, scrolledOnce])

  useEffect(() => {
    if (!expanded) {
      setShowScrollCue(true)
      setScrolledOnce(false)
      return
    }
    const t = setTimeout(() => {
      if (!scrolledOnce) setShowScrollCue(false)
    }, 3000)
    return () => clearTimeout(t)
  }, [expanded, scrolledOnce])

  useEffect(() => {
    if (expanded && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [expanded])

  const handleToggleExpanded = useCallback(() => {
    setExpanded((v) => !v)
  }, [])

  const handleBackdropClick = useCallback(() => {
    setExpanded(false)
  }, [])

  const handleSend = useCallback(() => {
    onSend()
  }, [onSend])

  if (safeItems.length === 0) return null

  const estimatedTotal = safeItems.reduce((sum, item) => {
    const price = parseFloat(item.price?.toString().replace(/[^0-9.]/g, '')) || 0
    return sum + price * item.quantity
  }, 0)

  const hasScrollableContent = safeItems.length > 4

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-[55]"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {expanded && (
        <div
          id="inquiry-tray-content"
          className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-md"
          role="dialog"
          aria-modal="true"
          aria-label="Inquiry tray"
          style={{
            backgroundColor: COLOR.plate,
            borderTop: `0.5px solid ${COLOR.hairlineGold}`,
          }}
        >
          <div className="flex flex-col" style={{ maxHeight: '50vh' }}>
            {hasScrollableContent && (
              <div className="shrink-0 h-[1.5px] bg-[#1A1A1A]">
                <div
                  className="h-full transition-all duration-150"
                  style={{ width: `${scrollProgress * 100}%`, backgroundColor: COLOR.goldPrimary }}
                />
              </div>
            )}

            <div className="shrink-0 relative flex items-center justify-between px-4 pt-3 pb-2">
              <span className="font-wordmark text-sm" style={{ color: '#F0EDE4' }}>
                {shopName}
              </span>
              {hasScrollableContent && showScrollCue && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 animate-bounce" style={{ color: COLOR.goldPrimary }} />
                </div>
              )}
              <div className="flex items-center gap-3">
                {safeItems.length > 1 && (
                  <button
                    onClick={onClear}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: COLOR.body }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear all
                  </button>
                )}
                <button
                  ref={closeButtonRef}
                  aria-label="Close inquiry tray"
                  onClick={() => setExpanded(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border"
                  style={{ borderColor: COLOR.hairlineGold, color: COLOR.goldSecondary }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto px-4 relative"
              style={{ paddingBottom: '8px' }}
            >
              <div className="flex flex-col gap-3">
                {safeItems.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-8 w-8 rounded object-cover shrink-0"
                          style={{ border: `0.5px solid ${COLOR.hairlineGold}` }}
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-xs" style={{ color: COLOR.goldSecondary }}>
                          {item.productName}
                        </span>
                        <span className="text-[10px]" style={{ color: COLOR.body }}>
                          {item.stockStatus}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onQuantityChange(item.key, Math.max(1, item.quantity - 1))}
                        className="flex h-6 w-6 items-center justify-center rounded-full border"
                        style={{ borderColor: COLOR.hairlineGold, color: COLOR.goldSecondary }}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-xs tabular-nums" style={{ color: COLOR.goldSecondary }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onQuantityChange(item.key, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full border"
                        style={{ borderColor: COLOR.hairlineGold, color: COLOR.goldSecondary }}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onRemove(item.key)}
                        className="ml-1 flex h-6 w-6 items-center justify-center"
                        style={{ color: COLOR.body }}
                        aria-label={`Remove ${item.productName}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {hasScrollableContent && (
                <div
                  className="pointer-events-none absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1.5"
                  aria-hidden="true"
                >
                  {safeItems.map((_, i) => {
                    const itemProgress = i / Math.max(safeItems.length - 1, 1)
                    const isActive = Math.abs(scrollProgress - itemProgress) < (0.5 / safeItems.length)
                    return (
                      <span
                        key={i}
                        className="transition-all duration-300"
                        style={{
                          width: '3px',
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
              )}
            </div>

            {/* Footer CTA — Send Inquiry inside tray */}
            <div className="shrink-0 px-4 pb-3 pt-2">
              <button
                onClick={onSend}
                className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs font-medium"
                style={{ backgroundColor: COLOR.goldPrimary, color: COLOR.void }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Send Inquiry — {safeItems.length} item{safeItems.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-md rounded-full border px-4 py-3 transition-all"
        style={{
          backgroundColor: 'rgba(11,11,11,0.95)',
          borderColor: COLOR.hairlineGold,
          transitionTimingFunction: EASE,
          opacity: isOverlayActive ? 0 : 1,
          pointerEvents: isOverlayActive ? 'none' : 'auto',
          transform: isOverlayActive ? 'translateY(20px)' : 'translateY(0)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleToggleExpanded}
            aria-expanded={expanded}
            aria-controls="inquiry-tray-content"
            className="flex flex-1 items-center gap-3 text-left"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: COLOR.goldPrimary, color: COLOR.void }}
            >
              {safeItems.length}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: COLOR.goldSecondary }}>
                {safeItems.length} piece{safeItems.length === 1 ? '' : 's'} selected
              </span>
              <span className="text-[10px]" style={{ color: COLOR.body }}>
                ${estimatedTotal.toLocaleString()} est.
              </span>
            </div>
            <ChevronDown
              className="h-4 w-4 transition-transform duration-300"
              style={{
                color: COLOR.body,
                transform: expanded ? 'rotate(180deg)' : 'none',
                transitionTimingFunction: EASE,
              }}
              aria-hidden="true"
            />
          </button>

          <button
            onClick={handleSend}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
            style={{ backgroundColor: COLOR.goldPrimary, color: COLOR.void }}
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Send Inquiry
          </button>
        </div>
      </div>
    </>
  )
}
