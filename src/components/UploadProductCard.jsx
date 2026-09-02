import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Store, Pencil, Trash2 } from 'lucide-react'
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

  return (
    <motion.article ref={cardRef} layout transition={spring} className={cn('overflow-hidden rounded-[20px] border border-border bg-card', isNew && 'animate-pop')}>
      <div className="flex gap-4 p-3">
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
          <p className="text-xs text-muted-foreground font-sans">{item.category ? `${item.category} · ` : ''}{statusLabel}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-2">
          <button type="button" onClick={onEdit} disabled={isProcessingItem} aria-label="Edit product" className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"><Pencil size={18} /></button>
          <button type="button" onClick={onDeleteRequest} disabled={isProcessingItem} aria-label="Delete product" className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"><Trash2 size={18} /></button>
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
