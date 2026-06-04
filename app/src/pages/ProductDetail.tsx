import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ChevronLeft, Check, ShoppingBag } from 'lucide-react'
import { useProducts } from '@/hooks/use-products'
import { addToCart } from '@/lib/cart-store'
import { buildWhatsAppUrl } from '@/lib/shop-contact'
import { normalizeProductColors, type ProductColor } from '@/lib/product-colors'

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products } = useProducts()

  const product = useMemo(() => products.find((p) => p.id === id), [products, id])

  const colors = useMemo(
    () => (product ? normalizeProductColors(product.colors, product.image) : []),
    [product]
  )

  const [selectedColorId, setSelectedColorId] = useState('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (colors.length > 0) setSelectedColorId(colors[0].id)
  }, [product?.id, colors])

  const selectedColor: ProductColor | undefined = useMemo(
    () => colors.find((c) => c.id === selectedColorId) ?? colors[0],
    [colors, selectedColorId]
  )

  const sizes = useMemo(() => {
    const raw = product?.size?.trim()
    if (!raw) return DEFAULT_SIZES
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }, [product])

  const activeImage = selectedColor?.image || product?.image || ''

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-[28px] text-black">Product not found</p>
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

  const handleAddToCart = () => {
    const size = selectedSize || sizes[0]
    const colorName = selectedColor?.name || ''
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: activeImage,
      size,
      color: colorName,
      quantity,
      weightKg: product.weightKg ?? 0.5,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2200)
  }

  const handleWhatsAppOrder = () => {
    const size = selectedSize || sizes[0]
    const colorName = selectedColor?.name || ''
    const colorLine = colorName ? `\nColour: ${colorName}` : ''
    const message = `Hi! I'd like to order:\n${product.name}${colorLine}\nSize: ${size}\nQty: ${quantity}\nPrice: Rs. ${product.price}`
    window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer')
  }

  const showColorPicker = colors.length > 1 || (colors[0] && colors[0].name !== 'Default')

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
            <img
              src={activeImage}
              alt={`${product.name} — ${selectedColor?.name || ''}`}
              className="w-full aspect-[3/4] object-cover"
            />
          </div>

          <div className="flex flex-col">
            <span className="font-body text-[12px] uppercase tracking-[0.12em] text-black/40">
              {product.category}
            </span>
            <h1 className="font-display text-[30px] sm:text-[38px] font-normal leading-[1.15] text-black mt-2">
              {product.name}
            </h1>
            <p className="font-body text-[22px] font-medium text-black mt-3">
              Rs. {product.price}
            </p>

            {product.description && (
              <p className="font-body text-[15px] leading-[1.7] text-[#212121]/80 mt-5">
                {product.description}
              </p>
            )}

            {showColorPicker && (
              <div className="mt-8">
                <p className="font-body text-[14px] text-black">
                  Colour: <span className="font-medium">{selectedColor?.name}</span>
                </p>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {colors.map((c) => {
                    const active = selectedColor?.id === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColorId(c.id)}
                        className={`shrink-0 w-[108px] text-left border-2 transition-colors ${
                          active ? 'border-[#1a73e8]' : 'border-black/10 hover:border-black/25'
                        }`}
                      >
                        <div className="aspect-[3/4] bg-[#f5f5f5] overflow-hidden">
                          <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-2 border-t border-black/[0.06]">
                          <p className="font-body text-[12px] font-medium text-black truncate">{c.name}</p>
                          <p className="font-body text-[12px] text-black mt-0.5">Rs. {product.price}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-8">
              <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/50">
                Select Size
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {sizes.map((size) => {
                  const active = (selectedSize || sizes[0]) === size
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] h-[42px] px-4 border font-body text-[13px] transition-colors ${
                        active
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black/15 hover:border-black/40'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-7">
              <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/50">
                Quantity
              </p>
              <div className="flex items-center mt-3 border border-black/15 w-fit">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 font-body text-[18px] text-black/60 hover:text-black transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-12 text-center font-body text-[14px] text-black">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 font-body text-[18px] text-black/60 hover:text-black transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className="inline-flex items-center justify-center gap-2 h-[52px] px-8 bg-black text-white font-body text-[14px] font-medium uppercase tracking-[0.06em] hover:bg-black/90 transition-colors"
              >
                {added ? (
                  <>
                    <Check size={18} />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} strokeWidth={1.5} />
                    Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={handleWhatsAppOrder}
                className="inline-flex items-center justify-center h-[52px] px-8 border border-black text-black font-body text-[14px] font-medium uppercase tracking-[0.06em] hover:bg-black hover:text-white transition-colors"
              >
                Order on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
