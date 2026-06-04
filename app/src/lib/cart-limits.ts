import { getCustomerColorOptions } from '@/lib/product-colors'
import type { Product } from '@/lib/products-store'
import {
  getProductSizeStock,
  hasExplicitSizeStock,
  isSizeAvailable,
  maxQuantityForSize,
} from '@/lib/product-sizes'

export function getCartItemMaxQuantity(
  product: Product | undefined,
  size: string,
  colorName: string
): number {
  if (!product) return 99

  const trackSize = hasExplicitSizeStock(product)
  const row = getProductSizeStock(product).find((r) => r.size === size)
  if (!row || !isSizeAvailable(row, trackSize)) return 0

  let cap = maxQuantityForSize(
    row,
    trackSize,
    product.stock > 0 ? product.stock : 99
  )

  if (colorName.trim()) {
    const colors = getCustomerColorOptions(product)
    const color = colors.find((c) => c.name.trim() === colorName.trim())
    if (color && color.stock !== undefined && color.stock > 0) {
      cap = Math.min(cap, color.stock)
    }
  }

  return Math.max(0, cap)
}
