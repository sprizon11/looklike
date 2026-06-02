import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Trash2 } from 'lucide-react'
import CheckoutModal from '@/components/CheckoutModal'
import { clearCart, readCart, removeCartItem, subscribeCart, updateCartItem } from '@/lib/cart-store'

export default function Cart() {
  const navigate = useNavigate()
  const [items, setItems] = useState(() => readCart())
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    setItems(readCart())
    return subscribeCart(() => setItems(readCart()))
  }, [])

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 md:px-12 py-6 sm:py-10">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1 font-body text-[13px] uppercase tracking-[0.06em] text-black/50 hover:text-black transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="mt-6 flex items-baseline justify-between gap-4">
          <h1 className="font-display text-[30px] sm:text-[38px] font-normal text-black">Cart</h1>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50 hover:text-black transition-colors"
            >
              Clear cart
            </button>
          )}
        </div>

        {orderSuccess && (
          <div className="mt-6 border border-green-200 bg-green-50 p-4">
            <p className="font-body text-[14px] text-green-800">
              {successMessage || 'Thank you for your order. We will contact you shortly for delivery.'}
            </p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-10 border border-black/[0.06] p-8 text-center">
            <p className="font-body text-[14px] text-black/60">Your cart is empty.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-5 inline-flex items-center justify-center h-[44px] px-6 bg-black text-white font-body text-[13px] font-medium uppercase tracking-[0.06em] hover:bg-black/90 transition-colors"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-4">
              {items.map((i) => (
                <div key={`${i.productId}-${i.size}-${i.color}`} className="border border-black/[0.06] p-4 sm:p-5">
                  <div className="flex gap-4">
                    <div className="w-[86px] h-[110px] bg-[#f7f7f7] overflow-hidden shrink-0">
                      <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-body text-[14px] font-medium text-black">{i.name}</p>
                          <p className="font-body text-[12px] text-black/50 mt-1">Size: {i.size}</p>
                          <p className="font-body text-[13px] text-black/60 mt-2">Rs. {i.price}</p>
                        </div>
                        <button
                          onClick={() => removeCartItem({ productId: i.productId, size: i.size, color: i.color })}
                          className="p-2 hover:bg-black/[0.04] transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} className="text-black/40" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center border border-black/15 w-fit">
                          <button
                            onClick={() =>
                              updateCartItem(
                                { productId: i.productId, size: i.size, color: i.color },
                                { quantity: Math.max(1, i.quantity - 1) }
                              )
                            }
                            className="w-10 h-10 font-body text-[18px] text-black/60 hover:text-black transition-colors"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-12 text-center font-body text-[14px] text-black">{i.quantity}</span>
                          <button
                            onClick={() =>
                              updateCartItem(
                                { productId: i.productId, size: i.size, color: i.color },
                                { quantity: i.quantity + 1 }
                              )
                            }
                            className="w-10 h-10 font-body text-[18px] text-black/60 hover:text-black transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <p className="font-body text-[14px] font-medium text-black">Rs. {i.price * i.quantity}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-black/[0.06] p-6 h-fit">
              <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/40">Summary</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-body text-[14px] text-black/60">Items</p>
                <p className="font-body text-[14px] text-black">{items.length}</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-body text-[14px] text-black/60">Total</p>
                <p className="font-body text-[16px] font-medium text-black">Rs. {total}</p>
              </div>

              <button
                onClick={() => setCheckoutOpen(true)}
                className="mt-6 w-full h-[48px] bg-black text-white font-body text-[14px] font-medium uppercase tracking-[0.06em] hover:bg-black/90 transition-colors"
              >
                Order Now
              </button>
              <p className="mt-3 font-body text-[12px] text-black/40">
                Enter your delivery details and place a Cash on Delivery order.
              </p>
            </div>
          </div>
        )}
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        total={total}
        onSuccess={(message) => {
          setSuccessMessage(message || '')
          setOrderSuccess(true)
          setItems([])
        }}
      />
    </div>
  )
}
