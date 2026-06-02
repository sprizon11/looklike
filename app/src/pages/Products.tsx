import Navigation from '@/sections/Navigation'
import ProductsGrid from '@/sections/ProductsGrid'
import Footer from '@/sections/Footer'

export default function Products() {
  return (
    <div>
      <Navigation />
      <ProductsGrid limit={Number.POSITIVE_INFINITY} showViewAll={false} />
      <Footer />
    </div>
  )
}

