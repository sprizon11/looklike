import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ChevronLeft, Check, ShoppingBag } from 'lucide-react'
import { useProducts } from '@/hooks/use-products'
import { cartImageRef } from '@/lib/cart-image'
import { addToCart, CartStorageError } from '@/lib/cart-store'
import {
  colorImages,
  getCustomerColorOptions,
  isLeggingsCatalogProduct,
  primaryColorImage,
  productGalleryImages,
  type ProductColor,
} from '@/lib/product-colors'
import {
  colorStockHint,
  colorUnavailableMessage,
  isColorAvailable,
} from '@/lib/color-stock'
import {
  getProductSizeStock,
  hasExplicitSizeStock,
  isSizeAvailable,
  maxQuantityForSize,
  sizeStockHint,
  type SizeStock,
} from '@/lib/product-sizes'
import KurtiDetailsList from '@/components/KurtiDetailsList'
import OrderDisclaimer from '@/components/OrderDisclaimer'
import { hasKurtiDetails, isKurtiCategory, normalizeKurtiDetails } from '@/lib/kurti-details'
import ProductImageCarousel from '@/components/ProductImageCarousel'
import LeggingsColorStrip from '@/components/LeggingsColorStrip'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products } = useProducts()

  const product = useMemo(() => products.find((p) => p.id === id), [products, id])

  const isLeggings = product ? isLeggingsCatalogProduct(product) : false

  const colors = useMemo(
    () => (product ? getCustomerColorOptions(product) : []),
    [product]
  )

  const trackSizeQty = product ? hasExplicitSizeStock(product) : false

  const sizeRows = useMemo(
    () => (product ? getProductSizeStock(product) : []),
    [product]
  )

  const [selectedColorId, setSelectedColorId] = useState('')
  const [pieceColors, setPieceColors] = useState<string[]>([''])
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [pickError, setPickError] = useState('')

  const defaultColorName = colors[0]?.name || ''

  const selectedSizeRow: SizeStock | undefined = useMemo(
    () =>
      sizeRows.find((r) => r.size === selectedSize) ??
      sizeRows.find((r) => isSizeAvailable(r, trackSizeQty)),
    [sizeRows, selectedSize, trackSizeQty]
  )

  const maxQtyForSize = maxQuantityForSize(
    selectedSizeRow,
    trackSizeQty,
    product?.stock && product.stock > 0 ? product.stock : 99
  )

  useEffect(() => {
    if (colors.length === 0) return
    const first = colors.find((c) => isColorAvailable(c)) ?? colors[0]
    setSelectedColorId(first.id)
  }, [product?.id, colors])

  const firstAvailableColorName = useMemo(
    () => colors.find((c) => isColorAvailable(c))?.name || defaultColorName,
    [colors, defaultColorName]
  )

  useEffect(() => {
    if (!firstAvailableColorName) return
    setPieceColors((prev) => {
      const next = [...prev]
      while (next.length < quantity) next.push(firstAvailableColorName)
      while (next.length > quantity) next.pop()
      return next.map((c) => {
        const row = colors.find((x) => x.name === c)
        if (row && isColorAvailable(row)) return c
        return firstAvailableColorName
      })
    })
  }, [quantity, firstAvailableColorName, colors])

  useEffect(() => {
    if (sizeRows.length === 0) return
    const firstAvailable = sizeRows.find((r) => isSizeAvailable(r, trackSizeQty))
    const pick = firstAvailable?.size || sizeRows[0].size
    setSelectedSize(pick)
  }, [product?.id, sizeRows, trackSizeQty])

  const selectedColor: ProductColor | undefined = useMemo(
    () => colors.find((c) => c.id === selectedColorId) ?? colors[0],
    [colors, selectedColorId]
  )

  const maxQtyForColor = useMemo(() => {
    let cap = maxQtyForSize
    if (
      selectedColor?.stock !== undefined &&
      selectedColor.stock > 0 &&
      !isLeggings
    ) {
      cap = Math.min(cap, selectedColor.stock)
    }
    return cap
  }, [maxQtyForSize, selectedColor?.stock, isLeggings])

  useEffect(() => {
    const cap = maxQtyForColor
    if (cap > 0) setQuantity((q) => Math.min(Math.max(1, q), cap))
  }, [selectedSize, maxQtyForColor, selectedColor?.id])

  const galleryImages = useMemo(() => {
    if (!product) return []
    if (isLeggings) {
      const activeName = pieceColors[0] || ''
      const row = activeName ? colors.find((c) => c.name === activeName) : undefined
      if (row && colorImages(row).length > 0) return colorImages(row)
      return productGalleryImages(product)
    }
    return selectedColor ? colorImages(selectedColor) : productGalleryImages(product)
  }, [isLeggings, selectedColor, product, colors, pieceColors])

  const activeImage = galleryImages[0] || product?.image || ''

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

  const pickSize = (row: SizeStock) => {
    if (!isSizeAvailable(row, trackSizeQty)) {
      setPickError(`Size ${row.size} is out of stock.`)
      return
    }
    setSelectedSize(row.size)
    setPickError('')
    const cap = maxQuantityForSize(
      row,
      trackSizeQty,
      product.stock && product.stock > 0 ? product.stock : 99
    )
    setQuantity((q) => Math.min(Math.max(1, q), cap))
  }

  const validateColors = (): boolean => {
    if (isLeggings) {
      for (let i = 0; i < quantity; i++) {
        const name = pieceColors[i]
        const row = colors.find((c) => c.name === name)
        if (!name?.trim()) {
          setPickError(`Please choose a colour for legging ${i + 1}.`)
          return false
        }
        if (row && !isColorAvailable(row)) {
          setPickError(colorUnavailableMessage(row))
          return false
        }
      }
      return true
    }
    if (selectedColor && !isColorAvailable(selectedColor)) {
      setPickError(colorUnavailableMessage(selectedColor))
      return false
    }
    return true
  }

  const pickDressColor = (c: ProductColor) => {
    if (!isColorAvailable(c)) {
      setPickError(colorUnavailableMessage(c))
      return
    }
    setSelectedColorId(c.id)
    setPickError('')
  }

  const pickLeggingColor = (index: number, name: string) => {
    const row = colors.find((c) => c.name === name)
    if (row && !isColorAvailable(row)) {
      setPickError(colorUnavailableMessage(row))
      return
    }
    setPieceColors((prev) => {
      const next = [...prev]
      next[index] = name
      return next
    })
    setPickError('')
  }

  const validateBeforeOrder = (): boolean => {
    if (!validateColors()) return false
    const row = sizeRows.find((r) => r.size === selectedSize)
    if (!row) {
      setPickError('Please select a size.')
      return false
    }
    if (!isSizeAvailable(row, trackSizeQty)) {
      setPickError(`Size ${row.size} is out of stock.`)
      return false
    }
    if (trackSizeQty && quantity > row.qty) {
      setPickError(`Only ${row.qty} available in size ${row.size}.`)
      return false
    }
    if (!isLeggings && selectedColor?.stock !== undefined && quantity > selectedColor.stock) {
      setPickError(`Only ${selectedColor.stock} available in ${selectedColor.name}.`)
      return false
    }
    return true
  }

  const addCurrentToCart = (): boolean => {
    if (!validateBeforeOrder()) return false
    const size = selectedSize
    setPickError('')

    if (!validateColors()) return false

    const cartImage =
      cartImageRef(activeImage) ||
      cartImageRef(selectedColor ? primaryColorImage(selectedColor) : '') ||
      cartImageRef(product.image)

    try {
      if (isLeggings) {
        for (let i = 0; i < quantity; i++) {
          const pieceRow = colors.find((c) => c.name === pieceColors[i])
          const pieceImage =
            cartImageRef(pieceRow ? primaryColorImage(pieceRow) : '') ||
            cartImage ||
            cartImageRef(product.image)
          addToCart({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: pieceImage,
            size,
            color: pieceColors[i],
            quantity: 1,
            weightKg: product.weightKg ?? 0.5,
          })
        }
      } else {
        const colorName = selectedColor?.name || ''
        addToCart({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: cartImage,
          size,
          color: colorName,
          quantity,
          weightKg: product.weightKg ?? 0.5,
        })
      }
    } catch (e) {
      if (e instanceof CartStorageError) {
        setPickError(e.message)
        return false
      }
      throw e
    }

    setAdded(true)
    window.setTimeout(() => setAdded(false), 2200)
    return true
  }

  const handleAddToCart = () => {
    void addCurrentToCart()
  }

  const handleBuyNow = () => {
    const ok = addCurrentToCart()
    if (!ok) return
    navigate('/cart')
  }

  const showDressColorPicker =
    !isLeggings && (colors.length > 1 || (colors[0] && colors[0].name !== 'Default'))

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
          <ProductImageCarousel images={galleryImages} alt={product.name} />

          <div className="flex flex-col">
            <span className="font-body text-[12px] uppercase tracking-[0.12em] text-black/40">
              {product.category}
            </span>
            <h1 className="font-display text-[30px] sm:text-[38px] font-normal leading-[1.15] text-black mt-2">
              {product.name}
            </h1>
            <p className="font-body text-[22px] font-semibold text-gold-dark mt-3">
              Rs. {product.price}
            </p>

            {showDressColorPicker && (
              <div className="mt-8">
                <p className="font-body text-[14px] text-black">
                  Colour: <span className="font-medium">{selectedColor?.name}</span>
                </p>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {colors.map((c) => {
                    const active = selectedColor?.id === c.id
                    const available = isColorAvailable(c)
                    const hint = colorStockHint(c)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickDressColor(c)}
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
                            src={primaryColorImage(c)}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 border-t border-black/[0.06]">
                          <p className="font-body text-[12px] font-medium text-black truncate">{c.name}</p>
                          <p className="font-body text-[12px] font-medium text-gold-dark mt-0.5">
                            Rs. {product.price}
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

            {isLeggings && colors.length > 0 && (
              <div className="mt-8">
                <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/50">
                  Choose colour — scroll sideways →
                </p>
                <div className="mt-3">
                  <LeggingsColorStrip
                    colors={colors}
                    selectedName={pieceColors[0] || ''}
                    onSelect={(name) => pickLeggingColor(0, name)}
                    onUnavailable={(c) => setPickError(colorUnavailableMessage(c))}
                    label={
                      pieceColors[0]
                        ? `Selected colour: ${pieceColors[0]}`
                        : 'Tap a colour swatch below'
                    }
                    shape="circle"
                  />
                </div>
              </div>
            )}

            <div className="mt-8">
              <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/50">
                Select Size
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {sizeRows.map((row) => {
                  const available = isSizeAvailable(row, trackSizeQty)
                  const hint = sizeStockHint(row, trackSizeQty)
                  const active = selectedSize === row.size
                  return (
                    <button
                      key={row.size}
                      type="button"
                      onClick={() => pickSize(row)}
                      className={`min-w-[56px] px-3 py-2 border font-body text-[13px] transition-colors flex flex-col items-center ${
                        !available
                          ? 'bg-black/[0.04] text-black/35 border-black/10 cursor-not-allowed'
                          : active
                            ? 'bg-black text-gold-light border-black'
                            : 'bg-white text-black border-black/15 hover:border-gold'
                      }`}
                    >
                      <span>{row.size}</span>
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

            {isLeggings && colors.length > 0 && quantity > 1 && (
              <div className="mt-8 space-y-5">
                <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/50">
                  Choose colour for each extra piece
                </p>
                {Array.from({ length: quantity - 1 }, (_, i) => (
                  <LeggingsColorStrip
                    key={i + 1}
                    colors={colors}
                    selectedName={pieceColors[i + 1] || ''}
                    onSelect={(name) => pickLeggingColor(i + 1, name)}
                    onUnavailable={(c) => setPickError(colorUnavailableMessage(c))}
                    label={
                      pieceColors[i + 1]
                        ? `Legging ${i + 2}: ${pieceColors[i + 1]}`
                        : `Legging ${i + 2} — tap a colour`
                    }
                    shape="circle"
                  />
                ))}
              </div>
            )}

            {product.description && (
              <p className="font-body text-[15px] leading-[1.7] text-[#212121]/80 mt-8">
                {product.description}
              </p>
            )}

            {isKurtiCategory(product.category) && hasKurtiDetails(product.kurtiDetails) && (
              <KurtiDetailsList
                details={normalizeKurtiDetails(product.kurtiDetails)}
                className="mt-5"
              />
            )}

            <OrderDisclaimer className="mt-6" compact />

            {pickError && <p className="mt-4 font-body text-[13px] text-red-600">{pickError}</p>}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!selectedSizeRow || !isSizeAvailable(selectedSizeRow, trackSizeQty)}
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
                onClick={handleBuyNow}
                disabled={!selectedSizeRow || !isSizeAvailable(selectedSizeRow, trackSizeQty)}
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
