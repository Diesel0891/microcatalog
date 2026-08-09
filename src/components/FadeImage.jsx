import { useState } from 'react'

/**
 * Image with fade-in on load.
 *
 * Shows a subtle stone background while loading, then fades
 * the image in smoothly when onLoad fires.
 *
 * @module FadeImage
 */

/**
 * Render an image with fade-in effect.
 *
 * @param {Object} props - Standard img props plus optional classes.
 * @returns {JSX.Element}
 */
export default function FadeImage({ className = '', ...props }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`bg-stone-100 ${className}`}>
      <img
        {...props}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}

