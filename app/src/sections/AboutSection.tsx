import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, y: 60, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
        }
      )

      const contentEls = contentRef.current?.querySelectorAll('.about-animate')
      if (contentEls) {
        gsap.fromTo(
          contentEls,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.12,
            scrollTrigger: { trigger: contentRef.current, start: 'top 85%' },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section id="about" ref={sectionRef} className="bg-[#f7f7f7] py-[140px] px-[30px] md:px-[60px]">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col md:flex-row gap-[60px] items-center">
          {/* Image */}
          <div ref={imageRef} className="w-full md:w-[45%]">
            <img
              src="/images/about-portrait.jpg"
              alt="About Look Like"
              className="w-full aspect-[4/5] object-cover"
            />
          </div>

          {/* Content */}
          <div ref={contentRef} className="w-full md:w-[55%] flex flex-col justify-center">
            <span className="about-animate font-body text-[12px] font-normal uppercase tracking-[0.12em] text-black/40">
              ABOUT US
            </span>
            <h2 className="about-animate font-display text-[42px] font-normal leading-[1.15] tracking-[-0.01em] text-black mt-4">
              Style That Speaks to You
            </h2>
            <p className="about-animate font-body text-[16px] font-normal leading-[1.7] text-[#212121] mt-6 max-w-[520px]">
              Look Like is Tirupur&apos;s destination for modern ladies wear. We bring you carefully curated kurtis from premium brands like Liva and Avaassa, alongside our signature leggings and palazzo collections. Every piece is chosen with care — because we believe great style should feel effortless.
            </p>
            <div className="about-animate mt-8" />
          </div>
        </div>
      </div>
    </section>
  )
}
