import { X, MessageCircle, Ruler } from 'lucide-react'
import StockStatusBadge from './StockStatusBadge.jsx'

/**
 * Item detail sheet for public catalog.
 *
 * Opens when a buyer taps a product card. Shows large image,
 * full details, and WhatsApp CTA. Replaces direct WhatsApp jump
 * to give buyers a moment to review before messaging.
 *
 * @module ItemDetailSheet
 */

/**
 * Render the item detail bottom sheet.
 *
 * @param {Object} props
 * @param {Object|null} props.item - The selected catalog item.
 * @param {string} props.sellerPhone - Seller's WhatsApp number.
 * @param {(item: Object) => void} props.onWhatsApp - Opens WhatsApp with pre-filled message.
 * @param {() => void} props.onClose - Closes the sheet.
 * @returns {JSX.Element|null}
 */
export default function ItemDetailSheet({ item, onWhatsApp, onClose }) {
  if (!item) return null


  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
        role="presentation"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/75 backdrop-blur-md border-t border-white/40 rounded-t-2xl z-50 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">

        {/* Header with close */}
        <div className="sticky top-0 bg-white/60 backdrop-blur-sm rounded-t-2xl px-4 pt-4 pb-2 flex items-center justify-between z-10">

          <StockStatusBadge status={item.stock_status} size="sm" />
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-charcoal-100 text-charcoal-500 hover:bg-charcoal-200 transition"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Large Image */}
        <div className="px-4">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-72 object-cover rounded-xl"
          />
        </div>

        {/* Details */}
        <div className="px-5 pt-4 pb-6 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-charcoal-950 leading-tight flex-1">
              {item.title}
            </h2>
            <span className="text-lg font-bold text-copper-600 whitespace-nowrap">
              {item.price}
            </span>
          </div>

          {item.description && (
            <p className="text-charcoal-600 text-sm leading-relaxed">
              {item.description}
            </p>
          )}

          {item.size_specs && (
                        <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-sage-600" strokeWidth={2} />
              <span className="text-sm text-charcoal-700 font-medium">
                {item.size_specs}
              </span>
            </div>

          )}

          {item.extra_notes && (
            <p className="text-charcoal-400 text-xs italic leading-relaxed">
              {item.extra_notes}
            </p>
          )}

          {/* WhatsApp CTA */}
          <div className="pt-4">
            <button
              onClick={() => onWhatsApp(item)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition bg-charcoal-950 text-white hover:bg-charcoal-800 active:scale-[0.98]">
              <MessageCircle className="w-5 h-5" strokeWidth={2} />
              Message on WhatsApp
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
