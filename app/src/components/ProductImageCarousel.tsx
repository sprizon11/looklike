import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DETAIL_IMAGE_W, GRID_IMAGE_W, withImageWidth } from '@/lib/image-url'

const AUTO_MS = 4500

type Props = {
  images: string[]
  alt: string
  className?: string
  /** Resize API photos for detail view without downloading full originals. */
  imageWidth?: number
}

export default function ProductImageCarousel({
  images,
  alt,
  className = '',
  imageWidth = DETAIL_IMAGE_W,
}: Props) {
  const rawSlides = useMemo(() => images.filter(Boolean), [images])
  const slides = useMemo(
    () => rawSlides.map((src) => withImageWidth(src, imageWidth) || src),
    [rawSlides, imageWidth]
  )
  const placeholders = useMemo(
    () => rawSlides.map((src) => withImageWidth(src, GRID_IMAGE_W) || src),
    [rawSlides]
  )

  const [index, setIndex] = useState(0)
  const [hiResReady, setHiResReady] = useState<Record<number, boolean>>({})
  const pauseUntilRef = useRef(0)

  useEffect(() => {
    setIndex(0)
    setHiResReady({})
  }, [slides.join('|')])

  const go = useCallback(
    (next: number) => {
      if (slides.length <= 1) return
      pauseUntilRef.current = Date.now() + AUTO_MS * 2
      setIndex(((next % slides.length) + slides.length) % slides.length)
    },
    [slides.length]
  )

  useEffect(() => {
    if (slides.length <= 1) return
    const id = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return
      setIndex((i) => (i + 1) % slides.length)
    }, AUTO_MS)
    return () => window.clearInterval(id)
  }, [slides.length, slides.join('|')])

  useEffect(() => {
    const next = (index + 1) % slides.length
    const prev = (index - 1 + slides.length) % slides.length
    for (const i of [index, next, prev]) {
      const src = slides[i]
      if (!src) continue
      const img = new Image()
      img.src = src
    }
  }, [index, slides])

  if (slides.length === 0) {
    return (
      <div className={`bg-[#f7f7f7] aspect-[3/4] flex items-center justify-center ${className}`}>
        <span className="font-body text-[13px] text-black/40">No image</span>
      </div>
    )
  }

  return (
    <div className={`relative bg-[#f7f7f7] overflow-hidden group ${className}`}>
      <div className="aspect-[3/4] relative">
        {slides.map((src, i) => {
          const placeholder = placeholders[i]
          const showPlaceholder = placeholder && placeholder !== src
          const hiResLoaded = hiResReady[i] || !showPlaceholder
          return (
            <div
              key={`${src}-${i}`}
              className={`absolute inset-0 transition-opacity duration-500 ${
                i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
              }`}
            >
              {showPlaceholder ? (
                <img
                  src={placeholder}
                  alt=""
                  aria-hidden
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : null}
              <img
                src={src}
                alt={i === index ? alt : ''}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                // @ts-expect-error fetchpriority is a valid HTML attribute
                fetchpriority={i === 0 ? 'high' : 'auto'}
                onLoad={() => setHiResReady((s) => ({ ...s, [i]: true }))}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  hiResLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          )
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 border border-black/10 flex items-center justify-center text-black/70 hover:bg-white hover:text-black opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
            aria-label="Previous photo"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 border border-black/10 flex items-center justify-center text-black/70 hover:bg-white hover:text-black opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
            aria-label="Next photo"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-gold' : 'w-1.5 bg-white/80 border border-black/20'
                }`}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>

          <span className="absolute top-3 right-3 z-10 font-body text-[11px] px-2 py-0.5 rounded-full bg-black/50 text-white">
            {index + 1} / {slides.length}
          </span>
        </>
      )}
    </div>
  )
}
