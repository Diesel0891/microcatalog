import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, ArrowLeft } from 'lucide-react'
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

export default function ProductEditor({ item, onChange, onSuggest, onAddImage, processing, onRetry, onDone }) {
  const [showMoreDetails, setShowMoreDetails] = useState(false)
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
  const coverImage = item.images?.[0]?.url || item.image_url
  const key = item.localKey || item.id

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-6 py-4 backdrop-blur-xl">
        <button type="button" onClick={onDone} className="flex size-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-secondary active:scale-[0.97]" aria-label="Back to catalog">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">{item.title || 'New product'}</h1>
        </div>
      </header>

      <div className="flex-1 px-6 py-5 pb-28">
        <div className="mb-5 flex justify-center">
          <div className="relative size-40 overflow-hidden rounded-2xl bg-secondary">
            {coverImage ? (
              <img src={coverImage} alt={item.title || 'Product photo'} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground"><span className="text-sm">No photo</span></div>
            )}
          </div>
        </div>

        <ProductField label="Product name" required value={item.title} onChange={(v) => { if (!isProcessingItem) { onChange({ title: v }); if (nameError && v.trim().length > 0) setNameError('') } }} onBlur={() => validateName(item.title)} placeholder="What are you selling?" error={nameError} id={`title-${key}`} disabled={isProcessingItem} />
        <ProductField label="Price" optional value={item.price} onChange={(v) => { if (!isProcessingItem) onChange({ price: v }) }} placeholder="Add a price" inputMode="decimal" id={`price-${key}`} disabled={isProcessingItem} helperText="Add your price, or leave it blank for now." />

        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-foreground">Availability</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((option) => {
              const selected = option.value === item.stock_status
              return (
                <button key={option.value} type="button" onClick={() => { if (!isProcessingItem) onChange({ stock_status: option.value }) }} disabled={isProcessingItem}
                  className={cn('flex-1 rounded-xl border py-3 text-sm font-sans transition-colors active:scale-[0.97] disabled:opacity-50', selected ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-transparent text-muted-foreground hover:bg-secondary/60')}>
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-5">
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <p className="text-sm font-medium text-foreground">Let AI help with product details</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Use your photos to suggest useful information.</p>
            <button type="button" onClick={onSuggest} disabled={isProcessingItem || (processing?.state === 'analyzing')}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 py-3 text-sm font-medium font-sans text-primary transition-opacity active:scale-[0.97] disabled:opacity-60">
              <Sparkles size={16} className={processing?.state === 'analyzing' ? 'animate-pulse' : ''} />
              {processing?.state === 'analyzing' ? 'Thinking…' : 'Suggest details'}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[11px] font-sans text-muted-foreground/60">AI suggestions are a starting point — review before publishing.</p>
        </div>

        {isProcessingItem && (
          <div className="mb-4">
            <ProcessingIndicator state={processing.state} error={processing.error} onRetry={onRetry} />
          </div>
        )}

        <button type="button" onClick={() => setShowMoreDetails((v) => !v)}
          className="mb-2 flex w-full items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm font-sans text-muted-foreground transition-colors hover:bg-secondary/50 active:scale-[0.97]">
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">More product details</p>
            <p className="text-xs text-muted-foreground">Optional information customers may find useful.</p>
          </div>
          <ChevronDown size={16} className={cn('shrink-0 transition-transform', showMoreDetails && 'rotate-180')} />
        </button>

        <AnimatePresence initial={false}>
          {showMoreDetails ? (
            <motion.div key="more-details" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={spring} className="overflow-hidden">
              <div className="flex flex-col gap-0 pt-2">
                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Category <span className="font-normal text-muted-foreground">(Optional)</span></label>
                  <button type="button" onClick={() => { if (!isProcessingItem) setCategorySheetOpen(true) }} disabled={isProcessingItem}
                    className={cn('flex w-full items-center justify-between rounded-2xl border border-border bg-secondary/50 px-4 py-3.5 text-left text-sm transition-colors active:scale-[0.97] disabled:opacity-50', item.category ? 'text-foreground' : 'text-muted-foreground')}>
                    <span>{item.category || 'Select category'}</span><ChevronDown className="size-4 text-muted-foreground" />
                  </button>
                  <CategorySelectorSheet open={categorySheetOpen} selectedId={item.category} onSelect={(category) => onChange({ category })} onClose={() => setCategorySheetOpen(false)} />
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Photos <span className="font-normal text-muted-foreground">(Optional)</span></label>
                  <ImageUploadGrid images={item.images ?? []} onRemove={(index) => { if (isProcessingItem) return; const next = (item.images ?? []).filter((_, i) => i !== index); onChange({ images: next.length > 0 ? next : [{ url: item.image_url }] }) }} onAdd={() => { if (isProcessingItem) return; document.getElementById(`img-upload-${key}`).click() }} />
                  <input id={`img-upload-${key}`} type="file" accept="image/*" className="hidden" onChange={(e) => { if (isProcessingItem) return; const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; const url = URL.createObjectURL(file); const next = [...(item.images ?? []), { url, uploading: true }]; onChange({ images: next }); onAddImage(key, file, url) }} />
                </div>

                <ProductField label="Description" optional value={item.description} onChange={(v) => onChange({ description: v })} placeholder="Tell customers a little about it" as="textarea" rows={3} id={`desc-${key}`} disabled={isProcessingItem} />
                <ProductField label="Notes" optional value={item.extra_notes} onChange={(v) => onChange({ extra_notes: v })} placeholder="Anything else buyers should know" as="textarea" rows={2} id={`notes-${key}`} disabled={isProcessingItem} />

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Specifications <span className="font-normal text-muted-foreground">(Optional)</span></label>
                  <StructuredAttributes category={item.category} attributes={item.attributes ?? []} categoryTemplates={{ [item.category]: getCategorySpecs(item.category) }} onChange={(attributes) => onChange({ attributes })} />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
