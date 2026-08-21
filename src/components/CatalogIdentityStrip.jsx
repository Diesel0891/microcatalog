import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COLOR = {
  void: '#000000',
  goldSecondary: '#EADBB6',
  hairlineGold: '#3A301A',
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export default function CatalogIdentityStrip({ shopName, logoUrl, isVisible = true }) {
  const [hasAnimated, setHasAnimated] = useState(false)
  const [showEntrance, setShowEntrance] = useState(false)

  // B3: One-time cinematic entrance per session
  useEffect(() => {
    if (!isVisible) return
    const sessionKey = 'infini_identity_animated'
    const alreadyAnimated = sessionStorage.getItem(sessionKey)
    if (!alreadyAnimated) {
      setShowEntrance(true)
      sessionStorage.setItem(sessionKey, '1')
      const t = setTimeout(() => setHasAnimated(true), 1200)
      return () => clearTimeout(t)
    } else {
      setHasAnimated(true)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b px-4 backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(0,0,0,0.65)',
        borderColor: COLOR.hairlineGold,
      }}
    >
      <AnimatePresence>
        {!hasAnimated && showEntrance ? (
          <motion.div
            key="entrance"
            initial={{ opacity: 0, y: -20, scale: 1.1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="flex items-center gap-3"
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt=""
                className="h-6 w-auto object-contain"
                style={{ maxHeight: '28px' }}
              />
            )}
            <span
              className="font-wordmark text-base font-medium leading-none"
              style={{ color: '#F0EDE4' }}
            >
              {shopName}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="static"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt=""
                className="h-6 w-auto object-contain"
                style={{ maxHeight: '28px' }}
              />
            )}
            <span
              className="font-wordmark text-base font-medium leading-none"
              style={{ color: '#F0EDE4' }}
            >
              {shopName}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
