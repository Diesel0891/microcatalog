import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary } from '../lib/cloudinary'
import { suggestProductDetails } from '../lib/ai'
import { compressImage } from '../lib/compressImage.js'
import { logger } from '../lib/logger.js'
import ProductCard from '../components/ProductCard.jsx'
import { Camera, Check, ChevronDown, ChevronUp, Loader2, AlertCircle, Store } from 'lucide-react'
import PublishSuccess from '../components/PublishSuccess.jsx'
import FloatingLabel from '../components/FloatingLabel.jsx'
import SkeletonLoader from '../components/SkeletonLoader.jsx'



const LOGO_URL = 'https://res.cloudinary.com/a3udr8l4/image/upload/w_200,h_200,c_fill,q_auto,f_webp/v1786228862/infini-logo-v2_edqhj9.png'

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


function Upload() {
  const { manageToken } = useParams()
  
  const [items, setItems] = useState([])
  const [totalItemCount, setTotalItemCount] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [sellerPhone, setSellerPhone] = useState('')
  const [shopName, setShopName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [seller, setSeller] = useState(null)
  const sellerUuid = seller?.uuid
  const [loadingSeller, setLoadingSeller] = useState(true)
  const [savedFeedback, setSavedFeedback] = useState(null)
  const [saveStates, setSaveStates] = useState({})
  const saveTimersRef = useRef({})
  const fileInputCounter = useRef(0)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkSize, setBulkSize] = useState('')
  const [showBulkBar, setShowBulkBar] = useState(false)
  const [suggestingIds, setSuggestingIds] = useState(new Set())
  const [aiErrorId, setAiErrorId] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(detectCountry())
  const [localPhone, setLocalPhone] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)

  const [inlineError, setInlineError] = useState(null)
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
          // Parse existing phone into country + local
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
          // Backward compatibility: old URLs used uuid instead of manage_token
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

          const newUuid = crypto.randomUUID()
          const { data: newSeller, error: insertError } = await supabase.from('sellers').insert({
            uuid: newUuid,
            manage_token: manageToken,
            phone: '',
            shop_name: '',
            is_pro: false,
            max_items: 999
          }).select().single()
          
          if (insertError) {
            logger.error('Upload', 'Failed to create seller', { message: insertError.message })
            setInlineError('Unable to connect to the database. Please check your internet connection and try again. If this persists, contact support.')
          } else {
            setSeller(newSeller)
            localStorage.setItem('microcatalog_manage_token', manageToken)
          localStorage.setItem('microcatalog_seller_uuid', newUuid)
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
    async function loadData() {
      if (!sellerUuid) return
      try {
        const { data: itemsData } = await supabase
          .from('catalog_items')
          .select('*')
          .eq('seller_uuid', sellerUuid)
          .order('created_at', { ascending: false })

        if (itemsData) {
          setItems(itemsData.map(item => ({
            id: item.id,
            dbId: item.id,
            imageUrl: item.image_url,
            title: item.title || '',
            price: item.price || '',
            description: item.description || '',
            sizeSpecs: item.size_specs || '',
            extraNotes: item.extra_notes || '',
            stock_status: item.stock_status || 'available',
            published: item.published,
            uploading: false,
            saved: true,
          })))
        }

        const { count } = await supabase
          .from('catalog_items')
          .select('*', { count: 'exact', head: true })
          .eq('seller_uuid', sellerUuid)

        setTotalItemCount(count || 0)
      } catch (err) {
        logger.error('Upload', 'Load data error', { message: err.message })
      }
    }
    loadData()
  }, [sellerUuid])

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const filesToUpload = files

    const newItems = filesToUpload.map((file) => ({
      id: crypto.randomUUID(),
      file,
      imageUrl: URL.createObjectURL(file),
      title: '',
      price: '',
      description: '',
      sizeSpecs: '',
      extraNotes: '',
      published: false,
      uploading: false,
      saved: false,
    }))

    setItems((prev) => [...newItems, ...prev])

    for (const item of newItems) {
      try {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, uploading: true } : i))
        )

        const fileToUpload = await compressImage(item.file)
        const imageUrl = await uploadToCloudinary(fileToUpload)

        const { data, error } = await supabase
          .from('catalog_items')
          .insert({
            seller_uuid: sellerUuid,
            image_url: imageUrl,
            title: '',
            price: '',
            description: '',
            size_specs: '',
            extra_notes: '',
            published: false,
            seller_phone: sellerPhone || null,
          })
          .select()
          .single()

        if (error) throw error

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, dbId: data.id, imageUrl, uploading: false, saved: true }
              : i
          )
        )
        setTotalItemCount(prev => prev + 1)
      } catch (err) {
        logger.error('Upload', 'Image upload failed', { message: err.message })
        const friendlyError = err.message?.includes('401') || err.message?.includes('Unauthorized')
          ? 'Image upload failed: Please check your Cloudinary configuration.'
          : err.message?.includes('network') || err.message?.includes('fetch')
          ? 'Upload failed: Please check your internet connection.'
          : 'Upload failed: ' + err.message
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, uploading: false, error: friendlyError } : i
          )
        )
      }
    }
  }, [sellerUuid, sellerPhone])

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const applyBulk = useCallback(async () => {
    if (selectedIds.size === 0) return

    const updates = {}
    if (bulkPrice.trim()) updates.price = bulkPrice.trim()
    if (bulkSize.trim()) updates.size_specs = bulkSize.trim()

    if (Object.keys(updates).length === 0) return

    setItems((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id)
          ? { ...item, price: updates.price || item.price, sizeSpecs: updates.size_specs || item.sizeSpecs }
          : item
      )
    )

    const dbIds = items.filter(i => selectedIds.has(i.id) && i.dbId).map(i => i.dbId)
    if (dbIds.length > 0) {
      for (const dbId of dbIds) {
        await supabase.from('catalog_items').update(updates).eq('id', dbId)
      }
    }

    setSelectedIds(new Set())
    setBulkPrice('')
    setBulkSize('')
  }, [selectedIds, bulkPrice, bulkSize, items])

  const updateField = useCallback((id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )

    const item = items.find((i) => i.id === id)
    if (!item?.dbId) return

    const dbField = field === 'sizeSpecs' ? 'size_specs' : field === 'extraNotes' ? 'extra_notes' : field

    const key = `${id}:${field}`
    if (saveTimersRef.current[key]) {
      clearTimeout(saveTimersRef.current[key])
    }

    setSaveStates((prev) => ({ ...prev, [id]: { ...prev[id], [field]: 'saving' } }))

    saveTimersRef.current[key] = setTimeout(async () => {
      try {
        const { error } = await supabase.from('catalog_items').update({ [dbField]: value }).eq('id', item.dbId)
        if (error) throw error
        setSaveStates((prev) => ({ ...prev, [id]: { ...prev[id], [field]: 'saved' } }))
        setTimeout(() => {
          setSaveStates((prev) => {
            const next = { ...prev }
            if (next[id]) {
              const { [field]: _, ...rest } = next[id]
              next[id] = rest
              if (Object.keys(next[id]).length === 0) delete next[id]
            }
            return next
          })
        }, 2000)
      } catch (err) {
        logger.error('Upload', 'Autosave failed', { itemId: id, field: dbField, error: err.message })
        setSaveStates((prev) => ({ ...prev, [id]: { ...prev[id], [field]: 'error' } }))
      }
    }, 500)
  }, [items])

  const removeItem = useCallback(async (id) => {
    const item = items.find((i) => i.id === id)
    if (item?.dbId) {
      await supabase.from('catalog_items').delete().eq('id', item.dbId)
      setTotalItemCount(prev => prev - 1)
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [items])

  const handleSuggest = useCallback(async (id) => {
    const item = items.find((i) => i.id === id)
    if (!item?.imageUrl || item.uploading || !item.saved) return

    setAiErrorId(null)
    setSuggestingIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })

    try {
      const { title, description, suggestedPrice } = await suggestProductDetails(item.imageUrl)

      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, title, description, price: suggestedPrice } : i))
      )

      if (item.dbId) {
        await supabase.from('catalog_items').update({
          title,
          description,
          price: suggestedPrice
        }).eq('id', item.dbId)
      }
    } catch (err) {
      logger.error('Upload', 'AI Suggest failed', { message: err.message })
      setAiErrorId(item.id)
    } finally {
      setSuggestingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [items])
  const handleRetry = useCallback(async (id) => {
    const item = items.find((i) => i.id === id)

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, uploading: true, error: null } : i))
    )

    try {
      const fileToUpload = await compressImage(item.file)
      const imageUrl = await uploadToCloudinary(fileToUpload)

      const { data, error } = await supabase
        .from('catalog_items')
        .insert({
          seller_uuid: sellerUuid,
          image_url: imageUrl,
          title: item.title || '',
          price: item.price || '',
          description: item.description || '',
          size_specs: item.sizeSpecs || '',
          extra_notes: item.extraNotes || '',
          published: false,
          seller_phone: sellerPhone || null,
        })
        .select()
        .single()

      if (error) throw error

      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, dbId: data.id, imageUrl, uploading: false, saved: true, error: null }
            : i
        )
      )
      setTotalItemCount(prev => prev + 1)
    } catch (err) {
      logger.error('Upload', 'Retry failed', { message: err.message })
      const friendlyError = err.message?.includes('401') || err.message?.includes('Unauthorized')
        ? 'Retry failed: Please check your Cloudinary configuration.'
        : err.message?.includes('network') || err.message?.includes('fetch')
        ? 'Retry failed: Please check your internet connection.'
        : 'Retry failed: ' + err.message
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, uploading: false, error: friendlyError } : i
        )
      )
    }
  }, [items, sellerUuid, sellerPhone])


  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\s/g, '')
    return cleaned.startsWith('+') && /^\+[0-9]{7,15}$/.test(cleaned)
  }

  const getFullPhone = useCallback(() => {
    const country = COUNTRIES.find(c => c.code === selectedCountry)
    if (!country) return ''
    if (country.code === 'OTHER') {
      const cleaned = localPhone.replace(/\s/g, '')
      return cleaned.startsWith('+') ? cleaned : '+' + cleaned
    }
    let cleaned = localPhone.replace(/\D/g, '')
    if (country.stripLeadingZero && cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1)
    }
    return country.dial + cleaned
  }, [selectedCountry, localPhone])

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
    await supabase.from('sellers').update({ shop_name: trimmed }).eq('uuid', sellerUuid)
    setSavedFeedback('shopName')
    setTimeout(() => setSavedFeedback(null), 2000)
  }, [sellerUuid, shopName])

  const autoSavePhone = useCallback(async () => {
    if (!validateLocalPhone()) return
    const fullPhone = getFullPhone()
    await supabase.from('sellers').update({ phone: fullPhone }).eq('uuid', sellerUuid)
    await supabase.from('catalog_items').update({ seller_phone: fullPhone }).eq('seller_uuid', sellerUuid)
    setSellerPhone(fullPhone)
    setSavedFeedback('phone')
    setTimeout(() => setSavedFeedback(null), 2000)
  }, [sellerUuid, getFullPhone, validateLocalPhone])

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

  const scrollToShopDetails = () => {
    const el = document.getElementById('shop-details')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('ring-2', 'ring-copper-400', 'ring-offset-2')
      setTimeout(() => el.classList.remove('ring-2', 'ring-copper-400', 'ring-offset-2'), 1500)
    }
  }

  const handlePublish = async () => {
    const fullPhone = getFullPhone()
    if (!validatePhone(fullPhone)) {
      setInlineError('Please save a valid WhatsApp number before publishing.')
      setPhoneTouched(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setPublishing(true)
    try {
      const { error } = await supabase
        .from('catalog_items')
        .update({ published: true })
        .eq('seller_uuid', sellerUuid)
        .eq('published', false)

      if (error) throw error
      setPublished(true)
    } catch (err) {
      const friendlyPublishError = err.message?.includes('401') || err.message?.includes('Unauthorized')
        ? 'Publish failed: Database connection issue. Please check your Supabase configuration.'
        : 'Publish failed: ' + err.message
      setInlineError(friendlyPublishError)
    } finally {
      setPublishing(false)
    }
  }
    if (loadingSeller) {
    return <SkeletonLoader variant="upload" />
  }

  if (published) {
    return (
      <PublishSuccess
        catalogUrl={`${window.location.origin}/#/c/${sellerUuid}`}
        onEditCatalog={() => setPublished(false)}
      />
    )
  }
  // v1: No item limits. max_items reserved for v2 monetization.

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-28">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-white/40">
<div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
                     <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shadow-sm bg-charcoal-950 ring-1 ring-white/10">
              <img src={LOGO_URL} alt="Infini" className="w-full h-full object-cover" />
                        </div>
            <div>

              <h1 className="text-lg font-bold text-charcoal-950 leading-tight">Your catalog</h1>
              <p className="text-xs text-charcoal-400">Add products and manage your shop</p>
            </div>
          </div>
          <div className="text-right flex flex-col justify-center">
            <p className="text-xs text-charcoal-500 font-semibold">{totalItemCount} product{totalItemCount !== 1 ? 's' : ''}</p>
            <div className="flex items-center justify-end gap-1.5 text-xs mt-1.5 text-charcoal-400">
              <button
                type="button"
                onClick={scrollToShopDetails}
                className="hover:text-copper-600 transition"
              >
                Edit shop details
              </button>
              <span>·</span>
              <a
                href={`/#/c/${sellerUuid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-copper-600 font-medium hover:text-copper-700 transition inline-flex items-center gap-0.5"
              >
                Preview <span className="text-[10px]">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      {inlineError && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" strokeWidth={2} />
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{inlineError}</p>
              <button
                onClick={() => setInlineError(null)}
                className="text-red-600 text-xs font-medium mt-2 hover:text-red-800 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Seller Info Card */}
                <div id="shop-details" className="bg-white rounded-2xl border border-stone-200 p-3 space-y-3 transition-all duration-300 scroll-mt-20">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-4 h-4 text-copper-500" strokeWidth={2} />
            <h2 className="text-sm font-semibold text-charcoal-700">Your Shop Details</h2>
          </div>

                  <div>
          <FloatingLabel
            label="Shop Name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            onBlur={autoSaveShopName}
            helper="This name appears at the top of your catalog"
          />
                    {savedFeedback === 'shopName' && (
            <p className="text-sage-700 text-xs mt-1.5 flex items-center gap-1">
              <Check className="w-3 h-3" strokeWidth={3} />
              Saved
            </p>
          )}
        </div>

        {/* Logo Upload */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {logoUrl ? (
              <img src={logoUrl} alt="Shop logo" className="w-16 h-16 rounded-xl object-cover border border-stone-200" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-charcoal-950 flex items-center justify-center border border-stone-200">
                <Store className="w-6 h-6 text-copper-400" strokeWidth={1.5} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal-900">{logoUrl ? 'Change logo' : 'Add shop logo'}</p>
              <p className="text-xs text-charcoal-400">Optional — appears on your catalog</p>
            </div>
          </label>
          {savedFeedback === 'logo' && (
            <p className="text-sage-700 text-xs mt-1.5 flex items-center gap-1">
              <Check className="w-3 h-3" strokeWidth={3} />
              Saved
            </p>
          )}
        </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-500 mb-1.5">WhatsApp Number <span className="text-red-500">*</span></label>
            <div className="flex gap-2 overflow-hidden">

              <select
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); setLocalPhone(''); }}
                className="border border-stone-200 rounded-xl px-2 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-copper-400 focus:border-transparent shrink-0 max-w-[40%]"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                placeholder={COUNTRIES.find(c => c.code === selectedCountry)?.placeholder || ''}
                value={localPhone}
                onChange={(e) => { setLocalPhone(e.target.value); setPhoneTouched(true); }}
                onBlur={autoSavePhone}
                className={`flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-copper-400 focus:border-transparent ${
                  phoneTouched && !validateLocalPhone() ? 'border-red-300 bg-red-50' : 'border-stone-200'
                }`}
              />
            </div>
            {phoneTouched && !validateLocalPhone() && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" strokeWidth={2} />
                Please enter a valid number for {COUNTRIES.find(c => c.code === selectedCountry)?.name || 'your country'}
              </p>
            )}
            <p className="text-xs text-charcoal-400 mt-1.5">Customers will message this number on WhatsApp.</p>
          </div>

          {savedFeedback === 'phone' && (
            <p className="text-sage-700 text-xs mt-1.5 flex items-center gap-1">
              <Check className="w-3 h-3" strokeWidth={3} />
              Saved
            </p>
          )}
        </div>

        <label className="block w-full border-2 border-dashed border-copper-300 hover:border-copper-500 hover:bg-copper-50/50 cursor-pointer rounded-xl p-8 text-center transition">
          <Camera className="w-8 h-8 mx-auto mb-3 text-copper-500" strokeWidth={1.5} />
          <p className="font-medium text-sm text-charcoal-900">Add your products</p>
          <p className="text-charcoal-400 text-xs mt-1">Tap to select product photos — you can choose multiple at once</p>
          <input
            key={fileInputCounter.current}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => { handleFileSelect(e); fileInputCounter.current += 1 }}
            className="hidden"
          />
        </label>

        {items.length > 1 && (
          <button
            onClick={() => setShowBulkBar(!showBulkBar)}
            className="flex items-center gap-2 text-sm font-medium text-copper-600 hover:text-copper-700 transition"
          >
            {showBulkBar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showBulkBar ? 'Hide Bulk Apply' : 'Bulk Apply Price & Specs'}
          </button>
        )}

        {showBulkBar && (
          <div className="bg-copper-50 border border-copper-200 rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Price (e.g. MK 15,000)"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="flex-1 min-w-0 border border-copper-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper-400"
              />
              <input
                type="text"
                placeholder="Size / Specs"
                value={bulkSize}
                onChange={(e) => setBulkSize(e.target.value)}
                className="flex-1 min-w-0 border border-copper-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper-400"
              />
            </div>
            <button
              onClick={applyBulk}
              disabled={selectedIds.size === 0 || (!bulkPrice.trim() && !bulkSize.trim())}
              className="w-full bg-copper-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-copper-700 disabled:opacity-50 transition"
            >
              Apply to Selected Items
            </button>
            <p className="text-xs text-copper-600">Tap the checkbox on cards to select them</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              showBulkBar={showBulkBar}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              onRemove={() => removeItem(item.id)}
              onUpdateField={(field, value) => updateField(item.id, field, value)}
              saveStates={saveStates[item.id] || {}}
              onRetry={() => handleRetry(item.id)}
              onSuggest={() => handleSuggest(item.id)}
              isSuggesting={suggestingIds.has(item.id)}
              showAiError={aiErrorId === item.id}
            />
          ))}
        </div>

        {items.length > 0 && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto bg-charcoal-950 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-charcoal-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {publishing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                Publishing...
              </>
            ) : (
              <>
                <Store className="w-5 h-5" strokeWidth={2} />
                Publish Catalog
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default Upload
