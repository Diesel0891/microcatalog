import { MessageCircle } from 'lucide-react'
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

/* Persistent bottom inquiry bar — v0 design */
export default function CatalogInquiryTray({
  items,
  onSend,
}) {
  const safeItems = Array.isArray(items) ? items : []
  if (safeItems.length === 0) return null

  // Calculate estimated total
  const estimatedTotal = safeItems.reduce((sum, item) => {
    const price = parseFloat(item.price?.toString().replace(/[^0-9.]/g, '')) || 0
    return sum + price * item.quantity
  }, 0)

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md"
      style={{
        backgroundColor: 'rgba(11,11,11,0.92)',
        borderTop: `0.5px solid ${COLOR.hairlineGold}`,
        backdropFilter: 'blur(20px)',
        transitionTimingFunction: EASE,
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Left: count + estimated total */}
        <div className="flex flex-col">
          <span className="text-xs font-medium" style={{ color: COLOR.goldSecondary }}>
            {safeItems.length} piece{safeItems.length === 1 ? '' : 's'} selected
          </span>
          <span className="text-[10px]" style={{ color: COLOR.body }}>
            ${estimatedTotal.toLocaleString()} est.
          </span>
        </div>

        {/* Right: Send Inquiry button */}
        <SquircleButton
          variant="solid"
          onClick={onSend}
          ariaLabel="Send consolidated WhatsApp inquiry"
          className="h-9 px-4 text-sm"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Send Inquiry
        </SquircleButton>
      </div>
    </div>
  )
}
