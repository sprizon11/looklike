import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Shirt, Truck, MessageCircle } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    icon: Shirt,
    title: 'Premium Quality',
    description: 'Handpicked fabrics from trusted brands like Liva and Avaassa.',
  },
  {
    icon: Truck,
    title: 'All India Delivery',
    description: 'Fast and reliable shipping to your doorstep anywhere in India.',
  },
  {
    icon: MessageCircle,
    title: 'Easy Ordering',
    description: 'Simply message us on WhatsApp and place your order in seconds.',
  },
]

export default function WhyChooseUs() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)

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

      const items = itemsRef.current?.querySelectorAll('.feature-item')
      if (items) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.15,
            scrollTrigger: { trigger: itemsRef.current, start: 'top 85%' },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="bg-black py-[100px] px-[30px] md:px-[60px]">
      <div className="max-w-[1440px] mx-auto">
        <h2
          ref={titleRef}
          className="font-display text-[36px] font-normal text-center text-white mb-[60px]"
        >
          Why Choose <span className="gold-text">Look Like</span>
        </h2>

        <div ref={itemsRef} className="grid grid-cols-1 md:grid-cols-3 gap-[40px]">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="feature-item flex flex-col items-center text-center">
                <div className="w-[58px] h-[58px] flex items-center justify-center rounded-full border border-gold/40 bg-gold/5">
                  <Icon size={24} strokeWidth={1.5} className="text-gold-light" />
                </div>
                <h3 className="font-body text-[18px] font-medium text-white mt-5">
                  {feature.title}
                </h3>
                <p className="font-body text-[14px] font-normal leading-[1.6] text-white/60 mt-3 max-w-[300px]">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
