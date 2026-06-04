import { applyColorAvailability } from '@/lib/color-stock'
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

/** Small payload for API / localStorage — no duplicate photos on each of 48 colours. */
export function buildLeggingsProductColorsLean(): ProductColor[] {
  return LEGGINGS_COLOR_CATALOG.map((opt) => {
    const name = leggingsColorLabel(opt)
    return {
      id: `leggings-${opt.code.replace(/\s+/g, '-').toLowerCase()}`,
      name,
      swatchHex: leggingsSwatchHex(name),
    }
  })
}

export function hydrateLeggingsColorList(
  colors: ProductColor[],
  mainImage: string,
  gallery: string[]
): ProductColor[] {
  const img = mainImage.trim()
  const slides = gallery.length > 0 ? gallery : img ? [img] : []
  return colors.map((c) => ({
    ...c,
    name: c.name.trim(),
    swatchHex: c.swatchHex || leggingsSwatchHex(c.name),
    image: img,
    images: slides,
  }))
}

/** @deprecated Use buildLeggingsProductColorsLean + hydrateLeggingsColorList */
export function buildLeggingsProductColors(mainImage: string): ProductColor[] {
  return hydrateLeggingsColorList(buildLeggingsProductColorsLean(), mainImage, [mainImage])
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
  outOfStock?: boolean
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
  outOfStockColors?: string[]
}): ProductColor[] {
  const mainImage = product.image?.trim() || ''
  let list: ProductColor[]
  if (isLeggingsCatalogProduct(product)) {
    const gallery = productGalleryImages(product)
    const lean =
      normalizeLeggingsColorNamesLean(product.colors).length >= LEGGINGS_COLOR_COUNT - 2
        ? normalizeLeggingsColorNamesLean(product.colors)
        : buildLeggingsProductColorsLean()
    list = hydrateLeggingsColorList(lean, mainImage, gallery)
  } else {
    list = normalizeProductColors(product.colors, mainImage)
  }
  return applyColorAvailability(list, product.outOfStockColors)
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

/** Strip duplicate images from stored leggings colours. */
export function normalizeLeggingsColorNamesLean(colors: ProductColor[] | undefined): ProductColor[] {
  if (!Array.isArray(colors) || colors.length === 0) return []
  const out: ProductColor[] = []
  for (const c of colors) {
    if (!c.name?.trim()) continue
    out.push({
      id: c.id,
      name: c.name.trim(),
      swatchHex: c.swatchHex || leggingsSwatchHex(c.name),
      ...(c.swatch ? { swatch: c.swatch } : {}),
      ...(c.stock !== undefined ? { stock: Math.max(0, Number(c.stock) || 0) } : {}),
      ...(c.outOfStock ? { outOfStock: true } : {}),
    })
  }
  return out
}

export function compactLeggingsProductForStorage<T extends {
  category: string
  name?: string
  image: string
  galleryImages?: string[]
  colors?: ProductColor[]
  outOfStockColors?: string[]
}>(product: T): T {
  if (!isLeggingsCatalogProduct(product)) return product
  const lean = normalizeLeggingsColorNamesLean(product.colors)
  return {
    ...product,
    colors:
      lean.length >= LEGGINGS_COLOR_COUNT - 2 ? lean : buildLeggingsProductColorsLean(),
    outOfStockColors: product.outOfStockColors?.length ? product.outOfStockColors : undefined,
  } as T
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
        ...(c.stock !== undefined ? { stock: Math.max(0, Number(c.stock) || 0) } : {}),
        ...(c.outOfStock ? { outOfStock: true } : {}),
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
    ...(color.stock !== undefined ? { stock: Math.max(0, Number(color.stock) || 0) } : {}),
    ...(color.outOfStock ? { outOfStock: true } : {}),
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
