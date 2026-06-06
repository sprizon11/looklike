import { useEffect, useMemo, useState } from 'react'
import { withImageWidth } from '@/lib/image-url'

type Props = {
  src?: string
  alt: string
  className?: string
  /** Eager-load above-the-fold images; others lazy-load. */
  priority?: boolean
  sizes?: string
}

/**
 * Image with a shimmer placeholder, async decoding and graceful error fallback.
 * Prevents broken-image icons while large photos stream in.
 */
export default function SmartImage({
  src,
  alt,
  className = '',
  priority = false,
  sizes,
}: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const resolvedSrc = useMemo(() => withImageWidth(src), [src])

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [resolvedSrc])

  const showPlaceholder = !src || !loaded || failed

  return (
    <span className="relative block w-full h-full overflow-hidden bg-[#f3f1ec]">
      {showPlaceholder && (
        <span
          aria-hidden
          className={`absolute inset-0 ${failed ? '' : 'animate-pulse'} bg-gradient-to-br from-[#f3f1ec] via-[#eceae3] to-[#f3f1ec]`}
        />
      )}
      {resolvedSrc && !failed && (
        <img
          src={resolvedSrc}
          alt={alt}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          // @ts-expect-error fetchpriority is a valid HTML attribute
          fetchpriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`${className} transition-opacity duration-150 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </span>
  )
}
