import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger.js'
import StockStatusBadge from '../components/StockStatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ItemDetailSheet from '../components/ItemDetailSheet.jsx'
import SkeletonLoader from '../components/SkeletonLoader.jsx'
import FadeImage from '../components/FadeImage.jsx'
import { motion } from 'framer-motion'
import { MessageCircle, Store, Edit3 } from 'lucide-react'

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
      let message
      switch (item.stock_status) {
        case 'reserved':
          message = `Hi, I'm interested in *${item.title}* — ${item.price}. Is there any chance it becomes available?`
          break
        case 'sold':
          message = `Hi, do you have anything similar to *${item.title}*?`
          break
        default:
          message = `Hi, I'm interested in *${item.title}* — ${item.price}.`
      }

      const fullMessage = [
        message,
        ``,
        `📷 Product photo:`,
        `${item.image_url}`
      ].join('\n')

      const encodedMessage = encodeURIComponent(fullMessage)
      const cleanPhone = sellerPhone ? sellerPhone.replace(/\D/g, '') : ''
      const whatsappUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`

      window.open(whatsappUrl, '_blank')
    }

    if (loading) {
    return <SkeletonLoader variant="catalog" count={4} />
  }

  if (error) {
    return <EmptyState title="Something went wrong" description={error} support={error} />
  }

  if (sellerNotFound) {
    return <EmptyState title="Catalog not found" description="This catalog link doesn't exist or has been removed." />
  }

  if (items.length === 0) {
    return <EmptyState title="Catalog is empty" description="No items have been published yet." />
  }

  const displayName = shopName.trim() || 'Catalog' 
  const manageToken = localStorage.getItem('microcatalog_manage_token')

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-white/40">

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
            Tap any item to view details and message on WhatsApp
          </p>
        </div>
      </div>
        {/* Viral Banner */}
        <div className="max-w-lg mx-auto px-4 py-2">
          <a
            href="/#/"
            className="block bg-charcoal-950 text-white rounded-xl p-4 text-center hover:bg-charcoal-800 active:scale-[0.98] transition"
          >
            <p className="text-sm font-medium">
              Love this catalog? <span className="text-copper-400">Create your own — it's free →</span>
            </p>
          </a>
        </div>


              {/* Items Grid */}
        <div className="max-w-lg mx-auto px-4 space-y-4 mt-2">
          {items.map((item, index) => {
            const isSold = item.stock_status === 'sold'

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => setSelectedItem(item)}
                className="w-full bg-white rounded-2xl border border-stone-200 overflow-hidden text-left transition-all duration-200 hover:shadow-lg hover:border-copper-300 active:scale-[0.98]">
                                <div className="relative">
                  <FadeImage
                    src={item.image_url}
                    alt={item.title}
                    className={`w-full h-56 ${isSold ? 'grayscale' : ''}`}
                  />
                  {isSold && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white/80 font-bold text-2xl tracking-widest drop-shadow-lg">SOLD</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <StockStatusBadge status={item.stock_status} size="xs" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-charcoal-950 text-lg leading-tight flex-1">{item.title}</h3>
                    <span className="text-lg font-bold text-copper-600 whitespace-nowrap">{item.price}</span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

      {/* Footer */}
      <div className="max-w-lg mx-auto px-4 mt-8 text-center">
        <p className="text-charcoal-300 text-xs">Powered by Infini</p>
      </div>
      <ItemDetailSheet
        item={selectedItem}
        onWhatsApp={openWhatsApp}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  )
}

export default Catalog
