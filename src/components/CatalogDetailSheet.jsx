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

const SPRING = {
  sheet: { type: 'spring', stiffness: 400, damping: 35, mass: 0.8 },
  sheetClose: { type: 'spring', stiffness: 500, damping: 40, mass: 0.7 },
  backdrop: { type: 'spring', stiffness: 300, damping: 30 },
  content: { type: 'spring', stiffness: 350, damping: 32 },
  button: { type: 'spring', stiffness: 500, damping: 30 },
}

const NEW_PRODUCT_WINDOW_DAYS = 14
const MAX_VISIBLE_SPECS = 3

function computeIsNew(createdAt) {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  const ageMs = Date.now() - created
  return ageMs >= 0 && ageMs <= NEW_PRODUCT_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: SPRING.backdrop },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const sheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: SPRING.sheet },
  exit: { y: '100%', transition: SPRING.sheetClose },
}

const imageVariants = {
  hidden: { scale: 1.03 },
  visible: { scale: 1, transition: { ...SPRING.content, delay: 0.1 } },
}

const headerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING.content, delay: 0.14 } },
}

const contentContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.18 } },
}

const contentItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: SPRING.content },
}

const ctaVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING.content, delay: 0.28 } },
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
  const closeButtonRef = useRef(null)
  const lastFocusedRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showScrollCue, setShowScrollCue] = useState(true)
  const [scrolledOnce, setScrolledOnce] = useState(false)

  // Escape to close
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Focus management: trap focus on open, restore on close
  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    } else if (lastFocusedRef.current) {
      lastFocusedRef.current.focus()
      lastFocusedRef.current = null
    }
  }, [open])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = original }
    }
  }, [open])

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
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-40"
            style={{ backgroundColor: '#000000' }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} — details`}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden border-t"
            style={{
              backgroundColor: COLOR.void,
              borderColor: COLOR.hairlineGold,
              contain: 'layout paint',
            }}
          >
            <motion.div
              variants={headerVariants}
              initial="hidden"
              animate="visible"
              className="absolute inset-x-0 top-0 z-30 flex h-14 items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
            >
              <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#1A1A1A]">
                <div
                  className="h-full transition-all duration-150"
                  style={{ width: `${scrollProgress * 100}%`, backgroundColor: COLOR.goldPrimary }}
                />
              </div>

              <motion.button
                ref={closeButtonRef}
                whileTap={{ scale: 0.88 }}
                transition={SPRING.button}
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
              </motion.button>

              <AnimatePresence>
                {showScrollCue && (
                  <motion.div
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: [0, 4, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{
                      opacity: { duration: 0.3 },
                      y: { duration: 0.6, repeat: 1, repeatType: 'reverse', ease: 'easeInOut' },
                    }}
                  >
                    <ChevronDown
                      className="h-4 w-4"
                      style={{ color: COLOR.goldPrimary }}
                      aria-hidden="true"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto pt-14" style={{ position: 'relative', zIndex: 1 }}>
              <motion.div variants={imageVariants} initial="hidden" animate="visible">
                <CatalogProductImage
                  images={Array.isArray(product.images) ? product.images : []}
                  activeIndex={activeImageIndex}
                  onCycle={onCycleImage}
                  isNew={isNew}
                  className="rounded-none border-0"
                />
              </motion.div>

              <motion.div
                variants={contentContainerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-5 p-5"
                style={{ paddingBottom: '7rem' }}
              >
                <motion.div variants={contentItemVariants} className="flex flex-col gap-2">
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
                </motion.div>

                <motion.div variants={contentItemVariants}>
                  <Hairline tone="obsidian" />
                </motion.div>

                {product.description && (
                  <motion.p variants={contentItemVariants} className="text-sm leading-relaxed" style={{ color: COLOR.body }}>
                    {product.description}
                  </motion.p>
                )}

                {visibleSpecs.length > 0 && (
                  <motion.div variants={contentItemVariants} className="flex flex-col gap-3">
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
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-16"
              style={{
                background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${COLOR.void} 100%)`,
                opacity: scrollProgress < 1 ? 0.55 : 0,
                transition: 'opacity 150ms ease',
              }}
            />

            <motion.div
              variants={ctaVariants}
              initial="hidden"
              animate="visible"
              className="absolute inset-x-0 bottom-0 z-20 p-3"
              style={{ backgroundColor: COLOR.void }}
            >
              <div
                className="flex items-center justify-between gap-2 rounded-full border p-1.5"
                style={{ borderColor: 'rgba(197,160,89,0.55)', backgroundColor: COLOR.void }}
              >
                <motion.div whileTap={{ scale: 0.93 }} transition={SPRING.button}>
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
                </motion.div>
                <motion.div whileTap={{ scale: 0.93 }} transition={SPRING.button}>
                  <SquircleButton
                    variant="solid"
                    onClick={onSendWhatsapp}
                    ariaLabel="Send WhatsApp inquiry"
                    className="h-8 px-3 text-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    WhatsApp
                  </SquircleButton>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
