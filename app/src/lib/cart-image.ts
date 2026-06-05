import type { CartItem } from '@/lib/cart-store'
import { getFeaturedColorOptions, readFeatured } from '@/lib/featured-store'
import type { OrderItem } from '@/lib/orders-api'
import {
  getCustomerColorOptions,
  isLeggingsCatalogProduct,
  primaryColorImage,
  productGalleryImages,
  shortLeggingsColorName,
  type ProductColor,
} from '@/lib/product-colors'
import type { Product } from '@/lib/products-store'

/** Never persist base64 blobs in cart — they exceed localStorage quota. */
export function cartImageRef(image?: string): string {
  const url = (image || '').trim()
  if (!url || url.startsWith('data:')) return ''
  return url
}

function normalizeColorKey(name: string): string {
  return name.trim().toLowerCase()
}

function findColorImageInOptions(colors: ProductColor[], colorName: string): string {
  const key = normalizeColorKey(colorName)
  if (!key) return ''

  const exact = colors.find((c) => normalizeColorKey(c.name) === key)
  if (exact) {
    const img = primaryColorImage(exact)
    if (img) return img
  }

  const short = colors.find((c) => normalizeColorKey(shortLeggingsColorName(c.name)) === key)
  if (short) {
    const img = primaryColorImage(short)
    if (img) return img
  }

  const partial = colors.find((c) => {
    const n = normalizeColorKey(c.name)
    return n.includes(key) || key.includes(n) || n.endsWith(`. ${key}`)
  })
  if (partial) {
    const img = primaryColorImage(partial)
    if (img) return img
  }

  return ''
}

function findColorImageForName(product: Product, colorName: string): string {
  return findColorImageInOptions(getCustomerColorOptions(product), colorName)
}

const FALLBACK_IMAGE = '/images/product-kurti-1.jpg'

export function resolveCartItemImage(item: CartItem, products: Product[]): string {
  const stored = cartImageRef(item.image)
  if (stored) return stored

  if (item.productId.startsWith('featured-')) {
    const featuredId = item.productId.slice('featured-'.length)
    const featured = readFeatured().find((f) => f.id === featuredId)
    if (featured) {
      if (item.color?.trim()) {
        const byColor = findColorImageInOptions(getFeaturedColorOptions(featured), item.color)
        if (byColor) return byColor
      }
      const main = featured.image?.trim()
      if (main) return main
    }
  }

  const product = products.find((p) => p.id === item.productId)
  if (!product) return FALLBACK_IMAGE

  if (item.color?.trim()) {
    const byColor = findColorImageForName(product, item.color)
    if (byColor) return byColor
  }

  if (isLeggingsCatalogProduct(product)) {
    const gallery = productGalleryImages(product)
    if (gallery[0]) return gallery[0]
  }

  const main = product.image?.trim()
  if (main) return main

  return FALLBACK_IMAGE
}

export function resolveOrderItemImage(item: OrderItem, products: Product[]): string {
  return resolveCartItemImage(
    {
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image || '',
      size: item.size,
      color: item.color || '',
      quantity: item.quantity,
    },
    products
  )
}
