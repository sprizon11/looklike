import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ShoppingBag, Menu, X, Search } from 'lucide-react'
import { cartCount, subscribeCart } from '@/lib/cart-store'
import Logo from '@/components/Logo'

export default function Navigation() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

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

  const runSearch = () => {
    const q = searchQuery.trim()
    if (!q) {
      navigate('/products')
    } else {
      navigate(`/products?q=${encodeURIComponent(q)}`)
    }
    setMobileMenuOpen(false)
  }

  const searchClass = scrolled
    ? 'border-black/15 text-black placeholder:text-black/35'
    : 'border-white/30 text-white placeholder:text-white/50'

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-[12px] border-b border-black/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 md:px-14 flex items-center gap-3 h-[60px]">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="shrink-0 transition-opacity duration-300 hover:opacity-80"
          aria-label="Look Like - Home"
        >
          <Logo variant={scrolled ? 'dark' : 'light'} size="sm" />
        </a>

        <form
          className="hidden md:flex flex-1 max-w-[280px] mx-4"
          onSubmit={(e) => {
            e.preventDefault()
            runSearch()
          }}
        >
          <div className="relative w-full">
            <Search
              size={16}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${scrolled ? 'text-black/35' : 'text-white/50'}`}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dresses…"
              className={`w-full h-[38px] pl-9 pr-3 border font-body text-[13px] focus:outline-none focus:border-black/30 bg-transparent ${searchClass}`}
            />
          </div>
        </form>

        <div className="hidden lg:flex items-center gap-6 ml-auto">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollToSection(link.href)}
              className={`font-body text-[13px] font-medium uppercase tracking-[0.08em] transition-colors duration-300 hover:opacity-70 ${
                scrolled ? 'text-black' : 'text-white'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto lg:ml-0">
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
            className={`lg:hidden p-2 transition-colors duration-400 ${scrolled ? 'text-black' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-[60px] left-0 right-0 bg-white border-b border-black/[0.06] shadow-lg lg:hidden">
          <div className="flex flex-col p-6 gap-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                runSearch()
              }}
            >
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dresses…"
                  className="w-full h-[42px] pl-9 pr-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                />
              </div>
            </form>
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
          </div>
        </div>
      )}
    </nav>
  )
}
