import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import { repairCartStorage } from '@/lib/cart-store'
import Home from './pages/Home'
import WhatsAppFloat from './components/WhatsAppFloat'

// Code-split heavy/secondary routes so the storefront loads fast.
const Admin = lazy(() => import('./pages/Admin'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const FeaturedDetail = lazy(() => import('./pages/FeaturedDetail'))
const Products = lazy(() => import('./pages/Products'))

function RouteFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-black/10 border-t-gold animate-spin" aria-label="Loading" />
    </div>
  )
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, hash])

  return null
}

export default function App() {
  useEffect(() => {
    repairCartStorage()
  }, [])

  return (
    <>
    <ScrollToTop />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/featured/:id" element={<FeaturedDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Suspense>
    <WhatsAppFloat />
    </>
  )
}
