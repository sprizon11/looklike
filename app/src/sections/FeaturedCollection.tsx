import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useFeatured } from '@/hooks/use-featured'
import { scrollPageToTop } from '@/lib/scroll-page-top'
import SmartImage from '@/components/SmartImage'

gsap.registerPlugin(ScrollTrigger)

export default function FeaturedCollection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { featured } = useFeatured()

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
        <div className="mb-10 sm:mb-14">
          <p className="font-body text-[11px] uppercase tracking-[0.18em] text-gold-dark">
            Curated picks
          </p>
          <h2
            ref={titleRef}
            className="font-display text-[34px] sm:text-[40px] font-normal text-left text-black mt-2 leading-[1.1] tracking-[-0.02em]"
          >
            New Arrivals
          </h2>
          <div className="gold-divider mt-5 w-[120px]" />
        </div>

        <div ref={itemsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {featured.map((item) => (
            <div
              key={item.id}
              className="featured-item group"
            >
              <div className="overflow-hidden aspect-[3/4]">
                <SmartImage
                  src={item.image}
                  alt={item.name}
                  priority
                  imageWidth={560}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-full object-cover ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-5">
                <h3 className="font-body text-[15px] font-medium text-[#212121]">
                  {item.name}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    scrollPageToTop()
                    navigate(`/featured/${item.id}`)
                  }}
                  className="inline-block mt-2 font-body text-[13px] font-normal uppercase tracking-[0.06em] text-black relative"
                >
                  View Details
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gold-gradient transition-all duration-300 group-hover:w-full" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
