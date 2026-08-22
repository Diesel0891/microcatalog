import { useState } from 'react'

/**
 * Image with fade-in on load.
 *
 * Shows a subtle stone background while loading, then fades
 * the image in smoothly when onLoad fires. Handles broken
 * images by stopping the shimmer and showing a fallback state.
 *
 * @module FadeImage
 */

/**
 * Render an image with fade-in effect.
 *
 * @param {Object} props - Standard img props plus optional classes.
 * @returns {JSX.Element}
 */
export default function FadeImage({ className = '', onLoad, onError, ...props }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const handleLoad = (e) => {
    setLoaded(true)
    onLoad?.(e)
  }

  const handleError = (e) => {
    setError(true)
    setLoaded(true) // Stop shimmer
    onError?.(e)
  }

  return (
    <div className={`relative bg-stone-100 ${className}`}>
      {!loaded && !error && <div className="absolute inset-0 shimmer-v0" />}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-200">
          <span className="text-xs text-stone-500">Image unavailable</span>
        </div>
      )}
      <img
        {...props}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${error ? 'opacity-0' : ''}`}
      />
    </div>
  )
}
