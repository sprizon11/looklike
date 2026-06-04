/**
 * Remove all products except "Side open kurti".
 * Run from backend folder: node scripts/prune-products.mjs
 */
import 'dotenv/config'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const { listProducts, deleteProduct } = await import('../src/store.js')

function findKeep(products) {
  const exact = products.find((p) => /^side\s*open\s*kurti$/i.test((p.name || '').trim()))
  if (exact) return exact
  const loose = products.find(
    (p) => /side\s*open\s*kurti/i.test(p.name || '') && !/avaassa|liva/i.test(p.name || '')
  )
  return loose || products[0]
}

const products = await listProducts()
const keep = findKeep(products)
if (!keep) {
  console.log('No products found.')
  process.exit(0)
}

const toRemove = products.filter((p) => p.id !== keep.id)
console.log(`Keeping: ${keep.name} (${keep.id})`)
for (const p of toRemove) {
  console.log(`Deleting: ${p.name} (${p.id})`)
  await deleteProduct(p.id)
}
console.log(`Done. ${toRemove.length} removed, 1 kept.`)
