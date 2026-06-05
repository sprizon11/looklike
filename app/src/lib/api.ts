import type { Product } from '@/lib/products-store'
import type { ProductColor } from '@/lib/product-colors'
import type { KurtiDetails } from '@/lib/kurti-details'
import type { SizeGuide } from '@/lib/size-guide'
import type { SizeStock } from '@/lib/product-sizes'
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

/** Resolve server-relative image endpoints (/api/...) against the API base for cross-origin dev. */
function absolutizeImageUrl(url: string | undefined, base: string): string | undefined {
  if (!url || !base) return url
  return url.startsWith('/api/') ? `${base}${url}` : url
}

function absolutizeProductImages(p: Product, base: string): Product {
  if (!base) return p
  return {
    ...p,
    image: absolutizeImageUrl(p.image, base) || p.image,
    galleryImages: p.galleryImages?.map((img) => absolutizeImageUrl(img, base) || img),
    colors: p.colors?.map((c) => ({
      ...c,
      image: absolutizeImageUrl(c.image, base),
      images: c.images?.map((img) => absolutizeImageUrl(img, base) || img),
    })),
  }
}

export async function apiListProducts(): Promise<Product[]> {
  const res = await apiFetch('/api/products')
  const json = (await res.json()) as { products: Product[] }
  const base = getApiBase()
  return json.products.map((p) => absolutizeProductImages(p, base))
}

/** Full product with original base64 images (admin edit) so photos survive re-save. */
export async function apiGetFullProduct(id: string): Promise<Product> {
  const res = await apiFetch(`/api/products/${encodeURIComponent(id)}/full`)
  const json = (await res.json()) as { product: Product }
  return json.product
}

export async function apiAddProduct(input: {
  name: string
  category: string
  price: number
  stock: number
  image: string
  galleryImages?: string[]
  size?: string
  sizeStock?: SizeStock[]
  description?: string
  weightKg?: number
  colors?: ProductColor[]
  kurtiDetails?: KurtiDetails
  outOfStockColors?: string[]
  sizeGuide?: SizeGuide
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
    sizeStock: SizeStock[]
    description: string
    weightKg: number
    colors: ProductColor[]
    kurtiDetails: KurtiDetails
    outOfStockColors: string[]
    sizeGuide: SizeGuide
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
