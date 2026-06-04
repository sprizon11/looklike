import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    if (reduceMotion) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 }
      )
      gsap.fromTo(
        scrollIndicatorRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power3.out', delay: 1.2 }
      )
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={heroRef} className="relative w-full min-h-[100svh] overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/images/hero-video-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.20) 40%, rgba(0,0,0,0.50) 100%)',
        }}
      />

      {/* Hero Content */}
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center justify-center min-h-[100svh] w-full text-center px-5 sm:px-8"
      >
        <span className="font-body text-[11px] sm:text-[12px] uppercase tracking-[0.4em] text-gold-light mb-5">
          Look Like · Tirupur
        </span>
        <h1 className="font-display text-white text-[38px] sm:text-[52px] md:text-[64px] font-normal leading-[1.05] tracking-[-0.02em] max-w-[820px] mx-auto text-balance">
          Effortless Style for <span className="italic font-medium gold-text">Every Woman</span>
        </h1>
        <p className="font-body text-white/85 text-[15px] sm:text-[16px] font-light leading-[1.7] max-w-[520px] mt-6 mx-auto">
          Discover our curated collection of kurtis, leggings, and palazzos. Premium fabrics, timeless designs, delivered to your doorstep.
        </p>
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('products')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          className="mt-9 inline-flex items-center h-[52px] px-10 rounded-full bg-white text-black font-body text-[13px] font-medium uppercase tracking-[0.14em] border border-transparent transition-all duration-300 hover:bg-gold-gradient hover:tracking-[0.18em]"
        >
          Explore Collection
        </button>
      </div>

      {/* Scroll Indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-6 left-5 sm:bottom-8 sm:left-8 z-10 hidden sm:flex items-center gap-3"
      >
        <div className="relative w-[1px] h-[40px] bg-white/50">
          <div
            className="absolute top-0 left-[-2px] w-[5px] h-[5px] rounded-full bg-gold-light"
            style={{ animation: 'scroll-pulse 1.8s ease-in-out infinite' }}
          />
        </div>
        <span className="font-body text-[11px] font-normal uppercase tracking-[0.1em] text-white/70">
          SCROLL
        </span>
      </div>
    </section>
  )
}
