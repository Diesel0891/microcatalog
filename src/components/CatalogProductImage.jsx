import { useRef } from 'react'
import { NewBadge } from './CatalogUI.jsx'

const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  goldPrimary: '#C5A059',
  hairlineObsidian: '#1A1A1A',
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export default function CatalogProductImage({
  images = [],
  activeIndex = 0,
  onCycle,
  isNew = false,
  className = '',
}) {
  const touchStartX = useRef(null)

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    if (!touch) return
    touchStartX.current = touch.clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || !onCycle) return
    const touch = e.changedTouches[0]
    if (!touch) {
      touchStartX.current = null
      return
    }
    const delta = touch.clientX - touchStartX.current
    if (Math.abs(delta) > 40) onCycle(delta < 0 ? 1 : -1)
    touchStartX.current = null
  }

  const image = images[Math.min(activeIndex, images.length - 1)] ?? images[0]

  return (
    <div
      className={`relative aspect-[4/5] overflow-hidden rounded-lg p-3 ${className}`}
      style={{
        backgroundColor: COLOR.plate,
        border: `0.5px solid ${COLOR.hairlineObsidian}`,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isNew && <NewBadge />}

      {image ? (
        <img
          src={image.url || '/placeholder.svg'}
          alt={image.alt || 'Product image'}
          className="h-full w-full object-contain transition-opacity duration-500"
          style={{ transitionTimingFunction: EASE }}
          onError={(e) => {
            const target = e.currentTarget
            if (target.src.endsWith('/placeholder.svg')) return
            target.src = '/placeholder.svg'
          }}
        />
      ) : null}

      {/* Invisible tap zones for image cycling */}
      {onCycle && images.length > 1 && (
        <>
          <button
            aria-label="Previous image"
            onClick={() => onCycle(-1)}
            className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize opacity-0"
          />
          <button
            aria-label="Next image"
            onClick={() => onCycle(1)}
            className="absolute inset-y-0 right-0 w-1/3 cursor-e-resize opacity-0"
          />
        </>
      )}

      {/* Pagination dots (A6) */}
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="h-1 w-1 rounded-full border transition-all duration-300"
              style={{
                borderColor: COLOR.goldPrimary,
                backgroundColor: i === activeIndex ? COLOR.goldPrimary : 'transparent',
                transitionTimingFunction: EASE,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
