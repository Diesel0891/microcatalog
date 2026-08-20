import { Sparkles, ChevronRight, X } from 'lucide-react'

const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  goldPrimary: '#C5A059',
  goldSecondary: '#EADBB6',
  body: '#A0A5AD',
  hairlineGold: '#3A301A',
  viral: '#0099FF',
}

export default function CatalogViralBanner({ catalogHomeUrl, onDismiss }) {
  return (
    <div className="flex h-dvh snap-start items-center justify-center px-6" style={{ backgroundColor: COLOR.void }}>
      <div
        className="relative w-full overflow-hidden border p-6"
        style={{ borderColor: COLOR.hairlineGold, backgroundColor: COLOR.plate }}
      >
        <button
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute right-3 top-3 transition-opacity hover:opacity-70"
          style={{ color: COLOR.body }}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2" style={{ color: COLOR.viral }}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span className="text-[10px] font-medium uppercase" style={{ letterSpacing: '0.2em' }}>
            Build your own
          </span>
        </div>
        <h3
          className="mt-4 font-serif text-2xl font-light leading-tight text-balance"
          style={{ color: COLOR.goldSecondary }}
        >
          Every seller starts with one catalog.
        </h3>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: COLOR.body }}>
          Infini turns a phone number into a storefront. No accounts, no fees to list.
        </p>
        <a
          href={catalogHomeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs transition-colors"
          style={{ borderColor: COLOR.hairlineGold, color: COLOR.goldPrimary }}
        >
          Create your catalog
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
