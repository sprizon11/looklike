import { isKurtiCategory } from '@/lib/kurti-details'

export type SizeGuideType = 'bottom' | 'kurti'

export type BottomSizeGuideRow = {
  size: string
  hip: string
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
  return { type: 'bottom', rows: [], note: '* All measurements are in inches.' }
}

export function defaultSizeGuideForCategory(category: string): SizeGuide | undefined {
  const type = sizeGuideTypeForCategory(category)
  if (!type) return undefined
  return emptySizeGuide(type)
}

function trimBottomRow(row: BottomSizeGuideRow): BottomSizeGuideRow {
  return {
    size: row.size.trim(),
    hip: row.hip.trim(),
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
    .map(trimBottomRow)
    .filter((r) => r.size && (r.hip || r.length))
  if (rows.length === 0) return undefined
  return {
    type: 'bottom',
    rows,
    note: input.note?.trim() || '* All measurements are in inches.',
  }
}

export function hasSizeGuide(guide: SizeGuide | undefined | null): boolean {
  if (!guide) return false
  return guide.rows.length > 0
}

export function bottomRowsFromSizeLabels(labels: string[]): BottomSizeGuideRow[] {
  return labels
    .map((s) => s.trim())
    .filter(Boolean)
    .map((size) => ({ size, hip: '', length: '' }))
}

export function kurtiRowsFromSizeLabels(labels: string[]): KurtiSizeGuideRow[] {
  return labels
    .map((s) => s.trim())
    .filter(Boolean)
    .map((size) => ({ size, bust: '', length: '' }))
}
