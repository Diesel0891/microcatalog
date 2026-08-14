/**
 * Google Gemini AI integration for Microcatalog.
 *
 * Provides optional "Suggest Details" functionality for product photos.
 * This is a convenience layer — the seller can always type manually.
 * Uses the Gemini 2.5 Flash model with a single-image, single-purpose prompt.
 *
 * @module ai
 * @see {@link https://ai.google.dev/gemini-api/docs}
 */

import { logger } from './logger.js'

/** Gemini API key from Vite environment variable. */
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

/** Gemini API endpoint for the 2.5 Flash model. */
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/**
 * Request AI-generated product details from a product photo.
 *
 * Sends the image to Gemini with a structured prompt asking for title,
 * description, and price in Malawian Kwacha format. The response is
 * parsed as JSON — if the format is unexpected, the error is logged
 * and re-thrown for the caller to handle.
 *
 * @param {string} imageUrl - URL of the product image (typically a Cloudinary secure_url).
 * @returns {Promise<{title: string, description: string, suggestedPrice: string}>}
 * @throws {Error} If the API key is missing, the request fails, or the response cannot be parsed.
 */
export async function suggestProductDetails(imageUrl) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured')
  }

  const prompt = `Analyze this product photo and provide:
1. A short, catchy product title (max 5 words)
2. A brief description (max 20 words)
3. A suggested price in Malawian Kwacha (MK) format

Respond ONLY in this exact JSON format:
{"title": "...", "description": "...", "price": "MK X,XXX"}`

  try {
    const { base64, mimeType } = await imageUrlToBase64(imageUrl)

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'AI request failed')
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI response format unexpected')
    }

    const result = JSON.parse(jsonMatch[0])
    return {
      title: result.title || '',
      description: result.description || '',
            price: result.price || ''
    }
  } catch (err) {
    logger.error('AI', 'AI Suggest failed', { message: err.message })
    throw err
  }
}

/**
 * Convert an image URL to base64 string and detect MIME type.
 *
 * Fetches the image as a blob, then uses FileReader to produce a
 * data URL. The base64 payload is extracted by stripping the
 * data URL prefix (e.g., "data:image/jpeg;base64,").
 *
 * @param {string} imageUrl - The image URL to convert.
 * @returns {Promise<{base64: string, mimeType: string}>}
 * @throws {Error} If the image cannot be fetched or read.
 */
async function imageUrlToBase64(imageUrl) {
  const response = await fetch(imageUrl)
  const blob = await response.blob()
  const mimeType = blob.type || 'image/jpeg'
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      resolve({ base64, mimeType })
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
