import type { CartItem } from '@/lib/cart-store'

export type CheckoutCustomer = {
  name: string
  phone: string
  email?: string
  address: string
  city: string
  state?: string
  pincode: string
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

export async function getPaymentConfig(): Promise<{ enabled: boolean; keyId: string | null }> {
  const res = await paymentFetch('/api/payments/config')
  return res.json() as Promise<{ enabled: boolean; keyId: string | null }>
}

export async function createPaymentOrder(input: {
  customer: CheckoutCustomer
  items: CartItem[]
}) {
  const res = await paymentFetch('/api/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({
      customer: input.customer,
      items: input.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        image: i.image,
      })),
    }),
  })
  return res.json() as Promise<{
    orderId: string
    amount: number
    currency: string
    razorpayOrderId: string
    keyId: string
  }>
}

export async function verifyPayment(input: {
  orderId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}) {
  const res = await paymentFetch('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return res.json() as Promise<{ ok: boolean }>
}

export async function createCodOrder(input: {
  customer: CheckoutCustomer
  items: CartItem[]
}) {
  const res = await paymentFetch('/api/orders/cod', {
    method: 'POST',
    body: JSON.stringify({
      customer: input.customer,
      items: input.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        size: i.size,
        image: i.image,
      })),
    }),
  })
  return res.json() as Promise<{ ok: boolean; orderId: string }>
}
