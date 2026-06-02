import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollIndicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
    <section ref={heroRef} className="relative w-full h-screen overflow-hidden">
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
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* Hero Content */}
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6"
      >
        <h1
          className="font-display text-white text-[36px] sm:text-[48px] md:text-[56px] font-normal leading-[1.1] tracking-[-0.02em] max-w-[700px]"
        >
          Effortless Style for Every Woman
        </h1>
        <p className="font-body text-white/90 text-[15px] font-normal leading-[1.6] max-w-[480px] mt-6">
          Discover our curated collection of kurtis, leggings, and palazzos. Premium fabrics, timeless designs, delivered to your doorstep.
        </p>
        <a
          href="https://wa.me/919344841180?text=Hi!%20I'm%20interested%20in%20exploring%20your%20collection."
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center h-[48px] px-8 rounded-full bg-white text-black font-body text-[14px] font-medium uppercase tracking-[0.06em] transition-all duration-250 hover:bg-black hover:text-white"
        >
          Explore Collection
        </a>
      </div>

      {/* Scroll Indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-8 left-8 z-10 flex items-center gap-3"
      >
        <div className="relative w-[1px] h-[40px] bg-white/50">
          <div
            className="absolute top-0 left-[-2px] w-[5px] h-[5px] rounded-full bg-white"
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
