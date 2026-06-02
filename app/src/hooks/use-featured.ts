import { useEffect, useMemo, useState } from 'react'
import type { FeaturedItem } from '@/lib/featured-store'
import {
  addFeatured as addFeaturedImpl,
  deleteFeatured as deleteFeaturedImpl,
  readFeatured,
  subscribeFeatured,
  updateFeatured as updateFeaturedImpl,
} from '@/lib/featured-store'

export function useFeatured() {
  const [featured, setFeatured] = useState<FeaturedItem[]>(() => readFeatured())

  useEffect(() => {
    setFeatured(readFeatured())
    return subscribeFeatured(() => setFeatured(readFeatured()))
  }, [])

  return useMemo(
    () => ({
      featured,
      addFeatured: addFeaturedImpl,
      updateFeatured: updateFeaturedImpl,
      deleteFeatured: deleteFeaturedImpl,
    }),
    [featured]
  )
}

