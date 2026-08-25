import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronUp, Pencil, Trash2, Sparkles, ChevronDown } from "lucide-react"
import { cn } from "../lib/cn.js"

const inputBase = "w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200 focus:border-primary/40 focus:bg-card"

const STATUS_META = {
  available: { label: "Available", badge: "bg-success-soft text-success" },
  reserved: { label: "Reserved", badge: "bg-reserved-soft text-reserved" },
  sold: { label: "Sold", badge: "bg-sold-soft text-sold" },
}

const spring = { type: "spring", stiffness: 300, damping: 30 }

function ProductImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-secondary sm:size-28">
      {!loaded && <div className="shimmer-v0 absolute inset-0" />}
      {src && (
        <img
          src={src}
          alt={alt || 'Product'}
          onLoad={() => setLoaded(true)}
          className={cn('size-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </div>
  )
}

function ProductCard({ item, open, isNew, onToggle, onChange, onDeleteRequest, onSuggest, suggesting }) {
  const cardRef = useRef(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const status = STATUS_META[item.stock_status] || STATUS_META.available
  const fieldClass = cn(inputBase, 'mt-1.5', suggesting && 'shimmer-v0 pointer-events-none text-transparent placeholder:text-transparent')

  useEffect(() => {
    if (!open || !cardRef.current) return
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        const rect = cardRef.current.getBoundingClientRect()
        const stickyBarHeight = 80
        const viewportBottom = window.innerHeight - stickyBarHeight
        if (rect.bottom > viewportBottom) {
          cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      })
    }, 350)
    return () => clearTimeout(timer)
  }, [open, detailsOpen])

  return (
    <motion.article ref={cardRef} layout transition={spring} className={cn("overflow-hidden rounded-[20px] border border-border bg-card/70 shadow-[var(--shadow-lift)] backdrop-blur-xl scroll-mb-24", isNew && "product-enter")}>
      <div className="flex gap-4 p-3">
        <ProductImage src={item.image_url} alt={item.title} />
        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-foreground">{item.title || 'What are you selling?'}</h3>
              <p className={cn('mt-1 font-medium', item.price ? 'text-foreground' : 'text-muted-foreground')}>
                {item.price || 'Name your price'}
              </p>
              {(() => {
                const detailCount = [item.size_specs, item.description, item.extra_notes].filter(Boolean).length
                return detailCount > 0 && !open ? (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/70">
                    <span className="size-1.5 rounded-full bg-primary/40" />
                    {detailCount} detail{detailCount !== 1 ? 's' : ''}
                  </span>
                ) : null
              })()}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onToggle}
                className="rounded-xl p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label={open ? 'Collapse product' : 'Edit product'}
              >
                {open ? <ChevronUp className="size-4" /> : <Pencil className="size-4" />}
              </button>
              <button
                onClick={onDeleteRequest}
                className="rounded-xl p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete product"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className={cn('inline-flex rounded-lg px-2.5 py-1 text-xs font-medium', status.badge)}>
              {status.label}
            </span>
            {(!item.image_url || !item.title?.trim() || !item.price?.trim()) && (
              <span className="inline-flex rounded-lg px-2.5 py-1 text-xs font-medium bg-destructive/10 text-destructive">
                Needs details
              </span>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-4">
              {/* Suggest Details — moved to top */}
              <button
                onClick={onSuggest}
                disabled={suggesting}
                className="mb-1.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:opacity-70"
              >
                <Sparkles className={cn('size-4', suggesting && 'animate-pulse')} />
                {suggesting ? 'Thinking…' : 'Auto-fill details'}
              </button>
              <p className="mb-4 text-[11px] text-center text-muted-foreground/60">
                Your photo is analyzed by the system to suggest details. It is not stored.
              </p>

              {/* Primary fields — always visible */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
                  Title
                  <input
                    inputMode="text"
                    className={fieldClass}
                    value={item.title || ''}
                    onChange={(e) => onChange({ title: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.closest('label')?.nextElementSibling?.querySelector('input,textarea')?.focus() } }}
                    placeholder="e.g. Handwoven basket"
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Price
                  <input
                    inputMode="decimal"
                    className={fieldClass}
                    value={item.price || ''}
                    onChange={(e) => onChange({ price: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const grid = e.target.closest('.grid'); grid?.querySelector('input[placeholder^="Medium"]')?.focus() } }}
                    placeholder="MWK 12,000"
                  />
                </label>
              </div>

              {/* Progressive disclosure toggle */}
              <button
                onClick={() => setDetailsOpen((v) => !v)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-secondary/30 py-2.5 px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary/50 press"
              >
                {detailsOpen ? 'Show less' : 'Add more details'}
                <span className={cn('transition-transform duration-200', detailsOpen && 'rotate-180')}>
                  <ChevronDown className="size-4" />
                </span>
              </button>

              {/* Secondary fields — collapsed by default */}
              <AnimatePresence initial={false}>
                {detailsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={spring}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-3 pt-3 sm:grid-cols-2">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...spring, delay: 0 }}
                      >
                        <label className="text-xs font-medium text-muted-foreground">
                          Size / Specs
                          <input
                            inputMode="text"
                            className={fieldClass}
                            value={item.size_specs || ''}
                            onChange={(e) => onChange({ size_specs: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const grid = e.target.closest('.grid'); grid?.querySelector('textarea')?.focus() } }}
                            placeholder="Medium, 40cm"
                          />
                        </label>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...spring, delay: 0.05 }}
                        className="sm:col-span-2"
                      >
                        <label className="text-xs font-medium text-muted-foreground">
                          Description
                          <textarea
                            inputMode="text"
                            rows={3}
                            className={cn(fieldClass, 'resize-none')}
                            value={item.description || ''}
                            onChange={(e) => onChange({ description: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const grid = e.target.closest('.grid'); grid?.querySelector('input[placeholder^="Optional"]')?.focus() } }}
                            placeholder="Describe your product"
                          />
                        </label>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...spring, delay: 0.1 }}
                        className="sm:col-span-2"
                      >
                        <label className="text-xs font-medium text-muted-foreground">
                          Notes
                          <input
                            inputMode="text"
                            className={fieldClass}
                            value={item.extra_notes || ''}
                            onChange={(e) => onChange({ extra_notes: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                            placeholder="Optional details"
                          />
                        </label>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status — bottom, single line, subtle buttons */}
              <div className="mt-4 flex items-center gap-3">
                <span className="shrink-0 text-xs font-medium text-muted-foreground">Status</span>
                <div className="flex flex-1 gap-2">
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => onChange({ stock_status: key })}
                      className={cn(
                        'flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 press',
                        item.stock_status === key
                          ? cn(meta.badge, 'border-transparent shadow-sm')
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary/60'
                      )}
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

export { ProductCard }
