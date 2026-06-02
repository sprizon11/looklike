import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
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
} from 'lucide-react'
import { useProducts } from '@/hooks/use-products'
import type { Product } from '@/lib/products-store'

const ADMIN_PASSWORD = 'admin123'

type Tab = 'dashboard' | 'products' | 'orders' | 'customers' | 'settings'

const ordersData = [
  { id: '#ORD-001', customer: 'Priya S.', product: 'Side Open Kurti - Liva', date: '2025-05-28', status: 'Completed', amount: 599 },
  { id: '#ORD-002', customer: 'Anitha M.', product: 'Ankle Length Leggings', date: '2025-05-29', status: 'Pending', amount: 299 },
  { id: '#ORD-003', customer: 'Deepa R.', product: 'Premium Palazzo Pants', date: '2025-05-30', status: 'Processing', amount: 399 },
  { id: '#ORD-004', customer: 'Lakshmi K.', product: 'Embroidered Party Kurti', date: '2025-05-30', status: 'Completed', amount: 899 },
  { id: '#ORD-005', customer: 'Meena T.', product: 'Flared Palazzo - Solid', date: '2025-06-01', status: 'Pending', amount: 449 },
  { id: '#ORD-006', customer: 'Sneha V.', product: 'Printed Casual Kurti', date: '2025-06-01', status: 'Processing', amount: 499 },
]

const customersData = [
  { id: 1, name: 'Priya S.', phone: '+91 98765 43210', orders: 5, total: 3247 },
  { id: 2, name: 'Anitha M.', phone: '+91 87654 32109', orders: 3, total: 1846 },
  { id: 3, name: 'Deepa R.', phone: '+91 76543 21098', orders: 4, total: 2156 },
  { id: 4, name: 'Lakshmi K.', phone: '+91 65432 10987', orders: 2, total: 1398 },
  { id: 5, name: 'Meena T.', phone: '+91 54321 09876', orders: 1, total: 449 },
]

