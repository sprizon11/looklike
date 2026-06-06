import type { ProductColor } from '@/lib/product-colors'

export type ColorSizeStock = {
  size: string
  qty: number
}

export function syncColorSizeStockWithLabels(
  existing: ColorSizeStock[] | undefined,
  sizeLabels: string[]
): ColorSizeStock[] {
  const labels = sizeLabels.map((s) => s.trim()).filter(Boolean)
  if (labels.length === 0) return []
  const map = new Map((existing || []).map((r) => [r.size.trim(), Math.max(0, Number(r.qty) || 0)]))
  return labels.map((size) => ({ size, qty: map.get(size) ?? 0 }))
}

export function normalizeColorSizeStockForSave(rows: ColorSizeStock[]): ColorSizeStock[] {
  return rows
    .map((r) => ({
      size: r.size.trim(),
      qty: Math.max(0, Math.floor(Number(r.qty) || 0)),
    }))
    .filter((r) => r.size)
}

export function colorHasSizeStock(color: ProductColor): boolean {
  return Array.isArray(color.sizeStock) && color.sizeStock.length > 0
}

export function getColorSizeQty(color: ProductColor, size: string): number | undefined {
  const key = size.trim()
  if (!key) return undefined
  const row = color.sizeStock?.find((r) => r.size.trim() === key)
  if (row) return Math.max(0, Number(row.qty) || 0)
  if (color.stock !== undefined) return Math.max(0, Number(color.stock) || 0)
  return undefined
}

export function totalColorSizeStock(color: ProductColor): number {
  if (colorHasSizeStock(color)) {
    return color.sizeStock!.reduce((sum, r) => sum + Math.max(0, Number(r.qty) || 0), 0)
  }
  if (color.stock !== undefined) return Math.max(0, Number(color.stock) || 0)
  return 0
}

export function isColorSizeAvailable(color: ProductColor, size: string): boolean {
  if (color.outOfStock) return false
  if (colorHasSizeStock(color)) {
    const qty = getColorSizeQty(color, size)
    return qty !== undefined && qty > 0
  }
  if (color.stock !== undefined) return color.stock > 0
  return true
}

export function isColorFullyOutOfStock(color: ProductColor): boolean {
  if (color.outOfStock) return true
  if (colorHasSizeStock(color)) return totalColorSizeStock(color) <= 0
  if (color.stock !== undefined) return color.stock <= 0
  return false
}

export function colorSizeStockHint(color: ProductColor, size?: string): string {
  if (color.outOfStock || isColorFullyOutOfStock(color)) return 'Out of stock'
  const sizeKey = size?.trim()
  if (sizeKey && colorHasSizeStock(color)) {
    const qty = getColorSizeQty(color, sizeKey)
    if (qty === undefined || qty <= 0) return 'Out of stock'
    return `${qty} left`
  }
  if (colorHasSizeStock(color)) {
    const total = totalColorSizeStock(color)
    if (total <= 0) return 'Out of stock'
    return `${total} total`
  }
  if (color.stock !== undefined && color.stock > 0) return `${color.stock} left`
  return ''
}

export function maxQtyForColorAndSize(
  color: ProductColor | undefined,
  size: string | undefined,
  fallback = 99
): number {
  if (!color) return fallback
  if (color.outOfStock || isColorFullyOutOfStock(color)) return 0
  const sizeKey = size?.trim()
  if (sizeKey && colorHasSizeStock(color)) {
    const qty = getColorSizeQty(color, sizeKey)
    return qty !== undefined && qty > 0 ? qty : 0
  }
  if (colorHasSizeStock(color)) return totalColorSizeStock(color) || 0
  if (color.stock !== undefined && color.stock > 0) return color.stock
  return fallback
}
