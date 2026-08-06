import { Package, HelpCircle } from 'lucide-react'

/**
 * Reusable empty state component.
 *
 * Used for "no items", "catalog not found", and error screens.
 * Provides consistent visual hierarchy with icon, title, description,
 * and optional action button.
 *
 * @module EmptyState
 */

/**
 * Render an empty state screen.
 *
 * @param {Object} props
 * @param {React.ComponentType} [props.icon=Package] - Lucide icon component.
 * @param {string} props.title - Headline text.
 * @param {string} props.description - Subtext explaining the state.
 * @param {{label: string, onClick: () => void}} [props.action] - Optional CTA button.
 * @param {string} [props.support] - Error message for support WhatsApp link.
 * @returns {JSX.Element}
 */
export default function EmptyState({ icon: Icon = Package, title, description, action, support }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 bg-charcoal-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Icon className="w-8 h-8 text-charcoal-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-charcoal-950 mb-2">{title}</h2>
        <p className="text-charcoal-400 text-sm leading-relaxed">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-5 inline-flex items-center gap-2 bg-copper-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-copper-700 transition"
          >
            {action.label}
          </button>
        )}
        {support && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Hello Infini, I got this error: ' + support)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-copper-600 font-medium hover:text-copper-700 transition"
          >
            <HelpCircle className="w-4 h-4" strokeWidth={2} />
            Contact Support
          </a>
        )}
      </div>
    </div>
  )
}
