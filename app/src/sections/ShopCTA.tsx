import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function ShopCTA() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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
    <section ref={sectionRef} className="bg-white py-[140px] px-[30px] md:px-[60px]">
      <div ref={contentRef} className="max-w-[1440px] mx-auto flex flex-col items-center text-center">
        <h2 className="cta-animate font-display text-[48px] font-normal leading-[1.1] text-black max-w-[600px]">
          Ready to Upgrade Your Wardrobe?
        </h2>
        <p className="cta-animate font-body text-[16px] font-normal text-black/50 mt-5">
          Browse our latest collection and order via WhatsApp
        </p>
        <a
          href="https://wa.me/919344841180?text=Hi!%20I'm%20ready%20to%20shop%20from%20Look%20Like!"
          target="_blank"
          rel="noopener noreferrer"
          className="cta-animate mt-8 inline-flex items-center h-[52px] px-10 rounded-full bg-black text-white font-body text-[14px] font-medium uppercase tracking-[0.06em] border border-black transition-all duration-250 hover:bg-white hover:text-black"
        >
          SHOP NOW ON WHATSAPP
        </a>
      </div>
    </section>
  )
}
