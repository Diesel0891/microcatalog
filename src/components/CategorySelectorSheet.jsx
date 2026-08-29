import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Search, X, Check } from 'lucide-react'
import { cn } from '../lib/cn.js'
import { CATEGORIES } from '../lib/categories.js'

const spring = { type: 'spring', stiffness: 300, damping: 30 }

export default function CategorySelectorSheet({ open, selectedId, onSelect, onClose }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CATEGORIES
    return CATEGORIES.filter((c) => c.label.toLowerCase().includes(q))
  }, [query])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 backdrop-blur-sm sm:items-center">
      <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={spring}
        className="relative w-full max-w-md rounded-t-[28px] border border-border bg-card p-5 shadow-[var(--shadow-lift)] sm:rounded-[28px]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Select category</h3>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-secondary"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="rounded-lg p-1 text-muted-foreground transition hover:bg-secondary">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-1">
            {filtered.map((cat) => {
              const selected = cat.id === selectedId
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelect(cat.id)
                    onClose()
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-colors active:scale-[0.97]',
                    selected
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-secondary/60',
                  )}
                >
                  <span>{cat.label}</span>
                  {selected && <Check className="size-4 text-primary" />}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No categories found</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
