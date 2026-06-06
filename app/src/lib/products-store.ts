import { compactLeggingsProductForStorage, type ProductColor } from '@/lib/product-colors'
import type { KurtiDetails } from '@/lib/kurti-details'
import type { SizeStock } from '@/lib/product-sizes'
import type { SizeGuide } from '@/lib/size-guide'

export type ProductCategory = 'Kurti' | 'Leggings' | 'Palazzo' | string

export type Product = {
  id: string
  name: string
  category: ProductCategory
  price: number
  stock: number
  image: string
  /** Main product photos (1–3), e.g. leggings — same image for all colour swatches */
  galleryImages?: string[]
  size?: string
  /** Per-size quantity and out-of-stock flag */
  sizeStock?: SizeStock[]
  description?: string
  /** Weight per piece in kg (for delivery charge) */
  weightKg?: number
  colors?: ProductColor[]
  /** Fabric, lining, style, etc. — shown on Kurti product pages */
  kurtiDetails?: KurtiDetails
  /** Leggings: full colour names (CL 1. Black, …) marked out of stock */
  outOfStockColors?: string[]
  /** Size chart for Kurti or bottom wear (leggings / palazzo / pant) */
  sizeGuide?: SizeGuide
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'looklike.products.v1'
const CHANGE_EVENT = 'looklike-products-changed'

function now() {
  return Date.now()
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function defaultProducts(): Product[] {
  return []
}

function getBrowserId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `p-${Math.random().toString(16).slice(2)}-${now()}`
}

export function ensureProductsSeeded() {
  if (typeof window === 'undefined') return
  const existing = safeParse<Product[]>(window.localStorage.getItem(STORAGE_KEY))
  if (Array.isArray(existing) && existing.length > 0) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts()))
}

export function readProducts(): Product[] {
  if (typeof window === 'undefined') return defaultProducts()
  ensureProductsSeeded()
  const parsed = safeParse<Product[]>(window.localStorage.getItem(STORAGE_KEY))
  if (!Array.isArray(parsed)) return defaultProducts()
  return parsed
}

function compactForStorage(list: Product[]) {
  return list.map((p) => compactLeggingsProductForStorage(p))
}

function isExternalImageUrl(url: string | undefined): boolean {
  const u = (url || '').trim()
  return u.length > 0 && !u.startsWith('data:')
}

/** Drop base64 blobs — local cache is optional when the live API is source of truth. */
export function stripProductsForLocalCache(list: Product[]): Product[] {
  return compactForStorage(list).map((p) => ({
    ...p,
    image: isExternalImageUrl(p.image) ? p.image : '',
    galleryImages: p.galleryImages?.filter(isExternalImageUrl),
    colors: p.colors?.map((c) => {
      const imgs = (c.images || []).filter(isExternalImageUrl)
      const img = isExternalImageUrl(c.image) ? c.image : imgs[0]
      return {
        id: c.id,
        name: c.name,
        ...(c.swatchHex ? { swatchHex: c.swatchHex } : {}),
        ...(c.stock !== undefined ? { stock: c.stock } : {}),
        ...(c.sizeStock?.length ? { sizeStock: c.sizeStock } : {}),
        ...(c.outOfStock ? { outOfStock: c.outOfStock } : {}),
        ...(img ? { image: img, images: imgs.length > 0 ? imgs : [img] } : {}),
      }
    }),
  }))
}

function metadataOnlyCache(list: Product[]): Product[] {
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    image: '',
    size: p.size,
    sizeStock: p.sizeStock,
    description: p.description,
    weightKg: p.weightKg,
    outOfStockColors: p.outOfStockColors,
    kurtiDetails: p.kurtiDetails,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }))
}

/** Best-effort local cache — never throws (API / server is authoritative in production). */
export function tryCacheProducts(next: Product[]): boolean {
  if (typeof window === 'undefined') return false

  const payloads = [
    () => compactForStorage(next),
    () => stripProductsForLocalCache(next),
    () => metadataOnlyCache(next),
  ]

  for (const build of payloads) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(build()))
      window.dispatchEvent(new Event(CHANGE_EVENT))
      return true
    } catch {
      // try smaller payload
    }
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  return false
}

export function writeProducts(next: Product[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compactForStorage(next)))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    if (err.includes('quota') || err.includes('QuotaExceeded')) {
      throw new Error(
        'Browser storage is full. Clear site data for looklike.in (Settings → site data), then try again.'
      )
    }
    throw e
  }
}

/** Sync local cache after loading from server API (all devices see same catalog). */
export function replaceProducts(next: Product[]) {
  tryCacheProducts(next)
}

export function subscribeProducts(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}

  const handler = () => onChange()
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange()
  }

  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', storageHandler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', storageHandler)
  }
}

export function addProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const current = readProducts()
  const t = now()
  const next: Product = { ...input, id: getBrowserId(), createdAt: t, updatedAt: t }
  writeProducts([next, ...current])
  return next
}

export function updateProduct(id: string, patch: Partial<Omit<Product, 'id' | 'createdAt'>>) {
  const current = readProducts()
  const t = now()
  const next = current.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: t } : p))
  writeProducts(next)
}

export function deleteProduct(id: string) {
  const current = readProducts()
  writeProducts(current.filter((p) => p.id !== id))
}

