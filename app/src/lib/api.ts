import type { Product } from '@/lib/products-store'
import type { ProductColor } from '@/lib/product-colors'
import { getApiBase, hasBackendApi } from '@/lib/api-base'

export function hasApi() {
  return hasBackendApi()
}

async function apiFetch(path: string, init?: RequestInit) {
  const base = getApiBase()
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = `Request failed: ${res.status}`
    try {
      const json = JSON.parse(text) as { error?: string }
      if (json.error) message = json.error
    } catch {
      if (text && text.length < 200) message = text
    }
    throw new Error(message)
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
  galleryImages?: string[]
  size?: string
  description?: string
  weightKg?: number
  colors?: ProductColor[]
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
    galleryImages: string[]
    size: string
    description: string
    weightKg: number
    colors: ProductColor[]
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
