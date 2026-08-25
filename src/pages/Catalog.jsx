import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { logger } from '../lib/logger.js'

import CatalogFeedCard from '../components/CatalogFeedCard.jsx'
import CatalogDetailSheet from '../components/CatalogDetailSheet.jsx'
import CatalogDiscoveryPortal from '../components/CatalogDiscoveryPortal.jsx'
import CatalogViralBanner from '../components/CatalogViralBanner.jsx'
import CatalogInquiryTray from '../components/CatalogInquiryTray.jsx'
import CatalogIdentityStrip from '../components/CatalogIdentityStrip.jsx'
import { ScrollPositionIndicator, Toast, CatalogEmptyState } from '../components/CatalogUI.jsx'
import CatalogSkeleton from '../components/CatalogSkeleton.jsx'

/* ----------------------------------------------------------------------------
 * Constants
 * ----------------------------------------------------------------------------*/
const VIRAL_BANNER_POSITIONS = [6, 18]
const VIRAL_BANNER_MAX_IMPRESSIONS = 999
const DISCOVERY_PORTAL_OVERSCROLL_THRESHOLD = 60
const DWELL_SAMPLE_SIZE_MS = 800

const COLOR = {
  void: '#000000',
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/* ----------------------------------------------------------------------------
 * Data mapping: Supabase catalog_items → v0 Product shape
 * ----------------------------------------------------------------------------*/
function mapItemToProduct(item) {
  const specs = []
  if (item.size_specs) {
    specs.push({ label: 'Size / Specs', value: item.size_specs })
  }
  if (item.extra_notes) {
    specs.push({ label: 'Notes', value: item.extra_notes })
  }

  return {
    id: item.id,
    name: item.title || null,
    category: null, // No category column in schema
    price: item.price || null,
    description: item.description || '',
    stockStatus: item.stock_status || 'available',
    images: item.image_url
      ? [{ url: item.image_url, quality: 'high', aspectRatio: 0.8, alt: item.title || 'Product image' }]
      : [],
    attributes: [], // No attributes in schema yet
    specs,
    sku: item.id.slice(0, 8).toUpperCase(),
    createdAt: item.created_at || new Date().toISOString(),
    // Preserve raw for WhatsApp
    _raw: item,
  }
}

/* ----------------------------------------------------------------------------
 * Inquiry helpers
 * ----------------------------------------------------------------------------*/
function inquiryKey(productId, _selection = {}) {
  return `${productId}`
}

function hasMeaningfulPrice(price) {
  if (price == null) return false
  const normalized = String(price).trim()
  return normalized !== '' && !/^MK\s*0(?:\.0+)?$/i.test(normalized) && !/^0(?:\.0+)?$/.test(normalized)
}

function buildInquiryMessage(items, _shopName) {
  if (items.length === 0) return ''
  const lines = ['Hello — I\'d like to inquire about:']
  lines.push('')
  for (const item of items) {
    const name = item.productName && item.productName !== 'Untitled'
      ? item.productName
      : 'Product inquiry'
    const qty = item.quantity > 1 ? ` \u00d7 ${item.quantity}` : ''
    const price = hasMeaningfulPrice(item.price)
      ? ` \u2014 ${item.price}`
      : item.stockStatus === 'sold' ? ' \u2014 sold'
      : ''
    lines.push(`\u2022 ${name}${qty}${price}`)
  }
  return lines.join('\n').trim()
}

function buildSingleProductMessage(product, _shopName) {
  if (!product) return ''
  const name = product.name && product.name !== 'Untitled' ? `the ${product.name}` : 'this item'
  if (product.stockStatus === 'sold') {
    return `Hello \u2014 I'm interested in ${name}. Do you have anything similar available?`
  }
  const price = hasMeaningfulPrice(product.price)
    ? ` \u2014 ${product.price}`
    : ''
  if (product.stockStatus === 'reserved') {
    return `Hello \u2014 I'm interested in ${name}${price}. Is it still available?`
  }
  return `Hello \u2014 I'm interested in ${name}${price}.`
}

export default function Catalog() {
  const { sellerUuid } = useParams()

  // Data state
  const [items, setItems] = useState([])
  const [sellerPhone, setSellerPhone] = useState('')
  const [shopName, setShopName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sellerNotFound, setSellerNotFound] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  // Feed state
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageIndices, setImageIndices] = useState({})
  const [dwellTimes, setDwellTimes] = useState({})
  const [viralImpressions, setViralImpressions] = useState(() => {
    try {
      const saved = sessionStorage.getItem('infini_viral_impressions')
      const parsed = saved ? parseInt(saved, 10) : 0
      return Number.isNaN(parsed) ? 0 : parsed
    } catch {
      return 0
    }
  })

  // Inquiry cart state (A1)
  const [inquiry, setInquiry] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`infini_inquiry_${sellerUuid}`)
      const parsed = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Overlay state
  const [portalOpen, setPortalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [detailProductId, setDetailProductId] = useState(null)

  // Refs
  const feedRef = useRef(null)
  const touchStartY = useRef(null)

  // Derived
  const products = useMemo(() => items.map(mapItemToProduct), [items])
  const maxPrice = useMemo(() => {
    return Math.max(...products.map((p) => parseFloat(p.price) || 0), 1)
  }, [products])
  const detailProduct = products.find((p) => p.id === detailProductId) || null

  // Persist inquiry cart
  useEffect(() => {
    try {
      sessionStorage.setItem(`infini_inquiry_${sellerUuid}`, JSON.stringify(inquiry))
    } catch {
      // ignore
    }
  }, [inquiry, sellerUuid])

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch seller info
        const { data: sellerData } = await supabase
          .from('sellers')
          .select('phone, shop_name, logo_url')
          .eq('uuid', sellerUuid)
          .single()

        if (sellerData) {
          setSellerPhone(sellerData.phone || '')
          setShopName(sellerData.shop_name || '')
          setLogoUrl(sellerData.logo_url || '')

          // Fire-and-forget daily view tracking
          try {
            const viewKey = `microcatalog_viewed_${sellerUuid}`
            const lastViewed = localStorage.getItem(viewKey)
            const now = Date.now()
            if (!lastViewed || now - parseInt(lastViewed, 10) >= 24 * 60 * 60 * 1000) {
              localStorage.setItem(viewKey, String(now))
              const today = new Date().toISOString().slice(0, 10)
              void (async () => { try { await supabase.rpc('track_daily_metric', {
                p_seller_uuid: sellerUuid,
                p_date: today,
                p_field: 'views'
              }); } catch {} })()
            }
          } catch {
            // localStorage unavailable
          }
        } else {
          setSellerNotFound(true)
          setLoading(false)
          return
        }

        // Fetch catalog items
        const { data, error: fetchError } = await supabase
          .from('catalog_items')
          .select('*')
          .eq('seller_uuid', sellerUuid)
          .eq('published', true)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setItems(data || [])
      } catch (err) {
        logger.error('Catalog', 'Fetch failed', { message: err.message })
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    // Owner check
    try {
      const storedUuid = localStorage.getItem('microcatalog_seller_uuid')
      setIsOwner(storedUuid === sellerUuid)
    } catch {
      setIsOwner(false)
    }
  }, [sellerUuid])

  // Feed scroll tracking
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const handle = () => {
      const index = Math.round(el.scrollTop / el.clientHeight)
      setActiveIndex(Math.min(products.length - 1, Math.max(0, index)))
    }
    el.addEventListener('scroll', handle)
    return () => el.removeEventListener('scroll', handle)
  }, [products.length])

  // Pull-down to discover gesture
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    if (touch && feedRef.current && feedRef.current.scrollTop <= 0) {
      touchStartY.current = touch.clientY
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (touchStartY.current === null) return
    const touch = e.touches[0]
    if (!touch) return
    const delta = touch.clientY - touchStartY.current
    if (delta > DISCOVERY_PORTAL_OVERSCROLL_THRESHOLD) {
      setPortalOpen(true)
      touchStartY.current = null
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null
  }, [])

  // Inquiry actions
  const isProductAdded = useCallback((product) => {
    const key = inquiryKey(product.id, {})
    return inquiry.some((item) => item.key === key)
  }, [inquiry])

  const handleToggle = useCallback((product) => {
    const key = inquiryKey(product.id, {})
    const alreadyAdded = inquiry.some((item) => item.key === key)
    if (alreadyAdded) {
      setInquiry((prev) => prev.filter((item) => item.key !== key))
      setToastMessage('Removed from inquiry')
    } else {
      setInquiry((prev) => [
        ...prev,
        {
          key,
          productId: product.id,
          productName: product.name,
          price: product.price,
          stockStatus: product.stockStatus,
          quantity: 1,
          selection: {},
          imageUrl: product.images[0]?.url || '',
        },
      ])
      setToastMessage('Added to inquiry')
    }
    setToastVisible(true)
  }, [inquiry])

  const handleRemoveInquiry = useCallback((key) => {
    setInquiry((prev) => prev.filter((item) => item.key !== key))
  }, [])

  const handleQuantityChange = useCallback((key, quantity) => {
    setInquiry((prev) => prev.map((item) => (item.key === key ? { ...item, quantity } : item)))
  }, [])

  const handleClearInquiry = useCallback(() => {
    setInquiry([])
  }, [])

  const handleDwell = useCallback((productId, ms) => {
    if (ms < DWELL_SAMPLE_SIZE_MS) return
    setDwellTimes((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + ms }))
  }, [])

  const cycleImage = useCallback((product, direction) => {
    setImageIndices((prev) => {
      const current = prev[product.id] || 0
      const next = (current + direction + product.images.length) % Math.max(product.images.length, 1)
      return { ...prev, [product.id]: next }
    })
  }, [])

  // WhatsApp send
  const sendWhatsapp = useCallback((extraProduct) => {
    let items = inquiry
    if (extraProduct) {
      const key = inquiryKey(extraProduct.id, {})
      if (!items.some((item) => item.key === key)) {
        const newItem = {
          key,
          productId: extraProduct.id,
          productName: extraProduct.name,
          price: extraProduct.price,
          stockStatus: extraProduct.stockStatus,
          quantity: 1,
          selection: {},
        }
        items = [...items, newItem]
        setInquiry(items)
      }
    }
    const message = buildInquiryMessage(items, shopName) // B5: shop name prefix
    if (!message) return
    const cleanPhone = sellerPhone ? sellerPhone.replace(/\D/g, '') : ''
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')

    // Track inquiry metrics
    if (sellerUuid) {
      const today = new Date().toISOString().slice(0, 10)
      void (async () => { try { await supabase.rpc('track_daily_metric', {
        p_seller_uuid: sellerUuid,
        p_date: today,
        p_field: 'inquiries'
      }); } catch (e) { logger.error('Catalog', 'Metric tracking failed', { message: e.message }) } })()
    }
  }, [inquiry, sellerPhone, shopName, sellerUuid])

