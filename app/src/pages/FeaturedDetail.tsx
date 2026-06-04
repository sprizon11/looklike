import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { useFeatured } from '@/hooks/use-featured'
import { addToCart } from '@/lib/cart-store'

export default function FeaturedDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { featured } = useFeatured()

  const item = useMemo(() => featured.find((f) => f.id === id), [featured, id])
  const sizes = useMemo(
    () => (item?.fullSize || '').split(',').map((s) => s.trim()).filter(Boolean),
    [item?.fullSize]
  )
  const [selectedSize, setSelectedSize] = useState<string>('')

  if (!item) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-[28px] text-black">Item not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-1 font-body text-[14px] text-black/60 hover:text-black transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Home
        </button>
      </div>
    )
  }

  const activeSize = selectedSize || sizes[0] || 'Free Size'

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 md:px-12 py-6 sm:py-10">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1 font-body text-[13px] uppercase tracking-[0.06em] text-black/50 hover:text-black transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14">
          <div className="bg-[#f7f7f7] overflow-hidden">
            <img src={item.image} alt={item.name} className="w-full aspect-[3/4] object-cover" />
          </div>

          <div className="flex flex-col">
            <h1 className="font-display text-[30px] sm:text-[38px] font-normal leading-[1.15] text-black">
              {item.name}
            </h1>
            <p className="font-body text-[22px] font-medium text-black mt-3">Rs. {item.price}</p>
            <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/50 mt-6">Size</p>
            {sizes.length > 0 ? (
              <div className="mt-2">
                <select
                  value={activeSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="h-[42px] px-3 border border-black/10 font-body text-[13px] text-black/80 focus:outline-none focus:border-black/30"
                >
                  {sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="font-body text-[14px] text-black/70 mt-2">{item.fullSize || 'Free Size'}</p>
            )}

            <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/50 mt-6">Description</p>
            <p className="font-body text-[15px] leading-[1.7] text-[#212121]/80 mt-2">{item.description}</p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  addToCart({
                    productId: `featured-${item.id}`,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    size: activeSize,
                    color: 'Default',
                    quantity: 1,
                    weightKg: 0.5,
                  })
                  navigate('/cart')
                }}
                className="h-[48px] px-8 bg-black text-gold-light font-body text-[13px] font-medium uppercase tracking-[0.06em] border border-gold/40 transition-all hover:bg-gold-gradient hover:text-black hover:border-transparent"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

