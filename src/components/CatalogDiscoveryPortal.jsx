import { useMemo, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import CatalogProductImage from './CatalogProductImage.jsx'

const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  goldPrimary: '#C5A059',
  goldSecondary: '#EADBB6',
  body: '#A0A5AD',
  hairlineGold: '#3A301A',
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export default function CatalogDiscoveryPortal({
  open,
  onClose,
  products,
  query,
  onQueryChange,
  dwellRecommendations,
  onOpenProduct,
}) {
  const touchStartY = useRef(null)

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    if (touch) touchStartY.current = touch.clientY
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === null) return
    const touch = e.touches[0]
    if (!touch) return
    const delta = touch.clientY - touchStartY.current
    if (delta > 60) {
      onClose()
      touchStartY.current = null
    }
  }, [onClose])

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, query])

  const isFiltering = query.trim().length > 0
  const showZeroState = isFiltering && filtered.length === 0
  const alternatives = products.slice(0, 3)

  return (
    <div
      role="region"
      aria-label="Discovery portal"
      aria-expanded={open}
      onClick={onClose}
      className="fixed inset-0 z-40 flex flex-col transition-all duration-500"
      style={{
        backgroundColor: 'rgba(0,0,0,0.85)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transform: open ? 'translateY(0)' : 'translateY(-16px)',
        transitionTimingFunction: EASE,
      }}
    >
      <div
        className="mx-auto flex h-full w-full max-w-md flex-col px-5 pb-8 pt-6"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle + close tap target */}
        <button
          aria-label="Close discovery portal"
          onClick={onClose}
          className="flex w-full justify-center pb-4 pt-2"
        >
          <div className="h-1 w-10 rounded-full" style={{ backgroundColor: 'rgba(197,160,89,0.4)' }} />
        </button>
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-medium uppercase"
            style={{ color: COLOR.body, letterSpacing: '0.22em' }}
          >
            Discover
          </span>
          <button
            aria-label="Close discovery portal"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border"
            style={{ borderColor: COLOR.hairlineGold, color: COLOR.goldSecondary }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Search input */}
        <div
          role="search"
          className="mt-5 flex items-center gap-2 border-b pb-3"
          style={{ borderColor: COLOR.hairlineGold }}
        >
          <Search className="h-4 w-4" style={{ color: COLOR.body }} aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search the catalog"
            aria-label="Search products"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#5A5D63]"
            style={{ color: COLOR.goldSecondary }}
          />
        </div>

        {/* Results */}
        <div className="mt-6 flex-1 overflow-y-auto no-scrollbar">
          {showZeroState ? (
            <div className="flex flex-col items-center gap-4 pt-8 text-center">
              <p className="text-sm leading-relaxed" style={{ color: COLOR.body }}>
                Nothing matches that search. Here are a few pieces close to what you might want.
              </p>
              <div className="grid w-full grid-cols-3 gap-2">
                {alternatives.map((p) => (
                  <button key={p.id} onClick={() => onOpenProduct(p.id)} aria-label={`View ${p.name}`}>
                    <CatalogProductImage images={p.images} activeIndex={0} />
                  </button>
                ))}
              </div>
            </div>
          ) : isFiltering ? (
            <div role="region" aria-label="Search results" className="grid grid-cols-3 gap-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onOpenProduct(p.id)}
                  aria-label={`View ${p.name}`}
                  className="flex flex-col gap-1.5"
                >
                  <CatalogProductImage images={p.images} activeIndex={0} />
                  <span className="truncate text-[11px]" style={{ color: COLOR.body }}>
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            dwellRecommendations.length > 0 && (
              <div role="region" aria-label="Recommended for you" className="flex flex-col gap-3">
                <span
                  className="text-[10px] font-medium uppercase"
                  style={{ color: COLOR.goldSecondary, letterSpacing: '0.2em' }}
                >
                  Because you lingered
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {dwellRecommendations.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onOpenProduct(p.id)}
                      aria-label={`View ${p.name}`}
                      className="flex flex-col gap-1.5 text-left"
                    >
                      <CatalogProductImage images={p.images} activeIndex={0} />
                      <span className="text-xs" style={{ color: COLOR.goldSecondary }}>
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
