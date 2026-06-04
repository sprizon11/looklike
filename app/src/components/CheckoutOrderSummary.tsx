import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { CartItem } from '@/lib/cart-store'
import { calcCartTotals, formatDeliveryNote, isTamilNadu } from '@/lib/delivery'

type Props = {
  items: CartItem[]
  state: string
  /** Mobile: collapsible header; items stay visible when expanded (default open). */
  compactHeader?: boolean
}

function variantLabel(item: CartItem) {
  const parts: string[] = []
  if (item.size) parts.push(item.size)
  if (item.color && item.color !== 'Default') parts.push(item.color)
  return parts.join(' / ')
}

export default function CheckoutOrderSummary({ items, state, compactHeader }: Props) {
  const [open, setOpen] = useState(true)
  const effectiveState = state.trim() || 'Tamil Nadu'
  const totals = calcCartTotals(items, effectiveState)
  const itemCount = items.reduce((n, i) => n + i.quantity, 0)

  return (
    <div className={compactHeader ? '' : 'lg:sticky lg:top-8'}>
      <button
        type="button"
        onClick={() => compactHeader && setOpen((v) => !v)}
        className={`w-full text-left ${compactHeader ? 'lg:cursor-default' : ''}`}
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-body text-[14px] text-[#1773b0]">
            Order summary
            {compactHeader && (
              <ChevronDown
                size={16}
                className={`transition-transform ${open ? 'rotate-180' : ''}`}
              />
            )}
          </span>
          <span className="font-body text-[15px] font-semibold text-black">
            Rs. {totals.total.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Mini thumbnails when collapsed on mobile */}
        {compactHeader && !open && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 lg:hidden">
            {items.map((i) => (
              <div
                key={`${i.productId}-${i.size}-${i.color}-mini`}
                className="relative shrink-0 w-12 h-14 bg-white border border-black/[0.1] overflow-hidden rounded-sm"
              >
                <img src={i.image} alt="" className="w-full h-full object-cover" />
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#707070] text-white text-[10px] font-medium">
                  {i.quantity}
                </span>
              </div>
            ))}
          </div>
        )}
      </button>

      <div className={`${open ? 'block' : 'hidden'} lg:block mt-4`}>
        <ul className="space-y-4">
          {items.map((i) => (
            <li
              key={`${i.productId}-${i.size}-${i.color}`}
              className="flex gap-3 items-center"
            >
              <div className="relative shrink-0 w-[64px] h-[80px] bg-white border border-black/[0.1] overflow-hidden rounded-sm shadow-sm">
                <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
                <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 flex items-center justify-center rounded-full bg-[#707070] text-white font-body text-[11px] font-medium">
                  {i.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[14px] font-medium text-black leading-snug">{i.name}</p>
                {variantLabel(i) && (
                  <p className="font-body text-[12px] text-black/55 mt-0.5">{variantLabel(i)}</p>
                )}
              </div>
              <p className="font-body text-[14px] text-black shrink-0 tabular-nums">
                Rs. {(i.price * i.quantity).toLocaleString('en-IN')}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-5 border-t border-black/[0.1] space-y-2.5 font-body text-[14px]">
          <div className="flex justify-between text-black/80">
            <span>
              Subtotal · {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className="tabular-nums">Rs. {totals.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-black/80 gap-4">
            <span className="min-w-0">
              <span className="inline-flex items-center gap-1">
                Shipping
              </span>
              <span className="block text-[11px] text-black/45 mt-0.5 font-normal">
                {state.trim()
                  ? formatDeliveryNote(state, totals.billedKg)
                  : formatDeliveryNote(effectiveState, totals.billedKg)}
              </span>
            </span>
            <span className="shrink-0 tabular-nums">
              Rs. {totals.deliveryCharge?.toLocaleString('en-IN') ?? '0'}
            </span>
          </div>
          {state.trim() && !isTamilNadu(state) && totals.billedKg > 0 && (
            <p className="text-[11px] text-black/40">Rs. 80 × {totals.billedKg} kg billed</p>
          )}
          <div className="flex justify-between pt-2 text-black font-semibold text-[16px]">
            <span>Total</span>
            <span className="tabular-nums">INR Rs. {totals.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
