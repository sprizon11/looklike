import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Star,
  LogOut,
  Search,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  DollarSign,
  Box,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  EyeOff,
} from 'lucide-react'
import Logo from '@/components/Logo'
import { useProducts } from '@/hooks/use-products'
import { useFeatured } from '@/hooks/use-featured'
import type { Product } from '@/lib/products-store'
import type { FeaturedItem } from '@/lib/featured-store'
import {
  apiListOrders,
  formatOrderDate,
  formatOrderTime,
  formatOrderDateTime,
  orderItemsSummary,
  orderStatusLabel,
  type AdminOrder,
} from '@/lib/orders-api'
import { compressImageFile } from '@/lib/compress-image'

const ADMIN_PASSWORD = 'admin123'

type Tab = 'dashboard' | 'products' | 'featured' | 'orders' | 'customers' | 'settings'

export default function Admin() {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const { products, addProduct, updateProduct, deleteProduct } = useProducts()
  const { featured, addFeatured, updateFeatured, deleteFeatured } = useFeatured()
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productError, setProductError] = useState('')
  const [productSaving, setProductSaving] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Kurti',
    price: '0',
    stock: '0',
    size: '',
    description: '',
    image: '' as string,
  })

  const [featuredModalOpen, setFeaturedModalOpen] = useState(false)
  const [editingFeatured, setEditingFeatured] = useState<FeaturedItem | null>(null)
  const [featuredError, setFeaturedError] = useState('')
  const [featuredForm, setFeaturedForm] = useState({
    name: '',
    price: '0',
    fullSize: 'XS, S, M, L, XL, XXL',
    description: '',
    image: '' as string,
  })

  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const list = await apiListOrders()
      setOrders(list)
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authenticated) return
    if (activeTab === 'dashboard' || activeTab === 'orders' || activeTab === 'customers') {
      loadOrders()
    }
  }, [authenticated, activeTab, loadOrders])

  const customersFromOrders = useMemo(() => {
    const map = new Map<
      string,
      { name: string; phone: string; orders: number; total: number; address: string; city: string }
    >()
    for (const o of orders) {
      const key = o.customer.phone
      const prev = map.get(key)
      if (prev) {
        prev.orders += 1
        prev.total += o.amount
      } else {
        map.set(key, {
          name: o.customer.name,
          phone: o.customer.phone,
          orders: 1,
          total: o.amount,
          address: o.customer.address,
          city: o.customer.city,
        })
      }
    }
    return Array.from(map.values())
  }, [orders])

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((o) => {
      const hay = [
        o.id,
        o.customer.name,
        o.customer.phone,
        o.customer.address,
        o.customer.city,
        orderItemsSummary(o.items),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [orders, searchQuery])

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return customersFromOrders
    return customersFromOrders.filter((c) => {
      const hay = [c.name, c.phone, c.address, c.city].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [customersFromOrders, searchQuery])

  const toDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image'))
      reader.readAsDataURL(file)
    })
  }

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        String(p.price).includes(q)
      )
    })
  }, [products, searchQuery])

  const openAddProduct = () => {
    setEditingProduct(null)
    setProductError('')
    setProductForm({
      name: '',
      category: 'Kurti',
      price: '0',
      stock: '0',
      size: '',
      description: '',
      image: '',
    })
    setProductModalOpen(true)
  }

  const openEditProduct = (p: Product) => {
    setEditingProduct(p)
    setProductError('')
    setProductForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      stock: String(p.stock),
      image: p.image,
      size: p.size || '',
      description: p.description || '',
    })
    setProductModalOpen(true)
  }

  const closeProductModal = () => {
    setProductModalOpen(false)
    setEditingProduct(null)
    setProductError('')
  }

  const openAddFeatured = () => {
    if (featured.length >= 2) {
      setFeaturedError('Only 2 New Arrivals are allowed. Please edit an existing item.')
      setFeaturedModalOpen(true)
      return
    }
    setEditingFeatured(null)
    setFeaturedError('')
    setFeaturedForm({
      name: '',
      price: '0',
      fullSize: 'XS, S, M, L, XL, XXL',
      description: '',
      image: '',
    })
    setFeaturedModalOpen(true)
  }

  const openEditFeatured = (f: FeaturedItem) => {
    setEditingFeatured(f)
    setFeaturedError('')
    setFeaturedForm({
      name: f.name,
      price: String(f.price),
      fullSize: f.fullSize,
      description: f.description,
      image: f.image,
    })
    setFeaturedModalOpen(true)
  }

  const closeFeaturedModal = () => {
    setFeaturedModalOpen(false)
    setEditingFeatured(null)
    setFeaturedError('')
  }

  const submitFeatured = () => {
    const name = featuredForm.name.trim()
    const price = Number(featuredForm.price)
    const fullSize = featuredForm.fullSize.trim()
    const description = featuredForm.description.trim()
    const image = featuredForm.image.trim()

    if (!name) return setFeaturedError('Name is required')
    if (!Number.isFinite(price) || price < 0) return setFeaturedError('Price must be valid')
    if (!fullSize) return setFeaturedError('Full size is required')
    if (!description) return setFeaturedError('Description is required')
    if (!image) return setFeaturedError('Please upload an image')

    setFeaturedError('')
    if (!editingFeatured && featured.length >= 2) {
      return setFeaturedError('Only 2 New Arrivals are allowed. Please edit an existing item.')
    }

    if (editingFeatured) {
      updateFeatured(editingFeatured.id, { name, price, fullSize, description, image })
    } else {
      addFeatured({ name, price, fullSize, description, image })
    }
    closeFeaturedModal()
  }

  const submitProduct = async () => {
    const name = productForm.name.trim()
    const category = productForm.category.trim() || 'Other'
    const price = Number(productForm.price)
    const stock = Number(productForm.stock)
    const image = productForm.image.trim()
    const size = productForm.size.trim()
    const description = productForm.description.trim()

    if (!name) {
      setProductError('Product name is required')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setProductError('Price must be a valid number')
      return
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setProductError('Stock must be a valid number')
      return
    }
    if (!image) {
      setProductError('Please upload an image')
      return
    }

    setProductError('')
    setProductSaving(true)
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, { name, category, price, stock, image, size, description })
      } else {
        await addProduct({ name, category, price, stock, image, size, description })
      }
      closeProductModal()
    } catch (e) {
      setProductError(e instanceof Error ? e.message : 'Could not save product. Try a smaller image.')
    } finally {
      setProductSaving(false)
    }
  }

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password')
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    setPassword('')
    setActiveTab('dashboard')
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <div className="flex flex-col items-center mb-10">
            <Logo variant="dark" size="lg" />
            <p className="font-body text-[11px] uppercase tracking-[0.3em] text-black/40 mt-3">
              Admin Panel
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-body text-[13px] font-medium uppercase tracking-[0.06em] text-black/60">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter admin password"
                  className="w-full h-[48px] pl-4 pr-12 border border-black/10 font-body text-[14px] text-black placeholder:text-black/30 focus:outline-none focus:border-black/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-black/40 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
              </div>
            </div>
            {error && (
              <p className="font-body text-[13px] text-red-500">{error}</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full h-[48px] bg-black text-white font-body text-[14px] font-medium uppercase tracking-[0.06em] hover:bg-black/90 transition-colors"
            >
              LOGIN
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 text-center font-body text-[13px] text-black/40 hover:text-black transition-colors flex items-center justify-center gap-1"
          >
            <ChevronLeft size={14} />
            Back to Website
          </button>
        </div>
      </div>
    )
  }

  const sidebarItems: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'featured', label: 'New Arrivals', icon: Star },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0)
  const codOrders = orders.filter((o) => o.status === 'cod').length
  const paidOrders = orders.filter((o) => o.status === 'paid').length
  const upiOrders = orders.filter((o) => o.status === 'upi').length

  const statusBadge = (status: AdminOrder['status']) => {
    const classes: Record<AdminOrder['status'], string> = {
      paid: 'bg-green-100 text-green-700',
      cod: 'bg-amber-100 text-amber-800',
      upi: 'bg-blue-100 text-blue-800',
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-[12px] font-medium ${classes[status]}`}
      >
        {orderStatusLabel(status)}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-[260px] min-h-screen bg-black flex flex-col fixed left-0 top-0">
        <div className="p-6 border-b border-white/10">
          <Logo variant="light" size="sm" align="start" />
          <p className="font-body text-[10px] uppercase tracking-[0.3em] text-white/40 mt-3">
            Admin Panel
          </p>
        </div>

        <nav className="flex-1 mt-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 font-body text-[14px] uppercase tracking-[0.04em] transition-colors ${
                  activeTab === item.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 font-body text-[14px] text-white/60 hover:text-white transition-colors"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[260px] p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-display text-[28px] font-normal text-black">
            {activeTab === 'featured' ? 'New Arrivals' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-[40px] pl-9 pr-4 border border-black/10 font-body text-[13px] text-black placeholder:text-black/30 focus:outline-none focus:border-black/30 w-[240px]"
              />
            </div>
          </div>
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'TOTAL PRODUCTS', value: products.length, icon: Box, change: 'In catalog' },
                { label: 'CONFIRMED ORDERS', value: orders.length, icon: ShoppingCart, change: `${paidOrders} paid · ${upiOrders} UPI · ${codOrders} COD` },
                { label: 'TOTAL REVENUE', value: `Rs. ${totalRevenue.toLocaleString()}`, icon: DollarSign, change: 'Paid + UPI + COD' },
                { label: 'UPI ORDERS', value: upiOrders, icon: Clock, change: 'Verify in GPay / bank' },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="bg-white border border-black/[0.08] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Icon size={20} strokeWidth={1.5} className="text-black/40" />
                      <TrendingUp size={16} strokeWidth={1.5} className="text-black/20" />
                    </div>
                    <p className="font-display text-[32px] font-normal text-black">{stat.value}</p>
                    <p className="font-body text-[12px] uppercase tracking-[0.06em] text-black/40 mt-1">{stat.label}</p>
                    <p className="font-body text-[12px] text-black/30 mt-2">{stat.change}</p>
                  </div>
                )
              })}
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-black/[0.08]">
              <div className="p-6 border-b border-black/[0.06] flex items-center justify-between">
                <h3 className="font-body text-[16px] font-medium text-black">Recent Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50 hover:text-black transition-colors flex items-center gap-1"
                >
                  View All
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/[0.06]">
                      {['Order ID', 'Customer', 'Product', 'Date & time', 'Status', 'Amount'].map((h) => (
                        <th key={h} className="text-left px-6 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-black/40 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 font-body text-[13px] text-black/40 text-center">
                          No confirmed orders yet.
                        </td>
                      </tr>
                    ) : (
                      orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="border-b border-black/[0.04] hover:bg-black/[0.01]">
                          <td className="px-6 py-4 font-body text-[13px] text-black/60">{order.id}</td>
                          <td className="px-6 py-4 font-body text-[13px] text-black">{order.customer.name}</td>
                          <td className="px-6 py-4 font-body text-[13px] text-black/60 max-w-[200px] truncate">
                            {orderItemsSummary(order.items)}
                          </td>
                          <td className="px-6 py-4 font-body text-[13px] text-black/40 whitespace-nowrap">
                            <p>{formatOrderDate(order.createdAt)}</p>
                            <p className="text-[12px] text-black/35 mt-0.5">{formatOrderTime(order.createdAt)}</p>
                          </td>
                          <td className="px-6 py-4">{statusBadge(order.status)}</td>
                          <td className="px-6 py-4 font-body text-[13px] font-medium text-black">Rs. {order.amount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="font-body text-[14px] text-black/50">{filteredProducts.length} products</p>
              <button
                onClick={openAddProduct}
                className="h-[40px] px-4 bg-black text-white font-body text-[13px] font-medium uppercase tracking-[0.04em] hover:bg-black/90 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add Product
              </button>
            </div>

            <div className="bg-white border border-black/[0.08] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    {['Image', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-black/40 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-black/[0.04] hover:bg-black/[0.01]">
                      <td className="px-6 py-3">
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-cover" />
                      </td>
                      <td className="px-6 py-4 font-body text-[13px] text-black">{product.name}</td>
                      <td className="px-6 py-4">
                        <span className="font-body text-[12px] uppercase tracking-[0.04em] px-2 py-1 bg-black/[0.04] text-black/60">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-body text-[13px] text-black">Rs. {product.price}</td>
                      <td className="px-6 py-4 font-body text-[13px] text-black/60">{product.stock} units</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditProduct(product)}
                            className="p-1.5 hover:bg-black/[0.04] transition-colors"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil size={14} className="text-black/40" />
                          </button>
                          <button
                            onClick={() => {
                              const ok = window.confirm(`Delete "${product.name}"?`)
                              if (ok) deleteProduct(product.id)
                            }}
                            className="p-1.5 hover:bg-red-50 transition-colors"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* New Arrivals */}
        {activeTab === 'featured' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="font-body text-[14px] text-black/50">{featured.length} new arrival items</p>
              <button
                onClick={openAddFeatured}
                disabled={featured.length >= 2}
                className="h-[40px] px-4 bg-black text-white font-body text-[13px] font-medium uppercase tracking-[0.04em] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/90 disabled:hover:bg-black"
              >
                <Plus size={16} />
                Add New Arrival
              </button>
            </div>

            {featured.length >= 2 && (
              <p className="font-body text-[13px] text-black/40">
                Limit reached (2/2). You can edit existing New Arrivals to change the dresses.
              </p>
            )}

            <div className="bg-white border border-black/[0.08] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    {['Image', 'Name', 'Price', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-black/40 font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featured.map((f) => (
                    <tr key={f.id} className="border-b border-black/[0.04] hover:bg-black/[0.01]">
                      <td className="px-6 py-3">
                        <img src={f.image} alt={f.name} className="w-10 h-10 object-cover" />
                      </td>
                      <td className="px-6 py-4 font-body text-[13px] text-black">{f.name}</td>
                      <td className="px-6 py-4 font-body text-[13px] text-black">Rs. {f.price}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditFeatured(f)}
                            className="p-1.5 hover:bg-black/[0.04] transition-colors"
                            aria-label={`Edit ${f.name}`}
                          >
                            <Pencil size={14} className="text-black/40" />
                          </button>
                          <button
                            onClick={() => {
                              const ok = window.confirm(`Delete new arrival "${f.name}"?`)
                              if (ok) deleteFeatured(f.id)
                            }}
                            className="p-1.5 hover:bg-red-50 transition-colors"
                            aria-label={`Delete ${f.name}`}
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {featured.length === 0 && (
                <div className="p-6">
                  <p className="font-body text-[13px] text-black/40">No new arrivals yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <p className="font-body text-[13px] text-black/50">
              UPI orders include payment screenshots. Verify payment before dispatching.
            </p>

            {ordersLoading ? (
              <p className="font-body text-[14px] text-black/50">Loading orders…</p>
            ) : (
              <>
                <div className="bg-white border border-black/[0.08] overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-black/[0.06]">
                        {['Order ID', 'Items', 'Customer', 'Phone', 'Payment', 'Amount', 'Date & time'].map((h) => (
                          <th
                            key={h}
                            className="text-left px-6 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-black/40 font-medium"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 font-body text-[13px] text-black/40 text-center">
                            No orders found.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className="border-b border-black/[0.04] hover:bg-black/[0.02] cursor-pointer"
                          >
                            <td className="px-6 py-4 font-body text-[13px] text-black/60 max-w-[140px] truncate">
                              {order.id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <div
                                    key={`${order.id}-${idx}`}
                                    className="w-10 h-12 bg-[#f7f7f7] border border-black/[0.06] overflow-hidden shrink-0"
                                  >
                                    {item.image ? (
                                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-black/[0.04]" />
                                    )}
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <span className="font-body text-[11px] text-black/40">+{order.items.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-body text-[13px] text-black">{order.customer.name}</td>
                            <td className="px-6 py-4 font-body text-[13px] text-black/60">{order.customer.phone}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                {statusBadge(order.status)}
                                {order.paymentProof && (
                                  <span className="font-body text-[10px] uppercase tracking-[0.06em] text-green-700">
                                    Screenshot
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-body text-[13px] font-medium text-black">Rs. {order.amount}</td>
                            <td className="px-6 py-4 font-body text-[13px] text-black/40 whitespace-nowrap">
                              <p>{formatOrderDate(order.createdAt)}</p>
                              <p className="text-[12px] text-black/35 mt-0.5">{formatOrderTime(order.createdAt)}</p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedOrder && (
                  <div className="bg-white border border-black/[0.08] p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-body text-[16px] font-medium text-black">Order details</h3>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50 hover:text-black"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 font-body text-[13px]">
                      <div className="space-y-2">
                        <p className="text-black/40 uppercase text-[11px] tracking-[0.08em]">Customer</p>
                        <p className="text-black">{selectedOrder.customer.name}</p>
                        <p className="text-black/70">{selectedOrder.customer.phone}</p>
                        {selectedOrder.customer.email && (
                          <p className="text-black/70">{selectedOrder.customer.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-black/40 uppercase text-[11px] tracking-[0.08em]">Delivery address</p>
                        <p className="text-black/80">{selectedOrder.customer.address}</p>
                        <p className="text-black/70">
                          {selectedOrder.customer.city}
                          {selectedOrder.customer.state ? `, ${selectedOrder.customer.state}` : ''} –{' '}
                          {selectedOrder.customer.pincode}
                        </p>
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <p className="text-black/40 uppercase text-[11px] tracking-[0.08em]">Items</p>
                        <ul className="space-y-3">
                          {selectedOrder.items.map((item, idx) => (
                            <li key={idx} className="flex gap-4 items-start">
                              <div className="w-16 h-20 bg-[#f7f7f7] border border-black/[0.06] overflow-hidden shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-black/[0.04]" />
                                )}
                              </div>
                              <div>
                                <p className="text-black font-medium">{item.name}</p>
                                <p className="text-black/60 mt-0.5">
                                  Size {item.size} · Qty {item.quantity} · Rs. {item.price * item.quantity}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-black/40 uppercase text-[11px] tracking-[0.08em]">Order placed</p>
                        <p className="mt-1 text-black">{formatOrderDateTime(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-black/40 uppercase text-[11px] tracking-[0.08em]">Payment</p>
                        <p className="mt-1">{statusBadge(selectedOrder.status)}</p>
                        {selectedOrder.upiReference && (
                          <p className="mt-2 text-black/70">UPI ref: {selectedOrder.upiReference}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-black/40 uppercase text-[11px] tracking-[0.08em]">Total</p>
                        <p className="mt-1 text-black font-medium">Rs. {selectedOrder.amount}</p>
                      </div>
                      {selectedOrder.paymentProof && (
                        <div className="md:col-span-2 space-y-2">
                          <p className="text-black/40 uppercase text-[11px] tracking-[0.08em]">Payment screenshot</p>
                          <a
                            href={selectedOrder.paymentProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={selectedOrder.paymentProof}
                              alt="UPI payment proof"
                              className="max-w-full max-h-[320px] border border-black/[0.08] object-contain bg-[#f7f7f7]"
                            />
                          </a>
                          <p className="text-black/40 font-body text-[12px]">Tap image to open full size</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Customers */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <p className="font-body text-[13px] text-black/50">
              Customers are built from confirmed orders (Paid + Cash on Delivery).
            </p>
            <div className="bg-white border border-black/[0.08] overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    {['Name', 'Phone', 'City', 'Address', 'Orders', 'Total Spent'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-black/40 font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 font-body text-[13px] text-black/40 text-center">
                        No customers yet.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.phone} className="border-b border-black/[0.04] hover:bg-black/[0.01]">
                        <td className="px-6 py-4 font-body text-[13px] text-black">{customer.name}</td>
                        <td className="px-6 py-4 font-body text-[13px] text-black/60">{customer.phone}</td>
                        <td className="px-6 py-4 font-body text-[13px] text-black/60">{customer.city}</td>
                        <td className="px-6 py-4 font-body text-[12px] text-black/50 max-w-[200px] truncate">
                          {customer.address}
                        </td>
                        <td className="px-6 py-4 font-body text-[13px] text-black">{customer.orders}</td>
                        <td className="px-6 py-4 font-body text-[13px] font-medium text-black">
                          Rs. {customer.total.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-[600px] space-y-6">
            <div className="bg-white border border-black/[0.08] p-6">
              <h3 className="font-body text-[16px] font-medium text-black mb-4">Shop Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Shop Name</label>
                  <input type="text" defaultValue="Look Like" className="w-full mt-1 h-[40px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30" />
                </div>
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">GST Number</label>
                  <input type="text" defaultValue="33CSRPT6961N1ZM" className="w-full mt-1 h-[40px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30" />
                </div>
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">WhatsApp Number</label>
                  <input type="text" defaultValue="+91 93448 41180" className="w-full mt-1 h-[40px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30" />
                </div>
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Address</label>
                  <textarea defaultValue="31/10A, Jawahar Nagar, Kongu Main Road, Tirupur, Tamil Nadu" rows={3} className="w-full mt-1 px-3 py-2 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30 resize-none" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-black/[0.08] p-6">
              <h3 className="font-body text-[16px] font-medium text-black mb-4">Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Current Password</label>
                  <input type="password" placeholder="Enter current password" className="w-full mt-1 h-[40px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30" />
                </div>
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">New Password</label>
                  <input type="password" placeholder="Enter new password" className="w-full mt-1 h-[40px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30" />
                </div>
              </div>
            </div>

            <button className="h-[44px] px-6 bg-black text-white font-body text-[13px] font-medium uppercase tracking-[0.04em] hover:bg-black/90 transition-colors">
              Save Changes
            </button>
          </div>
        )}
      </main>

      {/* Add/Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={closeProductModal}
            aria-label="Close modal"
          />
          <div className="relative w-full max-w-[520px] bg-white border border-black/[0.12] max-h-[85vh] overflow-y-auto">
            <div className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="font-display text-[22px] font-normal text-black">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h3>
                <p className="font-body text-[12px] text-black/40 mt-1">
                  Changes will show on the website instantly.
                </p>
              </div>
              <button
                className="p-2 hover:bg-black/[0.04] transition-colors"
                onClick={closeProductModal}
                aria-label="Close"
              >
                <X size={18} className="text-black/50" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Name</label>
                <input
                  value={productForm.name}
                  onChange={(e) => setProductForm((s) => ({ ...s, name: e.target.value }))}
                  className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                  placeholder="Product name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Category</label>
                  <input
                    value={productForm.category}
                    onChange={(e) => setProductForm((s) => ({ ...s, category: e.target.value }))}
                    className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                    placeholder="Kurti / Leggings / Palazzo"
                  />
                </div>
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Price (Rs.)</label>
                  <input
                    inputMode="numeric"
                    value={productForm.price}
                    onChange={(e) => setProductForm((s) => ({ ...s, price: e.target.value }))}
                    className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                    placeholder="599"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Stock</label>
                  <input
                    inputMode="numeric"
                    value={productForm.stock}
                    onChange={(e) => setProductForm((s) => ({ ...s, stock: e.target.value }))}
                    className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                    placeholder="24"
                  />
                </div>
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Size</label>
                  <input
                    value={productForm.size}
                    onChange={(e) => setProductForm((s) => ({ ...s, size: e.target.value }))}
                    className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                    placeholder="S, M, L, XL"
                  />
                </div>
              </div>

              <div>
                <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm((s) => ({ ...s, description: e.target.value }))}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30 resize-none"
                  placeholder="Write a short product description..."
                />
              </div>

              <div>
                <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Image Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full mt-2 font-body text-[13px]"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      setProductError('')
                      const dataUrl = await compressImageFile(file)
                      setProductForm((s) => ({ ...s, image: dataUrl }))
                    } catch {
                      setProductError('Could not use that image. Try a JPG or PNG under 5 MB.')
                    }
                  }}
                />
                <div className="mt-3 flex items-center gap-4">
                  <div className="w-14 h-14 bg-black/[0.04] border border-black/[0.06] overflow-hidden">
                    {productForm.image ? (
                      <img
                        src={productForm.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <p className="font-body text-[12px] text-black/40">
                    {productForm.image ? 'Image selected' : 'No image selected'}
                  </p>
                </div>
              </div>

              {productError && <p className="font-body text-[13px] text-red-500">{productError}</p>}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeProductModal}
                className="h-[40px] px-4 border border-black/10 font-body text-[13px] uppercase tracking-[0.06em] text-black/60 hover:text-black hover:border-black/30 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={productSaving}
                onClick={submitProduct}
                className="h-[40px] px-4 bg-black text-white font-body text-[13px] font-medium uppercase tracking-[0.04em] hover:bg-black/90 transition-colors disabled:opacity-60"
              >
                {productSaving ? 'Saving…' : editingProduct ? 'Save' : 'Add'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit New Arrival Modal */}
      {featuredModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
          <button className="absolute inset-0 bg-black/50" onClick={closeFeaturedModal} aria-label="Close modal" />
          <div className="relative w-full max-w-[520px] bg-white border border-black/[0.12] max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="font-display text-[22px] font-normal text-black">
                    {editingFeatured ? 'Edit New Arrival' : 'Add New Arrival'}
                  </h3>
                  <p className="font-body text-[12px] text-black/40 mt-1">This appears in the New Arrivals section on the homepage.</p>
                </div>
                <button className="p-2 hover:bg-black/[0.04] transition-colors" onClick={closeFeaturedModal} aria-label="Close">
                  <X size={18} className="text-black/50" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Name</label>
                  <input
                    value={featuredForm.name}
                    onChange={(e) => setFeaturedForm((s) => ({ ...s, name: e.target.value }))}
                    className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                    placeholder="Item name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Price (Rs.)</label>
                    <input
                      inputMode="numeric"
                      value={featuredForm.price}
                      onChange={(e) => setFeaturedForm((s) => ({ ...s, price: e.target.value }))}
                      className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                      placeholder="899"
                    />
                  </div>
                  <div>
                    <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Full Size</label>
                    <input
                      value={featuredForm.fullSize}
                      onChange={(e) => setFeaturedForm((s) => ({ ...s, fullSize: e.target.value }))}
                      className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                      placeholder="XS, S, M, L, XL, XXL"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Description</label>
                  <textarea
                    value={featuredForm.description}
                    onChange={(e) => setFeaturedForm((s) => ({ ...s, description: e.target.value }))}
                    rows={4}
                    className="w-full mt-1 px-3 py-2 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30 resize-none"
                    placeholder="Write description..."
                  />
                </div>

                <div>
                  <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Image Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full mt-2 font-body text-[13px]"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const dataUrl = await toDataUrl(file)
                      setFeaturedForm((s) => ({ ...s, image: dataUrl }))
                    }}
                  />
                  <div className="mt-3 flex items-center gap-4">
                    <div className="w-14 h-14 bg-black/[0.04] border border-black/[0.06] overflow-hidden">
                      {featuredForm.image ? (
                        <img src={featuredForm.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <p className="font-body text-[12px] text-black/40">
                      {featuredForm.image ? 'Image selected' : 'No image selected'}
                    </p>
                  </div>
                </div>

                {featuredError && <p className="font-body text-[13px] text-red-500">{featuredError}</p>}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={closeFeaturedModal}
                  className="h-[40px] px-4 border border-black/10 font-body text-[13px] uppercase tracking-[0.06em] text-black/60 hover:text-black hover:border-black/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeatured}
                  className="h-[40px] px-4 bg-black text-white font-body text-[13px] font-medium uppercase tracking-[0.04em] hover:bg-black/90 transition-colors"
                >
                  {editingFeatured ? 'Save' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
