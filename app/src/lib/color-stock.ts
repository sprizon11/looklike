import type { ProductColor } from '@/lib/product-colors'
import { shortLeggingsColorName } from '@/lib/product-colors'
import {
  colorHasSizeStock,
  colorSizeStockHint,
  getColorSizeQty,
  isColorFullyOutOfStock,
  isColorSizeAvailable,
  totalColorSizeStock,
} from '@/lib/color-size-stock'
import type { SizeStock } from '@/lib/product-sizes'
import { isSizeAvailable } from '@/lib/product-sizes'

export function normalizeColorKey(name: string): string {
  return name.trim().toLowerCase()
}

export function isColorOutOfStock(color: ProductColor): boolean {
  return isColorFullyOutOfStock(color)
}

export function isColorAvailable(color: ProductColor, size?: string): boolean {
  if (color.outOfStock) return false
  if (size?.trim() && colorHasSizeStock(color)) {
    return isColorSizeAvailable(color, size)
  }
  return !isColorFullyOutOfStock(color)
}

export function colorStockHint(color: ProductColor, size?: string): string {
  return colorSizeStockHint(color, size)
}

export function isSizeAvailableForColor(
  color: ProductColor | undefined,
  sizeRow: SizeStock,
  trackProductSizeQty: boolean
): boolean {
  if (sizeRow.outOfStock) return false
  if (color && colorHasSizeStock(color)) {
    return isColorSizeAvailable(color, sizeRow.size)
  }
  return isSizeAvailable(sizeRow, trackProductSizeQty)
}

export function sizeStockHintForColor(
  color: ProductColor | undefined,
  sizeRow: SizeStock,
  trackProductSizeQty: boolean
): string {
  if (color && colorHasSizeStock(color)) {
    return colorSizeStockHint(color, sizeRow.size)
  }
  if (sizeRow.outOfStock) return 'Out of stock'
  if (trackProductSizeQty) {
    if (sizeRow.qty <= 0) return 'Out of stock'
    return `${sizeRow.qty} left`
  }
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
      isColorFullyOutOfStock(c)
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
    .filter((c) => isColorFullyOutOfStock(c))
    .map((c) => c.name.trim())
    .filter(Boolean)
}

export function colorUnavailableMessage(color: ProductColor, size?: string): string {
  const short = shortLeggingsColorName(color.name)
  if (size?.trim() && colorHasSizeStock(color)) {
    const qty = getColorSizeQty(color, size)
    if (qty !== undefined && qty <= 0) {
      return `Size ${size} is out of stock in ${short || color.name}.`
    }
  }
  return `This colour is out of stock${short ? `: ${short}` : ''}.`
}

export { getColorSizeQty, totalColorSizeStock, colorHasSizeStock }
