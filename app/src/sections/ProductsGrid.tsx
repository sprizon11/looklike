import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useProducts } from '@/hooks/use-products'
import { scrollPageToTop } from '@/lib/scroll-page-top'
import SmartImage from '@/components/SmartImage'

gsap.registerPlugin(ScrollTrigger)

type Props = {
  limit?: number
  showViewAll?: boolean
  showFilters?: boolean
}

type PriceRange = 'all' | 'under-300' | '300-499' | '500-799' | '800-plus'

const PRICE_OPTIONS: { value: PriceRange; label: string }[] = [
  { value: 'all', label: 'All prices' },
  { value: 'under-300', label: 'Under Rs. 300' },
  { value: '300-499', label: 'Rs. 300 – 499' },
  { value: '500-799', label: 'Rs. 500 – 799' },
  { value: '800-plus', label: 'Rs. 800+' },
]

function matchesCategory(category: string, filter: string) {
  if (filter === 'all') return true
  return category.trim().toLowerCase() === filter.trim().toLowerCase()
}

function buildCategoryFilterOptions(products: { category: string }[]) {
  const opts: { value: string; label: string }[] = [{ value: 'all', label: 'All' }]
  const seen = new Set<string>()
  for (const p of products) {
    const label = p.category?.trim()
    if (!label) continue
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    opts.push({ value: label, label })
  }
  return opts
}

function matchesPrice(price: number, range: PriceRange) {
  if (range === 'all') return true
  if (range === 'under-300') return price < 300
  if (range === '300-499') return price >= 300 && price <= 499
  if (range === '500-799') return price >= 500 && price <= 799
  if (range === '800-plus') return price >= 800
  return true
}

export default function ProductsGrid({
  limit = 8,
  showViewAll = true,
  showFilters = true,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { products } = useProducts()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlQuery = searchParams.get('q') || ''
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState<PriceRange>('all')
  const [localSearch, setLocalSearch] = useState('')

  useEffect(() => {
    if (urlQuery) setLocalSearch(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    if (reduceMotion) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
        }
      )

      const cards = gridRef.current?.querySelectorAll('.product-card')
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.1,
            scrollTrigger: { trigger: gridRef.current, start: 'top 85%' },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const goToProduct = (productId: string) => {
    scrollPageToTop()
    navigate(`/product/${productId}`)
  }

  const sorted = useMemo(
    () => [...products].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [products]
  )

  const categoryOptions = useMemo(() => buildCategoryFilterOptions(sorted), [sorted])

  const searchTerm = (localSearch || urlQuery).trim().toLowerCase()

  const filtered = useMemo(() => {
    return sorted.filter((p) => {
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm)) return false
      if (!matchesCategory(p.category, categoryFilter)) return false
      if (!matchesPrice(p.price, priceFilter)) return false
      return true
    })
  }, [sorted, searchTerm, categoryFilter, priceFilter])

  const visible = Number.isFinite(limit) ? filtered.slice(0, Math.max(0, limit)) : filtered
  const canViewAll = showViewAll && sorted.length > 0

  useEffect(() => {
    const links: HTMLLinkElement[] = []
    for (const product of visible.slice(0, 4)) {
      if (!product.image) continue
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = product.image
      document.head.appendChild(link)
      links.push(link)
    }
    return () => {
      for (const link of links) link.remove()
    }
  }, [visible])

  return (
    <section id="products" ref={sectionRef} className="bg-white py-16 sm:py-20 md:py-24 px-5 sm:px-8 md:px-14">
      <div className="max-w-[1440px] mx-auto">
        <div ref={headerRef} className="mb-8 sm:mb-10">
          <p className="font-body text-[11px] uppercase tracking-[0.18em] text-gold-dark">The Collection</p>
          <h2 className="font-display text-[34px] sm:text-[40px] font-normal text-black mt-2 leading-[1.1] tracking-[-0.02em]">
            Our Products
          </h2>
          <div className="gold-divider mt-5 w-[120px]" />

          {showFilters && (
            <div className="mt-6 flex flex-col gap-4">
              <input
                type="search"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full sm:max-w-[320px] h-[42px] px-4 border border-black/10 font-body text-[13px] text-black placeholder:text-black/30 focus:outline-none focus:border-black/30"
              />

              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategoryFilter(opt.value)}
                    className={`h-[36px] px-4 font-body text-[12px] uppercase tracking-[0.06em] border transition-colors ${
                      categoryFilter === opt.value
                        ? 'bg-black text-gold-light border-black'
                        : 'border-black/15 text-black/60 hover:border-gold hover:text-gold-dark'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {PRICE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriceFilter(opt.value)}
                    className={`h-[36px] px-4 font-body text-[12px] uppercase tracking-[0.06em] border transition-colors ${
                      priceFilter === opt.value
                        ? 'bg-black text-gold-light border-black'
                        : 'border-black/15 text-black/60 hover:border-gold hover:text-gold-dark'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {visible.length === 0 ? (
          <p className="font-body text-[14px] text-black/50 py-8">No products match your filters.</p>
        ) : (
          <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {visible.map((product, idx) => (
              <div key={product.id} className="product-card group">
                <button
                  type="button"
                  onClick={() => goToProduct(product.id)}
                  className="relative block w-full overflow-hidden bg-[#f7f7f7] aspect-[3/4] cursor-pointer text-left"
                  aria-label={`View ${product.name}`}
                >
                  <SmartImage
                    src={product.image}
                    alt={product.name}
                    priority={idx < 4}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="w-full h-full object-cover ease-out group-hover:scale-105"
                  />
                </button>
                <div className="mt-3">
                  <button
                    onClick={() => goToProduct(product.id)}
                    className="font-body text-[15px] font-medium text-[#212121] text-left transition-colors hover:text-gold-dark"
                  >
                    {product.name}
                  </button>
                  <p className="font-body text-[14px] font-semibold text-gold-dark mt-1">Rs. {product.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {canViewAll && (
          <div className="mt-10 sm:mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="inline-flex items-center h-[46px] px-8 rounded-full bg-black text-gold-light font-body text-[13px] font-medium uppercase tracking-[0.08em] border border-gold/40 transition-all hover:bg-gold-gradient hover:text-black hover:border-transparent"
            >
              View All Products
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
