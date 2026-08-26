import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle, BarChart3, Camera, ChevronDown, ChevronRight, ChevronUp, Copy, ImagePlus,
  Link as LinkIcon, Lightbulb, Loader2, PartyPopper, Plus, ExternalLink,
  Store, UploadCloud, X, Check
} from 'lucide-react'
import { cn } from '../lib/cn.js'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary } from '../lib/cloudinary'
import { compressImage } from '../lib/compressImage.js'
import { suggestProductDetails } from '../lib/ai'
import { logger } from '../lib/logger.js'
import UploadProductCard from "../components/UploadProductCard.jsx"
import DeleteUndoToast from "../components/DeleteUndoToast.jsx"

const inputBase = "w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200 focus:border-primary/40 focus:bg-card"


const COUNTRIES = [
  { code: 'MW', flag: '🇲🇼', name: 'Malawi', dial: '+265', placeholder: '0991 234 567', digits: 9, stripLeadingZero: true },
  { code: 'ZM', flag: '🇿🇲', name: 'Zambia', dial: '+260', placeholder: '0977 123 456', digits: 9, stripLeadingZero: true },
  { code: 'ZW', flag: '🇿🇼', name: 'Zimbabwe', dial: '+263', placeholder: '071 234 5678', digits: 9, stripLeadingZero: true },
  { code: 'ZA', flag: '🇿🇦', name: 'South Africa', dial: '+27', placeholder: '071 234 5678', digits: 9, stripLeadingZero: true },
  { code: 'TZ', flag: '🇹🇿', name: 'Tanzania', dial: '+255', placeholder: '0712 345 678', digits: 9, stripLeadingZero: true },
  { code: 'MZ', flag: '🇲🇿', name: 'Mozambique', dial: '+258', placeholder: '84 123 4567', digits: 8, stripLeadingZero: false },
  { code: 'BW', flag: '🇧🇼', name: 'Botswana', dial: '+267', placeholder: '71 123 456', digits: 8, stripLeadingZero: false },
  { code: 'OTHER', flag: '🌍', name: 'Other', dial: '+', placeholder: 'e.g. +447123456789', digits: 7, stripLeadingZero: false },
]

const spring = { type: 'spring', stiffness: 300, damping: 30 }

function cleanPhone(raw, country) {
  let digits = (raw || '').replace(/\D/g, '')
  if (country?.stripLeadingZero) digits = digits.replace(/^0+/, '')
  return digits
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={spring}
      className="mb-5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="rounded-lg p-1 text-destructive/70 transition hover:bg-destructive/10 hover:text-destructive"
        aria-label="Dismiss error"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  )
}

function CircularProgress({ value, size = 44, strokeWidth = 3.5 }) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const pct = Math.round(value)
  return (
    <svg width={size} height={size} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)"
        strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (value / 100) * c }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em" className="text-[9px] font-bold" style={{ fill: 'var(--primary)' }}>
        {pct}%
      </text>
    </svg>
  )
}

function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const country = COUNTRIES.find((item) => item.code === value) || COUNTRIES[0]
  const rect = buttonRef.current?.getBoundingClientRect()

  useEffect(() => {
    if (!open) return
    const handleScroll = () => setOpen(false)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(inputBase, 'flex items-center justify-between gap-3 text-left')}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-base leading-none">{country.flag}</span>
          <span className="font-medium">{country.code}</span>
        </span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && createPortal(
        <>
          <button aria-label="Close country menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={spring}
            className="fixed z-50 max-h-64 overflow-auto rounded-2xl border border-border bg-card/95 p-1 shadow-[var(--shadow-lift)] backdrop-blur-xl"
            style={{ top: (rect?.bottom || 0) + 8, left: rect?.left, width: rect?.width }}
            role="listbox"
          >
            {COUNTRIES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => { onChange(item.code); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-secondary',
                  item.code === value && 'bg-secondary/70'
                )}
                role="option"
                aria-selected={item.code === value}
              >
                <span className="text-base leading-none">{item.flag}</span>
                <span className="font-medium">{item.code}</span>
                {item.code === value && <Check className="ml-auto size-4 text-primary" />}
              </button>
            ))}
          </motion.div>
        </>,
        document.body
      )}
    </div>
  )
}

