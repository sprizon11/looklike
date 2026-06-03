import { getApiBase } from '@/lib/api-base'

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
  status: 'paid' | 'cod' | 'upi'
  paymentMethod?: 'online' | 'cod' | 'upi'
  upiReference?: string
  paymentProof?: string
  createdAt: number
  updatedAt: number
}

function apiBase() {
  return getApiBase()
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
  if (status === 'upi') return 'UPI'
  return status
}
