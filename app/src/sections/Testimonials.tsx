import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const testimonials = [
  {
    quote: 'The kurtis from Look Like are absolutely gorgeous! The fabric quality is amazing and the fit is perfect.',
    name: 'Priya S.',
    location: 'Tirupur',
  },
  {
    quote: "I keep coming back for their leggings. So comfortable and the colors don't fade even after many washes.",
    name: 'Anitha M.',
    location: 'Coimbatore',
  },
  {
    quote: 'Love their palazzo collection! Stylish, comfortable, and so affordable. Highly recommend!',
    name: 'Deepa R.',
    location: 'Erode',
  },
]

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
        }
      )

      const cards = cardsRef.current?.querySelectorAll('.testimonial-card')
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.12,
            scrollTrigger: { trigger: cardsRef.current, start: 'top 85%' },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-white py-[120px] px-[30px] md:px-[60px]">
      <div className="max-w-[1440px] mx-auto">
        <h2
          ref={titleRef}
          className="font-display text-[36px] font-normal text-center text-black mb-[60px]"
        >
          What Our Customers Say
        </h2>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-[30px]">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="testimonial-card bg-[#f7f7f7] p-[40px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            >
              <p className="font-body text-[16px] italic font-normal leading-[1.7] text-[#212121]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="font-body text-[14px] font-medium text-black mt-6">
                {t.name}
              </p>
              <p className="font-body text-[13px] font-normal text-black/40">
                {t.location}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
