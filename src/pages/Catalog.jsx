import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger.js'
import { isInquirable, getStockLabel } from '../lib/stockStatus.js'
import StockStatusBadge from '../components/StockStatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ItemDetailSheet from '../components/ItemDetailSheet.jsx'
import { Loader2, MessageCircle, Tag, ChevronRight, Store, Edit3 } from 'lucide-react'

function Catalog() {
  const { sellerUuid } = useParams()
  const [items, setItems] = useState([])
  const [sellerPhone, setSellerPhone] = useState('')
  const [shopName, setShopName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [sellerNotFound, setSellerNotFound] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch seller info
        const { data: sellerData } = await supabase
          .from('sellers')
          .select('phone, shop_name')
          .eq('uuid', sellerUuid)
          .single()

        if (sellerData) {
          setSellerPhone(sellerData.phone || '')
          setShopName(sellerData.shop_name || '')
        } else {
          setSellerNotFound(true)
          setLoading(false)
          return
        }

        // Fetch catalog items
        const { data, error } = await supabase
          .from('catalog_items')
          .select('*')
          .eq('seller_uuid', sellerUuid)
          .eq('published', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setItems(data || [])
      } catch (err) {
        logger.error('Catalog', 'Fetch failed', { message: err.message })
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    // Check if viewer is the seller (owner)
    const storedUuid = localStorage.getItem('microcatalog_seller_uuid')
    setIsOwner(storedUuid === sellerUuid)
  }, [sellerUuid])

  const openWhatsApp = (item) => {
    const message = [
      `Hi, I'm interested in *${item.title}* — ${item.price}`,
      `Status: ${getStockLabel(item.stock_status)}`,
      ``,
      `📷 Product photo:`,
      `${item.image_url}`
    ].join('\n')

    const encodedMessage = encodeURIComponent(message)
    const cleanPhone = sellerPhone ? sellerPhone.replace(/\D/g, '') : ''
    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`

    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-copper-500 animate-spin mx-auto mb-3" strokeWidth={2} />
          <p className="text-charcoal-400 text-sm font-medium">Loading catalog...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <EmptyState title="Something went wrong" description={error} />
  }

  if (items.length === 0) {
    return <EmptyState title="Catalog is empty" description="No items have been published yet." />
  }

  if (sellerNotFound) {
    return <EmptyState title="Catalog not found" description="This catalog link doesn't exist or has been removed." />
  }

  const displayName = shopName.trim() || 'Catalog' 
  const manageToken = localStorage.getItem('microcatalog_manage_token')

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-8">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-charcoal-950 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-copper-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-charcoal-950 leading-tight">{displayName}</h1>
              <p className="text-xs text-charcoal-400">{items.length} item{items.length !== 1 ? 's' : ''} available</p>
            </div>
          </div>
          {isOwner && (
            <a
              href={`/#/u/${manageToken || sellerUuid}`}
              className="flex items-center gap-1.5 text-xs text-copper-600 font-medium hover:text-copper-700 transition"
            >
              <Edit3 className="w-3.5 h-3.5" strokeWidth={2} />
              Edit catalog
            </a>
          )}
        </div>
      </div>

      {/* Instruction Banner */}
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="bg-copper-50 border border-copper-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-copper-600 shrink-0" strokeWidth={2} />
          <p className="text-copper-800 text-xs font-medium">
            Tap any item to inquire on WhatsApp
          </p>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-lg mx-auto px-4 space-y-4 mt-2">
        {items.map((item) => {
          const inquirable = isInquirable(item.stock_status)
          const isSold = item.stock_status === 'sold'

          return (
            <button
              key={item.id}
              onClick={() => inquirable && setSelectedItem(item)}
              disabled={!inquirable}
              className={`w-full bg-white rounded-2xl border overflow-hidden text-left transition-all duration-200 ${
                inquirable
                  ? 'border-stone-200 hover:shadow-lg hover:border-copper-300 active:scale-[0.98]'
                  : 'border-stone-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="relative">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className={`w-full h-56 object-cover ${isSold ? 'grayscale' : ''}`}
                />
                {isSold && (
                  <div className="absolute inset-0 bg-charcoal-950/15 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl tracking-widest drop-shadow-lg">SOLD</span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <StockStatusBadge status={item.stock_status} size="xs" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                  <div className="flex items-end justify-between gap-2">
                    <h3 className="font-bold text-white text-lg leading-tight flex-1 drop-shadow-sm">{item.title}</h3>
                    <span className="text-white font-bold text-lg whitespace-nowrap drop-shadow-sm">{item.price}</span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {item.description && (
                  <p className="text-charcoal-500 text-sm leading-relaxed">{item.description}</p>
                )}

                {item.size_specs && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 bg-sage-50 text-sage-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-sage-200">
                      <Tag className="w-3 h-3" strokeWidth={2.5} />
                      {item.size_specs}
                    </span>
                  </div>
                )}

                {item.extra_notes && (
                  <p className="text-charcoal-400 text-xs mt-3 italic leading-relaxed">{item.extra_notes}</p>
                )}

                {/* WhatsApp CTA */}
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm transition ${
                    inquirable
                      ? 'bg-charcoal-950 text-white hover:bg-charcoal-800'
                      : 'bg-charcoal-200 text-charcoal-400 cursor-not-allowed'
                  }`}>
                    <MessageCircle className="w-5 h-5" strokeWidth={2} />
                    <span>{inquirable ? 'Inquire on WhatsApp' : 'Item Unavailable'}</span>
                    {inquirable && <ChevronRight className="w-4 h-4 ml-1 opacity-60" strokeWidth={2} />}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="max-w-lg mx-auto px-4 mt-8 text-center">
        <p className="text-charcoal-300 text-xs">Powered by Infini</p>
      </div>
    </div>
  )
}
      <ItemDetailSheet
       item={selectedItem}
       sellerPhone={sellerPhone}
       onWhatsApp={openWhatsApp}
       onClose={() => setSelectedItem(null)}
     />

export default Catalog
