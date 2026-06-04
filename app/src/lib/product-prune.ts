import type { Product } from '@/lib/products-store'

/** Product to keep when removing demo / extra catalogue items. */
export function findSideOpenKurtiToKeep(products: Product[]): Product | undefined {
  if (products.length === 0) return undefined

  const exact = products.find((p) => /^side\s*open\s*kurti$/i.test(p.name.trim()))
  if (exact) return exact

  const loose = products.find(
    (p) =>
      /side\s*open\s*kurti/i.test(p.name) &&
      !/avaassa|liva/i.test(p.name)
  )
  if (loose) return loose

  return products[0]
}

export function productsToRemoveExceptKeep(products: Product[], keep: Product): Product[] {
  return products.filter((p) => p.id !== keep.id)
}
