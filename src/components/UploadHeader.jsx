import { useState } from 'react'

function UploadHeader({shopName, logoUrl, onOpenPreview, isOverlayActive }) {
  const [logoError, setLogoError] = useState(false)

  if (isOverlayActive) return null

  return (
    <header
      className="w-full shrink-0 border-b px-4 pt-5 pb-3"
      style={{ borderColor: '#3A301A' }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl && !logoError ? (
            <img
              src={logoUrl || '/placeholder.svg'}
              alt={`${shopName} logo`}
              className="h-10 object-contain"
              style={{ maxHeight: 40 }}
              onError={() => setLogoError(true)}
            />
          ) : null}
          <span className="truncate font-wordmark text-[18px] font-bold text-[#F0EDE4]">
            {shopName}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenPreview}
          className="shrink-0 text-[10px] uppercase tracking-widest text-[#C5A059] hover:opacity-70 transition-opacity font-sans active:scale-[0.97]"
        >
          Preview catalog &rarr;
        </button>
      </div>
    </header>
  )
}

export default UploadHeader
