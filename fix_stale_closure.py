#!/usr/bin/env python3
import sys

FILE = 'src/pages/Upload.jsx'

with open(FILE, 'r') as f:
    content = f.read()

old_items = "  const [items, setItems] = useState([])"
new_items = """  const [items, setItems] = useState([])
  const itemsRef = useRef(items)
  itemsRef.current = items"""

if old_items not in content:
    print('ERROR: items state declaration not found')
    sys.exit(1)
content = content.replace(old_items, new_items, 1)

old_handler = """  const handleAddImage = useCallback(async (itemId, file, blobUrl) => {
    try {
      const compressed = await compressImage(file)
      const imageUrl = await uploadToCloudinary(compressed)

      const item = items.find((it) => it.id === itemId)
      if (!item) return

      const nextImages = (item.images ?? []).map((img) =>
        img.url === blobUrl ? { url: imageUrl } : img
      )

      updateItem(itemId, {
        images: nextImages,
        image_url: nextImages[0]?.url || item.image_url,
      })
    } catch (err) {
      logger.error('Upload', 'Image add failed', { itemId, message: err.message })
      setInlineError('Image upload failed')

      const item = items.find((it) => it.id === itemId)
      if (item) {
        updateItem(itemId, {
          images: (item.images ?? []).filter((img) => img.url !== blobUrl),
        })
      }
    }
  }, [items, updateItem, setInlineError])"""

new_handler = """  const handleAddImage = useCallback(async (itemId, file, blobUrl) => {
    try {
      const compressed = await compressImage(file)
      const imageUrl = await uploadToCloudinary(compressed)

      const item = itemsRef.current.find((it) => it.id === itemId)
      if (!item) return

      const nextImages = (item.images ?? []).map((img) =>
        img.url === blobUrl ? { url: imageUrl } : img
      )

      updateItem(itemId, {
        images: nextImages,
        image_url: nextImages[0]?.url || item.image_url,
      })
    } catch (err) {
      logger.error('Upload', 'Image add failed', { itemId, message: err.message })
      setInlineError('Image upload failed')

      const item = itemsRef.current.find((it) => it.id === itemId)
      if (item) {
        updateItem(itemId, {
          images: (item.images ?? []).filter((img) => img.url !== blobUrl),
        })
      }
    }
  }, [updateItem, setInlineError])"""

if old_handler not in content:
    print('ERROR: handleAddImage not found')
    sys.exit(1)
content = content.replace(old_handler, new_handler, 1)

with open(FILE, 'w') as f:
    f.write(content)

print('OK: Stale closure fix applied')
