import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Store, ChevronUp, Pencil, Trash2, Sparkles, ChevronDown } from 'lucide-react'
import { cn } from '../lib/cn.js'
import FloatingLabelInput from './FloatingLabelInput.jsx'
import StructuredAttributes from './StructuredAttributes.jsx'
import CategoryPillInput from './CategoryPillInput.jsx'
import ImageUploadGrid from './ImageUploadGrid.jsx'

const spring = { type: 'spring', stiffness: 300, damping: 30 }

const CATEGORY_TEMPLATES = {
  Apparel: ['Size', 'Color', 'Material', 'Fit'],
  Shoes: ['Size', 'Color', 'Material', 'Width'],
  Electronics: ['Screen Size', 'Storage', 'Battery', 'Condition'],
}

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
}) {
  const [showMoreDetails, setShowMoreDetails] = useState(false)

  const coverImage = item.images?.[0]?.url || item.image_url
  const needsDetails = !coverImage || !item.title || !item.price

  return (
    <motion.article
      layout
      transition={spring}
      className={cn(
        'overflow-hidden rounded-[20px] border border-[#1A1A1A] bg-[#0B0B0B]',
        isNew && 'animate-pop',
      )}
    >
      <div className="flex gap-4 p-3">
        <div className="shrink-0 size-24 rounded-2xl overflow-hidden bg-[#1A1A1A] flex items-center justify-center">
          {coverImage ? (
            <img
              src={coverImage || '/placeholder.svg'}
              alt={item.title || 'Product photo'}
              className="w-full h-full object-cover"
              style={{ width: 96, height: 96 }}
            />
          ) : (
            <Store size={28} className="text-[#A0A5AD]" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <h3 className="truncate font-serif text-xl font-light text-[#F0EDE4]">
            {item.title || 'What are you selling?'}
          </h3>
          <p
            className={cn(
              'text-base font-medium font-sans',
              item.price ? 'text-[#C5A059]' : 'text-[#A0A5AD]',
            )}
          >
            {item.price || 'Name your price'}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {item.category ? (
              <span className="rounded-full border border-[#3A301A] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.22em] text-[#A0A5AD] font-sans">
                {item.category}
              </span>
            ) : null}
            <span className="rounded-full border border-[#3A301A] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.22em] text-[#A0A5AD] font-sans">
              {STATUS_OPTIONS.find((s) => s.value === item.stock_status)?.label ?? 'Available'}
            </span>
            {needsDetails ? (
              <span className="rounded-lg bg-[#b91c1c]/10 px-2.5 py-1 text-xs text-[#b91c1c] font-sans">
                Needs details
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={open ? 'Collapse product' : 'Edit product'}
            className="rounded-xl p-2 text-[#A0A5AD] hover:bg-[#1A1A1A] transition-colors active:scale-[0.97]"
          >
            {open ? <ChevronUp size={18} /> : <Pencil size={18} />}
          </button>
          <button
            type="button"
            onClick={onDeleteRequest}
            aria-label="Delete product"
            className="rounded-xl p-2 text-[#A0A5AD] hover:bg-[#b91c1c]/10 hover:text-[#b91c1c] transition-colors active:scale-[0.97]"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

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
            <div className="border-t border-[#1A1A1A] p-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={onSuggest}
                disabled={suggesting}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#C5A059]/20 bg-[#C5A059]/5 text-[#C5A059] py-3 text-sm font-medium font-sans transition-opacity active:scale-[0.97] disabled:opacity-60"
              >
                <Sparkles size={16} className={suggesting ? 'animate-pulse' : ''} />
                {suggesting ? 'Thinking…' : 'Suggest details'}
              </button>
              <p className="text-[11px] text-center text-[#A0A5AD]/60 font-sans">
                AI suggestions are a starting point — review before publishing.
              </p>

              <FloatingLabelInput
                label="Product name"
                value={item.title}
                onChange={(v) => onChange({ title: v })}
                placeholder="What are you selling?"
                id={`title-${item.id}`}
              />
              <FloatingLabelInput
                label="Price"
                value={item.price}
                onChange={(v) => onChange({ price: v })}
                placeholder="Name your price"
                id={`price-${item.id}`}
              />
              <CategoryPillInput
                value={item.category}
                presets={Object.keys(CATEGORY_TEMPLATES)}
                onChange={(category) => onChange({ category })}
                onAddPreset={() => {}}
              />

              <ImageUploadGrid
                images={item.images ?? []}
                onRemove={(index) => {
                  const next = (item.images ?? []).filter((_, i) => i !== index)
                  onChange({ images: next.length > 0 ? next : [{ url: item.image_url }] })
                }}
                onAdd={() => document.getElementById(`img-upload-${item.id}`).click()}
              />
              <input
                id={`img-upload-${item.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  const url = URL.createObjectURL(file)
                  const next = [...(item.images ?? []), { url, uploading: true }]
                  onChange({ images: next })
                }}
              />

              <button
                type="button"
                onClick={() => setShowMoreDetails((v) => !v)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#1A1A1A]/60 bg-[#1A1A1A]/30 text-[#A0A5AD] py-3 text-sm font-sans transition-colors hover:bg-[#1A1A1A]/50 active:scale-[0.97]"
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
                    <div className="flex flex-col gap-3 pt-1">
                      <StructuredAttributes
                        category={item.category}
                        attributes={item.attributes ?? []}
                        categoryTemplates={CATEGORY_TEMPLATES}
                        onChange={(attributes) => onChange({ attributes })}
                      />
                      <FloatingLabelInput
                        label="Description"
                        value={item.description}
                        onChange={(v) => onChange({ description: v })}
                        placeholder="Tell buyers more about this item"
                        as="textarea"
                        rows={3}
                        id={`desc-${item.id}`}
                      />
                      <FloatingLabelInput
                        label="Notes"
                        value={item.extra_notes}
                        onChange={(v) => onChange({ extra_notes: v })}
                        placeholder="Anything else buyers should know"
                        id={`notes-${item.id}`}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="flex gap-2">
                {STATUS_OPTIONS.map((option) => {
                  const selected = option.value === item.stock_status
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChange({ stock_status: option.value })}
                      className={cn(
                        'flex-1 rounded-xl border py-2 text-sm font-sans transition-colors active:scale-[0.97]',
                        selected
                          ? 'bg-[#3A301A]/30 text-[#C5A059] border-transparent'
                          : 'border-[#1A1A1A] bg-transparent text-[#A0A5AD] hover:bg-[#1A1A1A]/60',
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  )
}
