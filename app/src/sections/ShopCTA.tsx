import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ShopCTA() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = contentRef.current?.querySelectorAll('.cta-animate')
      if (els) {
        gsap.fromTo(
          els,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.15,
            scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-white py-24 sm:py-28 md:py-[140px] px-5 sm:px-8 md:px-[60px]">
      <div ref={contentRef} className="max-w-[1440px] mx-auto flex flex-col items-center text-center">
        <span className="cta-animate font-body text-[11px] uppercase tracking-[0.4em] text-black/40 mb-5">
          New Season
        </span>
        <h2 className="cta-animate font-display text-[36px] sm:text-[44px] md:text-[52px] font-normal leading-[1.08] text-black max-w-[640px] text-balance">
          Ready to Upgrade Your <span className="italic font-medium">Wardrobe?</span>
        </h2>
        <p className="cta-animate font-body text-[15px] sm:text-[16px] font-light text-black/55 mt-5 max-w-[440px]">
          Browse our latest collection of premium ladies wear, crafted for everyday elegance.
        </p>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="cta-animate mt-9 inline-flex items-center h-[54px] px-12 rounded-full bg-black text-white font-body text-[13px] font-medium uppercase tracking-[0.14em] border border-black transition-all duration-300 hover:bg-white hover:text-black hover:tracking-[0.18em]"
        >
          Shop Now
        </button>
      </div>
    </section>
  )
}
