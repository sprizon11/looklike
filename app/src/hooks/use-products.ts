import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Product } from '@/lib/products-store'
import { apiAddProduct, apiDeleteProduct, apiListProducts, apiUpdateProduct, hasApi } from '@/lib/api'
import {
  addProduct as addProductImpl,
  deleteProduct as deleteProductImpl,
  readProducts,
  replaceProducts,
  subscribeProducts,
  updateProduct as updateProductImpl,
} from '@/lib/products-store'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => readProducts())

  useEffect(() => {
    if (hasApi()) {
      try {
        const raw = window.localStorage.getItem('looklike.products.v1')
        if (raw && raw.length > 400_000) {
          window.localStorage.removeItem('looklike.products.v1')
        }
      } catch {
        // ignore
      }

      apiListProducts()
        .then((list) => {
          setProducts(list)
          replaceProducts(list)
        })
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
    replaceProducts(next)
  }, [])

  return useMemo(
    () => ({
      products,
      addProduct: hasApi()
        ? async (input: Parameters<typeof addProductImpl>[0]) => {
            const created = await apiAddProduct(input)
            try {
              await refreshFromApi()
            } catch {
              setProducts((prev) => [created, ...prev.filter((p) => p.id !== created.id)])
            }
          }
        : addProductImpl,
      updateProduct: hasApi()
        ? async (id: string, patch: Parameters<typeof updateProductImpl>[1]) => {
            const updated = await apiUpdateProduct(id, patch)
            setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
            try {
              await refreshFromApi()
            } catch {
              // server saved; in-memory state already updated
            }
          }
        : updateProductImpl,
      deleteProduct: hasApi()
        ? async (id: string) => {
            await apiDeleteProduct(id)
            setProducts((prev) => prev.filter((p) => p.id !== id))
            try {
              await refreshFromApi()
            } catch {
              // server deleted; in-memory state already updated
            }
          }
        : deleteProductImpl,
    }),
    [products, refreshFromApi]
  )
}

