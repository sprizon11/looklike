import type { ProductColor } from '@/lib/product-colors'
import { shortLeggingsColorName } from '@/lib/product-colors'

export function normalizeColorKey(name: string): string {
  return name.trim().toLowerCase()
}

export function isColorOutOfStock(color: ProductColor): boolean {
  if (color.outOfStock) return true
  if (color.stock !== undefined && color.stock <= 0) return true
  return false
}

export function isColorAvailable(color: ProductColor): boolean {
  return !isColorOutOfStock(color)
}

export function colorStockHint(color: ProductColor): string {
  if (isColorOutOfStock(color)) return 'Out of stock'
  if (color.stock !== undefined && color.stock > 0) return `${color.stock} left`
  return ''
}

export function applyColorAvailability(
  colors: ProductColor[],
  outOfStockColors?: string[]
): ProductColor[] {
  const oosSet = new Set((outOfStockColors || []).map(normalizeColorKey))
  return colors.map((c) => {
    const flagged =
      c.outOfStock ||
      oosSet.has(normalizeColorKey(c.name)) ||
      (c.stock !== undefined && c.stock <= 0)
    return flagged ? { ...c, outOfStock: true } : c
  })
}

export function extractOutOfStockColorNames(product: {
  outOfStockColors?: string[]
  colors?: ProductColor[]
}): string[] {
  if (Array.isArray(product.outOfStockColors) && product.outOfStockColors.length > 0) {
    return [...product.outOfStockColors]
  }
  return (product.colors || [])
    .filter((c) => c.outOfStock || (c.stock !== undefined && c.stock <= 0))
    .map((c) => c.name.trim())
    .filter(Boolean)
}

export function colorUnavailableMessage(color: ProductColor): string {
  const short = shortLeggingsColorName(color.name)
  return `This colour is out of stock${short ? `: ${short}` : ''}.`
}
