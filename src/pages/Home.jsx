import { Link } from 'react-router-dom'
import { Eye, ArrowRight } from 'lucide-react'

const LOGO_URL = 'https://res.cloudinary.com/a3udr8l4/image/upload/w_200,h_200,c_fill,q_auto,f_webp/infini-logo_frripe.png?v=2'

function Home() {
  const testSellerUuid = 'x7k2m9p4qz'

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6">
      {/* Brand Mark */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-2xl mx-auto mb-5 overflow-hidden shadow-lg">
          <img 
            src={LOGO_URL} 
            alt="Infini" 
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-charcoal-500 text-sm font-medium">WhatsApp-integrated catalog platform</p>
      </div>

      {/* Action Cards */}
      <div className="w-full max-w-sm space-y-3">
        <Link
          to={`/u/${testSellerUuid}`}
          className="group flex items-center gap-4 bg-white border border-stone-200 rounded-xl p-4 hover:border-copper-400 hover:shadow-md transition-all duration-200"
        >
          <div className="w-11 h-11 bg-copper-50 rounded-lg flex items-center justify-center shrink-0">
            <img 
              src={LOGO_URL} 
              alt="Infini" 
              className="w-6 h-6 object-cover rounded"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-charcoal-900 font-semibold text-sm">Seller Upload</h2>
            <p className="text-charcoal-400 text-xs mt-0.5">Manage your product catalog</p>
          </div>
          <ArrowRight className="w-4 h-4 text-charcoal-300 group-hover:text-copper-500 transition-colors" strokeWidth={2} />
        </Link>

        <Link
          to={`/c/${testSellerUuid}`}
          className="group flex items-center gap-4 bg-white border border-stone-200 rounded-xl p-4 hover:border-copper-400 hover:shadow-md transition-all duration-200"
        >
          <div className="w-11 h-11 bg-sage-50 rounded-lg flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5 text-sage-600" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-charcoal-900 font-semibold text-sm">Public Catalog</h2>
            <p className="text-charcoal-400 text-xs mt-0.5">Preview customer view</p>
          </div>
          <ArrowRight className="w-4 h-4 text-charcoal-300 group-hover:text-copper-500 transition-colors" strokeWidth={2} />
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-charcoal-300 text-xs">Powered by Infini</p>
      </div>
    </div>
  )
}

export default Home
