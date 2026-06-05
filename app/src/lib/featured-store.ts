import { normalizeProductColors, type ProductColor } from '@/lib/product-colors'

export type FeaturedItem = {
  id: string
  name: string
  price: number
  fullSize: string
  description: string
  image: string
  colors?: ProductColor[]
  createdAt: number
  updatedAt: number
}

function normalizeFeaturedItem(item: FeaturedItem): FeaturedItem {
  const colors = normalizeProductColors(item.colors, item.image)
  const image = colors[0]?.image || item.image
  return { ...item, colors, image }
}

export function getFeaturedColorOptions(item: FeaturedItem): ProductColor[] {
  return normalizeProductColors(item.colors, item.image)
}

const STORAGE_KEY = 'looklike.featured.v1'
const CHANGE_EVENT = 'looklike-featured-changed'

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

function getBrowserId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `f-${Math.random().toString(16).slice(2)}-${now()}`
}

function defaultFeatured(): FeaturedItem[] {
  const t = now()
  return [
    {
      id: 'f-1',
      name: 'Liva Side-Open Kurti',
      price: 799,
      fullSize: 'XS, S, M, L, XL, XXL',
      description:
        'Premium fabric with a smooth, breathable feel. A flattering fall that looks elegant in photos. Perfect for daily wear and special outings.',
      image: '/images/featured-kurti-1.jpg',
      colors: [
        {
          id: 'f-1-wine',
          name: 'Wine',
          image: '/images/featured-kurti-1.jpg',
          images: ['/images/featured-kurti-1.jpg'],
        },
        {
          id: 'f-1-navy',
          name: 'Navy',
          image: '/images/featured-kurti-1.jpg',
          images: ['/images/featured-kurti-1.jpg'],
        },
      ],
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'f-2',
      name: 'Avaassa Designer Kurti',
      price: 899,
      fullSize: 'XS, S, M, L, XL, XXL',
      description:
        'Designer finish with a comfortable fit. Stays neat and stylish throughout the day. Easy to pair with leggings or palazzos.',
      image: '/images/featured-kurti-2.jpg',
      colors: [
        {
          id: 'f-2-teal',
          name: 'Teal',
          image: '/images/featured-kurti-2.jpg',
          images: ['/images/featured-kurti-2.jpg'],
        },
        {
          id: 'f-2-maroon',
          name: 'Maroon',
          image: '/images/featured-kurti-2.jpg',
          images: ['/images/featured-kurti-2.jpg'],
        },
      ],
      createdAt: t,
      updatedAt: t,
    },
  ]
}

export function ensureFeaturedSeeded() {
  if (typeof window === 'undefined') return
  const existing = safeParse<FeaturedItem[]>(window.localStorage.getItem(STORAGE_KEY))
  if (Array.isArray(existing) && existing.length > 0) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFeatured()))
}

export function readFeatured(): FeaturedItem[] {
  if (typeof window === 'undefined') return defaultFeatured()
  ensureFeaturedSeeded()
  const parsed = safeParse<FeaturedItem[]>(window.localStorage.getItem(STORAGE_KEY))
  if (!Array.isArray(parsed)) return defaultFeatured()
  return parsed.map(normalizeFeaturedItem)
}

export function writeFeatured(next: FeaturedItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeFeatured(onChange: () => void) {
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

export function addFeatured(input: Omit<FeaturedItem, 'id' | 'createdAt' | 'updatedAt'>) {
  const current = readFeatured()
  const t = now()
  const next: FeaturedItem = normalizeFeaturedItem({
    ...input,
    id: getBrowserId(),
    createdAt: t,
    updatedAt: t,
  })
  writeFeatured([next, ...current])
  return next
}

export function updateFeatured(id: string, patch: Partial<Omit<FeaturedItem, 'id' | 'createdAt'>>) {
  const current = readFeatured()
  const t = now()
  const next = current.map((f) =>
    f.id === id ? normalizeFeaturedItem({ ...f, ...patch, updatedAt: t }) : f
  )
  writeFeatured(next)
}

export function deleteFeatured(id: string) {
  const current = readFeatured()
  writeFeatured(current.filter((f) => f.id !== id))
}

