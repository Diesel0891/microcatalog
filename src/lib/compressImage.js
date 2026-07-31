/**
 * Compress and re-encode product photos before Cloudinary upload.
 *
 * Uses HTML5 Canvas with createImageBitmap (auto-EXIF rotation).
 * Falls back to original file if compression fails or times out.
 *
 * @module compressImage
 */

const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.80
const COMPRESSION_TIMEOUT_MS = 5000

/**
 * Compress an image file for faster upload.
 *
 * @param {File} file - The original image file from the file input.
 * @returns {Promise<File>} The compressed File, or the original if compression fails.
 */
export async function compressImage(file) {
  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) return file

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn('[compressImage] Timeout, using original')
      resolve(file)
    }, COMPRESSION_TIMEOUT_MS)

    const doCompress = async () => {
      try {
        // createImageBitmap handles EXIF rotation automatically in modern Chrome
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

        const { width, height } = bitmap
        let targetWidth = width
        let targetHeight = height

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            targetWidth = MAX_DIMENSION
            targetHeight = Math.round(height * (MAX_DIMENSION / width))
          } else {
            targetHeight = MAX_DIMENSION
            targetWidth = Math.round(width * (MAX_DIMENSION / height))
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

        canvas.toBlob((blob) => {
          clearTimeout(timer)
          if (!blob) {
            resolve(file)
            return
          }
        const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        }, 'image/jpeg', JPEG_QUALITY)
      } catch (err) {
        clearTimeout(timer)
        console.warn('[compressImage] Failed, using original:', err.message)
        resolve(file)
      }
    }

    doCompress()
  })
}
