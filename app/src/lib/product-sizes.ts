export type SizeStock = {
  size: string
  qty: number
  outOfStock: boolean
}

export const DEFAULT_SIZE_LABELS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function defaultSizeStockRows(): SizeStock[] {
  return DEFAULT_SIZE_LABELS.map((size) => ({ size, qty: 0, outOfStock: false }))
}

export function parseSizeList(size?: string): string[] {
  if (!size?.trim()) return []
  return size
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function hasExplicitSizeStock(product: { sizeStock?: SizeStock[] }): boolean {
  return Array.isArray(product.sizeStock) && product.sizeStock.length > 0
}

export function getProductSizeStock(product: {
  size?: string
  sizeStock?: SizeStock[]
}): SizeStock[] {
  if (hasExplicitSizeStock(product)) {
    return product.sizeStock!
      .map((r) => ({
        size: (r.size || '').trim(),
        qty: Math.max(0, Number(r.qty) || 0),
        outOfStock: Boolean(r.outOfStock),
      }))
      .filter((r) => r.size)
  }
  const labels = parseSizeList(product.size)
  if (labels.length === 0) return defaultSizeStockRows()
  return labels.map((size) => ({ size, qty: 0, outOfStock: false }))
}

export function sizeStockToLegacyString(rows: SizeStock[]): string {
  return rows
    .map((r) => r.size.trim())
    .filter(Boolean)
    .join(', ')
}

export function isSizeAvailable(row: SizeStock, trackQty: boolean): boolean {
  if (row.outOfStock) return false
  if (trackQty) return row.qty > 0
  return true
}

export function sizeStockHint(row: SizeStock, trackQty: boolean): string {
  if (row.outOfStock) return 'Out of stock'
  if (trackQty) {
    if (row.qty <= 0) return 'Out of stock'
    return `${row.qty} left`
  }
  return ''
}

export function maxQuantityForSize(
  row: SizeStock | undefined,
  trackQty: boolean,
  fallbackStock = 99
): number {
  if (!row || !isSizeAvailable(row, trackQty)) return 0
  if (trackQty) return row.qty
  return Math.max(1, fallbackStock)
}

export function normalizeSizeStockForSave(rows: SizeStock[]): SizeStock[] {
  return rows
    .map((r) => ({
      size: r.size.trim(),
      qty: Math.max(0, Math.floor(Number(r.qty) || 0)),
      outOfStock: Boolean(r.outOfStock),
    }))
    .filter((r) => r.size)
}
