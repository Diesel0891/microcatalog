/**
 * Image Handling Module
 * Object URL lifecycle, multi-upload queue, legacy migration.
 */

import { compressImage } from './compressImage.js'
import { uploadToCloudinary } from './cloudinary.js'

const OBJECT_URLS = new Set()

/* -------------------------------------------------------------------------- */
/* Object URL Lifecycle (Immediate Local Preview)                             */
/* -------------------------------------------------------------------------- */

/**
 * Create an object URL for immediate preview. Tracks for cleanup.
 * @param {File} file
 * @returns {string} Object URL
 */
export function createObjectUrl(file) {
  const url = URL.createObjectURL(file)
  OBJECT_URLS.add(url)
  return url
}

/**
 * Revoke a single object URL and remove from tracking.
 * @param {string} url
 */
export function revokeObjectUrl(url) {
  if (OBJECT_URLS.has(url)) {
    URL.revokeObjectURL(url)
    OBJECT_URLS.delete(url)
  }
}

/**
 * Revoke all tracked object URLs. Call on component unmount.
 */
export function revokeAllObjectUrls() {
  OBJECT_URLS.forEach((url) => URL.revokeObjectURL(url))
  OBJECT_URLS.clear()
}

/* -------------------------------------------------------------------------- */
/* Upload Pipeline                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Upload a single image: compress → Cloudinary → image object.
 * @param {File} file
 * @returns {Promise<{url: string, quality: string, aspectRatio: number, alt: string}>}
 */
export async function uploadImage(file) {
  const compressed = await compressImage(file)
  const url = await uploadToCloudinary(compressed)
  return {
    url,
    quality: 'high',
    aspectRatio: 0.8,
    alt: file.name?.replace(/\.[^/.]+$/, '') || 'Product image',
  }
}

/**
 * Upload multiple images with optional progress callback.
 * @param {File[]} files
 * @param {(progress: number) => void} [onProgress]
 * @returns {Promise<Array<{url: string, quality: string, aspectRatio: number, alt: string}>>}
 */
export async function uploadMultiple(files, onProgress) {
  const results = []
  for (let i = 0; i < files.length; i++) {
    const image = await uploadImage(files[i])
    results.push(image)
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100))
    }
  }
  return results
}

/* -------------------------------------------------------------------------- */
/* Legacy Migration Helpers                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Convert legacy single image_url to new images array format.
 * @param {Object} item - catalog_items row
 * @returns {Array<{url: string, quality: string, aspectRatio: number, alt: string}>}
 */
export function migrateSingleToArray(item) {
  if (item.images && Array.isArray(item.images) && item.images.length > 0) {
    return item.images
  }
  if (item.image_url) {
    return [
      {
        url: item.image_url,
        quality: 'high',
        aspectRatio: 0.8,
        alt: item.title || 'Product image',
      },
    ]
  }
  return []
}

/**
 * Get primary (first) image from images array.
 * @param {Array} images
 * @returns {{url: string, quality: string, aspectRatio: number, alt: string} | null}
 */
export function getPrimaryImage(images) {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null
  }
  return images[0]
}

/**
 * Safely get all images, always returning an array.
 * @param {Array | null | undefined} images
 * @returns {Array}
 */
export function getAllImages(images) {
  if (!images || !Array.isArray(images)) return []
  return images
}
