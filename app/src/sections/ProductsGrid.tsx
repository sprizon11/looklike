import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useProducts } from '@/hooks/use-products'

gsap.registerPlugin(ScrollTrigger)

export default function ProductsGrid() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { products } = useProducts()

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    if (reduceMotion) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
        }
      )

      const cards = gridRef.current?.querySelectorAll('.product-card')
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.1,
            scrollTrigger: { trigger: gridRef.current, start: 'top 85%' },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const handleWhatsAppOrder = (productName: string) => {
    const message = `Hi! I'm interested in ordering the ${productName}. Can you share more details?`
    window.open(`https://wa.me/919344841180?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <section id="products" ref={sectionRef} className="bg-white py-16 sm:py-20 md:py-24 px-5 sm:px-8 md:px-14">
      <div className="max-w-[1440px] mx-auto">
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 mb-8 sm:mb-12">
          <h2 className="font-display text-[32px] sm:text-[36px] font-normal text-black">Our Products</h2>
          <button
            onClick={() => {
              window.open('https://wa.me/919344841180?text=Hi!%20I%20want%20to%20see%20all%20your%20products.', '_blank')
            }}
            className="font-body text-[13px] font-normal uppercase tracking-[0.06em] text-black relative group w-fit"
          >
            VIEW ALL
            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-black origin-left scale-x-100 transition-transform duration-300 group-hover:scale-x-0" />
          </button>
        </div>

        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="product-card group cursor-pointer"
              onClick={() => handleWhatsAppOrder(product.name)}
            >
              <div className="relative overflow-hidden bg-[#f7f7f7] aspect-[3/4]">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 opacity-100 sm:opacity-0 sm:translate-y-[10px] transition-all duration-300 ease-out sm:group-hover:opacity-100 sm:group-hover:translate-y-0">
                  <span className="inline-block bg-black text-white font-body text-[12px] font-medium uppercase tracking-[0.04em] px-5 py-[10px]">
                    Quick View
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="font-body text-[15px] font-medium text-[#212121]">
                  {product.name}
                </h3>
                <p className="font-body text-[14px] font-normal text-black/50 mt-1">
                  Rs. {product.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
