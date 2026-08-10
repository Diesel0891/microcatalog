import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger.js'
import { Store, ArrowRight, HelpCircle, Loader2 } from 'lucide-react'

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

      // Store for ownership detection on catalog page
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
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center pt-10 pb-6 px-6">
                      {/* Brand Mark */}
        <div className="mb-6 text-center">
          <div className="w-24 h-24 rounded-2xl mx-auto mb-3 overflow-hidden shadow-lg bg-charcoal-950 ring-2 ring-white/10">
            <img src={LOGO_URL} alt="Infini" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-950 mb-2">Infini</h1>
          <p className="text-charcoal-500 text-sm font-medium">Your WhatsApp catalog, in 2 minutes</p>
        </div>



      {/* Primary CTA */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleStartSelling}
          disabled={creating}
          className="w-full group flex items-center gap-4 bg-charcoal-950 text-white rounded-xl p-4 hover:bg-charcoal-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
        >
          <div className="w-11 h-11 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-copper-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h2 className="font-semibold text-sm">Start Selling</h2>
            <p className="text-white/60 text-xs mt-0.5">Create your free catalog</p>
          </div>
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
