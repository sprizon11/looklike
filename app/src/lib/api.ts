import type { Product } from '@/lib/products-store'

function baseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (!raw) return null
  return raw.replace(/\/+$/, '')
}

export function hasApi() {
  return Boolean(baseUrl())
}

async function apiFetch(path: string, init?: RequestInit) {
  const base = baseUrl()
  if (!base) throw new Error('API base URL is not configured')

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed: ${res.status}`)
  }

  return res
}

export async function apiListProducts(): Promise<Product[]> {
  const res = await apiFetch('/api/products')
  const json = (await res.json()) as { products: Product[] }
  return json.products
}

export async function apiAddProduct(input: {
  name: string
  category: string
  price: number
  stock: number
  image: string
  size?: string
  description?: string
  variants?: { color: string; image: string }[]
}): Promise<Product> {
  const res = await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(input) })
  const json = (await res.json()) as { product: Product }
  return json.product
}

export async function apiUpdateProduct(
  id: string,
  patch: Partial<{
    name: string
    category: string
    price: number
    stock: number
    image: string
    size: string
    description: string
    variants: { color: string; image: string }[]
  }>
): Promise<Product> {
  const res = await apiFetch(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  const json = (await res.json()) as { product: Product }
  return json.product
}

export async function apiDeleteProduct(id: string): Promise<void> {
  await apiFetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

