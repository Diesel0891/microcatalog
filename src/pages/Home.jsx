import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger.js'
import { ArrowRight, Store, AlertCircle, HelpCircle, Loader2 } from 'lucide-react'

const LOGO_URL = 'https://res.cloudinary.com/a3udr8l4/image/upload/w_200,h_200,c_fill,q_auto,f_webp/v1786228862/infini-logo-v2_edqhj9.png'

export default function Home() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [recovering, setRecovering] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [recoveryError, setRecoveryError] = useState(null)

  async function handleCreate() {
    if (creating) return
    setCreating(true)

    try {
      const manageToken = crypto.randomUUID()
      const sellerUuid = crypto.randomUUID()

      const { error: insertError } = await supabase.from('sellers').insert({
        uuid: sellerUuid,
        manage_token: manageToken,
        phone: '',
        shop_name: '',
        is_pro: false,
        max_items: 999,
      })

      if (insertError) {
        logger.error('Home', 'Failed to create seller', { message: insertError.message })
        setCreateError('Unable to create catalog. Please check your connection and try again.')
        setCreating(false)
        return
      }

      localStorage.setItem('microcatalog_manage_token', manageToken)
      localStorage.setItem('microcatalog_seller_uuid', sellerUuid)

      navigate(`/u/${manageToken}`)
    } catch (err) {
      logger.error('Home', 'Onboarding error', { message: err.message })
      setCreateError('Something went wrong. Please try again.')
      setCreating(false)
    }
  }

  async function handleRecover(e) {
    e.preventDefault()
    if (recovering) return
    setRecoveryError(null)

    const digits = phone.replace(/[^\d+]/g, '')
    if (digits.length < 7) {
      setRecoveryError('Enter the phone number linked to your catalog.')
      return
    }

    setRecovering(true)

    try {
      const { data, error: dbError } = await supabase
        .from('sellers')
        .select('manage_token, uuid')
        .eq('phone', phone.trim())
        .single()

      if (dbError || !data) {
        setRecoveryError('No catalog found for that number. Make sure you entered the full number with country code (e.g. +265991234567).')
        setRecovering(false)
        return
      }

      localStorage.setItem('microcatalog_manage_token', data.manage_token)
      localStorage.setItem('microcatalog_seller_uuid', data.uuid)

      navigate(`/u/${data.manage_token}`)
    } catch (err) {
      logger.error('Home', 'Recovery error', { message: err.message })
      setRecoveryError('Unable to look up catalog. Please try again or contact support.')
      setRecovering(false)
    }
  }

  return (
    <main className="relative flex min-h-[100svh] flex-col items-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3.5rem,env(safe-area-inset-top))]">
      <div className="flex w-full max-w-[400px] flex-1 flex-col">
        {/* Brand block */}
        <header className="animate-rise flex flex-col items-center pt-6 text-center">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 scale-110 rounded-[28px] bg-primary/25 blur-2xl"
            />
            <div className="overflow-hidden rounded-[22px] shadow-[0_12px_32px_-12px_rgba(120,60,20,0.35)] ring-1 ring-black/5">
              <img
                src={LOGO_URL}
                alt="Infini logo"
                width={84}
                height={84}
                className="h-[84px] w-[84px]"
              />
            </div>
          </div>
          <h1 className="mt-7 text-[2rem] font-extrabold tracking-tight text-foreground">
            Infini
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground text-pretty">
            Your WhatsApp catalog, in 2 minutes
          </p>
        </header>

        {/* Primary action */}
        <div
          className="animate-rise mt-14"
          style={{ animationDelay: '0.08s' }}
        >
          <button
            type="button"
            onClick={handleCreate}
            aria-busy={creating}
            className="group flex min-h-[76px] w-full items-center gap-4 rounded-[20px] bg-primary px-5 py-4 text-left text-primary-foreground shadow-[0_14px_30px_-12px_rgba(180,80,30,0.55)] transition-all duration-150 ease-out will-change-transform hover:shadow-[0_18px_36px_-12px_rgba(180,80,30,0.6)] active:scale-[0.98] active:shadow-[0_6px_16px_-10px_rgba(180,80,30,0.6)] disabled:cursor-default"
            disabled={creating}
          >
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15 overflow-hidden">
              {creating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Store className="h-6 w-6" strokeWidth={2.1} />
              )}
              {creating && (
                <span
                  aria-hidden="true"
                  className="shimmer pointer-events-none absolute inset-0"
                />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span
                className={`block text-[17px] font-bold leading-tight transition-opacity duration-200 ${
                  creating ? 'opacity-60' : 'opacity-100'
                }`}
              >
                {creating ? 'Setting things up\u2026' : 'Create a new catalog'}
              </span>
              <span
                className={`mt-0.5 block text-[13px] leading-snug text-primary-foreground/75 transition-opacity duration-200 ${
                  creating ? 'opacity-40' : 'opacity-100'
                }`}
              >
                Add products and share in minutes
              </span>
            </span>

            <ArrowRight
              className={`h-5 w-5 shrink-0 text-primary-foreground/80 transition-transform duration-200 ease-out ${
                creating
                  ? 'translate-x-0 opacity-0'
                  : 'group-hover:translate-x-1 group-active:translate-x-1.5'
              }`}
            />
          </button>
        </div>

        {createError && (
          <div
            className="animate-rise mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-2 text-[13px] leading-snug text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{createError}</span>
          </div>
        )}

        {/* Secondary action */}
        <div
          className="animate-rise mt-6"
          style={{ animationDelay: '0.16s' }}
        >
          <button
            type="button"
            onClick={() => setRecoveryOpen((v) => !v)}
            aria-expanded={recoveryOpen}
            className="group flex w-full items-center justify-center gap-1.5 py-2 text-base font-semibold text-foreground/80 transition-colors hover:text-foreground"
          >
            Manage an existing catalog
            <ArrowRight
              className={`h-4 w-4 transition-transform duration-200 ease-out ${
                recoveryOpen
                  ? 'translate-x-0.5 rotate-90'
                  : 'group-hover:translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Recovery panel */}
        <div
          className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ gridTemplateRows: recoveryOpen ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div
              className={`mt-4 rounded-[20px] border border-border bg-card p-5 shadow-[0_10px_30px_-18px_rgba(80,50,20,0.4)] transition-opacity duration-300 ${
                recoveryOpen ? 'opacity-100 delay-150' : 'opacity-0'
              }`}
            >
              <form onSubmit={handleRecover} noValidate>
                <label
                  htmlFor="recovery-phone"
                  className="block text-[13px] font-semibold text-foreground"
                >
                  Phone number
                </label>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  The WhatsApp number linked to your catalog.
                </p>

                <div className="mt-3">
                  <input
                    id="recovery-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="e.g. +265 991 234 567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (recoveryError) setRecoveryError(null)
                    }}
                    aria-invalid={!!recoveryError}
                    className="h-[52px] w-full rounded-2xl border border-input bg-background px-4 text-left text-[16px] text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                </div>

                {recoveryError && (
                  <p
                    role="alert"
                    className="animate-rise mt-3 flex items-start gap-2 text-[13px] leading-snug text-destructive"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{recoveryError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  aria-busy={recovering}
                  disabled={recovering}
                  className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-[0_10px_24px_-12px_rgba(180,80,30,0.55)] transition-all duration-150 ease-out active:scale-[0.98] disabled:cursor-default disabled:opacity-90"
                >
                  {recovering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {'Finding your catalog\u2026'}
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Support + footer */}
        <div
          className="animate-rise mt-auto flex flex-col items-center gap-5 pt-14"
          style={{ animationDelay: '0.24s' }}
        >
          <a
            href="https://wa.me/?text=Hello%20Infini%2C%20I%20need%20help%20getting%20started"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
            Need help?
          </a>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground/50">
            Powered by Infini
          </p>
        </div>
      </div>
    </main>
  )
}
