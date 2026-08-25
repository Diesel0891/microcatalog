import { useEffect, useRef, useState } from 'react'
import { logger } from '../lib/logger.js'

const COLOR = {
  void: '#000000',
  plate: '#0B0B0B',
  goldPrimary: '#C5A059',
  body: '#A0A5AD',
  hairlineGold: '#3A301A',
  ivory: '#F0EDE4',
}

export default function CatalogViralBanner({ onImpression }) {
  const cardRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const hasLoggedImpression = useRef(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          setVisible(true)
          if (!hasLoggedImpression.current) {
            hasLoggedImpression.current = true
            logger.info('ViralCTA', 'viral_cta_impression')
            onImpression?.()
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [onImpression])

  const handleClick = () => {
    logger.info('ViralCTA', 'viral_cta_clicked')
  }

  return (
    <section
      className="flex h-dvh w-full snap-start flex-col items-center justify-center px-5 py-10"
      style={{ backgroundColor: COLOR.void }}
    >
      <div
        ref={cardRef}
        className="relative mx-auto flex w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-lg border px-6 text-center"
        style={{
          borderColor: COLOR.hairlineGold,
          backgroundColor: COLOR.plate,
          minHeight: '58dvh',
          maxHeight: '70dvh',
          opacity: reducedMotion ? 1 : (visible ? 1 : 0),
          transform: reducedMotion ? 'none' : (visible ? 'translateY(0)' : 'translateY(16px)'),
          transition: reducedMotion
            ? 'none'
            : 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <h3
          className="font-serif text-2xl font-light leading-tight text-balance"
          style={{ color: COLOR.ivory }}
        >
          Imagine this was<br />your shop.
        </h3>


        <a
          href="/#/"
          onClick={handleClick}
          className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium uppercase transition-opacity hover:opacity-70"
          style={{
            color: COLOR.goldPrimary,
            letterSpacing: '0.15em',
          }}
        >
          Create yours
          <span aria-hidden="true">→</span>
        </a>

        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span
            className="text-[10px] font-medium uppercase"
            style={{
              color: 'rgba(160,165,173,0.5)',
              letterSpacing: '0.2em',
            }}
          >
            Made with Infini
          </span>
        </div>
      </div>
    </section>
  )
}
