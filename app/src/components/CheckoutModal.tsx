import { useEffect, useState } from 'react'
import { Copy, Upload, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { CartItem } from '@/lib/cart-store'
import type { CheckoutCustomer, UpiOrderResponse } from '@/lib/payments-api'
import { confirmUpiOrder, createCodOrder, createUpiOrder, getPaymentConfig } from '@/lib/payments-api'
import { clearCart } from '@/lib/cart-store'
import { compressImageFile } from '@/lib/compress-image'
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
  const [paymentProof, setPaymentProof] = useState('')
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
      setPaymentProof('')
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
      onSuccess('Order placed! Pay cash when your order is delivered.')
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
    if (!paymentProof) {
      setError('Please upload a screenshot of your UPI payment')
      return
    }

    setError('')
    setLoading(true)
    try {
      const result = await confirmUpiOrder({
        orderId: upiOrder.orderId,
        paymentProof,
        upiReference: upiReference.trim() || undefined,
      })
      tryOwnerWhatsAppFallback(result)
      clearCart()
      setForm(emptyForm)
      onSuccess('Order submitted! We will verify your payment and contact you for delivery.')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit order')
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
              <div className="border border-black/[0.08] p-5">
                <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/40">Amount to pay</p>
                <p className="font-display text-[32px] text-black mt-1">
                  Rs. {upiOrder.amount.toLocaleString('en-IN')}
                </p>
                <p className="font-body text-[12px] text-black/45 mt-2">
                  Pay this exact amount to the UPI ID below, then upload your payment screenshot.
                </p>
              </div>

              <div className="border border-black/[0.06] p-4 bg-[#fafafa]">
                <p className="font-body text-[12px] uppercase tracking-[0.06em] text-black/40">UPI ID</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-body text-[15px] font-medium text-black break-all">{upiOrder.upiId}</p>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 border border-black/10 bg-white font-body text-[12px] uppercase tracking-[0.04em] text-black/70 hover:border-black/30 transition-colors"
                  >
                    <Copy size={14} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-body text-[12px] text-black/40 mt-2">Payee: {upiOrder.payeeName}</p>
                <p className="font-body text-[12px] text-black/50 mt-3">
                  Open GPay / PhonePe / Paytm → Pay to UPI ID → enter amount → complete payment.
                </p>
              </div>

              <div className="border border-black/[0.08] p-4 text-center">
                <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/40 mb-3">
                  Or scan QR (optional)
                </p>
                <div className="inline-flex p-2 bg-white border border-black/[0.08]">
                  <QRCodeSVG value={upiOrder.upiUri} size={160} level="M" includeMargin />
                </div>
              </div>

              <div>
                <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">
                  Payment screenshot <span className="text-red-500">*</span>
                </label>
                <label className="mt-2 flex flex-col items-center justify-center gap-2 w-full min-h-[120px] border border-dashed border-black/20 cursor-pointer hover:border-black/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        setError('')
                        const dataUrl = await compressImageFile(file, 900, 0.8)
                        setPaymentProof(dataUrl)
                      } catch {
                        setError('Could not use that image. Try a clear screenshot (JPG/PNG).')
                      }
                    }}
                  />
                  {paymentProof ? (
                    <img src={paymentProof} alt="Payment proof" className="max-h-[180px] object-contain" />
                  ) : (
                    <>
                      <Upload size={22} className="text-black/30" />
                      <span className="font-body text-[13px] text-black/50">Tap to upload payment screenshot</span>
                    </>
                  )}
                </label>
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
              </div>

              {error && <p className="font-body text-[13px] text-red-500">{error}</p>}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={loading || !paymentProof}
                  onClick={confirmUpiPayment}
                  className="w-full h-[48px] bg-black text-white font-body text-[14px] font-medium uppercase tracking-[0.06em] hover:bg-black/90 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Please wait…' : 'Submit order'}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep('form')
                    setUpiOrder(null)
                    setPaymentProof('')
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
                    UPI is not configured on the server yet. Use Cash on Delivery, or add UPI_ID on Render.
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
