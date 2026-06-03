import { useEffect, useState } from 'react'
import { Copy, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import UpiAppPayButtons from '@/components/UpiAppPayButtons'
import type { CartItem } from '@/lib/cart-store'
import type { CheckoutCustomer, UpiOrderResponse } from '@/lib/payments-api'
import { confirmUpiOrder, createCodOrder, createUpiOrder, getPaymentConfig } from '@/lib/payments-api'
import { clearCart } from '@/lib/cart-store'
import { tryOwnerWhatsAppFallback } from '@/lib/shop-contact'

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
  const [step, setStep] = useState<'form' | 'upi'>('form')
  const [upiEnabled, setUpiEnabled] = useState(false)
  const [upiOrder, setUpiOrder] = useState<UpiOrderResponse | null>(null)
  const [upiReference, setUpiReference] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    getPaymentConfig()
      .then((cfg) => setUpiEnabled(cfg.upi.enabled))
      .catch(() => setUpiEnabled(false))
  }, [open])

  useEffect(() => {
    if (!open) {
      setStep('form')
      setUpiOrder(null)
      setUpiReference('')
      setError('')
      setCopied(false)
    }
  }, [open])

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

  const placeCodOrder = async () => {
    setError('')
    const customer = buildCustomer()
    if (!customer) return

    setLoading(true)
    try {
      const result = await createCodOrder({ customer, items })
      tryOwnerWhatsAppFallback(result)
      clearCart()
      setForm(emptyForm)
      onSuccess(
        result.whatsappSent
          ? 'Order placed! We sent a WhatsApp alert to the shop and will contact you for delivery.'
          : 'Order placed! Pay cash when your order is delivered.'
      )
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place order')
    } finally {
      setLoading(false)
    }
  }

  const startUpiPayment = async () => {
    setError('')
    const customer = buildCustomer()
    if (!customer) return

    setLoading(true)
    try {
      const order = await createUpiOrder({ customer, items })
      setUpiOrder(order)
      setStep('upi')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start UPI payment')
    } finally {
      setLoading(false)
    }
  }

  const confirmUpiPayment = async () => {
    if (!upiOrder) return
    setError('')
    setLoading(true)
    try {
      const result = await confirmUpiOrder({
        orderId: upiOrder.orderId,
        upiReference: upiReference.trim() || undefined,
      })
      tryOwnerWhatsAppFallback(result)
      clearCart()
      setForm(emptyForm)
      onSuccess(
        result.whatsappSent
          ? 'Order received! WhatsApp alert sent to the shop. We will verify your UPI payment shortly.'
          : 'Order received! We will verify your UPI payment and confirm delivery shortly.'
      )
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm payment')
    } finally {
      setLoading(false)
    }
  }

  const copyUpiId = async () => {
    if (!upiOrder?.upiId) return
    try {
      await navigator.clipboard.writeText(upiOrder.upiId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy UPI ID')
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-0 sm:px-6">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close checkout" />
      <div className="relative w-full sm:max-w-[520px] bg-white border border-black/[0.12] max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-[22px] font-normal text-black">
                {step === 'upi' ? 'Pay with UPI' : 'Checkout'}
              </h2>
              <p className="font-body text-[12px] text-black/40 mt-1">Total: Rs. {total.toLocaleString('en-IN')}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/[0.04] transition-colors" aria-label="Close">
              <X size={18} className="text-black/50" />
            </button>
          </div>

          {step === 'upi' && upiOrder ? (
            <div className="mt-6 space-y-5">
              <div className="border border-black/[0.08] p-5 text-center">
                <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/40">Scan & pay</p>
                <p className="font-display text-[28px] text-black mt-2">
                  Rs. {upiOrder.amount.toLocaleString('en-IN')}
                </p>
                <div className="mt-4 inline-flex p-3 bg-white border border-black/[0.08]">
                  <QRCodeSVG value={upiOrder.upiUri} size={220} level="M" includeMargin />
                </div>
                <p className="font-body text-[13px] text-black/60 mt-4">
                  Scan with any UPI app, or tap an app below to pay directly on your phone.
                </p>
              </div>

              <UpiAppPayButtons
                upiId={upiOrder.upiId}
                payeeName={upiOrder.payeeName}
                amount={upiOrder.amount}
                note={`Look Like order ${upiOrder.orderId}`}
              />

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-black/[0.08]" />
                <span className="font-body text-[11px] uppercase tracking-[0.08em] text-black/30">or copy UPI ID</span>
                <div className="flex-1 h-px bg-black/[0.08]" />
              </div>

              <div className="border border-black/[0.06] p-4">
                <p className="font-body text-[12px] uppercase tracking-[0.06em] text-black/40">UPI ID</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-body text-[14px] text-black break-all">{upiOrder.upiId}</p>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 border border-black/10 font-body text-[12px] uppercase tracking-[0.04em] text-black/70 hover:border-black/30 transition-colors"
                  >
                    <Copy size={14} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-body text-[12px] text-black/40 mt-2">Payee: {upiOrder.payeeName}</p>
              </div>

              <div>
                <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">
                  UPI transaction ID (optional)
                </label>
                <input
                  value={upiReference}
                  onChange={(e) => setUpiReference(e.target.value)}
                  className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
                  placeholder="e.g. 123456789012"
                />
                <p className="font-body text-[12px] text-black/40 mt-1">
                  Helps us verify your payment faster.
                </p>
              </div>

              {error && <p className="font-body text-[13px] text-red-500">{error}</p>}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={confirmUpiPayment}
                  className="w-full h-[48px] bg-black text-white font-body text-[14px] font-medium uppercase tracking-[0.06em] hover:bg-black/90 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Please wait…' : 'I have paid'}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep('form')
                    setUpiOrder(null)
                    setError('')
                  }}
                  className="w-full h-[44px] border border-black/15 font-body text-[13px] uppercase tracking-[0.06em] text-black/70 hover:border-black/30 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <>
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
                {upiEnabled ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={startUpiPayment}
                    className="w-full h-[48px] bg-black text-white font-body text-[14px] font-medium uppercase tracking-[0.06em] hover:bg-black/90 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Please wait…' : `Pay Rs. ${total.toLocaleString('en-IN')} with UPI`}
                  </button>
                ) : (
                  <p className="font-body text-[12px] text-amber-700 bg-amber-50 border border-amber-100 p-3">
                    UPI QR is not configured on the server yet. Use Cash on Delivery, or ask the shop owner to add UPI_ID.
                  </p>
                )}
                <button
                  type="button"
                  disabled={loading}
                  onClick={placeCodOrder}
                  className="w-full h-[48px] border border-black/15 font-body text-[14px] font-medium uppercase tracking-[0.06em] text-black hover:border-black/30 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Please wait…' : 'Cash on Delivery'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
