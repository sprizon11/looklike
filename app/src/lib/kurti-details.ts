export type KurtiDetails = {
  fabric: string
  lining: string
  style: string
  color: string
  length: string
  pocket: string
}

export function emptyKurtiDetails(): KurtiDetails {
  return {
    fabric: '',
    lining: 'No',
    style: '',
    color: '',
    length: '',
    pocket: 'No',
  }
}

export function isKurtiCategory(category: string): boolean {
  return category.trim().toLowerCase() === 'kurti'
}

export function normalizeKurtiDetails(input?: Partial<KurtiDetails> | null): KurtiDetails {
  const d = emptyKurtiDetails()
  if (!input) return d
  return {
    fabric: (input.fabric ?? '').trim(),
    lining: input.lining === 'Yes' ? 'Yes' : 'No',
    style: (input.style ?? '').trim(),
    color: (input.color ?? '').trim(),
    length: (input.length ?? '').trim(),
    pocket: input.pocket === 'Yes' ? 'Yes' : 'No',
  }
}

export function hasKurtiDetails(details?: KurtiDetails | null): boolean {
  if (!details) return false
  return Boolean(
    details.fabric ||
      details.style ||
      details.color ||
      details.length ||
      details.lining === 'Yes' ||
      details.pocket === 'Yes'
  )
}

export function validateKurtiDetails(details: KurtiDetails): string | null {
  if (!details.fabric.trim()) return 'Fabric is required for Kurti'
  if (!details.style.trim()) return 'Style is required for Kurti'
  if (!details.color.trim()) return 'Colour is required for Kurti'
  if (!details.length.trim()) return 'Length is required for Kurti'
  return null
}
