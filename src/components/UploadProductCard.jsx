import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, MoreHorizontal, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/cn.js'
import ProcessingIndicator from './ProcessingIndicator.jsx'

const spring = { type: 'spring', stiffness: 300, damping: 30 }

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
]

export default function UploadProductCard({ item, isNew, onEdit, onDeleteRequest, processing, onRetry }) {
  const cardRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!isNew || !cardRef.current) return
    const timer = setTimeout(() => {
      const rect = cardRef.current.getBoundingClientRect()
      const stickyBarHeight = 80
      const padding = 16
      if (rect.bottom > window.innerHeight - stickyBarHeight) {
        window.scrollTo({ top: window.scrollY + rect.top - padding, behavior: 'smooth' })
      }
    }, 420)
    return () => clearTimeout(timer)
  }, [isNew])

  const isProcessingItem = processing && processing.state !== 'ready'
  const coverImage = item.images?.[0]?.url || item.image_url
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === item.stock_status)?.label ?? 'Available'

  const handleDeleteConfirm = () => {
    setConfirmingDelete(false)
    setMenuOpen(false)
    onDeleteRequest()
  }

  const handleCancelDelete = () => {
    setConfirmingDelete(false)
  }

  return (
    <motion.article ref={cardRef} layout transition={spring} className={cn('rounded-[24px] border border-border bg-card', isNew && 'animate-pop')}>
      <div className="flex gap-4 p-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
          {coverImage ? (
            <img src={coverImage} alt={item.title || 'Product photo'} className={cn('size-full object-cover transition-opacity duration-300', imageLoaded ? 'opacity-100' : 'opacity-0')} onLoad={() => setImageLoaded(true)} />
          ) : (
            <Store size={28} className="text-muted-foreground" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <h3 className={cn('font-serif font-light leading-snug', item.title ? 'text-base text-foreground' : 'text-base text-muted-foreground')} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.title || 'What are you selling?'}
          </h3>
          <p className={cn('font-sans', item.price ? 'text-sm font-medium text-primary' : 'text-sm text-muted-foreground')}>{item.price || 'Name your price'}</p>
          <p className="text-xs text-muted-foreground font-sans">{item.category ? `${item.category} \u00b7 ` : ''}{statusLabel}</p>
        </div>

        <div className="relative flex shrink-0 items-start justify-center pt-1">
          {!confirmingDelete ? (
            <>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                disabled={isProcessingItem}
                aria-label="Product actions"
                aria-expanded={menuOpen}
                className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
              >
                <MoreHorizontal size={20} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-10 w-40 rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-lift)]"
                  >
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onEdit() }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary active:scale-[0.97]"
                    >
                      <Pencil size={16} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 active:scale-[0.97]"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-0 z-10 w-52 rounded-2xl border border-destructive/30 bg-card p-3 shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Delete product?</p>
                  <p className="mt-0.5 text-xs text-muted-foreground" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title || 'This product'}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="flex-1 rounded-xl bg-secondary px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80 active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 rounded-xl bg-destructive px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-destructive/90 active:scale-[0.97]"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {isProcessingItem && (
        <div className="border-t border-border p-4">
          <ProcessingIndicator state={processing.state} error={processing.error} onRetry={onRetry} />
        </div>
      )}
    </motion.article>
  )
}
