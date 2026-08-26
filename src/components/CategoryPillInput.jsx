import { useState, useEffect } from 'react'
import FloatingLabelInput from './FloatingLabelInput.jsx'
import { cn } from '../lib/cn.js'

function CategoryPillInput({value, presets, onChange, onAddPreset }) {
  const [draft, setDraft] = useState(value ?? '')

  useEffect(() => {
    setDraft(value ?? '')
  }, [value])

  function commitDraft() {
    const trimmed = draft.trim()
    if (trimmed.length === 0) return
    if (!presets.includes(trimmed)) {
      onAddPreset(trimmed)
    }
    onChange(trimmed)
  }

  return (
    <div className="w-full">
      <FloatingLabelInput
        label="Category"
        value={draft}
        onChange={setDraft}
        placeholder="e.g. Apparel"
        id="category-pill-input"
      />
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar mt-2"
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commitDraft()
          }
        }}
      >
        {presets.map((preset) => {
          const selected = preset === value
          return (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setDraft(preset)
                onChange(preset)
              }}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-sans transition-colors active:scale-[0.97]',
                selected
                  ? 'border-[#C5A059]/40 text-[#C5A059] bg-[#3A301A]/30'
                  : 'border-[#3A301A] text-[#A0A5AD] hover:bg-[#1A1A1A]',
              )}
            >
              {preset}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryPillInput
