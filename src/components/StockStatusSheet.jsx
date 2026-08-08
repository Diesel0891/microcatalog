/**
 * Stock status sheet component.
 *
 * Bottom sheet for selecting stock status. Replaces the inline
 * StockStatusSelector with a tappable badge + sheet pattern.
 *
 * @module StockStatusSheet
 */

import { STOCK_STATUS, getStockLabel, getStockColors } from '../lib/stockStatus.js'

const STATUS_OPTIONS = [
  STOCK_STATUS.AVAILABLE,
  STOCK_STATUS.RESERVED,
  STOCK_STATUS.SOLD,
]

const STATUS_HELPERS = {
  [STOCK_STATUS.RESERVED]: 'Item is being held for a specific buyer',
}

/**
 * Render a stock status selection sheet.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the sheet is visible.
 * @param {string} props.currentStatus - Currently selected status.
 * @param {(status: string) => void} props.onSelect - Called when a status is selected.
 * @param {() => void} props.onClose - Called to close the sheet.
 * @returns {JSX.Element | null}
 */
export default function StockStatusSheet({ isOpen, currentStatus, onSelect, onClose }) {
  if (!isOpen) return null

  const handleSelect = (status) => {
    onSelect(status)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onClose}
        role="presentation"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/75 backdrop-blur-md border-t border-white/40 rounded-t-2xl z-50 p-6 animate-slide-up shadow-2xl">

        {/* Drag handle */}
        <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-6" />

        <h3 className="text-lg font-bold text-charcoal-950 mb-1">Update Status</h3>
        <p className="text-sm text-charcoal-400 mb-5">Tap an option to update this item</p>

        <div className="space-y-2.5">
          {STATUS_OPTIONS.map((status) => {
            const label = getStockLabel(status)
            const colors = getStockColors(status)
            const isActive = currentStatus === status
            const helper = STATUS_HELPERS[status]

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleSelect(status)}
                className={[
                  'w-full flex items-start gap-3.5 p-4 rounded-xl border-2 transition-all duration-150 text-left',
                  isActive
                    ? `${colors.border} ${colors.bg} ring-1 ring-offset-1`
                    : 'border-stone-200 bg-white hover:border-stone-300',
                ].join(' ')}
              >
                {/* Radio indicator */}
                <div className="mt-0.5 shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                      isActive ? 'border-copper-500' : 'border-stone-300'
                    }`}
                  >
                    {isActive && (
                      <div className="w-2.5 h-2.5 rounded-full bg-copper-500" />
                    )}
                  </div>
                </div>

                {/* Label + helper */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${isActive ? colors.text : 'text-charcoal-900'}`}>
                    {label}
                  </p>
                  {helper && (
                    <p className="text-xs text-charcoal-400 mt-0.5 leading-relaxed">
                      {helper}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Cancel button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-3.5 rounded-xl border border-stone-200 text-charcoal-600 font-medium text-sm hover:bg-stone-50 transition"
        >
          Cancel
        </button>
      </div>
    </>
  )
}
