import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, ChevronDown } from 'lucide-react'
import { Hairline, StatusBadge, SquircleButton } from './CatalogUI.jsx'
import CatalogProductImage from './CatalogProductImage.jsx'

const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  goldPrimary: '#C5A059',
  goldSecondary: '#EADBB6',
  body: '#A0A5AD',
  hairlineGold: '#3A301A',
  hairlineObsidian: '#1A1A1A',
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const NEW_PRODUCT_WINDOW_DAYS = 14
const MAX_VISIBLE_SPECS = 3

function computeIsNew(createdAt) {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  const ageMs = Date.now() - created
  return ageMs >= 0 && ageMs <= NEW_PRODUCT_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

export default function CatalogDetailSheet({
  product,
  open,
  onClose,
  activeImageIndex,
  onCycleImage,
  isAdded,
  onAdd,
  onSendWhatsapp,
}) {
  const scrollRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [hasMoreBelow, setHasMoreBelow] = useState(false)
  const [showScrollCue, setShowScrollCue] = useState(true)
  const [scrolledOnce, setScrolledOnce] = useState(false)

  // Scroll tracking + progress bar + scroll cue (A7)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !open) return
    const handle = () => {
      const max = el.scrollHeight - el.clientHeight
      setScrollProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0)
      setHasMoreBelow(el.scrollTop < max - 8)
      if (el.scrollTop > 10 && !scrolledOnce) {
        setScrolledOnce(true)
        setShowScrollCue(false)
      }
    }
    handle()
    el.addEventListener('scroll', handle)
    return () => el.removeEventListener('scroll', handle)
  }, [open, scrolledOnce])

  // Auto-hide scroll cue after 3 seconds (A7)
  useEffect(() => {
    if (!open) {
      setShowScrollCue(true)
      setScrolledOnce(false)
      return
    }
    const t = setTimeout(() => {
      if (!scrolledOnce) setShowScrollCue(false)
    }, 3000)
    return () => clearTimeout(t)
  }, [open, scrolledOnce])

  if (!product) return null

  const isNew = computeIsNew(product.createdAt)
  const specs = product.specs || []
  const visibleSpecs = specs.slice(0, MAX_VISIBLE_SPECS)
  const overflowSpecs = specs.slice(MAX_VISIBLE_SPECS)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.98 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden border-t"
            style={{
              backgroundColor: COLOR.void,
              borderColor: COLOR.hairlineGold,
            }}
          >
            {/* Scroll progress bar */}
            <div className="absolute inset-x-0 top-0 z-10 h-[1.5px] bg-[#1A1A1A]">
              <div
                className="h-full transition-all duration-150"
                style={{ width: `${scrollProgress * 100}%`, backgroundColor: COLOR.goldPrimary }}
              />
            </div>

            {/* Close button */}
            <button
              aria-label="Close details"
              onClick={onClose}
              className="absolute right-3 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md"
              style={{
                borderColor: COLOR.hairlineGold,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: COLOR.goldSecondary,
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Scroll cue (A7) */}
            <AnimatePresence>
              {showScrollCue && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-1/2 top-4 z-20 -translate-x-1/2"
                >
                  <ChevronDown
                    className="h-4 w-4 animate-bounce"
                    style={{ color: COLOR.goldPrimary }}
                    aria-hidden="true"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <CatalogProductImage
                images={product.images || []}
                activeIndex={activeImageIndex}
                onCycle={onCycleImage}
                isNew={isNew}
                className="rounded-none border-0"
              />

              <div className="flex flex-col gap-5 p-5" style={{ paddingBottom: '7rem' }}>
                <div className="flex flex-col gap-2">
                  <span
                    className="text-[10px] font-medium uppercase"
                    style={{ color: COLOR.body, letterSpacing: '0.22em' }}
                  >
                    {product.category || 'Product'}
                  </span>
                  <h2
                    className="font-serif text-3xl font-light leading-tight text-balance"
                    style={{ color: COLOR.goldSecondary }}
                  >
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xl font-medium"
                      style={{ color: COLOR.goldPrimary, textShadow: '0 0 28px rgba(197,160,89,0.4)' }}
                    >
                      {product.price}
                    </span>
                    <StatusBadge status={product.stockStatus} />
                  </div>
                </div>

                <Hairline tone="obsidian" />

                {product.description && (
                  <p className="text-sm leading-relaxed" style={{ color: COLOR.body }}>
                    {product.description}
                  </p>
                )}

                {visibleSpecs.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <Hairline tone="obsidian" />
                    <span
                      className="text-[10px] font-medium uppercase"
                      style={{ color: COLOR.body, letterSpacing: '0.2em' }}
                    >
                      Specifications
                    </span>
                    <dl className="flex flex-col gap-2">
                      {visibleSpecs.map((spec) => (
                        <div key={spec.label} className="flex items-baseline justify-between gap-4">
                          <dt className="text-xs" style={{ color: COLOR.body }}>
                            {spec.label}
                          </dt>
                          <dd className="text-right text-xs" style={{ color: COLOR.goldSecondary }}>
                            {spec.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {overflowSpecs.length > 0 && (
                      <span className="text-xs" style={{ color: COLOR.body }}>
                        +{overflowSpecs.length} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Fade gradient for more content */}
            {hasMoreBelow && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-[5.5rem] h-10"
                style={{ background: 'linear-gradient(to top, #000000, transparent)' }}
                aria-hidden="true"
              />
            )}

            {/* CTA bar (A4: shared container with hairline border, pill buttons at opposite ends) */}
            <div
              className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t p-3"
              style={{ backgroundColor: COLOR.void, borderColor: COLOR.hairlineGold }}
            >
              <SquircleButton
                variant="solid"
                onClick={onAdd}
                ariaLabel={isAdded ? 'Added to inquiry' : 'Add to inquiry'}
                className="h-8 px-3 text-xs"
              >
                {isAdded ? 'Added' : 'Add to Inquiry'}
              </SquircleButton>
              <SquircleButton
                variant="solid"
                onClick={onSendWhatsapp}
                ariaLabel="Send WhatsApp inquiry"
                className="h-8 px-3 text-xs"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                WhatsApp
              </SquircleButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
