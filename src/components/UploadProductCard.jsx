import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, ChevronUp, Pencil, Trash2, Sparkles, ChevronDown } from 'lucide-react'
import { cn } from '../lib/cn.js'
import ProductField from './ProductField.jsx'
import StructuredAttributes from './StructuredAttributes.jsx'
import CategorySelectorSheet from './CategorySelectorSheet.jsx'
import { getCategorySpecs } from '../lib/categories.js'
import ImageUploadGrid from './ImageUploadGrid.jsx'
import ProcessingIndicator from './ProcessingIndicator.jsx'

const spring = { type: 'spring', stiffness: 300, damping: 30 }

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
]

export default function UploadProductCard({
  item,
  open,
  isNew,
  onToggle,
  onChange,
  onDeleteRequest,
  onSuggest,
  suggesting,
  onAddImage,
  processing,
  onRetry,
}) {
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const cardRef = useRef(null)
  const detailsRef = useRef(null)
  useEffect(() => {
    if (!open || !cardRef.current) return
    const timer = setTimeout(() => {
      const rect = cardRef.current.getBoundingClientRect()
      const stickyBarHeight = 80
      const padding = 16
      if (rect.bottom > window.innerHeight - stickyBarHeight) {
        window.scrollTo({
          top: window.scrollY + rect.top - padding,
          behavior: 'smooth',
        })
      }
    }, 420)
    return () => clearTimeout(timer)
  }, [open])
  useEffect(() => {
    if (!showMoreDetails || !detailsRef.current) return
    const timer = setTimeout(() => {
      const rect = detailsRef.current.getBoundingClientRect()
      const stickyBarHeight = 80
      const padding = 16
      if (rect.bottom > window.innerHeight - stickyBarHeight) {
        window.scrollTo({
          top: window.scrollY + rect.top - padding,
          behavior: 'smooth',
        })
      }
    }, 420)
    return () => clearTimeout(timer)
  }, [showMoreDetails])


  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [nameError, setNameError] = useState('')

  const validateName = useCallback((name) => {
    if (!name || name.trim().length === 0) {
      setNameError("Add a product name so customers know what you're selling.")
      return false
    }
    setNameError('')
    return true
  }, [])

  const isProcessingItem = processing && processing.state !== 'ready'
  const _isError = processing?.state === 'error'
  const _isOptimistic = item.id === null

  const coverImage = item.images?.[0]?.url || item.image_url
  const needsDetails = !coverImage || !item.title || !item.price

  return (
    <motion.article
      ref={cardRef}
      layout
      transition={spring}
      className={cn(
        'overflow-hidden rounded-[20px] border border-border bg-card',
        isNew && 'animate-pop',
      )}
    >
      <div className="flex gap-4 p-3">
        <div className="shrink-0 size-24 rounded-2xl overflow-hidden bg-secondary flex items-center justify-center">
          {coverImage ? (
            <img
              src={coverImage || '/placeholder.svg'}
              alt={item.title || 'Product photo'}
              className="w-full h-full object-cover"
              style={{ width: 96, height: 96 }}
            />
          ) : (
            <Store size={28} className="text-muted-foreground" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <h3 className={cn(
              'font-serif font-light',
              item.title
                ? 'truncate text-xl text-foreground'
                : 'text-base text-muted-foreground leading-relaxed'
            )}>
            {item.title || 'What are you selling?'}
          </h3>
          <p
            className={cn(
              'font-sans',
              item.price
                ? 'text-base font-medium text-primary'
                : 'text-sm text-muted-foreground',
            )}
          >
            {item.price || 'Name your price'}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {item.category ? (
              <span className="rounded-full border border-primary/20 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-sans">
                {item.category}
              </span>
            ) : null}
            <span className="rounded-full border border-primary/20 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-sans">
              {STATUS_OPTIONS.find((s) => s.value === item.stock_status)?.label ?? 'Available'}
            </span>
            {needsDetails ? (
              <span className="rounded-lg bg-destructive/10 px-2.5 py-1 text-xs text-destructive font-sans">
                Needs details
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            disabled={isProcessingItem}
            aria-label={open ? 'Collapse product' : 'Edit product'}
            className="rounded-xl p-2 text-muted-foreground hover:bg-secondary transition-colors active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
          >
            {open ? <ChevronUp size={18} /> : <Pencil size={18} />}
          </button>
          <button
            type="button"
            onClick={onDeleteRequest}
            disabled={isProcessingItem}
            aria-label="Delete product"
            className="rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {isProcessingItem && (
        <div className="border-t border-border p-4">
          <ProcessingIndicator
            state={processing.state}
            error={processing.error}
            onRetry={onRetry}
          />
        </div>
      )}

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-4 flex flex-col gap-0">
              {/* PRIMARY: Product name */}
              <ProductField
                label="Product name"
                required
                value={item.title}
                onChange={(v) => {
                  if (isProcessingItem) return
                  onChange({ title: v })
                  if (nameError && v.trim().length > 0) setNameError('')
                }}
                onBlur={() => validateName(item.title)}
                placeholder="What are you selling?"
                error={nameError}
                id={`title-${item.localKey || item.id}`}
                disabled={isProcessingItem}
              />

              {/* PRIMARY: Price */}
              <ProductField
                label="Price"
                optional
                value={item.price}
                onChange={(v) => { if (!isProcessingItem) onChange({ price: v }) }}
                placeholder="Add a price"
                inputMode="decimal"
                id={`price-${item.localKey || item.id}`}
                disabled={isProcessingItem}
                helperText="Add your price, or leave it blank for now."
              />

              {/* SECONDARY: Suggest button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={onSuggest}
                  disabled={isProcessingItem || suggesting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 text-primary py-3 text-sm font-medium font-sans transition-opacity active:scale-[0.97] disabled:opacity-60"
                >
                  <Sparkles size={16} className={suggesting ? 'animate-pulse' : ''} />
                  {suggesting ? 'Thinking…' : 'Suggest details'}
                </button>
                <p className="text-[11px] text-center text-muted-foreground/60 font-sans mt-1.5">
                  AI suggestions are a starting point — review before publishing.
                </p>
              </div>

              {/* PROGRESSIVE DISCLOSURE */}
              <button
                type="button"
                onClick={() => setShowMoreDetails((v) => !v)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/30 text-muted-foreground py-3 text-sm font-sans transition-colors hover:bg-secondary/50 active:scale-[0.97] mb-2"
              >
                <ChevronDown
                  size={16}
                  className={cn('transition-transform', showMoreDetails && 'rotate-180')}
                />
                Add more details
              </button>

              <AnimatePresence initial={false}>
                {showMoreDetails ? (
                  <motion.div
                    key="more-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={spring}
                    className="overflow-hidden"
                  >
                    <div ref={detailsRef} className="flex flex-col gap-0 pt-2">
                      {/* Category */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Category <span className="text-muted-foreground font-normal">(Optional)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => { if (!isProcessingItem) setCategorySheetOpen(true) }}
                          disabled={isProcessingItem}
                          className={cn(
                            'w-full flex items-center justify-between rounded-2xl border border-border bg-secondary/50 px-4 py-3.5 text-left text-sm transition-colors active:scale-[0.97] disabled:opacity-50',
                            item.category ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          <span>{item.category || 'Select category'}</span>
                          <ChevronDown className="size-4 text-muted-foreground" />
                        </button>
                        <CategorySelectorSheet
                          open={categorySheetOpen}
                          selectedId={item.category}
                          onSelect={(category) => onChange({ category })}
                          onClose={() => setCategorySheetOpen(false)}
                        />
                      </div>

                      {/* Photos */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Photos <span className="text-muted-foreground font-normal">(Optional)</span>
                        </label>
                        <ImageUploadGrid
                          images={item.images ?? []}
                          onRemove={(index) => {
                            if (isProcessingItem) return
                            const next = (item.images ?? []).filter((_, i) => i !== index)
                            onChange({ images: next.length > 0 ? next : [{ url: item.image_url }] })
                          }}
                          onAdd={() => {
                            if (isProcessingItem) return
                            document.getElementById(`img-upload-${item.localKey || item.id}`).click()
                          }}
                        />
                        <input
                          id={`img-upload-${item.localKey || item.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (isProcessingItem) return
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (!file) return
                            const url = URL.createObjectURL(file)
                            const next = [...(item.images ?? []), { url, uploading: true }]
                            onChange({ images: next })
                            onAddImage(item.localKey || item.id, file, url)
                          }}
                        />
                      </div>

                      {/* Description */}
                      <ProductField
                        label="Description"
                        optional
                        value={item.description}
                        onChange={(v) => onChange({ description: v })}
                        placeholder="Tell customers a little about it"
                        as="textarea"
                        rows={3}
                        id={`desc-${item.localKey || item.id}`}
                        disabled={isProcessingItem}
                      />

                      {/* Notes */}
                      <ProductField
                        label="Notes"
                        optional
                        value={item.extra_notes}
                        onChange={(v) => onChange({ extra_notes: v })}
                        placeholder="Anything else buyers should know"
                        as="textarea"
                        rows={2}
                        id={`notes-${item.localKey || item.id}`}
                        disabled={isProcessingItem}
                      />

                      {/* Specifications */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Specifications <span className="text-muted-foreground font-normal">(Optional)</span>
                        </label>
                        <StructuredAttributes
                          category={item.category}
                          attributes={item.attributes ?? []}
                          categoryTemplates={{ [item.category]: getCategorySpecs(item.category) }}
                          onChange={(attributes) => onChange({ attributes })}
                        />
                      </div>

                      {/* Availability */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Availability <span className="text-muted-foreground font-normal">(Optional)</span>
                        </label>
                        <div className="flex gap-2">
                          {STATUS_OPTIONS.map((option) => {
                            const selected = option.value === item.stock_status
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => { if (!isProcessingItem) onChange({ stock_status: option.value }) }}
                                disabled={isProcessingItem}
                                className={cn(
                                  'flex-1 rounded-xl border py-2 text-sm font-sans transition-colors active:scale-[0.97] disabled:opacity-50',
                                  selected
                                    ? 'bg-primary/10 text-primary border-transparent'
                                    : 'border-border bg-transparent text-muted-foreground hover:bg-secondary/60',
                                )}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  )
}
