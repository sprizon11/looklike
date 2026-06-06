import { colorImages, productGalleryImages } from '@/lib/product-colors'
import { withImageWidth } from '@/lib/image-url'
import type { Product } from '@/lib/products-store'

const prefetched = new Set<string>()

function prefetchUrl(url: string | undefined) {
  const src = withImageWidth(url)?.trim()
  if (!src || prefetched.has(src)) return
  prefetched.add(src)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

/** Warm the browser cache for a product detail view (hero + colours). */
export function prefetchProductImages(product: {
  id: string
  image: string
  galleryImages?: string[]
  colors?: Product['colors']
}) {
  const hero = productGalleryImages(product)
  for (const raw of hero) prefetchUrl(raw)
  prefetchUrl(product.image)

  for (const color of product.colors || []) {
    for (const raw of colorImages(color).slice(0, 2)) prefetchUrl(raw)
  }
}
