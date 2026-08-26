import { useState } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import FloatingLabelInput from './FloatingLabelInput.jsx'

const spring = { type: 'spring', stiffness: 300, damping: 30 }

export default function StructuredAttributes({
  category,
  attributes,
  categoryTemplates,
  onChange,
}) {
  const [addingCustom, setAddingCustom] = useState(false)
  const [customKeyDraft, setCustomKeyDraft] = useState('')

  const templateKeys = category ? categoryTemplates[category] : undefined
  const hasTemplate = Boolean(templateKeys && templateKeys.length > 0)
  const idPrefix = `attr-${(category ?? 'none').toLowerCase().replace(/\s+/g, '-')}`

  function updateAttribute(key, value) {
    const exists = attributes.some((a) => a.key === key)
    const next = exists
      ? attributes.map((a) => (a.key === key ? { ...a, value: value } : a))
      : [...attributes, { key: key, value: value }]
    onChange(next)
  }

  function removeCustom(key) {
    onChange(attributes.filter((a) => a.key !== key))
  }

  function commitCustom() {
    const trimmed = customKeyDraft.trim()
    if (trimmed.length === 0) {
      setAddingCustom(false)
      return
    }
    const isDuplicate =
      attributes.some((a) => a.key === trimmed) || (templateKeys?.includes(trimmed) ?? false)
    if (!isDuplicate) {
      onChange([...attributes, { key: trimmed, value: '' }])
    }
    setCustomKeyDraft('')
    setAddingCustom(false)
  }

  if (!hasTemplate) {
    const freeFormValue = attributes.find((a) => a.key === 'Size / Specs')?.value ?? ''
    return (
      <div className="w-full">
        <FloatingLabelInput
          label="Size / Specs"
          value={freeFormValue}
          onChange={(v) => updateAttribute('Size / Specs', v)}
          placeholder="Size or specifications"
          id={`${idPrefix}-freeform`}
        />
      </div>
    )
  }

  const templateAttrs = templateKeys.map((key) => ({
    key,
    value: attributes.find((a) => a.key === key)?.value ?? '',
  }))
  const customAttrs = attributes.filter((a) => !templateKeys.includes(a.key))

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {templateAttrs.map((attr) => (
          <FloatingLabelInput
            key={attr.key}
            label={attr.key}
            value={attr.value}
            onChange={(v) => updateAttribute(attr.key, v)}
            id={`${idPrefix}-${attr.key.toLowerCase().replace(/\s+/g, '-')}`}
          />
        ))}
        {customAttrs.map((attr) => (
          <div key={attr.key} className="relative">
            <FloatingLabelInput
              label={attr.key}
              value={attr.value}
              onChange={(v) => updateAttribute(attr.key, v)}
              id={`${idPrefix}-${attr.key.toLowerCase().replace(/\s+/g, '-')}`}
            />
            <button
              type="button"
              onClick={() => removeCustom(attr.key)}
              aria-label={`Remove ${attr.key} attribute`}
              className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full border border-[#3A301A] bg-[#0B0B0B] text-[#A0A5AD] hover:text-[#F0EDE4] transition-colors active:scale-[0.97]"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {addingCustom ? (
          <motion.div
            key="custom-attribute-input"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 pt-1">
              <div className="flex-1">
                <FloatingLabelInput
                  label="Attribute name"
                  value={customKeyDraft}
                  onChange={setCustomKeyDraft}
                  placeholder="e.g. Pattern"
                  id={`${idPrefix}-custom-name`}
                />
              </div>
              <button
                type="button"
                onClick={commitCustom}
                className="shrink-0 rounded-xl border border-[#C5A059]/40 bg-[#3A301A]/30 px-4 py-3.5 text-sm text-[#C5A059] font-sans transition-colors active:scale-[0.97] hover:bg-[#3A301A]/50"
              >
                Add
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="add-custom-trigger"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setAddingCustom(true)}
              className="w-full rounded-xl border border-dashed border-[#1A1A1A] py-2.5 text-sm text-[#A0A5AD] font-sans transition-colors hover:bg-[#1A1A1A]/30 active:scale-[0.97]"
            >
              + Add custom attribute
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
