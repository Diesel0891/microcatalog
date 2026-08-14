import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary } from '../lib/cloudinary'
import { suggestProductDetails } from '../lib/ai'
import { compressImage } from '../lib/compressImage.js'
import { logger } from '../lib/logger.js'
import {
  Store, Camera, Sparkles, Check, ChevronDown, X, Phone,
  Pencil, Trash2, Clock, Circle, CheckCircle2, ShoppingBag,
  ImagePlus, MoreHorizontal, Eye, Loader2, AlertCircle
} from 'lucide-react'
import { cn } from '../lib/cn.js'

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

const STATUS_META = {
  available: {
    label: 'Available',
    badge: 'bg-success-soft text-success',
    dotIcon: CheckCircle2,
    sheetDesc: 'Ready to buy right now',
  },
  reserved: {
    label: 'Reserved',
    badge: 'bg-reserved-soft text-reserved',
    dotIcon: Clock,
    sheetDesc: 'On hold for a customer',
  },
  sold: {
    label: 'Sold',
    badge: 'bg-sold-soft text-muted-foreground',
    dotIcon: Circle,
    sheetDesc: 'No longer available',
  },
}

const inputBase = "w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200 focus:border-primary/40 focus:bg-card focus:ring-4 focus:ring-primary/10"

function detectCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const map = {
      'Africa/Blantyre': 'MW', 'Africa/Lilongwe': 'MW',
      'Africa/Lusaka': 'ZM',
      'Africa/Harare': 'ZW',
      'Africa/Johannesburg': 'ZA', 'Africa/Pretoria': 'ZA',
      'Africa/Dar_es_Salaam': 'TZ',
      'Africa/Maputo': 'MZ',
      'Africa/Gaborone': 'BW',
    }
    return map[tz] || 'MW'
  } catch {
    return 'MW'
  }
}


/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }) {
  const meta = STATUS_META[status]
  const Icon = meta.dotIcon
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight", meta.badge)}>
      <Icon className="size-3.5" strokeWidth={2.4} />
      {meta.label}
    </span>
  )
}

function Photo({ src, alt }) {
    const [loaded, setLoaded] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
      if (ref.current?.complete && ref.current.naturalWidth > 0) setLoaded(true)
    }, [])

    return (
      <div className="relative size-full">
        {!loaded && <div className="absolute inset-0 shimmer-v0" />}
        <img
          ref={ref}
          src={src || '/placeholder.svg'}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={cn("size-full object-cover", loaded ? "animate-photo" : "opacity-0")}
        />
      </div>
    )
  }


function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-muted-foreground/80">{hint}</span> : null}
    </label>
  )
}


/* ------------------------------------------------------------------ */
/*  Country selector                                                   */
/* ------------------------------------------------------------------ */

