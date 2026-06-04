import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { CartItem } from '@/lib/cart-store'
import { calcCartTotals, formatDeliveryNote, isTamilNadu } from '@/lib/delivery'

type Props = {
  items: CartItem[]
  state: string
  compactHeader?: boolean
}

export default function CheckoutOrderSummary({ items, state, compactHeader }: Props) {
  const [open, setOpen] = useState(!compactHeader)
  const totals = calcCartTotals(items, state)
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)

  return (
    <div className={compactHeader ? '' : 'lg:sticky lg:top-8'}>
      <button
        type="button"
        onClick={() => compactHeader && setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-3 ${
          compactHeader ? 'lg:pointer-events-none' : ''
        }`}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 font-body text-[14px] text-[#1773b0]">
          Order summary
          {compactHeader && (
            <ChevronDown
              size={16}
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          )}
        </span>
        <span className="font-body text-[15px] font-medium text-black">
          Rs. {totals.total.toLocaleString('en-IN')}
        </span>
      </button>

      <div className={`${open ? 'block' : 'hidden'} ${compactHeader ? 'lg:block' : ''} mt-4`}>
        <ul className="space-y-4">
          {items.map((i) => (
            <li
              key={`${i.productId}-${i.size}-${i.color}`}
              className="flex gap-3 items-start"
            >
              <div className="relative shrink-0 w-[56px] h-[70px] bg-[#f0f0f0] border border-black/[0.08] overflow-hidden rounded-sm">
                <img src={i.image} alt="" className="w-full h-full object-cover" />
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full bg-black text-white font-body text-[11px] font-medium">
                  {i.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-body text-[13px] font-medium text-black leading-snug">{i.name}</p>
                <p className="font-body text-[12px] text-black/50 mt-0.5">
                  {i.color ? `${i.color} / ` : ''}
                  {i.size}
                </p>
              </div>
              <p className="font-body text-[13px] text-black shrink-0">
                Rs. {(i.price * i.quantity).toLocaleString('en-IN')}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-black/[0.08] space-y-2 font-body text-[14px]">
          <div className="flex justify-between text-black/70">
            <span>
              Subtotal · {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span>Rs. {totals.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-black/70 gap-4">
            <span className="min-w-0">
              Shipping
              {state.trim() ? (
                <span className="block text-[11px] text-black/40 mt-0.5 font-normal">
                  {formatDeliveryNote(state, totals.billedKg)}
                </span>
              ) : (
                <span className="block text-[11px] text-black/40 mt-0.5 font-normal">
                  Select state below
                </span>
              )}
            </span>
            <span className="shrink-0">
              {totals.deliveryCharge != null
                ? `Rs. ${totals.deliveryCharge.toLocaleString('en-IN')}`
                : '—'}
            </span>
          </div>
          {!state.trim() && (
            <p className="text-[11px] text-black/40">
              Tamil Nadu Rs. 60 flat · Other states Rs. 80 per kg (all India)
            </p>
          )}
          {state.trim() && !isTamilNadu(state) && (
            <p className="text-[11px] text-black/40">Rs. 80 × {totals.billedKg} kg billed</p>
          )}
          <div className="flex justify-between pt-2 text-black font-medium text-[15px]">
            <span>Total</span>
            <span>INR Rs. {totals.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
