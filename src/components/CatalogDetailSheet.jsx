import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, ChevronDown, Check } from 'lucide-react'
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
  onToggle,
  onSendWhatsapp,
}) {
  const scrollRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showScrollCue, setShowScrollCue] = useState(true)
  const [scrolledOnce, setScrolledOnce] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !open) return
    const handle = () => {
      const max = el.scrollHeight - el.clientHeight
      setScrollProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0)
      if (el.scrollTop > 10 && !scrolledOnce) {
        setScrolledOnce(true)
        setShowScrollCue(false)
      }
    }
    handle()
    el.addEventListener('scroll', handle)
    return () => el.removeEventListener('scroll', handle)
  }, [open, scrolledOnce])

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
  const specs = Array.isArray(product.specs) ? product.specs : []
  const visibleSpecs = specs.slice(0, MAX_VISIBLE_SPECS)
  const overflowSpecs = specs.slice(MAX_VISIBLE_SPECS)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.01 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: '#000000' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden border-t"
            style={{
              backgroundColor: COLOR.void,
              borderColor: COLOR.hairlineGold,
              contain: 'layout paint',
            }}
          >
            {/* Header strip: progress line + close + scroll cue */}
            <div
              className="absolute inset-x-0 top-0 z-30 flex h-14 items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
            >
              <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#1A1A1A]">
                <div
                  className="h-full transition-all duration-150"
                  style={{ width: `${scrollProgress * 100}%`, backgroundColor: COLOR.goldPrimary }}
                />
              </div>

              <button
                aria-label="Close details"
                onClick={onClose}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border"
                style={{
                  borderColor: COLOR.hairlineGold,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: COLOR.goldSecondary,
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              <AnimatePresence>
                {showScrollCue && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ChevronDown
                      className="h-4 w-4 animate-bounce"
                      style={{ color: COLOR.goldPrimary }}
                      aria-hidden="true"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scrollable content — z-index 1 so header (z-30) and CTA bar (z-20) stay above */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto pt-14" style={{ position: 'relative', zIndex: 1 }}>
              <CatalogProductImage
                images={Array.isArray(product.images) ? product.images : []}
                activeIndex={activeImageIndex}
                onCycle={onCycleImage}
                isNew={isNew}
                className="rounded-none border-0"
              />

              <div className="flex flex-col gap-5 p-5" style={{ paddingBottom: '7rem' }}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="text-[10px] font-medium uppercase"
                      style={{ color: COLOR.body, letterSpacing: '0.22em' }}
                    >
                      {product.category || 'Product'}
                    </span>
                    <StatusBadge status={product.stockStatus} />
                  </div>
                  <div className="flex items-start justify-between gap-3 text-left">
                    <h2
                      className="font-serif text-3xl font-light leading-tight text-balance"
                      style={{ color: '#F0EDE4' }}
                    >
                      {product.name}
                    </h2>
                    <span
                      className="shrink-0 text-xl font-medium"
                      style={{ color: COLOR.goldPrimary, textShadow: '0 0 28px rgba(197,160,89,0.4)' }}
                    >
                      {product.price}
                    </span>
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
                          <dd className="text-right text-xs" style={{ color: '#F0EDE4' }}>
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

            {/* CTA bar — solid background, z-index above scrollable content */}
            <div
              className="absolute inset-x-0 bottom-0 z-20 p-3"
              style={{ backgroundColor: COLOR.void }}
            >
              <div
                className="flex items-center justify-between gap-2 rounded-full border p-1.5"
                style={{ borderColor: 'rgba(197,160,89,0.55)', backgroundColor: COLOR.void }}
              >
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
