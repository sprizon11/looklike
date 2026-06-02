export type OrderCustomer = {
  name: string
  phone: string
  email?: string
  address: string
  city: string
  state?: string
  pincode: string
}

export type OrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
  size: string
  image?: string
}

export type AdminOrder = {
  id: string
  customer: OrderCustomer
  items: OrderItem[]
  amount: number
  currency: string
  status: 'paid' | 'cod'
  paymentMethod?: 'online' | 'cod'
  createdAt: number
  updatedAt: number
}

function apiBase() {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (raw) return raw.replace(/\/+$/, '')
  return ''
}

export async function apiListOrders(): Promise<AdminOrder[]> {
  const res = await fetch(`${apiBase()}/api/orders`)
  if (!res.ok) throw new Error('Failed to load orders')
  const json = (await res.json()) as { orders: AdminOrder[] }
  return json.orders
}

export function formatOrderDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function orderItemsSummary(items: OrderItem[]) {
  return items.map((i) => `${i.name} (${i.size}) x${i.quantity}`).join(', ')
}

export function orderStatusLabel(status: AdminOrder['status']) {
  if (status === 'paid') return 'Paid'
  if (status === 'cod') return 'Cash on Delivery'
  return status
}
