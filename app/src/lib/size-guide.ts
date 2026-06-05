import { isKurtiCategory } from '@/lib/kurti-details'

export type SizeGuideType = 'bottom' | 'kurti'

export type BottomSizeGuideRow = {
  size: string
  brandSize?: string
  inSize?: string
  waist: string
  hip: string
  inseam: string
  length: string
}

export type KurtiSizeGuideRow = {
  size: string
  bust: string
  length: string
}

export type SizeGuide =
  | { type: 'bottom'; rows: BottomSizeGuideRow[]; note?: string }
  | { type: 'kurti'; rows: KurtiSizeGuideRow[]; note?: string }

export function isBottomWearCategory(category: string): boolean {
  const c = category.trim().toLowerCase()
  return (
    c === 'leggings' ||
    c === 'palazzo' ||
    c === 'pant' ||
    c.includes('legging') ||
    c.includes('palazzo') ||
    c.includes('pant')
  )
}

export function sizeGuideTypeForCategory(category: string): SizeGuideType | null {
  if (isKurtiCategory(category)) return 'kurti'
  if (isBottomWearCategory(category)) return 'bottom'
  return null
}

export function supportsSizeGuide(category: string): boolean {
  return sizeGuideTypeForCategory(category) !== null
}

export function emptySizeGuide(type: SizeGuideType): SizeGuide {
  if (type === 'kurti') {
    return { type: 'kurti', rows: [], note: '* All measurements are in inches.' }
  }
  return { type: 'bottom', rows: [], note: '' }
}

export function defaultSizeGuideForCategory(category: string): SizeGuide | undefined {
  const type = sizeGuideTypeForCategory(category)
  if (!type) return undefined
  return emptySizeGuide(type)
}

function trimRow(row: BottomSizeGuideRow): BottomSizeGuideRow {
  return {
    size: row.size.trim(),
    brandSize: row.brandSize?.trim() || undefined,
    inSize: row.inSize?.trim() || undefined,
    waist: row.waist.trim(),
    hip: row.hip.trim(),
    inseam: row.inseam.trim(),
    length: row.length.trim(),
  }
}

function trimKurtiRow(row: KurtiSizeGuideRow): KurtiSizeGuideRow {
  return {
    size: row.size.trim(),
    bust: row.bust.trim(),
    length: row.length.trim(),
  }
}

export function bottomRowHasData(row: BottomSizeGuideRow): boolean {
  return Boolean(
    row.size ||
      row.brandSize ||
      row.inSize ||
      row.waist ||
      row.hip ||
      row.inseam ||
      row.length
  )
}

export function kurtiRowHasData(row: KurtiSizeGuideRow): boolean {
  return Boolean(row.size || row.bust || row.length)
}

export function normalizeSizeGuide(
  input: SizeGuide | undefined | null,
  category: string
): SizeGuide | undefined {
  const type = sizeGuideTypeForCategory(category)
  if (!type) return undefined
  if (!input || input.type !== type) return undefined

  if (type === 'kurti') {
    const kurtiInput = input as Extract<SizeGuide, { type: 'kurti' }>
    const rows = kurtiInput.rows
      .map(trimKurtiRow)
      .filter((r) => r.size && (r.bust || r.length))
    if (rows.length === 0) return undefined
    return {
      type: 'kurti',
      rows,
      note: input.note?.trim() || '* All measurements are in inches.',
    }
  }

  const bottomInput = input as Extract<SizeGuide, { type: 'bottom' }>
  const rows = bottomInput.rows
    .map(trimRow)
    .filter((r) => r.size && (r.waist || r.hip || r.inseam || r.length))
  if (rows.length === 0) return undefined
  return {
    type: 'bottom',
    rows,
    note: input.note?.trim() || undefined,
  }
}

export function hasSizeGuide(guide: SizeGuide | undefined | null): boolean {
  if (!guide) return false
  if (guide.type === 'kurti') return guide.rows.length > 0
  return guide.rows.length > 0
}

export function formatGuideMeasure(value: string, unit: 'in' | 'cm'): string {
  const trimmed = value.trim()
  if (!trimmed) return '—'
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return trimmed
  if (unit === 'in') return String(n)
  return (n * 2.54).toFixed(1)
}

export function bottomRowsFromSizeLabels(labels: string[]): BottomSizeGuideRow[] {
  return labels
    .map((s) => s.trim())
    .filter(Boolean)
    .map((size) => ({
      size,
      brandSize: '',
      inSize: '',
      waist: '',
      hip: '',
      inseam: '',
      length: '',
    }))
}

export function kurtiRowsFromSizeLabels(labels: string[]): KurtiSizeGuideRow[] {
  return labels
    .map((s) => s.trim())
    .filter(Boolean)
    .map((size) => ({ size, bust: '', length: '' }))
}