export default function Admin() {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const { products, addProduct, updateProduct, deleteProduct } = useProducts()
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productError, setProductError] = useState('')
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Kurti',
    price: '0',
    stock: '0',
    size: '',
    description: '',
    image: '' as string, // data URL or path
  })

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
      setProductError('Please upload a product image')
      return
    }

    setProductError('')
    if (editingProduct) {
      await updateProduct(editingProduct.id, { name, category, price, stock, image, size, description })
    } else {
      await addProduct({ name, category, price, stock, image, size, description })
    }
    closeProductModal()
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
          <div className="text-center mb-10">
            <h1 className="font-display text-[28px] font-medium tracking-[0.1em] text-black">
              LOOK LIKE
            </h1>
            <p className="font-body text-[12px] uppercase tracking-[0.1em] text-black/40 mt-1">
              LADIES WEAR - ADMIN
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-body text-[13px] font-medium uppercase tracking-[0.06em] text-black/60">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter admin password"
                className="w-full mt-2 h-[48px] px-4 border border-black/10 font-body text-[14px] text-black placeholder:text-black/30 focus:outline-none focus:border-black/30 transition-colors"
              />
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
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const totalRevenue = ordersData.reduce((sum, o) => sum + o.amount, 0)
  const pendingOrders = ordersData.filter((o) => o.status === 'Pending').length

  const statusBadge = (status: string) => {
    const classes: Record<string, string> = {
      Completed: 'bg-green-100 text-green-700',
      Pending: 'bg-yellow-100 text-yellow-700',
      Processing: 'bg-gray-100 text-gray-700',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-[12px] font-medium ${classes[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-[260px] min-h-screen bg-black flex flex-col fixed left-0 top-0">
        <div className="p-6">
          <h1 className="font-display text-[20px] font-medium tracking-[0.1em] text-white">
            LOOK LIKE
          </h1>
          <p className="font-body text-[11px] uppercase tracking-[0.1em] text-white/40 mt-1">
            ADMIN PANEL
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
          <h2 className="font-display text-[28px] font-normal text-black capitalize">
            {activeTab}
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
                { label: 'TOTAL PRODUCTS', value: products.length, icon: Box, change: '+3 this week' },
                { label: 'TOTAL ORDERS', value: ordersData.length, icon: ShoppingCart, change: '+2 today' },
                { label: 'REVENUE THIS MONTH', value: `Rs. ${totalRevenue.toLocaleString()}`, icon: DollarSign, change: '+12% from last' },
                { label: 'PENDING ORDERS', value: pendingOrders, icon: Clock, change: 'Needs attention' },
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
                      {['Order ID', 'Customer', 'Product', 'Date', 'Status', 'Amount'].map((h) => (
                        <th key={h} className="text-left px-6 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-black/40 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ordersData.slice(0, 5).map((order) => (
                      <tr key={order.id} className="border-b border-black/[0.04] hover:bg-black/[0.01]">
                        <td className="px-6 py-4 font-body text-[13px] text-black/60">{order.id}</td>
                        <td className="px-6 py-4 font-body text-[13px] text-black">{order.customer}</td>
                        <td className="px-6 py-4 font-body text-[13px] text-black/60">{order.product}</td>
                        <td className="px-6 py-4 font-body text-[13px] text-black/40">{order.date}</td>
                        <td className="px-6 py-4">{statusBadge(order.status)}</td>
                        <td className="px-6 py-4 font-body text-[13px] font-medium text-black">Rs. {order.amount}</td>
                      </tr>
                    ))}
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

        {/* Orders */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              {['All', 'Pending', 'Processing', 'Completed'].map((filter) => (
                <button
                  key={filter}
                  className="h-[36px] px-4 font-body text-[12px] uppercase tracking-[0.06em] border border-black/10 text-black/60 hover:border-black/30 hover:text-black transition-colors"
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="bg-white border border-black/[0.08] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    {['Order ID', 'Customer', 'Product', 'Date', 'Status', 'Amount'].map((h) => (
                      <th key={h} className="text-left px-6 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-black/40 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordersData.map((order) => (
                    <tr key={order.id} className="border-b border-black/[0.04] hover:bg-black/[0.01]">
                      <td className="px-6 py-4 font-body text-[13px] text-black/60">{order.id}</td>
                      <td className="px-6 py-4 font-body text-[13px] text-black">{order.customer}</td>
                      <td className="px-6 py-4 font-body text-[13px] text-black/60">{order.product}</td>
                      <td className="px-6 py-4 font-body text-[13px] text-black/40">{order.date}</td>
                      <td className="px-6 py-4">{statusBadge(order.status)}</td>
                      <td className="px-6 py-4 font-body text-[13px] font-medium text-black">Rs. {order.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers */}
        {activeTab === 'customers' && (
          <div className="bg-white border border-black/[0.08] overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  {['ID', 'Name', 'Phone', 'Orders', 'Total Spent'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 font-body text-[11px] uppercase tracking-[0.08em] text-black/40 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customersData.map((customer) => (
                  <tr key={customer.id} className="border-b border-black/[0.04] hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-body text-[13px] text-black/40">#{customer.id}</td>
                    <td className="px-6 py-4 font-body text-[13px] text-black">{customer.name}</td>
                    <td className="px-6 py-4 font-body text-[13px] text-black/60">{customer.phone}</td>
                    <td className="px-6 py-4 font-body text-[13px] text-black">{customer.orders}</td>
                    <td className="px-6 py-4 font-body text-[13px] font-medium text-black">Rs. {customer.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <div className="relative w-full max-w-[520px] bg-white border border-black/[0.12] p-6">
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
                    const dataUrl = await toDataUrl(file)
                    setProductForm((s) => ({ ...s, image: dataUrl }))
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
                onClick={submitProduct}
                className="h-[40px] px-4 bg-black text-white font-body text-[13px] font-medium uppercase tracking-[0.04em] hover:bg-black/90 transition-colors"
              >
                {editingProduct ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
