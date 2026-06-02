import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Product } from '@/lib/products-store'
import { apiAddProduct, apiDeleteProduct, apiListProducts, apiUpdateProduct, hasApi } from '@/lib/api'
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
    if (hasApi()) {
      apiListProducts()
        .then(setProducts)
        .catch(() => {
          setProducts(readProducts())
        })
      return () => {}
    }

    setProducts(readProducts())
    return subscribeProducts(() => setProducts(readProducts()))
  }, [])

  const refreshFromApi = useCallback(async () => {
    if (!hasApi()) return
    const next = await apiListProducts()
    setProducts(next)
  }, [])

  return useMemo(
    () => ({
      products,
      addProduct: hasApi()
        ? async (input: Parameters<typeof addProductImpl>[0]) => {
            await apiAddProduct(input)
            await refreshFromApi()
          }
        : addProductImpl,
      updateProduct: hasApi()
        ? async (id: string, patch: Parameters<typeof updateProductImpl>[1]) => {
            await apiUpdateProduct(id, patch)
            await refreshFromApi()
          }
        : updateProductImpl,
      deleteProduct: hasApi()
        ? async (id: string) => {
            await apiDeleteProduct(id)
            await refreshFromApi()
          }
        : deleteProductImpl,
    }),
    [products, refreshFromApi]
  )
}

