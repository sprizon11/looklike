import { LEGGINGS_COLOR_CATALOG, leggingsColorLabel } from '@/lib/leggings-color-catalog'
import { leggingsSwatchHex } from '@/lib/leggings-swatch-colors'

export const MAX_COLOR_IMAGES = 3
export const LEGGINGS_COLOR_COUNT = LEGGINGS_COLOR_CATALOG.length

export function isLeggingsProduct(category?: string) {
  return (category || '').toLowerCase().includes('legging')
}

/** True when product uses the 48-colour leggings chart (by category or saved colour names). */
export function isLeggingsCatalogProduct(product: {
  category?: string
  name?: string
  colors?: ProductColor[]
}) {
  if (isLeggingsProduct(product.category)) return true
  if ((product.name || '').toLowerCase().includes('legging')) return true
  const colors = product.colors || []
  const clCount = colors.filter((c) => /^CL\s*\d/i.test((c.name || '').trim())).length
  return clCount >= 15
}

export function isLeggingsAdminForm(category: string, colors: ProductColor[]) {
  if (isLeggingsProduct(category)) return true
  return colors.filter((c) => /^CL\s*\d/i.test((c.name || '').trim())).length >= 15
}

export function shortLeggingsColorName(fullLabel: string) {
  const parts = fullLabel.split('.')
  if (parts.length >= 2) return parts.slice(1).join('.').trim()
  return fullLabel.trim()
}

export function buildLeggingsProductColors(mainImage: string): ProductColor[] {
  const img = mainImage.trim()
  return LEGGINGS_COLOR_CATALOG.map((opt) => {
    const name = leggingsColorLabel(opt)
    return {
      id: `leggings-${opt.code.replace(/\s+/g, '-').toLowerCase()}`,
      name,
      image: img,
      images: img ? [img] : [],
      swatchHex: leggingsSwatchHex(name),
    }
  })
}

export type ProductColor = {
  id: string
  name: string
  /** Primary thumbnail (first image) — kept for older data */
  image?: string
  /** Up to 3 photos per colour */
  images?: string[]
  /** Small fabric swatch image (optional; leggings) */
  swatch?: string
  /** Hex fill when no swatch image (leggings picker) */
  swatchHex?: string
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

/** Colour list for product page — leggings always show all 48 names with the main product photo. */
export function getCustomerColorOptions(product: {
  category: string
  image: string
  colors?: ProductColor[]
  name?: string
}): ProductColor[] {
  const mainImage = product.image?.trim() || ''
  if (isLeggingsCatalogProduct(product)) {
    const saved = normalizeLeggingsColorNames(product.colors, mainImage)
    if (saved.length >= LEGGINGS_COLOR_COUNT - 2) return saved
    return buildLeggingsProductColors(mainImage)
  }
  return normalizeProductColors(product.colors, mainImage)
}

export function productGalleryImages(product: {
  image: string
  galleryImages?: string[]
}): string[] {
  const gallery = (product.galleryImages || []).map((u) => u.trim()).filter(Boolean).slice(0, MAX_COLOR_IMAGES)
  if (gallery.length > 0) return gallery
  const main = product.image?.trim()
  return main ? [main] : []
}

/** Keep colour names for leggings even when photos are only on the main product image. */
export function normalizeLeggingsColorNames(
  colors: ProductColor[] | undefined,
  mainImage: string
): ProductColor[] {
  const img = mainImage.trim()
  if (!Array.isArray(colors) || colors.length === 0) return []
  const out: ProductColor[] = []
  for (const c of colors) {
    if (!c.name?.trim()) continue
    const images = colorImages(c)
    const useImg = images[0] || img
    out.push({
      ...c,
      name: c.name.trim(),
      image: useImg,
      images: useImg ? [useImg] : [],
      swatchHex: c.swatchHex || leggingsSwatchHex(c.name),
      ...(c.swatch ? { swatch: c.swatch } : {}),
    })
  }
  return out
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
