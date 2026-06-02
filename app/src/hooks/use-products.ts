import { useEffect, useMemo, useState } from 'react'
import type { Product } from '@/lib/products-store'
import {
  addProduct as addProductImpl,
  deleteProduct as deleteProductImpl,
  readProducts,
  subscribeProducts,
  updateProduct as updateProductImpl,
} from '@/lib/products-store'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => readProducts())

  useEffect(() => {
    setProducts(readProducts())
    return subscribeProducts(() => setProducts(readProducts()))
  }, [])

  return useMemo(
    () => ({
      products,
      addProduct: addProductImpl,
      updateProduct: updateProductImpl,
      deleteProduct: deleteProductImpl,
    }),
    [products]
  )
}

