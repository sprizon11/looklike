import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const featuredItems = [
  {
    name: 'Liva Side-Open Kurti',
    image: '/images/featured-kurti-1.jpg',
  },
  {
    name: 'Avaassa Designer Kurti',
    image: '/images/featured-kurti-2.jpg',
  },
]

export default function FeaturedCollection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    if (reduceMotion) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
          },
        }
      )

      const items = itemsRef.current?.querySelectorAll('.featured-item')
      if (items) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.15,
            scrollTrigger: {
              trigger: itemsRef.current,
              start: 'top 85%',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="featured"
      ref={sectionRef}
      className="bg-white py-20 sm:py-24 md:py-28 px-5 sm:px-8 md:px-14"
    >
      <div className="max-w-[1440px] mx-auto">
        <h2
          ref={titleRef}
          className="font-display text-[32px] sm:text-[36px] font-normal text-center mb-10 sm:mb-14 text-black"
        >
          Featured Collection
        </h2>

        <div ref={itemsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {featuredItems.map((item) => (
            <div key={item.name} className="featured-item group cursor-pointer">
              <div className="overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[3/4] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-5">
                <h3 className="font-body text-[15px] font-medium text-[#212121]">
                  {item.name}
                </h3>
                <span className="inline-block mt-2 font-body text-[13px] font-normal uppercase tracking-[0.06em] text-black relative">
                  View Details
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
