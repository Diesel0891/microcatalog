with open('src/components/UploadProductCard.jsx', 'r') as f:
    content = f.read()

old_import = "import StructuredAttributes from './StructuredAttributes.jsx'"
new_import = """import StructuredAttributes from './StructuredAttributes.jsx'
import CategoryPillInput from './CategoryPillInput.jsx'
import ImageUploadGrid from './ImageUploadGrid.jsx'"""

if old_import not in content:
    print('ERROR: import target not found')
    exit(1)
content = content.replace(old_import, new_import, 1)

old_price = '''              <FloatingLabelInput
                label="Price"
                value={item.price}
                onChange={(v) => onChange({ price: v })}
                placeholder="Name your price"
                id={`price-${item.id}`}
              />'''

new_price = '''              <FloatingLabelInput
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
              />'''

if old_price not in content:
    print('ERROR: price input target not found')
    exit(1)
content = content.replace(old_price, new_price, 1)

old_btn = '''              <button
                type="button"
                onClick={() => setShowMoreDetails((v) => !v)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#1A1A1A]/60 bg-[#1A1A1A]/30 text-[#A0A5AD] py-3 text-sm font-sans transition-colors hover:bg-[#1A1A1A]/50 active:scale-[0.97]"
              >
                <ChevronDown
                  size={16}
                  className={cn('transition-transform', showMoreDetails && 'rotate-180')}
                />
                Add more details
              </button>'''

new_btn = '''              <ImageUploadGrid
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
              </button>'''

if old_btn not in content:
    print('ERROR: details button target not found')
    exit(1)
content = content.replace(old_btn, new_btn, 1)

with open('src/components/UploadProductCard.jsx', 'w') as f:
    f.write(content)
print('OK: Items 3 and 4 applied')
