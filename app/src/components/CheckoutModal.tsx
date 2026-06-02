import { useState } from 'react'
import { X } from 'lucide-react'
import type { CartItem } from '@/lib/cart-store'
import type { CheckoutCustomer } from '@/lib/payments-api'
import { createCodOrder, createPaymentOrder, getPaymentConfig, verifyPayment } from '@/lib/payments-api'
import { clearCart } from '@/lib/cart-store'

type RazorpayResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: RazorpayResponse) => void
  modal?: { ondismiss?: () => void }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void }
  }
}

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true)
  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(Boolean(window.Razorpay))
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

type Props = {
  open: boolean
  onClose: () => void
  items: CartItem[]
  total: number
  onSuccess: (message?: string) => void
}

const emptyForm: CheckoutCustomer = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
}

export default function CheckoutModal({ open, onClose, items, total, onSuccess }: Props) {
  const [form, setForm] = useState<CheckoutCustomer>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const buildCustomer = (): CheckoutCustomer | null => {
    const name = form.name.trim()
    const phone = form.phone.trim()
    const address = form.address.trim()
    const city = form.city.trim()
    const pincode = form.pincode.trim()
    const state = form.state?.trim() || ''
    const email = form.email?.trim() || ''

    if (!name) {
      setError('Name is required')
      return null
    }
    if (phone.length < 10) {
      setError('Enter a valid phone number')
      return null
    }
    if (!address) {
      setError('Address is required')
      return null
    }
    if (!city) {
      setError('City is required')
      return null
    }
    if (pincode.length < 4) {
      setError('Enter a valid pincode')
      return null
    }

    const customer: CheckoutCustomer = { name, phone, address, city, pincode }
    if (email) customer.email = email
    if (state) customer.state = state
    return customer
  }

  const payOnline = async () => {
    setError('')
    const customer = buildCustomer()
    if (!customer) return

    setLoading(true)
    try {
      const config = await getPaymentConfig()
      if (!config.enabled || !config.keyId) {
        setError('Online payment is not configured yet. Please use Cash on Delivery.')
        return
      }

      const order = await createPaymentOrder({ customer, items })
      const loaded = await loadRazorpayScript()
      if (!loaded || !window.Razorpay) {
        setError('Could not load payment gateway. Please try again.')
        return
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: 'Look Like',
        description: `Order ${order.orderId}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        theme: { color: '#000000' },
        handler: async (response) => {
          try {
            await verifyPayment({
              orderId: order.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            clearCart()
            setForm(emptyForm)
            onSuccess('Payment successful! Thank you for your order.')
            onClose()
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Payment verification failed')
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })

      rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start payment')
    } finally {
      setLoading(false)
    }
  }

  const payCod = async () => {
    setError('')
    const customer = buildCustomer()
    if (!customer) return

    setLoading(true)
    try {
      await createCodOrder({ customer, items })
      clearCart()
      setForm(emptyForm)
      onSuccess('Order placed! Pay cash when your order is delivered.')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place COD order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-0 sm:px-6">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close checkout" />
      <div className="relative w-full sm:max-w-[520px] bg-white border border-black/[0.12] max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-[22px] font-normal text-black">Checkout</h2>
              <p className="font-body text-[12px] text-black/40 mt-1">Total: Rs. {total}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/[0.04] transition-colors" aria-label="Close">
              <X size={18} className="text-black/50" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                inputMode="tel"
                className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Email (optional)</label>
              <input
                value={form.email || ''}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                type="email"
                className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Delivery Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30 resize-none"
                placeholder="House no, street, area"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">City</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                  className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                  placeholder="Tirupur"
                />
              </div>
              <div>
                <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">State</label>
                <input
                  value={form.state || ''}
                  onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))}
                  className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                  placeholder="Tamil Nadu"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">Pincode</label>
              <input
                value={form.pincode}
                onChange={(e) => setForm((s) => ({ ...s, pincode: e.target.value }))}
                inputMode="numeric"
                className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                placeholder="641601"
              />
            </div>

            {error && <p className="font-body text-[13px] text-red-500">{error}</p>}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={payOnline}
              className="w-full h-[48px] bg-black text-white font-body text-[14px] font-medium uppercase tracking-[0.06em] hover:bg-black/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Please wait…' : 'Pay Online (Razorpay)'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={payCod}
              className="w-full h-[48px] border border-black text-black font-body text-[14px] font-medium uppercase tracking-[0.06em] hover:bg-black/[0.04] transition-colors disabled:opacity-60"
            >
              Cash on Delivery
            </button>
            <p className="font-body text-[12px] text-black/40 text-center">
              Pay online with UPI/cards, or choose COD and pay when your order arrives.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
