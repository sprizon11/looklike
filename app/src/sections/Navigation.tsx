import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { cartCount, subscribeCart } from '@/lib/cart-store'

export default function Navigation() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setCount(cartCount())
    return subscribeCart(() => setCount(cartCount()))
  }, [])

  const navLinks = [
    { label: 'SHOP', href: '#products' },
    { label: 'NEW ARRIVALS', href: '#featured' },
    { label: 'COLLECTIONS', href: '#about' },
    { label: 'ABOUT', href: '#about' },
    { label: 'CONTACT', href: '#footer' },
  ]

  const scrollToSection = (href: string) => {
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  const goToAdmin = () => {
    window.location.hash = '#/admin'
    setMobileMenuOpen(false)
  }

  const goToCart = () => {
    navigate('/cart')
    setMobileMenuOpen(false)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center transition-all duration-400 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-[12px] border-b border-black/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full max-w-[1440px] mx-auto px-[30px] md:px-[60px] flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className={`font-display text-[18px] font-medium tracking-[0.1em] uppercase transition-colors duration-400 ${
            scrolled ? 'text-black' : 'text-white'
          }`}
        >
          LOOK LIKE
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollToSection(link.href)}
              className={`font-body text-[14px] font-medium uppercase tracking-[0.08em] transition-colors duration-300 hover:opacity-70 ${
                scrolled ? 'text-black' : 'text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <a
            href="https://wa.me/919344841180?text=Hi!%20I'm%20interested%20in%20your%20collection."
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden sm:inline-flex items-center h-[40px] px-6 rounded-full font-body text-[14px] font-medium uppercase tracking-[0.06em] transition-all duration-250 ${
              scrolled
                ? 'bg-black text-white hover:bg-white hover:text-black hover:border hover:border-black'
                : 'bg-white text-black hover:bg-black hover:text-white hover:border hover:border-white'
            }`}
          >
            ORDER ON WHATSAPP
          </a>
          <button
            onClick={goToCart}
            className={`relative p-2 transition-colors duration-400 ${scrolled ? 'text-black' : 'text-white'}`}
            aria-label="Open cart"
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-medium flex items-center justify-center border border-white">
                {count}
              </span>
            )}
          </button>
          <button
            className={`md:hidden p-2 transition-colors duration-400 ${scrolled ? 'text-black' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-[60px] left-0 right-0 bg-white border-b border-black/[0.06] shadow-lg md:hidden">
          <div className="flex flex-col p-6 gap-4">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="font-body text-[14px] font-medium uppercase tracking-[0.08em] text-black text-left py-2"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={goToAdmin}
              className="font-body text-[14px] font-medium uppercase tracking-[0.08em] text-black text-left py-2"
            >
              ADMIN
            </button>
            <button
              onClick={goToCart}
              className="font-body text-[14px] font-medium uppercase tracking-[0.08em] text-black text-left py-2"
            >
              CART
            </button>
            <a
              href="https://wa.me/919344841180?text=Hi!%20I'm%20interested%20in%20your%20collection."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-[40px] px-6 rounded-full font-body text-[14px] font-medium uppercase tracking-[0.06em] bg-black text-white mt-2"
            >
              ORDER ON WHATSAPP
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
