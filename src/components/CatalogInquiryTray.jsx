import { useState, useEffect } from 'react'
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

  // Auto-close tray when overlay (sheet/portal) opens
  useEffect(() => {
    if (isOverlayActive) setExpanded(false)
  }, [isOverlayActive])

  if (safeItems.length === 0) return null

  const estimatedTotal = safeItems.reduce((sum, item) => {
    const price = parseFloat(item.price?.toString().replace(/[^0-9.]/g, '')) || 0
    return sum + price * item.quantity
  }, 0)

  return (
    <>
      {/* Backdrop: tap outside to close */}
      {expanded && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Expandable tray */}
      {expanded && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md"
          style={{
            backgroundColor: COLOR.plate,
            borderTop: `0.5px solid ${COLOR.hairlineGold}`,
            transition: `transform 0.4s ${EASE}`,
          }}
        >
          <div className="max-h-[50vh] flex flex-col">
            {/* Header: shop name + clear all + close X */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
              <span className="font-wordmark text-sm" style={{ color: '#F0EDE4' }}>
                {shopName}
              </span>
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
                  aria-label="Close inquiry tray"
                  onClick={() => setExpanded(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border"
                  style={{ borderColor: COLOR.hairlineGold, color: COLOR.goldSecondary }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable item list — pb-20 clears the ~64px persistent bar */}
            <div className="flex-1 overflow-y-auto px-4 pb-20">
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
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onRemove(item.key)}
                        className="ml-1 flex h-6 w-6 items-center justify-center"
                        style={{ color: COLOR.body }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent bottom bar — hides when overlay is active */}
      <button
        onClick={() => setExpanded((v) => !v)}
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
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: COLOR.goldPrimary, color: COLOR.void }}
            >
              {safeItems.length}
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-medium" style={{ color: COLOR.goldSecondary }}>
                {safeItems.length} piece{safeItems.length === 1 ? '' : 's'} selected
              </span>
              <span className="text-[10px]" style={{ color: COLOR.body }}>
                ${estimatedTotal.toLocaleString()} est.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChevronDown
              className="h-4 w-4 transition-transform duration-300"
              style={{
                color: COLOR.body,
                transform: expanded ? 'rotate(180deg)' : 'none',
                transitionTimingFunction: EASE,
              }}
            />
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
              style={{ backgroundColor: COLOR.goldPrimary, color: COLOR.void }}
              onClick={(e) => {
                e.stopPropagation()
                onSend()
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Send Inquiry
            </span>
          </div>
        </div>
      </button>
    </>
  )
}
