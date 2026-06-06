import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ChevronLeft, Check, ShoppingBag } from 'lucide-react'
import { useFeatured } from '@/hooks/use-featured'
import { getFeaturedColorOptions } from '@/lib/featured-store'
import { cartImageRef } from '@/lib/cart-image'
import { addToCart } from '@/lib/cart-store'
import {
  colorImages,
  primaryColorImage,
  type ProductColor,
} from '@/lib/product-colors'
import {
  colorStockHint,
  colorUnavailableMessage,
  isColorAvailable,
  isSizeAvailableForColor,
  sizeStockHintForColor,
} from '@/lib/color-stock'
import { maxQtyForColorAndSize } from '@/lib/color-size-stock'
import OrderDisclaimer from '@/components/OrderDisclaimer'
import ProductImageCarousel from '@/components/ProductImageCarousel'
import { SWATCH_IMAGE_W, withImageWidth } from '@/lib/image-url'
import { scrollPageToTop, scrollPageToTopAfterPaint } from '@/lib/scroll-page-top'

const MAX_QTY = 10

export default function FeaturedDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { featured } = useFeatured()

  const item = useMemo(() => featured.find((f) => f.id === id), [featured, id])

  useEffect(() => {
    scrollPageToTop()
    return scrollPageToTopAfterPaint()
  }, [id])

  useEffect(() => {
    if (!item) return
    return scrollPageToTopAfterPaint()
  }, [item?.id])
  const colors = useMemo(() => (item ? getFeaturedColorOptions(item) : []), [item])
  const sizes = useMemo(
    () => (item?.fullSize || '').split(',').map((s) => s.trim()).filter(Boolean),
    [item?.fullSize]
  )

  const [selectedColorId, setSelectedColorId] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [pickError, setPickError] = useState('')

  const selectedColor: ProductColor | undefined = useMemo(
    () => colors.find((c) => c.id === selectedColorId) ?? colors[0],
    [colors, selectedColorId]
  )

  const activeSize = selectedSize || sizes[0] || 'Free Size'

  const maxQtyForColor = useMemo(() => {
    const colorCap = maxQtyForColorAndSize(selectedColor, activeSize, MAX_QTY)
    return Math.min(MAX_QTY, colorCap)
  }, [selectedColor, activeSize])

  useEffect(() => {
    if (colors.length === 0) return
    const first = colors.find((c) => isColorAvailable(c)) ?? colors[0]
    setSelectedColorId(first.id)
  }, [item?.id, colors])

  useEffect(() => {
    if (sizes.length === 0) return
    setSelectedSize(sizes[0])
  }, [item?.id, sizes])

  useEffect(() => {
    if (maxQtyForColor > 0) setQuantity((q) => Math.min(Math.max(1, q), maxQtyForColor))
  }, [selectedColorId, selectedSize, maxQtyForColor])

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

  const galleryImages = selectedColor
    ? colorImages(selectedColor)
    : item.image
      ? [item.image]
      : []

  const showColorPicker =
    colors.length > 1 || (colors[0] && colors[0].name !== 'Default')

  const pickColor = (c: ProductColor) => {
    if (!isColorAvailable(c, activeSize)) {
      setPickError(colorUnavailableMessage(c, activeSize))
      return
    }
    setSelectedColorId(c.id)
    setPickError('')
    const cap = maxQtyForColorAndSize(c, activeSize, MAX_QTY)
    if (cap > 0) setQuantity((q) => Math.min(Math.max(1, q), cap))
  }

  const pickSize = (size: string) => {
    if (selectedColor && !isColorAvailable(selectedColor, size)) {
      setPickError(colorUnavailableMessage(selectedColor, size))
      return
    }
    setSelectedSize(size)
    setPickError('')
    const cap = maxQtyForColorAndSize(selectedColor, size, MAX_QTY)
    if (cap > 0) setQuantity((q) => Math.min(Math.max(1, q), cap))
  }

  const addCurrentToCart = (): boolean => {
    if (selectedColor && !isColorAvailable(selectedColor, activeSize)) {
      setPickError(colorUnavailableMessage(selectedColor, activeSize))
      return false
    }
    const cap = maxQtyForColorAndSize(selectedColor, activeSize, MAX_QTY)
    if (quantity > cap) {
      setPickError(
        cap > 0
          ? `Only ${cap} available in ${selectedColor?.name || 'this colour'} size ${activeSize}.`
          : `Size ${activeSize} is out of stock for ${selectedColor?.name || 'this colour'}.`
      )
      return false
    }

    const cartImage =
      cartImageRef(galleryImages[0] || '') ||
      cartImageRef(selectedColor ? primaryColorImage(selectedColor) : '') ||
      cartImageRef(item.image)

    addToCart({
      productId: `featured-${item.id}`,
      name: item.name,
      price: item.price,
      image: cartImage,
      size: activeSize,
      color: selectedColor?.name || 'Default',
      quantity,
      weightKg: 0.5,
    })
    setPickError('')
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2200)
    return true
  }

  const handleAddToCart = () => {
    addCurrentToCart()
  }

  const handleBuyNow = () => {
    const ok = addCurrentToCart()
    if (!ok) return
    navigate('/cart')
  }

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
          {galleryImages.length > 0 ? (
            <ProductImageCarousel images={galleryImages} alt={item.name} />
          ) : (
            <div className="bg-[#f7f7f7] overflow-hidden">
              <div className="w-full aspect-[3/4] bg-black/[0.04]" />
            </div>
          )}

          <div className="flex flex-col">
            <h1 className="font-display text-[30px] sm:text-[38px] font-normal leading-[1.15] text-black">
              {item.name}
            </h1>
            <p className="font-body text-[22px] font-semibold text-gold-dark mt-3">
              Rs. {item.price}
            </p>

            {showColorPicker && (
              <div className="mt-8">
                <p className="font-body text-[14px] text-black">
                  Colour: <span className="font-medium">{selectedColor?.name}</span>
                </p>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {colors.map((c) => {
                    const active = selectedColor?.id === c.id
                    const available = isColorAvailable(c, activeSize)
                    const hint = colorStockHint(c, activeSize)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickColor(c)}
                        className={`shrink-0 w-[108px] text-left border-2 transition-colors ${
                          !available
                            ? 'border-black/10 opacity-55 cursor-not-allowed'
                            : active
                              ? 'border-gold'
                              : 'border-black/10 hover:border-gold/40'
                        }`}
                      >
                        <div className="aspect-[3/4] bg-[#f5f5f5] overflow-hidden">
                          <img
                            src={withImageWidth(primaryColorImage(c), SWATCH_IMAGE_W)}
                            alt={c.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 border-t border-black/[0.06]">
                          <p className="font-body text-[12px] font-medium text-black truncate">{c.name}</p>
                          <p className="font-body text-[12px] font-medium text-gold-dark mt-0.5">
                            Rs. {item.price}
                          </p>
                          {hint ? (
                            <p
                              className={`font-body text-[10px] mt-0.5 ${
                                !available ? 'text-red-600 font-medium' : 'text-black/45'
                              }`}
                            >
                              {hint}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mt-8">
                <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/50">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {sizes.map((s) => {
                    const active = activeSize === s
                    const sizeRow = { size: s, qty: 0, outOfStock: false }
                    const available = isSizeAvailableForColor(selectedColor, sizeRow, false)
                    const hint = sizeStockHintForColor(selectedColor, sizeRow, false)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => pickSize(s)}
                        className={`min-w-[56px] px-3 py-2 border font-body text-[13px] transition-colors flex flex-col items-center ${
                          !available
                            ? 'bg-black/[0.04] text-black/35 border-black/10 cursor-not-allowed'
                            : active
                              ? 'bg-black text-gold-light border-black'
                              : 'bg-white text-black border-black/15 hover:border-gold'
                        }`}
                      >
                        <span>{s}</span>
                        {hint ? (
                          <span
                            className={`text-[10px] mt-0.5 ${
                              !available
                                ? 'text-red-600 font-medium'
                                : active
                                  ? 'text-gold-light/90'
                                  : 'text-black/45'
                            }`}
                          >
                            {hint}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
                <p className="font-body text-[11px] text-black/45 mt-2">
                  Check the size chart / size guide before you order.
                </p>
              </div>
            )}

            <div className="mt-7">
              <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/50">
                Quantity
                {maxQtyForColor > 0 ? (
                  <span className="text-black/40 normal-case"> (max {maxQtyForColor})</span>
                ) : null}
              </p>
              <div className="flex items-center mt-3 border border-black/15 w-fit">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={maxQtyForColor === 0}
                  className="w-10 h-10 font-body text-[18px] text-black/60 hover:text-black transition-colors disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-12 text-center font-body text-[14px] text-black">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQtyForColor, q + 1))}
                  disabled={maxQtyForColor === 0 || quantity >= maxQtyForColor}
                  className="w-10 h-10 font-body text-[18px] text-black/60 hover:text-black transition-colors disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {item.description && (
              <p className="font-body text-[15px] leading-[1.7] text-[#212121]/80 mt-8">
                {item.description}
              </p>
            )}

            {pickError && <p className="mt-4 font-body text-[13px] text-red-600">{pickError}</p>}

            <OrderDisclaimer className="mt-6" compact />

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={maxQtyForColor === 0}
                className="inline-flex items-center justify-center gap-2 h-[52px] px-8 bg-black text-gold-light font-body text-[14px] font-medium uppercase tracking-[0.06em] border border-gold/40 transition-all hover:bg-gold-gradient hover:text-black hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
                type="button"
                onClick={handleBuyNow}
                disabled={maxQtyForColor === 0}
                className="inline-flex items-center justify-center h-[52px] px-8 border border-black text-black font-body text-[14px] font-medium uppercase tracking-[0.06em] transition-colors hover:bg-black hover:text-gold-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
