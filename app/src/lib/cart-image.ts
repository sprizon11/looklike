import type { CartItem } from '@/lib/cart-store'
import {
  getCustomerColorOptions,
  isLeggingsCatalogProduct,
  primaryColorImage,
  productGalleryImages,
  shortLeggingsColorName,
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

function findColorImageForName(
  product: Product,
  colorName: string
): string {
  const key = normalizeColorKey(colorName)
  if (!key) return ''

  const options = getCustomerColorOptions(product)

  const exact = options.find((c) => normalizeColorKey(c.name) === key)
  if (exact) {
    const img = primaryColorImage(exact)
    if (img) return img
  }

  const short = options.find((c) => normalizeColorKey(shortLeggingsColorName(c.name)) === key)
  if (short) {
    const img = primaryColorImage(short)
    if (img) return img
  }

  const partial = options.find((c) => {
    const n = normalizeColorKey(c.name)
    return n.includes(key) || key.includes(n) || n.endsWith(`. ${key}`)
  })
  if (partial) {
    const img = primaryColorImage(partial)
    if (img) return img
  }

  return ''
}

export function resolveCartItemImage(item: CartItem, products: Product[]): string {
  const stored = cartImageRef(item.image)
  if (stored) return stored

  const product = products.find((p) => p.id === item.productId)
  if (!product) return '/images/product-kurti-1.jpg'

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

  return '/images/product-kurti-1.jpg'
}
