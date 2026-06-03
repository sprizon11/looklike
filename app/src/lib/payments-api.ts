import type { CartItem } from '@/lib/cart-store'
import type { OrderNotifyInfo } from '@/lib/shop-contact'

export type CheckoutCustomer = {
  name: string
  phone: string
  email?: string
  address: string
  city: string
  state?: string
  pincode: string
}

export type PaymentConfig = {
  razorpay: { enabled: boolean; keyId: string | null }
  upi: { enabled: boolean; upiId: string | null; payeeName: string }
}

export type OrderPlacedResponse = OrderNotifyInfo & {
  ok: boolean
  orderId: string
}

export type UpiOrderResponse = {
  ok: boolean
  orderId: string
  amount: number
  currency: string
  upiId: string
  payeeName: string
  upiUri: string
}

function apiBase() {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (raw) return raw.replace(/\/+$/, '')
  return ''
}

async function paymentFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const json = (await res.json()) as { error?: string }
      if (json.error) message = json.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return res
}

function mapCartItems(items: CartItem[]) {
  return items.map((i) => ({
    productId: i.productId,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    size: i.size,
    image: i.image,
  }))
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const res = await paymentFetch('/api/payments/config')
  return res.json() as Promise<PaymentConfig>
}

export async function createUpiOrder(input: {
  customer: CheckoutCustomer
  items: CartItem[]
}) {
  const res = await paymentFetch('/api/orders/upi', {
    method: 'POST',
    body: JSON.stringify({
      customer: input.customer,
      items: mapCartItems(input.items),
    }),
  })
  return res.json() as Promise<UpiOrderResponse>
}

export async function confirmUpiOrder(input: { orderId: string; upiReference?: string }) {
  const res = await paymentFetch(`/api/orders/${encodeURIComponent(input.orderId)}/upi-confirm`, {
    method: 'POST',
    body: JSON.stringify({
      upiReference: input.upiReference?.trim() || undefined,
    }),
  })
  return res.json() as Promise<OrderPlacedResponse>
}

export async function createCodOrder(input: {
  customer: CheckoutCustomer
  items: CartItem[]
}) {
  const res = await paymentFetch('/api/orders/cod', {
    method: 'POST',
    body: JSON.stringify({
      customer: input.customer,
      items: mapCartItems(input.items),
    }),
  })
  return res.json() as Promise<OrderPlacedResponse>
}
