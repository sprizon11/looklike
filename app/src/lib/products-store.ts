export type ProductCategory = 'Kurti' | 'Leggings' | 'Palazzo' | string

export type Product = {
  id: string
  name: string
  category: ProductCategory
  price: number
  stock: number
  image: string
  size?: string
  description?: string
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
  const t = now()
  return [
    {
      id: 'p-1',
      name: 'Side Open Kurti - Liva',
      category: 'Kurti',
      price: 599,
      stock: 24,
      image: '/images/product-kurti-1.jpg',
      size: 'S, M, L, XL',
      description: 'Soft fabric with an easy, flattering fit.',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-2',
      name: 'Side Open Kurti - Avaassa',
      category: 'Kurti',
      price: 699,
      stock: 18,
      image: '/images/product-kurti-2.jpg',
      size: 'S, M, L, XL',
      description: 'Designer kurti with premium finish.',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-3',
      name: 'Ankle Length Leggings',
      category: 'Leggings',
      price: 299,
      stock: 45,
      image: '/images/product-leggings-1.jpg',
      size: 'Free Size',
      description: 'Comfort stretch for daily wear.',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-4',
      name: 'Premium Palazzo Pants',
      category: 'Palazzo',
      price: 399,
      stock: 32,
      image: '/images/product-palazzo-1.jpg',
      size: 'M, L, XL',
      description: 'Lightweight palazzo pants for all-day comfort.',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-5',
      name: 'Printed Casual Kurti',
      category: 'Kurti',
      price: 499,
      stock: 15,
      image: '/images/kurti-various-1.jpg',
      size: 'S, M, L',
      description: 'Printed casual kurti for everyday style.',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-6',
      name: 'Embroidered Party Kurti',
      category: 'Kurti',
      price: 899,
      stock: 8,
      image: '/images/kurti-various-2.jpg',
      size: 'M, L, XL',
      description: 'Embroidered party wear kurti.',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-7',
      name: 'Cotton Daily Wear Leggings',
      category: 'Leggings',
      price: 249,
      stock: 56,
      image: '/images/leggings-various-1.jpg',
      size: 'Free Size',
      description: 'Cotton leggings designed for comfort.',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-8',
      name: 'Flared Palazzo - Solid',
      category: 'Palazzo',
      price: 449,
      stock: 21,
      image: '/images/palazzo-various-1.jpg',
      size: 'M, L, XL',
      description: 'Solid flared palazzo with a clean silhouette.',
      createdAt: t,
      updatedAt: t,
    },
  ]
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

export function writeProducts(next: Product[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(CHANGE_EVENT))
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