function CountrySelect({ value, onChange }) {
    const selected = COUNTRIES.find(c => c.code === value) || COUNTRIES[0]

    return (
      <div className="relative shrink-0">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="press h-[52px] appearance-none rounded-2xl border border-border bg-secondary/50 px-3.5 pr-9 text-[15px] font-semibold text-foreground"
        >
          {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>

          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    )
  }


/* ------------------------------------------------------------------ */
/*  Shop details card                                                  */
/* ------------------------------------------------------------------ */

function ShopCard({
  shopName, setShopName,
  phone, setPhone,
  countryCode, setCountryCode,
  logoUrl,
  onShopNameBlur,
  onPhoneBlur,
  phoneError,
  saveState,
  highlight,
  onLogoUpload,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const logoInput = useRef(null)

  return (
    <section
      id="shop-details"
      className={cn(
        "animate-enter rounded-[20px] border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow",
        highlight ? "border-primary/50 ring-4 ring-primary/10" : "border-border",
      )}
      style={{ animationDelay: "80ms" }}
    >
      <div className="flex items-start gap-4">
        {/* Logo upload */}
        <button
          type="button"
          onClick={() => logoInput.current?.click()}
          className="press group relative size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary"
          aria-label="Upload shop logo"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Shop logo" className="size-full object-cover" />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-0.5 text-muted-foreground">
              <Camera className="size-5" strokeWidth={2} />
              <span className="text-[9px] font-semibold">Logo</span>
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-foreground/55 py-1 text-[10px] font-semibold text-background opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            Edit
          </span>
        </button>
        <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold leading-tight text-foreground">
                {shopName || "Your shop"}
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Shop profile</p>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(c => !c)}
              className="press flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
              aria-label={collapsed ? "Expand shop details" : "Collapse shop details"}
            >
              <ChevronDown className={cn("size-5 transition-transform duration-300", collapsed && "-rotate-90")} />
            </button>
          </div>

          <div className="mt-1 h-4">
            {saveState === 'saving' ? (
              <span className="animate-fade inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60" />
                Saving
              </span>
            ) : saveState === 'saved' ? (
              <span className="animate-fade inline-flex items-center gap-1.5 text-xs text-success">
                <Check className="size-3.5" strokeWidth={3} />
                Saved
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Collapsible body */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        )}
      >
          <div className={cn("overflow-hidden", !collapsed && "overflow-visible")}>

          <div className="mt-5 space-y-5">
            <Field label="Shop name">
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                onBlur={onShopNameBlur}
                placeholder="e.g. Amara Threads"
                className={inputBase}
              />
            </Field>

                                        <Field label="WhatsApp number">
                <div className="flex items-start gap-2.5">
                  <CountrySelect value={countryCode} onChange={setCountryCode} />
                  <div className="flex-1">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                        onBlur={onPhoneBlur}
                        inputMode="tel"
                        placeholder="801 234 5678"
                        className={cn(inputBase, "h-[52px] py-0 pl-11")}
                      />
                    </div>
                    {phoneError ? (
                      <span className="mt-1.5 block text-xs text-destructive">{phoneError}</span>
                    ) : null}
                    <span className="mt-1.5 block text-xs text-muted-foreground/80">Customers message this number to order.</span>
                  </div>
                </div>
              </Field>

          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Upload section                                                   */
/* ------------------------------------------------------------------ */

function UploadSection({ onFiles, uploading, hasProducts }) {
  const galleryInput = useRef(null)
  const cameraInput = useRef(null)

  const handleFiles = (e) => {
    if (e.target.files?.length) onFiles(e)
    e.target.value = ''
  }

  if (hasProducts) {
    return (
      <div className="animate-enter" style={{ animationDelay: '160ms' }}>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => galleryInput.current?.click()}
            className="press group flex-1 flex items-center gap-3 rounded-[20px] border border-dashed border-primary/35 bg-primary/[0.04] p-4 text-left transition-colors hover:bg-primary/[0.07]"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary transition-transform group-active:scale-95">
              <ImagePlus className="size-5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-foreground">Gallery</span>
              <span className="mt-0.5 block text-[13px] text-muted-foreground">Pick from photos</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => cameraInput.current?.click()}
            className="press group flex-1 flex items-center gap-3 rounded-[20px] border border-dashed border-primary/35 bg-primary/[0.04] p-4 text-left transition-colors hover:bg-primary/[0.07]"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary transition-transform group-active:scale-95">
              <Camera className="size-5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-foreground">Camera</span>
              <span className="mt-0.5 block text-[13px] text-muted-foreground">Snap a new photo</span>
            </span>
          </button>
        </div>
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFiles}
        />
        {uploading ? (
          <div className="animate-fade mt-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-semibold text-foreground">
                {uploading.count} {uploading.count === 1 ? 'photo' : 'photos'} uploading
              </span>
              <span className="tabular-nums text-muted-foreground">{Math.round(uploading.progress)}%</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                style={{ width: `${uploading.progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="animate-enter flex flex-col items-center rounded-[20px] border border-dashed border-border bg-card/60 px-6 py-12 text-center" style={{ animationDelay: '240ms' }}>
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Camera className="size-7" strokeWidth={2} />
      </div>
      <h3 className="mt-4 text-[17px] font-bold text-foreground">Add your first product</h3>
      <p className="mx-auto mt-1.5 max-w-[16rem] text-[13px] leading-relaxed text-muted-foreground">
        Pick from your gallery or snap a photo.
      </p>
      <div className="mt-5 flex w-full max-w-[16rem] gap-3">
        <button
          type="button"
          onClick={() => galleryInput.current?.click()}
          className="press group flex flex-1 items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-[13px] font-bold text-primary-foreground shadow-[0_8px_24px_oklch(0.64_0.16_41/0.3)]"
        >
          <ImagePlus className="size-4" />
          Gallery
        </button>
        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          className="press group flex flex-1 items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-[13px] font-bold text-primary-foreground shadow-[0_8px_24px_oklch(0.64_0.16_41/0.3)]"
        >
          <Camera className="size-4" />
          Camera
        </button>
      </div>
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  )
}

/*  Product card                                                       */
/* ------------------------------------------------------------------ */

function ProductCard({
  item,
  index,
  onUpdate,
  onDelete,
  onOpenStatus,
  onSuggest,
  suggestingId,
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article
      className="animate-enter overflow-hidden rounded-[20px] border border-border bg-card shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
      style={{ animationDelay: `${240 + index * 60}ms` }}
    >
      {/* Hero photo */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
        <Photo src={item.image_url} alt={item.title || "Product photo"} />
        <button
          type="button"
          onClick={() => onOpenStatus(item.id)}
          className="press absolute left-3 top-3"
          aria-label="Change stock status"
        >
          <StatusBadge status={item.stock_status} />
        </button>
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="press absolute bottom-3 right-3 flex h-9 items-center gap-1.5 rounded-full bg-card/85 px-3 text-[13px] font-semibold text-foreground shadow-sm backdrop-blur-md"
        >
          {expanded ? "Close" : "Details"}
          <ChevronDown className={cn("size-4 transition-transform duration-300", expanded && "rotate-180")} />
        </button>
      </div>

      {/* Summary row */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-bold text-foreground">
            {item.title || "Untitled product"}
          </h3>
          <p className="mt-0.5 text-[15px] font-semibold text-primary">
            {item.price || "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="press flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          aria-label={expanded ? "Collapse" : "Edit details"}
        >
          <Pencil className="size-4" />
        </button>
      </div>

      {/* Unfolding editor */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-border px-4 pb-4 pt-4">
            {/* Title + AI suggest */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-muted-foreground">Title</span>
                <button
                  type="button"
                  onClick={() => onSuggest(item.id)}
                  disabled={suggestingId === item.id}
                  className={cn(
                    "press inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-xs font-semibold text-primary transition-colors",
                    suggestingId === item.id && "opacity-90",
                  )}
                >
                  <Sparkles className={cn("size-3.5", suggestingId === item.id && "animate-pulse")} strokeWidth={2.4} />
                  {suggestingId === item.id ? "Thinking…" : "Suggest details"}
                </button>
              </div>
              <div className="relative">
                <input
                  value={item.title || ''}
                  onChange={(e) => onUpdate(item.id, { title: e.target.value })}
                  placeholder="Name your product"
                  className={inputBase}
                />
                {suggestingId === item.id ? <span className="shimmer-v0 pointer-events-none absolute inset-0 rounded-2xl" /> : null}
              </div>
            </div>

            {/* Price + size */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price">
                <input
                  value={item.price || ''}
                  onChange={(e) => onUpdate(item.id, { price: e.target.value })}
                  placeholder="e.g. MK 15,000"
                  className={inputBase}
                />
              </Field>
              <Field label="Size / specs">
                <div className="relative">
                  <input
                    value={item.size_specs || ''}
                    onChange={(e) => onUpdate(item.id, { size_specs: e.target.value })}
                    placeholder="S, M, L"
                    className={inputBase}
                  />
                  {suggestingId === item.id ? <span className="shimmer-v0 pointer-events-none absolute inset-0 rounded-2xl" /> : null}
                </div>
              </Field>
            </div>

            {/* Description */}
            <Field label="Description">
              <div className="relative">
                <textarea
                  value={item.description || ''}
                  onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                  placeholder="Tell customers what makes it special"
                  rows={3}
                  className={cn(inputBase, "resize-none leading-relaxed")}
                />
                {suggestingId === item.id ? <span className="shimmer-v0 pointer-events-none absolute inset-0 rounded-2xl" /> : null}
              </div>
            </Field>

            {/* Notes */}
            <Field label="Notes">
              <input
                value={item.extra_notes || ''}
                onChange={(e) => onUpdate(item.id, { extra_notes: e.target.value })}
                placeholder="e.g. Ships in 3 days"
                className={inputBase}
              />
            </Field>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => onOpenStatus(item.id)}
                className="press inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-2 text-[13px] font-semibold text-foreground"
              >
                Stock: {STATUS_META[item.stock_status].label}
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="press inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remove product"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}


/* ------------------------------------------------------------------ */
/*  Stock status bottom sheet                                          */
/* ------------------------------------------------------------------ */

function StockSheet({ current, onSelect, onClose }) {
  const order = ['available', 'reserved', 'sold']
  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-backdrop absolute inset-0 bg-foreground/30 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div className="animate-sheet absolute inset-x-0 bottom-0 mx-auto max-w-[440px] rounded-t-[28px] border-t border-border bg-card p-5 pb-8 shadow-[var(--shadow-sheet)]">
        <div className="mx-auto mb-5 h-1.5 w-11 rounded-full bg-border" />
        <div className="animate-fade mb-4 flex items-center justify-between" style={{ animationDelay: "100ms" }}>
          <h3 className="text-lg font-bold text-foreground">Stock status</h3>
          <button
            type="button"
            onClick={onClose}
            className="press flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"
            aria-label="Close"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="animate-fade space-y-2.5" style={{ animationDelay: "120ms" }}>
          {order.map(s => {
            const meta = STATUS_META[s]
            const Icon = meta.dotIcon
            const active = s === current
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSelect(s)}
                className={cn(
                  "press flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all",
                  active
                    ? "border-primary/50 bg-primary/[0.06] ring-4 ring-primary/10"
                    : "border-border bg-card hover:bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl",
                    s === "available" && "bg-success-soft text-success",
                    s === "reserved" && "bg-reserved-soft text-reserved",
                    s === "sold" && "bg-sold-soft text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={2.4} />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-bold text-foreground">{meta.label}</span>
                  <span className="block text-[13px] text-muted-foreground">{meta.sheetDesc}</span>
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border-2 transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {active ? <Check className="size-3.5" strokeWidth={3.5} /> : null}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Success modal                                                      */
/* ------------------------------------------------------------------ */

function SuccessModal({ link, onClose }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center">
      <div className="animate-backdrop absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={onClose} aria-hidden />
      <div className="animate-sheet relative mx-auto w-full max-w-[440px] rounded-t-[28px] bg-card p-7 pb-10 text-center shadow-[var(--shadow-sheet)] sm:rounded-[28px]">
        <div className="animate-pop mx-auto flex size-20 items-center justify-center rounded-full bg-success-soft" style={{ animationDelay: "80ms" }}>
          <svg viewBox="0 0 24 24" className="check-draw size-9 text-success" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="animate-fade mt-5 text-2xl font-bold text-foreground" style={{ animationDelay: "180ms" }}>
          Your catalog is live
        </h2>
        <p className="animate-fade mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted-foreground" style={{ animationDelay: "220ms" }}>
          Share this link anywhere. Customers tap a product and order straight to your WhatsApp.
        </p>

        <div className="animate-fade mt-6 flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 p-2 pl-4" style={{ animationDelay: "260ms" }}>
          <span className="min-w-0 flex-1 truncate text-left text-[14px] font-medium text-foreground">{link}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(link).catch(() => {})
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1800)
            }}
            className="press flex h-11 items-center gap-1.5 rounded-xl bg-card px-3.5 text-[13px] font-semibold text-foreground ring-1 ring-border"
          >
            {copied ? <Check className="size-4 text-success" strokeWidth={3} /> : <span>Copy</span>}
            {copied ? "Copied" : null}
          </button>
        </div>

        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="press mt-3 flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[16px] font-bold text-primary-foreground shadow-[0_8px_24px_oklch(0.64_0.16_41/0.35)]"
        >
          <Eye className="size-5" />
          View my catalog
        </a>
        <button
          type="button"
          onClick={onClose}
          className="press mt-2 h-11 w-full rounded-2xl text-[15px] font-semibold text-muted-foreground"
        >
          Back to catalog
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Upload component                                              */
/* ------------------------------------------------------------------ */

export default function Upload() {
  const { manageToken } = useParams()

  const [items, setItems] = useState([])
  const [totalItemCount, setTotalItemCount] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [sellerPhone, setSellerPhone] = useState('')
  const [shopName, setShopName] = useState('')
  const [seller, setSeller] = useState(null)
  const sellerUuid = seller?.uuid
  const [loadingSeller, setLoadingSeller] = useState(true)
  const [savedFeedback, setSavedFeedback] = useState(null)
  const [suggestingIds, setSuggestingIds] = useState(new Set())
  const [selectedCountry, setSelectedCountry] = useState(detectCountry())
  const [localPhone, setLocalPhone] = useState('')
  const [inlineError, setInlineError] = useState(null)
  const [phoneError, setPhoneError] = useState(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [statusFor, setStatusFor] = useState(null)
  const [uploading, setUploading] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [needsPhone, setNeedsPhone] = useState(false)


  // Load seller
  useEffect(() => {
    async function loadSeller() {
      try {
        const { data } = await supabase.from('sellers').select('*').eq('manage_token', manageToken).single()
        if (data) {
          setSeller(data)
          localStorage.setItem('microcatalog_manage_token', manageToken)
          localStorage.setItem('microcatalog_seller_uuid', data.uuid)
          setShopName(data.shop_name || '')
          setLogoUrl(data.logo_url || '')
          const fullPhone = data.phone || ''
          setSellerPhone(fullPhone)
          if (fullPhone) {
            const country = COUNTRIES.find(c => fullPhone.startsWith(c.dial) && c.code !== 'OTHER')
            if (country) {
              setSelectedCountry(country.code)
              setLocalPhone(fullPhone.slice(country.dial.length))
            } else {
              setSelectedCountry('OTHER')
              setLocalPhone(fullPhone.replace(/^\+/, ''))
            }
          }
        } else {
          const { data: legacySeller } = await supabase.from('sellers').select('*').eq('uuid', manageToken).single()
          if (legacySeller) {
            setSeller(legacySeller)
            localStorage.setItem('microcatalog_manage_token', legacySeller.manage_token)
            localStorage.setItem('microcatalog_seller_uuid', legacySeller.uuid)
            setShopName(legacySeller.shop_name || '')
            setLogoUrl(legacySeller.logo_url || '')
            const fullPhone = legacySeller.phone || ''
            setSellerPhone(fullPhone)
            if (fullPhone) {
              const country = COUNTRIES.find(c => fullPhone.startsWith(c.dial) && c.code !== 'OTHER')
              if (country) {
                setSelectedCountry(country.code)
                setLocalPhone(fullPhone.slice(country.dial.length))
              } else {
                setSelectedCountry('OTHER')
                setLocalPhone(fullPhone.replace(/^\+/, ''))
              }
            }
            window.location.replace(`/#/u/${legacySeller.manage_token}`)
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

  // Load items
  useEffect(() => {
    if (!sellerUuid) return
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('catalog_items')
          .select('*')
          .eq('seller_uuid', sellerUuid)
          .order('created_at', { ascending: false })
        if (error) throw error
        setItems(data || [])
        setTotalItemCount(data?.length || 0)
      } catch (err) {
        logger.error('Upload', 'Load data error', { message: err.message })
      }
    }
    loadData()
  }, [sellerUuid])


  const validateLocalPhone = useCallback(() => {
    const country = COUNTRIES.find(c => c.code === selectedCountry)
    if (!country) return false
    let cleaned = localPhone.replace(/\D/g, '')
    if (country.stripLeadingZero && cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1)
    }
    return cleaned.length === country.digits
  }, [selectedCountry, localPhone])

  const autoSaveShopName = useCallback(async () => {
    const trimmed = shopName.trim()
    if (!trimmed) return
    await supabase.from('sellers').update({ shop_name: trimmed }).eq('uuid', sellerUuid)
    setSavedFeedback('shopName')
    setTimeout(() => setSavedFeedback(null), 2000)
  }, [sellerUuid, shopName])

  const autoSavePhone = useCallback(async () => {
    if (!validateLocalPhone()) {
      setPhoneError('Please enter a valid phone number')
      return
    }
    setPhoneError(null)
    const country = COUNTRIES.find(c => c.code === selectedCountry)
    let cleaned = localPhone.replace(/\D/g, '')
    if (country.stripLeadingZero && cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1)
    }
    const fullPhone = country.dial + cleaned
    await supabase.from('sellers').update({ phone: fullPhone }).eq('uuid', sellerUuid)
    await supabase.from('catalog_items').update({ seller_phone: fullPhone }).eq('seller_uuid', sellerUuid)
    setSellerPhone(fullPhone)
    setSavedFeedback('phone')
    setTimeout(() => setSavedFeedback(null), 2000)
  }, [sellerUuid, selectedCountry, localPhone, validateLocalPhone])

  const handleLogoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      const url = await uploadToCloudinary(compressed)
      setLogoUrl(url)
      await supabase.from('sellers').update({ logo_url: url }).eq('uuid', sellerUuid)
      setSavedFeedback('logo')
      setTimeout(() => setSavedFeedback(null), 2000)
    } catch (err) {
      logger.error('Upload', 'Logo upload failed', { message: err.message })
      setInlineError('Logo upload failed. Please try again.')
    }
  }, [sellerUuid])

  // File upload
  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !sellerUuid) return

    setUploading({ count: files.length, progress: 0 })
    setInlineError(null)

    const newItems = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      image_url: '',
      title: '',
      price: '',
      description: '',
      size_specs: '',
      extra_notes: '',
      published: false,
      seller_phone: sellerPhone || null,
      stock_status: 'available',
    }))

    setItems(prev => [...newItems, ...prev])
    setTotalItemCount(prev => prev + files.length)

          let completed = 0
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i]
        try {
          setUploading(u => u ? { ...u, progress: (i / files.length) * 100 + (0.15 / files.length) * 100 } : null)
          const fileToUpload = await compressImage(item.file)

          setUploading(u => u ? { ...u, progress: (i / files.length) * 100 + (0.55 / files.length) * 100 } : null)
          const imageUrl = await uploadToCloudinary(fileToUpload)

          setUploading(u => u ? { ...u, progress: (i / files.length) * 100 + (0.85 / files.length) * 100 } : null)
          const { error } = await supabase
            .from('catalog_items')
            .insert({
              seller_uuid: sellerUuid,
              image_url: imageUrl,
              title: item.title,
              price: item.price,
              description: item.description,
              size_specs: item.size_specs,
              extra_notes: item.extra_notes,
              published: false,
              seller_phone: sellerPhone || null,
              stock_status: 'available',
            })
            .select()
            .single()

          if (error) throw error

          setItems(prev => prev.map(it => it.id === item.id ? { ...it, image_url: imageUrl, file: null } : it))
          completed++
          setUploading(u => u ? { ...u, progress: (completed / files.length) * 100 } : null)
        } catch (err) {
          logger.error('Upload', 'Image upload failed', { message: err.message })
          setInlineError('Upload failed: Please check your internet connection.')
          setUploading(null)
          return
        }
      }
      await new Promise(r => setTimeout(r, 600))
      setUploading(null)

  }, [sellerUuid, sellerPhone])

  // Update item
  const updateItem = useCallback(async (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
    const dbField = Object.keys(updates)[0]
    try {
      await supabase.from('catalog_items').update({ [dbField]: updates[dbField] }).eq('id', id)
    } catch (err) {
      logger.error('Upload', 'Autosave failed', { itemId: id, field: dbField, error: err.message })
    }
  }, [])

  // Delete item
  const deleteItem = useCallback(async (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
    setTotalItemCount(prev => prev - 1)
    try {
      await supabase.from('catalog_items').delete().eq('id', id)
    } catch (err) {
      logger.error('Upload', 'Delete failed', { message: err.message })
    }
  }, [])

  // AI suggest
  const handleSuggest = useCallback(async (id) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    setSuggestingIds(prev => new Set(prev).add(id))
    try {
      const suggestion = await suggestProductDetails(item.image_url)
      if (suggestion) {
        setItems(prev => prev.map(i => i.id === id ? {
          ...i,
          title: i.title || suggestion.title || '',
          price: i.price || suggestion.price || '',
          description: i.description || suggestion.description || '',
          size_specs: i.size_specs || suggestion.size_specs || '',
        } : i))
        await supabase.from('catalog_items').update({
          title: suggestion.title || item.title,
          price: suggestion.price || item.price,
          description: suggestion.description || item.description,
          size_specs: suggestion.size_specs || item.size_specs,
        }).eq('id', id)
      }
    } catch (err) {
      logger.error('Upload', 'AI Suggest failed', { message: err.message })
    } finally {
      setSuggestingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [items])

  // Stock status
  const handleStatusChange = useCallback(async (id, status) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, stock_status: status } : i))
    try {
      await supabase.from('catalog_items').update({ stock_status: status }).eq('id', id)
    } catch (err) {
      logger.error('Upload', 'Status update failed', { message: err.message })
    }
  }, [])

  // Publish
  const handlePublish = useCallback(async () => {
    if (!validateLocalPhone()) {
      setNeedsPhone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setPublishing(true)
    try {
      await supabase.from('catalog_items').update({ published: true }).eq('seller_uuid', sellerUuid)
      setPublished(true)
    } catch (err) {
      logger.error('Upload', 'Publish failed', { message: err.message })
      setInlineError('Failed to publish. Please try again.')
    } finally {
      setPublishing(false)
    }
  }, [sellerUuid, validateLocalPhone])

  const catalogLink = `https://microcatalog.vercel.app/#/c/${sellerUuid}`

  const activeItem = statusFor ? items.find(i => i.id === statusFor) : null

  if (loadingSeller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative mx-auto max-w-[440px] pb-32">
        {/* Header */}
        <header className="animate-enter sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_4px_12px_oklch(0.64_0.16_41/0.3)]">
              <Store className="size-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[19px] font-bold leading-tight text-foreground">Your catalog</h1>
              <p className="text-[13px] font-medium text-muted-foreground">
                {totalItemCount} {totalItemCount === 1 ? "product" : "products"}
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                className="press flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
                aria-label="More actions"
              >
                <MoreHorizontal className="size-5" />
              </button>
              {menuOpen ? (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} aria-hidden />
                  <div className="animate-expand absolute right-0 top-12 z-30 w-48 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-lift)]">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); document.getElementById('shop-details')?.scrollIntoView({ behavior: 'smooth' }) }}
                      className="press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-foreground hover:bg-secondary"
                    >
                      <Pencil className="size-4 text-muted-foreground" />
                      Edit shop
                    </button>
                    <a
                      href={`/#/c/${sellerUuid}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium text-foreground hover:bg-secondary"
                    >
                      <Eye className="size-4 text-muted-foreground" />
                      Preview catalog
                    </a>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="space-y-6 px-5 pt-6">
          {inlineError && (
            <div className="animate-rise rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-2 text-[13px] leading-snug text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{inlineError}</span>
            </div>
          )}

          <ShopCard
            shopName={shopName}
            setShopName={setShopName}
            phone={localPhone}
            setPhone={setLocalPhone}
            countryCode={selectedCountry}
            setCountryCode={setSelectedCountry}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            saveState={savedFeedback === 'shopName' || savedFeedback === 'phone' || savedFeedback === 'logo' ? 'saved' : 'idle'}
            highlight={needsPhone}
            onLogoUpload={handleLogoUpload}
            onShopNameBlur={autoSaveShopName}
            onPhoneBlur={autoSavePhone}
            phoneError={phoneError}
          />

          {needsPhone && !sellerPhone && (
            <div className="animate-expand -mt-3 flex items-start gap-2.5 rounded-2xl border border-reserved/30 bg-reserved-soft/70 p-3.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-reserved" />
              <p className="text-[13px] leading-relaxed text-foreground">
                Add your WhatsApp number above so customers can reach you. It only takes a second — then you're ready to publish.
              </p>
            </div>
          )}

          <UploadSection onFiles={handleFileSelect} uploading={uploading} hasProducts={items.length > 0} />

          {items.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[15px] font-bold text-foreground">Products</h2>
                <span className="text-[13px] font-medium text-muted-foreground">Tap a card to edit</span>
              </div>
              {items.map((item, i) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  index={i}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  onOpenStatus={setStatusFor}
                  onSuggest={handleSuggest}
                  suggestingId={suggestingIds.has(item.id) ? item.id : null}
                />
              ))}
            </div>
          )}
        </main>



        {/* Publish bar */}
        <div className="fixed inset-x-0 bottom-0 z-40">
          <div className="mx-auto max-w-[440px] px-5 pb-5">
            <div className="rounded-[22px] border border-border/70 bg-background/80 p-2 shadow-[0_-6px_30px_oklch(0.3_0.02_60/0.1)] backdrop-blur-xl">
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || items.length === 0}
                className={cn(
                  "press flex h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl text-[16px] font-bold transition-all",
                  items.length === 0
                    ? "bg-secondary text-muted-foreground"
                    : "bg-primary text-primary-foreground shadow-[0_8px_24px_oklch(0.64_0.16_41/0.35)]",
                )}
              >
                {publishing ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <ShoppingBag className="size-5" strokeWidth={2.2} />
                    Publish catalog
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeItem && (
        <StockSheet
          current={activeItem.stock_status}
          onClose={() => setStatusFor(null)}
          onSelect={(s) => handleStatusChange(activeItem.id, s)}
        />
      )}

      {published && (
        <SuccessModal link={catalogLink} onClose={() => setPublished(false)} />
      )}
    </div>
  )
}