const sendSingleProductWhatsapp = useCallback((product) => {
  if (!product) return
  const message = buildSingleProductMessage(product, shopName)
  if (!message) return
  const cleanPhone = sellerPhone ? sellerPhone.replace(/\D/g, '') : ''
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener,noreferrer')

  if (sellerUuid) {
    const today = new Date().toISOString().slice(0, 10)
    void (async () => { try { await supabase.rpc('track_daily_metric', {
      p_seller_uuid: sellerUuid,
      p_date: today,
      p_field: 'inquiries'
    }); } catch (e) { logger.error('Catalog', 'Metric tracking failed', { message: e.message }) } })()
  }
}, [sellerPhone, shopName, sellerUuid])

  // Dwell recommendations
  const dwellRecommendations = useMemo(() => {
    return Object.entries(dwellTimes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([id]) => products.find((p) => p.id === id))
      .filter(Boolean)
  }, [dwellTimes, products])

  // Loading / error states
  if (loading) return <CatalogSkeleton />
  if (error) return (
    <div className="infini-catalog h-dvh w-full flex items-center justify-center" style={{ backgroundColor: COLOR.void }}>
      <CatalogEmptyState title="Something went wrong" description={error} />
    </div>
  )
  if (sellerNotFound) {
    return (
      <div className="infini-catalog h-dvh w-full flex items-center justify-center" style={{ backgroundColor: COLOR.void }}>
        <CatalogEmptyState title="Catalog not found" description="This catalog link doesn't exist or has been removed." />
      </div>
    )
  }
  if (products.length === 0) {
    return (
      <div className="infini-catalog h-dvh w-full flex items-center justify-center" style={{ backgroundColor: COLOR.void }}>
        <CatalogEmptyState title="Catalog is empty" description="No items have been published yet." />
      </div>
    )
  }

  const isOverlayActive = portalOpen || detailProductId !== null
  let manageToken = ''
  try { manageToken = localStorage.getItem('microcatalog_manage_token') || '' } catch {}

  // Defensive: if products array is somehow invalid, show fallback
  if (!Array.isArray(products)) {
    return (
      <div className="h-dvh w-full flex items-center justify-center" style={{ backgroundColor: '#000000', color: '#A0A5AD' }}>
        <p className="text-sm">Loading catalog...</p>
      </div>
    )
  }

  return (
    <main className="infini-catalog relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden" style={{ backgroundColor: COLOR.void }}>
      {/* Dark gradient backing for all top chrome */}
      <div
        className="fixed inset-x-0 top-0 z-10 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
        }}
      />

      {/* B1: Persistent identity strip */}
      <CatalogIdentityStrip
        shopName={shopName || 'Catalog'}
        logoUrl={logoUrl}
        isVisible={true}
      />

      {/* Discover pill button — hides when overlay active */}
      <button
        onClick={() => setPortalOpen(true)}
        aria-label="Open discovery portal"
        aria-expanded={portalOpen}
        className="absolute left-1/2 top-14 z-20 -translate-x-1/2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all"
        style={{
          borderColor: '#3A301A',
          color: '#A0A5AD',
          backgroundColor: 'rgba(0,0,0,0.7)',
          opacity: isOverlayActive ? 0 : 1,
          pointerEvents: isOverlayActive ? 'none' : 'auto',
          transitionDuration: '0.35s',
          transitionTimingFunction: EASE,
        }}
      >
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Discover
        </span>
      </button>

      {/* Owner edit link — hides when overlay active */}
      {isOwner && (
        <a
          href={`/#/u/${manageToken || sellerUuid}`}
          className="absolute right-3 top-[4.5rem] z-20 text-[10px] font-medium uppercase transition-all hover:opacity-70"
          style={{
            color: '#C5A059',
            letterSpacing: '0.15em',
            opacity: isOverlayActive ? 0 : 1,
            pointerEvents: isOverlayActive ? 'none' : 'auto',
            transitionDuration: '0.35s',
            transitionTimingFunction: EASE,
          }}
        >
          Edit catalog →
        </a>
      )}

      {/* Snap-scroll feed */}
      <div
        ref={feedRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto"
        style={{
          scrollBehavior: 'smooth',
          opacity: isOverlayActive ? 0 : 1,
          pointerEvents: isOverlayActive ? 'none' : 'auto',
          transition: `opacity 0.35s ${EASE}`,
        }}
      >
        {products.map((product, index) => {
          const activeImgIndex = imageIndices[product.id] || 0
          const cards = [
            <CatalogFeedCard
              key={product.id}
              product={product}
              maxPrice={maxPrice}
              activeImageIndex={activeImgIndex}
              onCycleImage={(dir) => cycleImage(product, dir)}
              isAdded={isProductAdded(product)}
              onToggle={() => handleToggle(product)}
              onDwell={(ms) => handleDwell(product.id, ms)}
              onOpenDetail={() => setDetailProductId(product.id)}
            />,
          ]
          // Viral CTA interstitial
          const position = index + 1
          const shouldShowViral = VIRAL_BANNER_POSITIONS.includes(position) && viralImpressions < VIRAL_BANNER_MAX_IMPRESSIONS
          if (shouldShowViral) {
            cards.push(
              <CatalogViralBanner
                key={`viral-${position}`}
                onImpression={() => {
                  setViralImpressions((prev) => {
                    const next = prev + 1
                    try { sessionStorage.setItem('infini_viral_impressions', String(next)) } catch {}
                    return next
                  })
                }}
              />,
            )
          }
          return cards
        })}
      </div>

      {/* Scroll position indicator */}
      <ScrollPositionIndicator count={products.length} activeIndex={activeIndex} />

      {/* Discovery portal */}
      <CatalogDiscoveryPortal
        open={portalOpen}
        onClose={() => setPortalOpen(false)}
        products={products}
        query={query}
        onQueryChange={setQuery}
        dwellRecommendations={dwellRecommendations}
        onOpenProduct={(id) => {
          setPortalOpen(false)
          setDetailProductId(id)
        }}
      />

      {/* Detail sheet */}
      <CatalogDetailSheet
        product={detailProduct}
        open={detailProductId !== null}
        onClose={() => setDetailProductId(null)}
        activeImageIndex={detailProduct ? (imageIndices[detailProduct.id] || 0) : 0}
        onCycleImage={(dir) => detailProduct && cycleImage(detailProduct, dir)}
        isAdded={detailProduct ? isProductAdded(detailProduct) : false}
        onToggle={() => detailProduct && handleToggle(detailProduct)}
        onSendWhatsapp={() => detailProduct && sendSingleProductWhatsapp(detailProduct)}
      />

      {/* Persistent bottom inquiry bar */}
      <CatalogInquiryTray
        items={inquiry}
        shopName={shopName}
        onRemove={handleRemoveInquiry}
        onQuantityChange={handleQuantityChange}
        onSend={() => sendWhatsapp()}
        onClear={handleClearInquiry}
        isOverlayActive={isOverlayActive}
      />

      {/* Toast (A1) */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </main>
  )
}
