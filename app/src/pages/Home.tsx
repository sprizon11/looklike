import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Navigation from '@/sections/Navigation'
import Hero from '@/sections/Hero'
import FeaturedCollection from '@/sections/FeaturedCollection'
import ProductsGrid from '@/sections/ProductsGrid'
import AboutSection from '@/sections/AboutSection'
import WhyChooseUs from '@/sections/WhyChooseUs'
import Testimonials from '@/sections/Testimonials'
import ShopCTA from '@/sections/ShopCTA'
import ShippingInfo from '@/sections/ShippingInfo'
import Footer from '@/sections/Footer'

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      duration: 1.2,
      smoothWheel: true,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000)
      })
    }
  }, [])

  return (
    <div>
      <Navigation />
      <Hero />
      <FeaturedCollection />
      <ProductsGrid />
      <AboutSection />
      <WhyChooseUs />
      <Testimonials />
      <ShopCTA />
      <ShippingInfo />
      <Footer />
    </div>
  )
}
