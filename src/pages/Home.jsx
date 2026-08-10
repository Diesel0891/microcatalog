import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger.js'
import { Store, ArrowRight, HelpCircle } from 'lucide-react'

const LOGO_URL = 'https://res.cloudinary.com/a3udr8l4/image/upload/w_200,h_200,c_fill,q_auto,f_webp/v1786228862/infini-logo-v2_edqhj9.png'

function Home() {
  const navigate = useNavigate()
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryPhone, setRecoveryPhone] = useState('')
  const [recovering, setRecovering] = useState(false)
  const [recoveryError, setRecoveryError] = useState(null)
  const [creating, setCreating] = useState(false)

  const handleStartSelling = async () => {
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
        setRecoveryError('Unable to create catalog. Please check your connection and try again.')
        setCreating(false)
        return
      }

      localStorage.setItem('microcatalog_manage_token', manageToken)
      localStorage.setItem('microcatalog_seller_uuid', sellerUuid)

      navigate(`/u/${manageToken}`)
    } catch (err) {
      logger.error('Home', 'Onboarding error', { message: err.message })
      setRecoveryError('Something went wrong. Please try again.')
      setCreating(false)
    }
  }

  const handleRecover = async () => {
    if (!recoveryPhone.trim()) return

    setRecovering(true)
    setRecoveryError(null)

    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('manage_token, uuid')
        .eq('phone', recoveryPhone.trim())
        .single()

      if (error || !data) {
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
    <div className="min-h-screen bg-base-100 flex flex-col items-center pt-14 pb-8 px-6">
      {/* Brand Mark */}
      <div className="text-center mb-10">
        <div className="avatar mb-5">
          <div className="w-24 rounded-2xl ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100 shadow-xl">
            <img src={LOGO_URL} alt="Infini" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-base-content mb-2 tracking-tight">Infini</h1>
        <p className="text-base-content/50 text-sm font-medium">Your WhatsApp catalog, in 2 minutes</p>
      </div>

      {/* Primary CTA */}
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleStartSelling}
          disabled={creating}
          className="btn btn-primary btn-lg w-full gap-3 shadow-lg shadow-primary/20 normal-case text-left h-auto py-4"
        >
          <div className="bg-white/20 rounded-lg p-2">
            <Store className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base">Start Selling</div>
            <div className="text-xs opacity-70 font-normal">Create your free catalog</div>
          </div>
          {creating ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <ArrowRight className="w-5 h-5 opacity-60" strokeWidth={2} />
          )}
        </button>

        {/* Recovery Toggle */}
        <button
          onClick={() => {
            setShowRecovery(!showRecovery)
            setRecoveryError(null)
          }}
          className="btn btn-ghost btn-sm w-full text-primary normal-case font-medium"
        >
          {showRecovery ? 'Hide' : 'Manage an existing catalog →'}
        </button>

        {/* Recovery Panel */}
        {showRecovery && (
          <div className="card card-compact bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body space-y-3">
              <p className="text-xs text-base-content/60">
                Enter the WhatsApp number you saved in your catalog (with country code).
              </p>
              <input
                type="tel"
                placeholder="+265991234567"
                value={recoveryPhone}
                onChange={(e) => setRecoveryPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRecover()}
                className="input input-bordered input-sm w-full bg-base-100"
              />
              <button
                onClick={handleRecover}
                disabled={recovering || !recoveryPhone.trim()}
                className="btn btn-primary btn-sm w-full normal-case"
              >
                {recovering ? (
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                ) : null}
                Find my catalog
              </button>
              {recoveryError && (
                <div className="alert alert-error alert-sm py-2 text-xs">
                  <span>{recoveryError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Support */}
        <a
          href="https://wa.me/?text=Hello%20Infini%2C%20I%20need%20help%20with%20my%20catalog."
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-xs w-full text-base-content/50 normal-case gap-2"
        >
          <HelpCircle className="w-3.5 h-3.5" strokeWidth={2} />
          Need help? Contact support
        </a>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-base-content/30 text-xs">Powered by Infini</p>
      </div>
    </div>
  )
}

export default Home
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
          ) : (
            <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-copper-400 transition-colors" strokeWidth={2} />
          )}
        </button>

        {/* Recovery Toggle */}
        <button
          onClick={() => {
            setShowRecovery(!showRecovery)
            setRecoveryError(null)
          }}
          className="w-full flex items-center justify-center gap-2 text-sm text-copper-600 font-medium hover:text-copper-700 transition"
        >
          
          {showRecovery ? 'Hide' : 'Manage an existing catalog →'}
        </button>

        {/* Recovery Panel */}
        {showRecovery && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
            <p className="text-xs text-charcoal-500">
              Enter the WhatsApp number you saved in your catalog (with country code).
            </p>
            <input
              type="tel"
              placeholder="+265991234567"
              value={recoveryPhone}
              onChange={(e) => setRecoveryPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRecover()}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-copper-400 focus:border-transparent"
            />
            <button
              onClick={handleRecover}
              disabled={recovering || !recoveryPhone.trim()}
              className="w-full bg-copper-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-copper-700 disabled:opacity-50 transition"
            >
              {recovering ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  Looking up...
                </span>
              ) : (
                'Find my catalog'
              )}
            </button>
            {recoveryError && (
              <p className="text-red-600 text-xs leading-relaxed">{recoveryError}</p>
            )}
          </div>
        )}

        {/* Support */}
        <a
          href="https://wa.me/?text=Hello%20Infini%2C%20I%20need%20help%20with%20my%20catalog."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 text-sm text-charcoal-600 hover:text-charcoal-900 transition"
        >
          <HelpCircle className="w-4 h-4" strokeWidth={2} />
          Need help? Contact support
        </a>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-charcoal-300 text-xs">Powered by Infini</p>
      </div>
    </div>
  )
}

export default Home
