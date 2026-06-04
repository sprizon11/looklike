export const MAX_COLOR_IMAGES = 3

export type ProductColor = {
  id: string
  name: string
  /** Primary thumbnail (first image) — kept for older data */
  image?: string
  /** Up to 3 photos per colour */
  images?: string[]
  stock?: number
}

export function padColorImageSlots(images?: string[], legacyImage?: string): string[] {
  const fromImages = Array.isArray(images) ? images.filter(Boolean) : []
  const merged =
    fromImages.length > 0 ? fromImages : legacyImage?.trim() ? [legacyImage.trim()] : []
  const slots = [...merged.slice(0, MAX_COLOR_IMAGES)]
  while (slots.length < MAX_COLOR_IMAGES) slots.push('')
  return slots
}

export function colorImages(color: ProductColor): string[] {
  if (Array.isArray(color.images) && color.images.length > 0) {
    return color.images.map((u) => u.trim()).filter(Boolean).slice(0, MAX_COLOR_IMAGES)
  }
  if (color.image?.trim()) return [color.image.trim()]
  return []
}

export function primaryColorImage(color: ProductColor): string {
  return colorImages(color)[0] || ''
}

export function normalizeProductColors(
  colors: ProductColor[] | undefined,
  fallbackImage: string
): ProductColor[] {
  if (Array.isArray(colors) && colors.length > 0) {
    const out: ProductColor[] = []
    for (const c of colors) {
      const images = colorImages(c)
      if (!c.name?.trim() || images.length === 0) continue
      out.push({
        ...c,
        name: c.name.trim(),
        images,
        image: images[0],
      })
    }
    if (out.length > 0) return out
  }
  const img = fallbackImage?.trim()
  if (!img) return []
  return [{ id: 'color-default', name: 'Default', images: [img], image: img }]
}

export function serializeColorForSave(color: ProductColor): ProductColor {
  const images = colorImages(color)
  return {
    id: color.id,
    name: color.name.trim(),
    images,
    image: images[0],
    ...(color.stock !== undefined ? { stock: color.stock } : {}),
  }
}

export function emptyColorEntry(name = ''): ProductColor {
  return {
    id: newColorId(),
    name,
    images: ['', '', ''],
    image: '',
  }
}

export function getApiBaseForProofs() {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (raw?.trim()) return raw.replace(/\/+$/, '')
  if (import.meta.env.PROD) return ''
  return ''
}

export function paymentProofImageUrl(orderId: string) {
  return `${getApiBaseForProofs()}/api/orders/${encodeURIComponent(orderId)}/payment-proof`
}

export function orderPaymentProofSrc(order: {
  id: string
  paymentProof?: string
  paymentProofFile?: string
}) {
  if (order.paymentProof) return order.paymentProof
  if (order.paymentProofFile) return paymentProofImageUrl(order.id)
  return null
}

export function newColorId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `color-${crypto.randomUUID()}`
  return `color-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}
