import { useState } from 'react'
import { MessageCircle, Search } from 'lucide-react'

export default function CatalogIdentityStrip({
  shopName,
  logoUrl,
  sellerPhone,
  isOwner,
  manageToken,
  sellerUuid,
  onOpenDiscover,
  isOverlayActive,
}) {
  const [logoError, setLogoError] = useState(false)

  if (isOverlayActive) return null

  const handleMessageSeller = () => {
    if (!sellerPhone) return
    const cleanPhone = sellerPhone.replace(/\\D/g, '')
    const message = encodeURIComponent("Hello — I'd like to inquire about your catalog.")
    const url = `https://wa.me/${cleanPhone}?text=${message}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleEditCatalog = () => {
    const token = manageToken || sellerUuid
    if (token) {
      window.location.href = `/#/u/${token}`
    }
  }

  return (
    <div className="w-full shrink-0 border-b px-4 pt-5 pb-3" style={{ borderColor: '#3A301A' }}>
      {/* Identity row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl && !logoError && (
            <img
              src={logoUrl}
              alt={`${shopName || 'Shop'} logo`}
              className="h-10 w-auto object-contain shrink-0"
              style={{ maxHeight: '40px' }}
              onError={() => setLogoError(true)}
            />
          )}
          <h1 className="font-wordmark text-[18px] font-bold tracking-tight text-[#F0EDE4] truncate min-w-0 leading-none">
            {shopName || 'Catalog'}
          </h1>
        </div>

        {onOpenDiscover && (
          <button
            onClick={onOpenDiscover}
            aria-label="Open discovery portal"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ color: '#A0A5AD' }}
          >
            <Search className="size-4" />
          </button>
        )}
      </div>

      {/* Action row */}
      <div className="mt-3 flex items-center justify-between">
        {sellerPhone && (
          <button
            onClick={handleMessageSeller}
            className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#25D366', color: '#ffffff' }}
            aria-label="Message seller on WhatsApp"
          >
            <MessageCircle className="size-4" />
            Message Seller
          </button>
        )}

        {isOwner && (
          <button
            onClick={handleEditCatalog}
            className="h-10 text-[10px] font-medium uppercase tracking-widest text-[#C5A059] hover:opacity-70 transition-opacity"
          >
            Edit catalog →
          </button>
        )}
      </div>
    </div>
  )
}
