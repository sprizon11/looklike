import type { CartItem } from '@/lib/cart-store'
import type { Product } from '@/lib/products-store'

/** Never persist base64 blobs in cart — they exceed localStorage quota. */
export function cartImageRef(image?: string): string {
  const url = (image || '').trim()
  if (!url || url.startsWith('data:')) return ''
  return url
}

export function resolveCartItemImage(item: CartItem, products: Product[]): string {
  const stored = cartImageRef(item.image)
  if (stored) return stored

  const product = products.find((p) => p.id === item.productId)
  const fromProduct = cartImageRef(product?.image)
  if (fromProduct) return fromProduct

  return '/images/product-kurti-1.jpg'
}
