import { ListChecks, X, ChevronDown, MessageCircle, Minus, Plus } from 'lucide-react'
import { SquircleButton } from './CatalogUI.jsx'

const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  goldPrimary: '#C5A059',
  goldSecondary: '#EADBB6',
  body: '#A0A5AD',
  hairlineGold: '#3A301A',
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

function formatSelection(selection) {
  const parts = Object.entries(selection || {}).map(([k, v]) => `${k}: ${v}`)
  return parts.length ? ` (${parts.join(', ')})` : ''
}

function QuantityStepper({ quantity, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <SquircleButton
        ariaLabel="Decrease quantity"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        className="h-7 w-7 p-0"
      >
        <Minus className="h-3 w-3" aria-hidden="true" />
      </SquircleButton>
      <span
        className="w-4 text-center text-sm tabular-nums"
        style={{ color: COLOR.goldSecondary }}
        aria-live="polite"
      >
        {quantity}
      </span>
      <SquircleButton
        ariaLabel="Increase quantity"
        onClick={() => onChange(quantity + 1)}
        className="h-7 w-7 p-0"
      >
        <Plus className="h-3 w-3" aria-hidden="true" />
      </SquircleButton>
    </div>
  )
}

/* Floating badge — small, corner-anchored, opens tray on tap (A1) */
export function CatalogFloatingBadge({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={`${count} item${count === 1 ? '' : 's'} in inquiry, open tray`}
      className="fixed bottom-6 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-transform active:scale-95"
      style={{
        backgroundColor: COLOR.plate,
        borderColor: COLOR.hairlineGold,
        color: COLOR.goldSecondary,
      }}
    >
      <ListChecks className="h-4 w-4" aria-hidden="true" />
      <span
        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ backgroundColor: COLOR.goldPrimary, color: COLOR.void }}
      >
        {count}
      </span>
    </button>
  )
}

/* Expandable inquiry tray overlay (A1) */
export default function CatalogInquiryTray({
  items,
  expanded,
  onToggle,
  onRemove,
  onQuantityChange,
  onSend,
  shopName,
}) {
  const safeItems = Array.isArray(items) ? items : []
  if (safeItems.length === 0) return null

  return (
    <>
      {/* Floating badge when tray is collapsed */}
      {!expanded && <CatalogFloatingBadge count={safeItems.length} onClick={onToggle} />}

      {/* Full tray overlay when expanded */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-3 pb-3 transition-all duration-400"
        style={{
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
          transform: expanded ? 'translateY(0)' : 'translateY(20px)',
          transitionTimingFunction: EASE,
        }}
      >
        {/* Item list */}
        {expanded && (
          <div
            role="region"
            aria-label="Inquiry list"
            className="mb-2 max-h-64 overflow-y-auto border p-3"
            style={{ backgroundColor: COLOR.plate, borderColor: COLOR.hairlineGold }}
          >
            {/* Shop wordmark (B5) */}
            {shopName && (
              <div className="mb-3 border-b pb-2" style={{ borderColor: COLOR.hairlineGold }}>
                <span
                  className="font-wordmark text-sm font-medium"
                  style={{ color: COLOR.goldSecondary }}
                >
                  {shopName}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {safeItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs" style={{ color: COLOR.goldSecondary }}>
                      {item.productName}
                    </span>
                    <span className="text-[10px]" style={{ color: COLOR.body }}>
                      {formatSelection(item.selection).replace(/[()]/g, '') || item.stockStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <QuantityStepper
                      quantity={item.quantity}
                      onChange={(q) => onQuantityChange(item.key, q)}
                    />
                    <button
                      aria-label={`Remove ${item.productName}`}
                      onClick={() => onRemove(item.key)}
                      style={{ color: COLOR.body }}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar — only visible when expanded */}
        <div
          className="flex items-center gap-3 border p-3"
          style={{
            backgroundColor: 'rgba(11,11,11,0.92)',
            borderColor: COLOR.hairlineGold,
            backdropFilter: 'blur(20px)',
          }}
        >
          <button
            onClick={onToggle}
            aria-label={expanded ? 'Collapse list' : 'Expand list'}
            className="flex h-10 w-10 items-center justify-center rounded-full border"
            style={{ borderColor: COLOR.hairlineGold, color: COLOR.goldSecondary }}
          >
            <ListChecks className="h-4 w-4" aria-hidden="true" />
          </button>
          <span aria-live="polite" className="text-xs" style={{ color: COLOR.body }}>
            <span className="font-medium" style={{ color: COLOR.goldPrimary }}>
              {safeItems.length}
            </span>{' '}
            item{items.length === 1 ? '' : 's'} in your inquiry
          </span>
          <button
            onClick={onToggle}
            aria-label={expanded ? 'Collapse list' : 'Expand list'}
            className="ml-auto"
            style={{ color: COLOR.body }}
          >
            <ChevronDown
              className="h-4 w-4 transition-transform duration-300"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transitionTimingFunction: EASE }}
              aria-hidden="true"
            />
          </button>
          <SquircleButton
            variant="solid"
            onClick={onSend}
            ariaLabel="Send consolidated WhatsApp inquiry"
            className="h-10 px-4 text-sm"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Send
          </SquircleButton>
        </div>
      </div>
    </>
  )
}
