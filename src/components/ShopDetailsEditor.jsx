import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Store, X, Check, AlertCircle } from 'lucide-react'
import { cn } from '../lib/cn.js'

const spring = { type: 'spring', stiffness: 300, damping: 30 }

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

function cleanPhone(raw, country) {
  let digits = (raw || '').replace(/\D/g, '')
  if (country?.stripLeadingZero) digits = digits.replace(/^0+/, '')
  return digits
}

const inputBase = "w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200 focus:border-primary/40"

export default function ShopDetailsEditor({ shopName, onShopNameChange, onShopNameBlur, phone, onPhoneChange, countryCode, onCountryCodeChange, logoUrl, onLogoUpload, onRemoveLogo, logoUploading, saveStatus, phoneError, onPhoneErrorChange, onPhoneBlur, validPhone, onDone }) {
  const logoInputRef = useRef(null)
  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-6 py-4 backdrop-blur-xl">
        <button type="button" onClick={onDone} className="flex size-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-secondary active:scale-[0.97]" aria-label="Back to catalog">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1 min-w-0"><h1 className="truncate text-base font-semibold text-foreground">Shop details</h1></div>
      </header>

      <div className="flex-1 px-6 py-5 pb-28">
        <div className="mb-6 flex items-start gap-4">
          <button type="button" onClick={() => logoInputRef.current?.click()} className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/50 text-muted-foreground transition hover:border-primary/40 hover:bg-secondary" aria-label="Upload shop logo">
            {logoUploading ? (
              <div className="shimmer-v0 absolute inset-0" />
            ) : logoUrl ? (
              <>
                <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring} src={logoUrl} alt="Shop logo" className="size-full object-cover" />
                <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveLogo() }} className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground/60 text-background backdrop-blur-sm transition hover:bg-foreground/80" aria-label="Remove logo"><X className="size-3.5" /></button>
              </>
            ) : (
              <span className="flex flex-col items-center gap-1.5"><Store className="size-6" /><span className="text-[11px] font-medium">Add logo</span></span>
            )}
          </button>
          <input ref={logoInputRef} className="hidden" type="file" accept="image/*" onChange={onLogoUpload} />

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Shop name</label>
              {saveStatus === 'saving' && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60"><span className="size-1.5 animate-pulse rounded-full bg-primary/50" />Saving…</span>}
              {saveStatus === 'saved' && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success"><Check className="size-3" />Saved</span>}
              {saveStatus === 'queued' && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning"><AlertCircle className="size-3" />Queued</span>}
            </div>
            <input className={cn(inputBase, 'mt-1.5 field-input')} value={shopName} onChange={(e) => onShopNameChange(e.target.value)} onBlur={onShopNameBlur} placeholder="Your shop name" />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">WhatsApp phone number</p>
          <div className="grid grid-cols-[7.5rem_1fr] gap-2">
            <select value={countryCode} onChange={(e) => { const next = COUNTRIES.find((c) => c.code === e.target.value) || COUNTRIES[0]; onPhoneChange(cleanPhone(phone, next)); onCountryCodeChange(e.target.value) }} className={cn(inputBase, 'appearance-none bg-secondary/50 text-center text-sm font-medium')}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input className={cn(inputBase, 'field-input', phone.length > 0 && !validPhone && 'border-destructive', validPhone && !phoneError && 'border-success', phoneError && 'border-destructive')} value={phone} onChange={(e) => { onPhoneErrorChange(''); onPhoneChange((e.target.value || '').replace(/\D/g, '')) }} onBlur={onPhoneBlur} placeholder={selectedCountry.placeholder} inputMode="tel" />
          </div>
          {phoneError && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive error-banner-enter"><AlertCircle className="size-3.5 shrink-0" />{phoneError}</p>}
        </div>
      </div>
    </div>
  )
}
