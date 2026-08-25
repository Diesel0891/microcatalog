import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { StatusBadge, SquircleButton } from './CatalogUI.jsx'
import CatalogProductImage from './CatalogProductImage.jsx'

const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  goldPrimary: '#C5A059',
  goldSecondary: '#EADBB6',
  body: '#A0A5AD',
  hairlineObsidian: '#1A1A1A',
}

const SIGNATURE_THRESHOLD = 0.62
const NEW_PRODUCT_WINDOW_DAYS = 14

function computeIsNew(createdAt) {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  const ageMs = Date.now() - created
  return ageMs >= 0 && ageMs <= NEW_PRODUCT_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

function computePresentationTier(product, maxPrice) {
  const priceScore = maxPrice > 0 ? parseFloat(product.price || 0) / maxPrice : 0
  const score = priceScore * 0.75
  return score >= SIGNATURE_THRESHOLD ? 'signature' : 'collection'
}

export default function CatalogFeedCard({
  product,
  maxPrice,
  activeImageIndex,
  onCycleImage,
  isAdded,
  onToggle,
  onOpenDetail,
  onDwell,
}) {
  const cardRef = useRef(null)
  const tier = computePresentationTier(product, maxPrice)
  const isSignature = tier === 'signature'
  const isNew = computeIsNew(product.createdAt)

  // Dwell tracking
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    let startedAt = null
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          startedAt = Date.now()
        } else if (startedAt !== null) {
          onDwell(Date.now() - startedAt)
          startedAt = null
        }
      },
      { threshold: [0, 0.6, 1] },
    )
    observer.observe(el)
    return () => {
      if (startedAt !== null) onDwell(Date.now() - startedAt)
      observer.disconnect()
    }
  }, [onDwell])

  const images = Array.isArray(product.images) ? product.images : []

  // A2: Entire card tappable, but AddToInquiry button stops propagation
  const handleCardClick = (e) => {
    // Don't open detail if clicking the Add to Inquiry button
    if (e.target.closest('[data-inquiry-btn]')) return
    onOpenDetail()
  }

  return (
    <section
      ref={cardRef}
      className="flex h-dvh w-full snap-start flex-col justify-center px-5 py-5"
      style={{ backgroundColor: COLOR.void }}
      aria-label={product.name}
    >
      <div
        className="relative mx-auto w-full max-w-md overflow-hidden rounded-lg"
        style={{
          border: `0.5px solid ${COLOR.hairlineObsidian}`,
          backgroundColor: COLOR.plate,
        }}
      >
        {/* Image stage — tappable via parent, but has its own touch zones */}
        <div onClick={handleCardClick} className="cursor-pointer">
          <CatalogProductImage
            images={images}
            activeIndex={activeImageIndex}
            onCycle={onCycleImage}
            isNew={isNew}
            className="rounded-none border-0"
          />
        </div>

        {/* Content area — tappable to open detail */}
        <div
          className="flex flex-col gap-3 p-5 cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className="text-[10px] font-medium uppercase"
              style={{
                color: isSignature ? COLOR.goldSecondary : COLOR.body,
                letterSpacing: '0.22em',
              }}
            >
              {product.category || 'Product'}
            </span>
            <StatusBadge status={product.stockStatus} />
          </div>

          <div className="flex items-start justify-between gap-3 text-left">
            <h2
              className={`font-serif ${isSignature ? 'text-2xl' : 'text-xl'} font-light leading-tight text-balance`}
              style={{ color: '#F0EDE4' }}
            >
              {product.name || "Unnamed product"}
            </h2>
            <span
              className="shrink-0 text-base font-medium"
              style={{
                color: COLOR.goldPrimary,
                textShadow: isSignature ? '0 0 24px rgba(197,160,89,0.45)' : undefined,
              }}
            >
              {product.price || "Price on request"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] tracking-wide" style={{ color: COLOR.body }}>
              {product.sku}
            </span>
            <div data-inquiry-btn onClick={(e) => e.stopPropagation()}>
              <SquircleButton
                variant={isAdded ? 'ghost' : 'solid'}
                onClick={onToggle}
                ariaLabel={isAdded ? 'Remove from inquiry' : 'Add to inquiry'}
                ariaPressed={isAdded}
                className="h-8 px-3 text-xs"
                style={isAdded ? { backgroundColor: 'rgba(240,237,228,0.10)', borderColor: 'rgba(240,237,228,0.28)', color: '#F0EDE4' } : undefined}
              >
                {isAdded ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    In inquiry
                  </span>
                ) : (
                  'Add to Inquiry'
                )}
              </SquircleButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