function UploadSheet({ open, onClose, onFiles }) {
  const galleryRef = useRef(null)
  const cameraRef = useRef(null)
  if (!open) return null

  const receive = (event) => {
    if (event.target.files?.length) onFiles([...event.target.files])
    event.target.value = ''
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 backdrop-blur-sm sm:items-center">
      <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={spring}
        className="relative w-full max-w-md rounded-[24px] border border-border bg-card p-5 shadow-[var(--shadow-lift)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">Add product photo</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose the best image of your product.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition hover:bg-secondary" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => galleryRef.current?.click()} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-secondary/50 p-5 text-sm font-medium text-foreground transition hover:bg-secondary">
            <ImagePlus className="size-6 text-primary" />Gallery
          </button>
          <button onClick={() => cameraRef.current?.click()} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-secondary/50 p-5 text-sm font-medium text-foreground transition hover:bg-secondary">
            <Camera className="size-6 text-primary" />Camera
          </button>
        </div>
        <input ref={galleryRef} className="hidden" type="file" accept="image/*" multiple onChange={receive} />
        <input ref={cameraRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={receive} />
      </motion.div>
    </div>,
    document.body
  )
}





function Sparkline({ data, width = 280, height = 48, barWidth = 6, gap = 3 }) {
  const max = Math.max(...data.map((d) => d.views || 0), 1)
  return (
    <svg width={width} height={height} className="overflow-visible">
      {data.map((d, i) => {
        const h = Math.max(((d.views || 0) / max) * height, 2)
        const x = i * (barWidth + gap)
        const isRecent = i >= data.length - 7
        return (
          <motion.rect
            key={d.date}
            x={x}
            y={height - h}
            width={barWidth}
            height={h}
            rx={2}
            initial={{ height: 0, y: height }}
            animate={{ height: h, y: height - h }}
            transition={{ duration: 0.5, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
            fill={isRecent ? 'var(--primary)' : 'var(--border)'}
          />
        )
      })}
    </svg>
  )
}

function InsightsSheet({ open, onClose, analytics, items }) {
  const totalViews = analytics.reduce((s, d) => s + (d.views || 0), 0)
  const totalInquiries = analytics.reduce((s, d) => s + (d.inquiries || 0), 0)
  const rate = totalViews > 0 ? Math.round((totalInquiries / totalViews) * 1000) / 10 : 0

  const prevSlice = analytics.slice(0, Math.max(analytics.length - 30, 0))
  const prevViews = prevSlice.reduce((s, d) => s + (d.views || 0), 0)
  const prevInquiries = prevSlice.reduce((s, d) => s + (d.inquiries || 0), 0)
  const prevRate = prevViews > 0 ? Math.round((prevInquiries / prevViews) * 1000) / 10 : 0

  const trend = prevRate === 0 ? null : rate - prevRate
  const trendPct = prevRate === 0 ? null : Math.round(((rate - prevRate) / prevRate) * 1000) / 10

  const [animatedRate, setAnimatedRate] = useState(0)
  useEffect(() => {
    if (!open) return
    const start = performance.now()
    const duration = 800
    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedRate(Math.round(rate * eased * 10) / 10)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [open, rate])

  const topProducts = [...items]
    .filter((i) => (i.inquiry_count || 0) > 0)
    .sort((a, b) => (b.inquiry_count || 0) - (a.inquiry_count || 0))
    .slice(0, 3)

  const message = (() => {
    if (totalViews === 0) return 'Share your catalog link to start tracking activity.'
    if (totalInquiries === 0) return 'Your catalog is getting views. Make sure your WhatsApp number is correct and your prices are competitive.'
    if (rate < 1) return 'Your catalog is getting views but few inquiries. Consider improving your product photos or descriptions.'
    if (rate < 5) return 'Your catalog is converting well. Keep sharing your link to reach more customers.'
    return 'Excellent engagement! Your catalog is highly compelling.'
  })()

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="insights"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/25 p-4 backdrop-blur-sm sm:items-center"
        >
          <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={spring}
            className="relative w-full max-w-md rounded-t-[28px] border border-border bg-card p-6 text-center shadow-[var(--shadow-lift)] sm:rounded-[28px] max-h-[85vh] overflow-y-auto"
          >
            <button onClick={onClose} className="absolute right-4 top-4 rounded-xl p-2 text-muted-foreground transition hover:bg-secondary" aria-label="Close">
              <X className="size-5" />
            </button>

            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BarChart3 className="size-7" />
            </div>
            <p className="text-lg font-semibold text-foreground">Insights</p>

            <div className="mt-6 rounded-[24px] border border-border bg-card/60 p-6 shadow-[var(--shadow-lift)] backdrop-blur-xl">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">30-Day Inquiry Rate</p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">
                {totalViews === 0 ? '—' : `${animatedRate.toFixed(1)}%`}
              </p>

              {analytics.length > 1 && (
                <div className="mt-4 flex justify-center">
                  <Sparkline data={analytics} />
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-1.5 text-sm">
                {trend !== null && trend !== 0 && (
                  <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold', trend > 0 ? 'bg-success-soft text-success' : 'bg-destructive/10 text-destructive')}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trendPct).toFixed(1)}%
                  </span>
                )}
                <span className="text-muted-foreground">
                  {trend === null || trend === 0 ? 'Not enough historical data' : 'vs previous 30 days'}
                </span>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                {totalInquiries.toLocaleString()} inquiries from {totalViews.toLocaleString()} views
              </p>
            </div>

            {topProducts.length > 0 && (
              <div className="mt-4 rounded-[24px] border border-border bg-card/60 p-5 shadow-[var(--shadow-lift)] backdrop-blur-xl text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Products</p>
                <div className="mt-3 space-y-3">
                  {topProducts.map((product, idx) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{product.title || 'Untitled'}</p>
                      </div>
                      <span className="text-xs font-semibold text-primary">
                        {product.inquiry_count || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-4 text-left">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lightbulb className="size-4" />
                </div>
                <p className="text-sm leading-relaxed text-foreground">{message}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-2xl bg-secondary/70 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default function Upload() {
  const { manageToken } = useParams()

  const [seller, setSeller] = useState(null)
  const [loadingSeller, setLoadingSeller] = useState(true)
  const sellerUuid = seller?.uuid

  const [shopName, setShopName] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('MW')
  const [logoUrl, setLogoUrl] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [needsPhone, setNeedsPhone] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  const [items, setItems] = useState([])
  const [uploading, setUploading] = useState(null)
  const [inlineError, setInlineError] = useState(null)
  const [suggestingId, setSuggestingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [deletedItem, setDeletedItem] = useState(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const [newItemIds, setNewItemIds] = useState(new Set())
  const [saveStatus, setSaveStatus] = useState(null)
  const [isOnline, setIsOnline] = useState(true)
  const writeQueue = useRef([])

  const [profileOpen, setProfileOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [analytics, setAnalytics] = useState([])

  const logoInputRef = useRef(null)
  const shopSectionRef = useRef(null)

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0]
  const cleanedPhone = cleanPhone(phone, selectedCountry)
  const validPhone = countryCode === 'OTHER'
    ? cleanedPhone.length >= selectedCountry.digits
    : cleanedPhone.length === selectedCountry.digits

  const publishableItems = items.filter((item) => item.image_url && item.title?.trim() && item.price?.trim())
  const complete = [Boolean(shopName.trim()), validPhone, publishableItems.length > 0]
  const completeCount = complete.filter(Boolean).length
  const canPublish = completeCount === 3
  const shopIncomplete = !shopName.trim() || !validPhone

  // Auto-clear new-item celebration after 1.5s
  useEffect(() => {
    if (newItemIds.size === 0) return
    const timer = setTimeout(() => setNewItemIds(new Set()), 1500)
    return () => clearTimeout(timer)
  }, [newItemIds])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      const queue = writeQueue.current
      writeQueue.current = []
      queue.forEach(({ id, patch }) => {
        supabase.from('catalog_items').update(patch).eq('id', id).then(({ error }) => {
          if (error) writeQueue.current.push({ id, patch, timestamp: Date.now() })
        })
      })
    }
    const handleOffline = () => setIsOnline(false)
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    async function loadSeller() {
      try {
        const { data } = await supabase
          .from('sellers')
          .select('*')
          .eq('manage_token', manageToken)
          .single()

        if (data) {
          setSeller(data)
          localStorage.setItem('microcatalog_manage_token', manageToken)
          localStorage.setItem('microcatalog_seller_uuid', data.uuid)
          setShopName(data.shop_name || '')
          setLogoUrl(data.logo_url || '')


          const storedPhone = localStorage.getItem(`microcatalog_phone_${data.uuid}`) || ''
          const fullPhone = data.phone || storedPhone
          setSellerPhone(fullPhone)
          if (fullPhone) {
            const country = COUNTRIES.find((c) => fullPhone.startsWith(c.dial) && c.code !== 'OTHER')
            if (country) {
              setCountryCode(country.code)
              setPhone(fullPhone.slice(country.dial.length))
            } else {
              setCountryCode('OTHER')
              setPhone(fullPhone.replace(/^\+/, ''))
            }
          }
          // Migration: if localStorage has phone but Supabase doesn't, backfill
          if (!data.phone && storedPhone) {
            supabase.from('sellers').update({ phone: storedPhone }).eq('uuid', data.uuid).then(({ error }) => {
              if (error) console.warn('Migration error:', error.message)
            }).catch((err) => {
              console.warn('Migration exception:', err.message)
            })
          }
        } else {
          const { data: legacy } = await supabase
            .from('sellers')
            .select('*')
            .eq('uuid', manageToken)
            .single()

          if (legacy) {
            setSeller(legacy)
            localStorage.setItem('microcatalog_manage_token', legacy.manage_token)
            localStorage.setItem('microcatalog_seller_uuid', legacy.uuid)
            setShopName(legacy.shop_name || '')
            setLogoUrl(legacy.logo_url || '')


            const storedPhone = localStorage.getItem(`microcatalog_phone_${legacy.uuid}`) || ''
            const fullPhone = legacy.phone || storedPhone
            setSellerPhone(fullPhone)
            if (fullPhone) {
              const country = COUNTRIES.find((c) => fullPhone.startsWith(c.dial) && c.code !== 'OTHER')
              if (country) {
                setCountryCode(country.code)
                setPhone(fullPhone.slice(country.dial.length))
              } else {
                setCountryCode('OTHER')
                setPhone(fullPhone.replace(/^\+/, ''))
              }
            }
            // Migration: if localStorage has phone but Supabase doesn't, backfill
            if (!legacy.phone && storedPhone) {
              supabase.from('sellers').update({ phone: storedPhone }).eq('uuid', legacy.uuid).then(({ error }) => {
                if (error) console.warn('Migration error:', error.message)
              }).catch((err) => {
                console.warn('Migration exception:', err.message)
              })
            }
            window.location.replace(`/#/u/${legacy.manage_token}`)
            return
          }
        }
      } catch (err) {
        logger.error('Upload', 'Load seller error', { message: err.message })
      } finally {
        setLoadingSeller(false)
      }
    }
    loadSeller()
  }, [manageToken])

  useEffect(() => {
    if (!sellerPhone || phone) return
    const country = COUNTRIES.find((c) => sellerPhone.startsWith(c.dial) && c.code !== 'OTHER')
    if (country) {
      setCountryCode(country.code)
      setPhone(sellerPhone.slice(country.dial.length))
    } else {
      setCountryCode('OTHER')
      setPhone(sellerPhone.replace(/^\+/, ''))
    }
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- rehydration: must not rerun when phone changes
  }, [sellerPhone])

  useEffect(() => {
    if (!sellerUuid) return
    async function loadAnalytics() {
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const { data, error } = await supabase
          .from('seller_analytics')
          .select('date, views, inquiries')
          .eq('seller_uuid', sellerUuid)
          .gte('date', thirtyDaysAgo.toISOString().slice(0, 10))
          .order('date', { ascending: true })
        if (error) throw error
        setAnalytics(data || [])
      } catch (err) {
        logger.error('Upload', 'Load analytics error', { message: err.message })
      }
    }
    loadAnalytics()
  }, [sellerUuid])

  useEffect(() => {
    if (!sellerUuid) return
    async function loadItems() {
      try {
        const { data, error } = await supabase
          .from('catalog_items')
          .select('*')
          .eq('seller_uuid', sellerUuid)
          .order('created_at', { ascending: false })
        if (error) throw error
        setItems(data || [])
      } catch (err) {
        logger.error('Upload', 'Load items error', { message: err.message })
      }
    }
    loadItems()
  }, [sellerUuid])

  const autoSaveShopName = useCallback(async () => {
    const trimmed = shopName.trim()
    if (!trimmed || !sellerUuid) return
    setSaveStatus('saving')
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ shop_name: trimmed })
        .eq('uuid', sellerUuid)
      if (error) throw error
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus((s) => s === 'saved' ? null : s), 2000)
    } catch (err) {
      logger.error('Upload', 'Shop name save failed', { message: err.message })
      setSaveStatus(null)
    }
  }, [sellerUuid, shopName])

  const autoSavePhone = useCallback(async (attempt = 1) => {
    if (!validPhone || !sellerUuid) return
    const fullPhone = selectedCountry.dial + cleanedPhone
    localStorage.setItem(`microcatalog_phone_${sellerUuid}`, fullPhone)
    localStorage.setItem(`microcatalog_country_${sellerUuid}`, selectedCountry.code)
    setSaveStatus('saving')
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ phone: fullPhone })
        .eq('uuid', sellerUuid)
      if (error) {
        logger.warn('Upload', 'Phone save error', { message: error.message, code: error.code, details: error.details })
        throw error
      }
      setSellerPhone(fullPhone)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus((s) => s === 'saved' ? null : s), 2000)
    } catch (err) {
      logger.error('Upload', 'Phone save failed', { attempt, message: err.message })
      if (attempt < 3) {
        setTimeout(() => autoSavePhone(attempt + 1), 1000 * attempt)
      } else {
        setInlineError('We could not save your phone number. Please check your connection and try again.')
      }
    }
  }, [sellerUuid, selectedCountry, cleanedPhone, validPhone])

  // Debounced auto-save: save phone 800ms after user stops typing if valid
  useEffect(() => {
    if (!validPhone || !sellerUuid || !phone) return
    const timer = setTimeout(() => autoSavePhone(), 800)
    return () => clearTimeout(timer)
  }, [validPhone, sellerUuid, phone, autoSavePhone])

  const handleLogo = useCallback(async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !sellerUuid) return
    setInlineError(null)
    setLogoUploading(true)
    try {
      const compressed = await compressImage(file)
      const url = await uploadToCloudinary(compressed)
      setLogoUrl(url)
      const { error } = await supabase
        .from('sellers')
        .update({ logo_url: url })
        .eq('uuid', sellerUuid)
      if (error) throw error
    } catch (err) {
      logger.error('Upload', 'Logo upload failed', { message: err.message })
      setInlineError('We could not upload that logo. Please try again.')
    } finally {
      setLogoUploading(false)
    }
  }, [sellerUuid])

const handleRemoveLogo = useCallback(async () => {
  if (!sellerUuid) return
  setLogoUrl('')
  try {
    await supabase.from('sellers').update({ logo_url: null }).eq('uuid', sellerUuid)
  } catch (err) {
    logger.error('Upload', 'Logo removal failed', { message: err.message })
  }
}, [sellerUuid])

  const updateItem = useCallback(async (id, patch) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
    if (!isOnline) {
      writeQueue.current.push({ id, patch, timestamp: Date.now() })
      setSaveStatus('queued')
      setTimeout(() => setSaveStatus((s) => s === 'queued' ? null : s), 2000)
      return
    }
    try {
      const cleanPatch = { ...patch }
      delete cleanPatch.attributes
      const { error } = await supabase.from('catalog_items').update(cleanPatch).eq('id', id)
      if (error) throw error
    } catch (err) {
      logger.error('Upload', 'Autosave failed', { itemId: id, patch, message: err.message })
      writeQueue.current.push({ id, patch, timestamp: Date.now() })
      setSaveStatus('queued')
      setTimeout(() => setSaveStatus((s) => s === 'queued' ? null : s), 2000)
    }
  }, [isOnline])

  const handleFiles = useCallback(async (files) => {
    if (!files.length || !sellerUuid) return
    setInlineError(null)
    setUploading({ count: files.length, progress: 0 })

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index]

        setUploading({ count: files.length, progress: Math.round(((index + 0.3) / files.length) * 100) })
        const compressed = await compressImage(file)

        setUploading({ count: files.length, progress: Math.round(((index + 0.6) / files.length) * 100) })
        const imageUrl = await uploadToCloudinary(compressed)

        setUploading({ count: files.length, progress: Math.round(((index + 0.9) / files.length) * 100) })
        const { data: dbItem, error } = await supabase
          .from('catalog_items')
          .insert({
            seller_uuid: sellerUuid,
            image_url: imageUrl,
            images: [{ url: imageUrl }],
            title: '',
            price: '',
            description: '',
            size_specs: '',
            extra_notes: '',
            category: null,
            published: false,
            seller_phone: sellerPhone || null,
            stock_status: 'available',
          })
          .select()
          .single()
        if (error) throw error

        setItems((current) => [...current, {
          id: dbItem.id,
          image_url: imageUrl,
          images: [{ url: imageUrl }],
          title: '',
          price: '',
          description: '',
          size_specs: '',
          extra_notes: '',
          category: null,
          attributes: [],
          stock_status: 'available',
          published: false,
          seller_phone: sellerPhone || null,
          created_at: dbItem.created_at,
        }])
        setNewItemIds((prev) => new Set(prev).add(dbItem.id))

        setUploading({ count: files.length, progress: Math.round(((index + 1) / files.length) * 100) })
      }
      setTimeout(() => setUploading(null), 600)
    } catch (err) {
      logger.error('Upload', 'Image upload failed', { message: err.message })
      setInlineError('We could not upload that photo. Please try again.')
      setUploading(null)
    }
  }, [sellerUuid, sellerPhone])

  const suggest = useCallback(async (item) => {
    setSuggestingId(item.id)
    setInlineError(null)
    try {
      const details = await suggestProductDetails(item.image_url)
      if (details) {
        const patch = {
          title: item.title || details.title || '',
          price: item.price || details.price || '',
          description: item.description || details.description || '',
          size_specs: item.size_specs || details.size_specs || '',
        }
        await updateItem(item.id, patch)
      }
    } catch (err) {
      logger.error('Upload', 'AI Suggest failed', { message: err.message })
      setInlineError('Suggestions are unavailable right now. You can still add details manually.')
    } finally {
      setSuggestingId(null)
    }
  }, [updateItem])

  const handleDeleteRequest = useCallback((id) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    setDeletedItem(item)
    setItems((current) => current.filter((i) => i.id !== id))
    setShowUndoToast(true)
  }, [items])

    const publish = useCallback(async () => {
    if (!canPublish) {
      if (shopIncomplete) {
        setNeedsPhone(true)
        setProfileOpen(true)
        requestAnimationFrame(() => shopSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      }
      return
    }
    setInlineError(null)
    setPublishing(true)
    try {
      const { error } = await supabase
        .from('catalog_items')
        .update({ published: true })
        .eq('seller_uuid', sellerUuid)
      if (error) throw error
      setItems((current) => current.map((item) => ({ ...item, published: true })))
      setPublished(true)
    } catch (err) {
      logger.error('Upload', 'Publish failed', { message: err.message })
      setInlineError('Failed to publish. Please try again.')
    } finally {
      setPublishing(false)
    }
  }, [sellerUuid, canPublish, shopIncomplete])

  const storeUrl = sellerUuid ? `https://microcatalog.vercel.app/#/c/${sellerUuid}` : ''
  const shortLink = sellerUuid ? `microcatalog.vercel.app/#/c/${sellerUuid}` : ''

  if (loadingSeller) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-28 text-foreground sm:px-6">
      {!isOnline && (
        <div className="sticky top-0 z-40 mb-4 flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
          <AlertCircle className="size-4 shrink-0" />
          <span>You are offline. Changes will sync when you are back online.</span>
        </div>
      )}
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-black/5">
              <img
                src="https://res.cloudinary.com/a3udr8l4/image/upload/w_128,h_128,c_fill,q_auto,f_webp/v1786228862/infini-logo-v2_edqhj9.png"
                alt="Infini"
                width={32}
                height={32}
                className="size-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; const fallback = e.currentTarget.parentElement.querySelector('.fallback-icon'); if (fallback) fallback.style.display = 'flex' }}
              />
              <div className="fallback-icon absolute inset-0 hidden items-center justify-center bg-primary text-primary-foreground">
                <Store className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">
                {shopName.trim() || 'Your catalog'}
              </p>
              {completeCount < 3 && (
                <p className="text-xs text-muted-foreground">Step {completeCount + 1} of 3</p>
              )}
            </div>
          </div>
          <AnimatePresence>
            {completeCount < 3 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <CircularProgress value={(completeCount / 3) * 100} />
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <ErrorBanner message={inlineError} onDismiss={() => setInlineError(null)} />

        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shop details</p>
        </div>
        <section ref={shopSectionRef} className="mb-8 scroll-mt-4">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border border-border bg-card/60 p-3 text-left shadow-[var(--shadow-lift)] backdrop-blur-xl transition-all",
              needsPhone && "ring-4 ring-primary/20 border-primary/50"
            )}
          >
            <div className="flex size-11 items-center justify-center overflow-hidden rounded-xl bg-secondary">
              {logoUrl ? (
                <img src={logoUrl} alt="Shop logo" className="size-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              ) : (
                <Store className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{shopName || 'Your shop'}</p>
              <p className="truncate text-xs text-muted-foreground">
                {!phone ? 'Add your WhatsApp number to publish' : validPhone ? `${selectedCountry.dial} ${cleanedPhone}` : 'Invalid WhatsApp number'}
              </p>
            </div>
            {profileOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {profileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={spring}
                className="overflow-hidden"
              >
                <div className="mt-3 grid gap-4 rounded-2xl border border-border bg-card/60 p-4 shadow-[var(--shadow-lift)] backdrop-blur-xl">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/50 text-muted-foreground transition hover:border-primary/40 hover:bg-secondary"
                      aria-label="Upload shop logo"
                    >
                      {logoUploading ? (
                        <div className="shimmer-v0 absolute inset-0" />
                      ) : logoUrl ? (
                        <>
                          <motion.img
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={spring}
                            src={logoUrl}
                            alt="Shop logo"
                            className="size-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveLogo() }}
                            className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground/60 text-background backdrop-blur-sm transition hover:bg-foreground/80"
                            aria-label="Remove logo"
                          >
                            <X className="size-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="flex flex-col items-center gap-1.5">
                          <Store className="size-6" />
                          <span className="text-[11px] font-medium">Add logo</span>
                        </span>
                      )}
                    </button>
                    <input ref={logoInputRef} className="hidden" type="file" accept="image/*" onChange={handleLogo} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">Shop name</label>
                        {saveStatus === 'saving' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60">
                            <span className="size-1.5 rounded-full bg-primary/50 animate-pulse" />
                            Saving…
                          </span>
                        )}
                        {saveStatus === 'saved' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                            <Check className="size-3" />
                            Saved
                          </span>
                        )}
                        {saveStatus === 'queued' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning">
                            <AlertCircle className="size-3" />
                            Queued
                          </span>
                        )}
                      </div>
                      <input
                        className={cn(inputBase, 'mt-1.5 field-input')}
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        onBlur={autoSaveShopName}
                        placeholder="Your shop name"
                      />
                    </div>
                  </div>
                  <div>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">WhatsApp phone number</p>
                    <div className="grid grid-cols-[7.5rem_1fr] gap-2">
                      <CountrySelect
                        value={countryCode}
                        onChange={(code) => {
                          const next = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0]
                          setPhone((prev) => cleanPhone(prev, next))
                          setCountryCode(code)
                        }}
                      />
                      <input
                        className={cn(inputBase, 'field-input', phone.length > 0 && !validPhone && 'border-destructive', validPhone && !phoneError && 'border-success', phoneError && 'border-destructive')}
                        value={phone}
                        onChange={(e) => { setPhoneError(''); setPhone((e.target.value || '').replace(/\D/g, '')) }}
                        onBlur={() => {
                          if (phone.length === 0) {
                            setPhoneError('')
                          } else if (!validPhone) {
                            setPhoneError(`Enter a valid ${selectedCountry.name} WhatsApp number`)
                          } else {
                            setPhoneError('')
                            autoSavePhone()
                          }
                        }}
                        placeholder={selectedCountry.placeholder}
                        inputMode="tel"
                      />
                    </div>
                        {phoneError && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive error-banner-enter">
                            <AlertCircle className="size-3.5 shrink-0" />
                            {phoneError}
                          </p>
                        )}
                  </div>
                  <button
                    onClick={() => setInsightsOpen(true)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-card/40 px-4 py-3 text-left transition hover:bg-card/70"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BarChart3 className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Insights</p>
                        <p className="text-xs text-muted-foreground">30-day activity</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Products</h2>
            {items.length > 0 && (
              <button
                onClick={() => setSheetOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Plus className="size-4" />Add
              </button>
            )}
          </div>

          {uploading && (
            <div className="relative z-20 mb-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-lift)]">
              <div className="mb-2.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <UploadCloud className="size-4 text-primary" />
                  {uploading.count} {uploading.count === 1 ? 'photo' : 'photos'} uploading
                </span>
                <span className="font-semibold tabular-nums text-primary">{uploading.progress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary shadow-[inset_0_1px_2px_oklch(0.3_0.03_60_/_.12)]">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.max(uploading.progress, 6)}%` }}
                  transition={spring}
                  className="relative h-full min-w-[0.75rem] rounded-full bg-primary"
                >
                  <span className="shimmer-v0 absolute inset-0 rounded-full" />
                </motion.div>
              </div>
            </div>
          )}

          {items.length === 0 && !uploading ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="flex flex-col items-center gap-5 rounded-[24px] border border-border bg-card/50 px-6 py-14 text-center shadow-[var(--shadow-lift)] backdrop-blur-xl"
            >
              <div>
                <p className="text-lg font-semibold text-foreground text-balance">
                  Start with your best product photo
                </p>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground text-pretty">
                  Your catalog is waiting for its first item.
                </p>
              </div>
              <button
                onClick={() => setSheetOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] transition hover:opacity-90"
              >
                <Plus className="size-4" />Add product
              </button>
            </motion.div>
          ) : (
            <motion.div layout className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <UploadProductCard
                    key={item.id}
                    item={item}
                    open={expandedId === item.id}
                    isNew={newItemIds.has(item.id)}
                    onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    onChange={(patch) => updateItem(item.id, patch)}
                    onDeleteRequest={() => handleDeleteRequest(item.id)}
                    onSuggest={() => suggest(item)}
                    suggesting={suggestingId === item.id}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {sheetOpen && <UploadSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onFiles={handleFiles} />}
      </AnimatePresence>

      <DeleteUndoToast
        message={deletedItem ? '"' + (deletedItem.title || 'Product') + '" deleted' : ''}
        visible={showUndoToast}
        onUndo={() => {
          if (deletedItem) {
            setItems((current) => [...current, deletedItem])
            setDeletedItem(null)
          }
          setShowUndoToast(false)
        }}
        onDismiss={() => {
          setDeletedItem(null)
          setShowUndoToast(false)
          if (deletedItem) {
            supabase.from('catalog_items').delete().eq('id', deletedItem.id).then(({ error }) => {
              if (error) logger.error('Upload', 'Delete failed', { itemId: deletedItem.id, message: error.message })
            })
          }
        }}
      />

      <InsightsSheet
        open={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        analytics={analytics}
        items={items}
      />

      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={spring}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/60 px-4 py-3.5 backdrop-blur-xl sm:px-6"
          >
            <div className="mx-auto max-w-3xl relative">
              {shopIncomplete ? (
                <button
                  onClick={() => {
                    setNeedsPhone(true)
                    setProfileOpen(true)
                    requestAnimationFrame(() => shopSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary/70 px-5 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
                >
                  Add shop details to publish <span aria-hidden>→</span>
                </button>
              ) : items.length > 0 && publishableItems.length === 0 ? (
                <button
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary/70 px-5 py-3.5 text-sm font-medium text-muted-foreground"
                >
                  <Check className="size-4" />Complete item details to publish
                </button>
              ) : (
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] transition hover:opacity-90 disabled:opacity-70"
                >
                  {publishing ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      Publishing…
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />Publish catalog
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {createPortal(
        <AnimatePresence>
          {published && (
            <motion.div
              key="publish-celebration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/25 p-4 backdrop-blur-sm sm:items-center"
            >
              <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={() => setPublished(false)} />
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={spring}
                className="relative w-full max-w-md rounded-t-[28px] border border-border bg-card p-6 text-center shadow-[var(--shadow-lift)] sm:rounded-[28px]"
              >
                <button onClick={() => setPublished(false)} className="absolute right-4 top-4 rounded-xl p-2 text-muted-foreground transition hover:bg-secondary" aria-label="Close">
                  <X className="size-5" />
                </button>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
                  className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-success-soft text-success"
                >
                  <PartyPopper className="size-8" />
                </motion.div>
                <p className="text-xl font-semibold text-foreground text-balance">Your catalog is live!</p>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground text-pretty">
                  Share this link with your customers and start selling.
                </p>
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-left">
                  <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{shortLink}</span>
                  <button
                    onClick={() => { navigator?.clipboard?.writeText?.(storeUrl); setCopied(true); setTimeout(() => setCopied(false), 1600) }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-lift)] transition hover:bg-secondary"
                  >
                    {copied ? <><Check className="size-3.5 text-success" />Copied</> : <><Copy className="size-3.5" />Copy</>}
                  </button>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <a href={storeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                    <ExternalLink className="size-4" />View storefront
                  </a>
                  <button onClick={() => setPublished(false)} className="rounded-2xl px-5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary">
                    Done
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </main>
  )
}
