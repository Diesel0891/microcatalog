/**
 * Post-publish success screen component.
 *
 * Displayed after a seller publishes their catalog. Provides an animated
 * celebration moment with clear next actions: copy link, share to WhatsApp,
 * view catalog, and return to editing. Recovery codes are a UI placeholder
 * for Phase 2.
 *
 * Design Standard v1.0 P1A — celebratory payoff with hierarchy of CTAs.
 *
 * @module PublishSuccess
 */

import { useState } from 'react'
import { Check, Copy, Share2, ExternalLink, Edit3, ChevronDown, ChevronUp } from 'lucide-react'

/**
 * Render the post-publish success screen.
 *
 * @param {Object} props
 * @param {string} props.catalogUrl - Full URL of the published catalog.
 * @param {() => void} props.onEditCatalog - Callback to return to the upload/editing view.
 * @returns {JSX.Element}
 */
export default function PublishSuccess({ catalogUrl, onEditCatalog }) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)

  /**
   * Copy the catalog URL to the clipboard with fallback for older browsers.
   */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(catalogUrl)
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = catalogUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 3000)
  }

  /**
   * Open WhatsApp share dialog with a pre-filled message.
   * Uses wa.me without a recipient — seller shares to their own contacts.
   */
  const shareToWhatsApp = () => {
    const message = encodeURIComponent(`Check out my catalog! ${catalogUrl}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  /**
   * Open the catalog in a new browser tab.
   */
  const viewCatalog = () => {
    window.open(catalogUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <div
        className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 max-w-sm w-full animate-card-in"
      >
        {/* Animated Checkmark */}
        <div className="flex justify-center mb-6">
          <svg
            className="w-20 h-20"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Circle */}
            <circle
              cx="40" cy="40" r="36"
              stroke="var(--color-success)"
              strokeWidth="3"
              strokeLinecap="round"
              className="animate-check-circle"
              style={{
                strokeDasharray: 226,
                strokeDashoffset: 226,
              }}
            />
            {/* Checkmark */}
            <path
              d="M24 40L35 51L56 29"
              stroke="var(--color-success)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-check-mark"
              style={{
                strokeDasharray: 48,
                strokeDashoffset: 48,
              }}
            />
          </svg>
        </div>

        {/* Headline — fades in after circle */}
        <h2
          className="text-xl font-bold text-charcoal-950 text-center mb-2 animate-fade-in-1"
        >
          Your catalog is live!
        </h2>
        <p className="text-charcoal-500 text-sm text-center mb-6 animate-fade-in-1">
          Share it with your customers and start selling.
        </p>

        {/* URL Display — fades in after headline */}
        <div className="bg-charcoal-50 rounded-xl p-4 mb-4 animate-fade-in-2">
          <p className="text-xs text-charcoal-400 mb-2 font-medium uppercase tracking-wide">
            Catalog Link
          </p>
          <p className="text-charcoal-900 text-sm font-mono break-all leading-relaxed">
            {catalogUrl}
          </p>
        </div>

        {/* Copy Feedback */}
        {linkCopied && (
          <div className="bg-sage-50 border border-sage-200 rounded-lg p-3 mb-4 flex items-center gap-2 animate-fade-in-1">
            <Check className="w-4 h-4 text-sage-600" strokeWidth={3} />
            <p className="text-sage-700 text-sm font-medium">Link copied to clipboard</p>
          </div>
        )}

        {/* Primary CTA: Copy Link */}
        <button
          onClick={copyLink}
          className="w-full bg-charcoal-950 text-white py-3.5 px-4 rounded-xl font-medium hover:bg-charcoal-800 transition flex items-center justify-center gap-2 shadow-sm animate-fade-in-2"
        >
          <Copy className="w-4 h-4" strokeWidth={2} />
          Copy Link
        </button>

        {/* Secondary CTA: Share to WhatsApp */}
        <button
          onClick={shareToWhatsApp}
          className="w-full mt-3 py-3.5 px-4 rounded-xl font-medium border border-green-500 text-green-600 hover:bg-green-50 transition flex items-center justify-center gap-2 animate-fade-in-2"
        >
          <Share2 className="w-4 h-4" strokeWidth={2} />
          Share to WhatsApp
        </button>

        {/* Tertiary Actions */}
        <div className="mt-6 pt-5 border-t border-stone-100 space-y-3 animate-fade-in-3">
          <button
            onClick={viewCatalog}
            className="w-full flex items-center justify-center gap-2 text-sm text-charcoal-600 hover:text-charcoal-900 transition font-medium"
          >
            <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
            View my catalog
          </button>

          <button
            onClick={onEditCatalog}
            className="w-full flex items-center justify-center gap-2 text-sm text-charcoal-600 hover:text-charcoal-900 transition font-medium"
          >
            <Edit3 className="w-4 h-4" strokeWidth={1.5} />
            Edit catalog
          </button>
        </div>

        {/* Recovery Code Placeholder — collapsible */}
        <div className="mt-6 pt-5 border-t border-stone-100 animate-fade-in-4">
          <button
            onClick={() => setShowRecovery(!showRecovery)}
            className="w-full flex items-center justify-between text-xs text-charcoal-400 hover:text-charcoal-600 transition"
          >
            <span>Recovery code</span>
            {showRecovery
              ? <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} />
              : <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
            }
          </button>

          {showRecovery && (
            <div className="mt-3 bg-charcoal-50 rounded-lg p-4 text-center">
              <p className="text-xs text-charcoal-400 leading-relaxed">
                Recovery codes will let you regain access to your catalog if you lose your link.
              </p>
              <p className="text-xs text-charcoal-300 mt-2 font-medium">
                Coming soon
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
