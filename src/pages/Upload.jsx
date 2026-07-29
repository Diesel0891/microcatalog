import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary } from '../lib/cloudinary'
import { suggestProductDetails } from '../lib/ai'
import { logger } from '../lib/logger.js'
import ProductCard from '../components/ProductCard.jsx'
import { Upload as UploadIcon, Check, ChevronDown, ChevronUp, Loader2, Sparkles, AlertCircle, Store } from 'lucide-react'
import PublishSuccess from '../components/PublishSuccess.jsx'

const LOGO_URL = 'https://res.cloudinary.com/a3udr8l4/image/upload/w_200,h_200,c_fill,q_auto,f_webp/infini-logo_frripe.png?v=2'
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
  const { sellerUuid } = useParams()
  
  const [items, setItems] = useState([])
  const [totalItemCount, setTotalItemCount] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [sellerPhone, setSellerPhone] = useState('')
  const [shopName, setShopName] = useState('')
  const [phoneSaved, setPhoneSaved] = useState(false)
  const [seller, setSeller] = useState(null)
  const [loadingSeller, setLoadingSeller] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
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

  useEffect(() => {
    async function loadSeller() {
      try {
        const { data } = await supabase.from('sellers').select('*').eq('uuid', sellerUuid).single()
        
        if (data) {
          setSeller(data)
          setShopName(data.shop_name || '')
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
          const { data: newSeller, error: insertError } = await supabase.from('sellers').insert({
            uuid: sellerUuid,
            phone: '',
            shop_name: '',
            is_pro: false,
            max_items: 999
          }).select().single()
          
          if (insertError) {
            logger.error('Upload', 'Failed to create seller', { message: insertError.message })
            alert('Unable to connect to the database. Please check your internet connection and try again. If this persists, contact support.')
          } else {
            setSeller(newSeller)
          }
        }
      } catch (err) {
        logger.error('Upload', 'Load seller error', { message: err.message })
      } finally {
        setLoadingSeller(false)
      }
    }
    loadSeller()
  }, [sellerUuid])

  useEffect(() => {
    async function loadData() {
      try {
        const { data: itemsData } = await supabase
          .from('catalog_items')
          .select('*')
          .eq('seller_uuid', sellerUuid)
          .eq('published', false)
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

    const maxItems = seller?.max_items || 999
    const remaining = maxItems - totalItemCount

    if (remaining <= 0) {
      alert(`You've reached your limit of ${seller.max_items || 999} items. Upgrade to add more.`)
      return
    }

    const filesToUpload = files.slice(0, remaining)
    if (filesToUpload.length === 0) {
      alert(`You can only upload ${remaining} more item(s).`)
      return
    }

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

        const imageUrl = await uploadToCloudinary(item.file)

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
  }, [sellerUuid, sellerPhone, totalItemCount, seller])

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

  const updateField = useCallback(async (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )

    const item = items.find((i) => i.id === id)
    if (item?.dbId) {
      const dbField = field === 'sizeSpecs' ? 'size_specs' : field === 'extraNotes' ? 'extra_notes' : field
      await supabase.from('catalog_items').update({ [dbField]: value }).eq('id', item.dbId)
    }
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

  const validateLocalPhone = () => {
    const country = COUNTRIES.find(c => c.code === selectedCountry)
    if (!country) return false
    let cleaned = localPhone.replace(/\D/g, '')
    if (country.stripLeadingZero && cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1)
    }
    return cleaned.length === country.digits
  }

  const canSave = validateLocalPhone()

  const saveSellerInfo = useCallback(async () => {
    if (!canSave) return
    
    await supabase.from('sellers').update({ 
      phone: getFullPhone(),
      shop_name: shopName.trim()
    }).eq('uuid', sellerUuid)
    
    await supabase
      .from('catalog_items')
      .update({ seller_phone: getFullPhone() })
      .eq('seller_uuid', sellerUuid)

    setSellerPhone(getFullPhone())
    setPhoneSaved(true)
    setHasUnsavedChanges(false)
  }, [sellerUuid, getFullPhone, shopName, canSave])

  const handlePublish = async () => {
    const fullPhone = getFullPhone()
    if (!validatePhone(fullPhone)) {
      alert('Please save a valid WhatsApp number before publishing.')
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
      alert(friendlyPublishError)
    } finally {
      setPublishing(false)
    }
  }

  if (loadingSeller) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-copper-500 animate-spin" strokeWidth={2} />
      </div>
    )
  }

  if (published) {
    return (
      <PublishSuccess
        catalogUrl={`${window.location.origin}/#/c/${sellerUuid}`}
        onEditCatalog={() => setPublished(false)}
      />
    )
  }
  const maxItems = seller?.max_items || 999
  const remainingSlots = maxItems - totalItemCount
  const isAtLimit = remainingSlots <= 0

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-28">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
              <img src={LOGO_URL} alt="Infini" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-charcoal-950 leading-tight">Upload</h1>
              <p className="text-xs text-charcoal-400">Manage your products</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-charcoal-400">{totalItemCount} / {maxItems} items</p>
            {!seller?.is_pro && (
              <p className="text-xs text-copper-600 font-medium">{remainingSlots} remaining</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {!seller?.is_pro && remainingSlots <= 3 && (
          <div className="bg-copper-50 border border-copper-200 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-copper-600 shrink-0 mt-0.5" strokeWidth={2} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-copper-800">
                {isAtLimit ? 'Item limit reached' : `${remainingSlots} slots left`}
              </p>
              <p className="text-xs text-copper-600 mt-0.5">
                Upgrade to unlimited items. Contact us on WhatsApp.
              </p>
            </div>
          </div>
        )}

        {/* Seller Info Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-4 h-4 text-copper-500" strokeWidth={2} />
            <h2 className="text-sm font-semibold text-charcoal-700">Your Shop Details</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-500 mb-1.5">Shop Name <span className="text-charcoal-300 font-normal">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Africa Trading"
              value={shopName}
              onChange={(e) => { setShopName(e.target.value); setHasUnsavedChanges(true); setPhoneSaved(false); }}
              className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-copper-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-500 mb-1.5">WhatsApp Number <span className="text-red-500">*</span></label>
            <div className="flex gap-2 overflow-hidden">
              <select
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); setLocalPhone(''); setHasUnsavedChanges(true); setPhoneSaved(false); }}
                className="border border-stone-200 rounded-lg px-2 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-copper-400 focus:border-transparent shrink-0 max-w-[40%]"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                placeholder={COUNTRIES.find(c => c.code === selectedCountry)?.placeholder || ''}
                value={localPhone}
                onChange={(e) => { setLocalPhone(e.target.value); setPhoneTouched(true); setHasUnsavedChanges(true); setPhoneSaved(false); }}
                className={`flex-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-copper-400 focus:border-transparent ${
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

          <button
            onClick={saveSellerInfo}
            disabled={!canSave}
            className="w-full bg-charcoal-950 text-white py-3 rounded-xl font-medium hover:bg-charcoal-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {phoneSaved && !hasUnsavedChanges ? (
              <>
                <Check className="w-4 h-4" strokeWidth={3} />
                Shop Details Saved
              </>
            ) : (
              'Save Shop Details'
            )}
          </button>
        </div>

        <label className={`block w-full border-2 border-dashed rounded-xl p-8 text-center transition ${
          isAtLimit 
            ? 'border-stone-300 bg-stone-50 opacity-50 cursor-not-allowed' 
            : 'border-copper-300 hover:border-copper-500 hover:bg-copper-50/50 cursor-pointer'
        }`}>
          <UploadIcon className={`w-8 h-8 mx-auto mb-3 ${isAtLimit ? 'text-stone-400' : 'text-copper-500'}`} strokeWidth={1.5} />
          <p className={`font-medium text-sm ${isAtLimit ? 'text-stone-500' : 'text-charcoal-900'}`}>
            {isAtLimit ? 'Item limit reached' : 'Tap to upload photos'}
          </p>
          <p className="text-charcoal-400 text-xs mt-1">
            {isAtLimit ? 'Upgrade for unlimited items' : `Up to ${remainingSlots} more images`}
          </p>
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
