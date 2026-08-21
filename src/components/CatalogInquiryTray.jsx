import { useState } from 'react'
import { MessageCircle, ChevronDown, X, Minus, Plus } from 'lucide-react'

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
}) {
  const safeItems = Array.isArray(items) ? items : []
  const [expanded, setExpanded] = useState(false)

  if (safeItems.length === 0) return null

  // Calculate estimated total
  const estimatedTotal = safeItems.reduce((sum, item) => {
    const price = parseFloat(item.price?.toString().replace(/[^0-9.]/g, '')) || 0
    return sum + price * item.quantity
  }, 0)

  return (
    <>
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
          <div className="max-h-64 overflow-y-auto px-4 py-3 pb-32">
            {shopName && (
              <div className="pb-2">
                <span className="font-wordmark text-sm" style={{ color: '#F0EDE4' }}>
                  {shopName}
                </span>
              </div>
            )}
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
                    {/* Quantity stepper */}
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
                    {/* Remove */}
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
      )}

      {/* Persistent bottom bar — tappable to expand tray */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-md rounded-full border px-4 py-3 transition-all"
        style={{
          backgroundColor: 'rgba(11,11,11,0.95)',
          borderColor: COLOR.hairlineGold,
          backdropFilter: 'blur(20px)',
          transitionTimingFunction: EASE,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: filled circle count + text */}
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

          {/* Right: ChevronDown + Send Inquiry */}
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
