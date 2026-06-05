import { Printer, X } from 'lucide-react'
import type { AdminOrder } from '@/lib/orders-api'
import type { CartItem } from '@/lib/cart-store'
import type { Product } from '@/lib/products-store'
import { resolveCartItemImage } from '@/lib/cart-image'
import { buildOrderBill } from '@/lib/order-bill'

type Props = {
  order: AdminOrder
  products: Product[]
  onClose: () => void
  onPrint: () => void
}

export default function AdminBillingPanel({ order, products, onClose, onPrint }: Props) {
  const bill = buildOrderBill(order)

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[90] bg-black/40"
        onClick={onClose}
        aria-label="Close billing panel"
      />
      <aside className="fixed top-0 right-0 z-[100] h-full w-full max-w-[480px] bg-white border-l border-black/[0.1] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-black/[0.08]">
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.12em] text-black/40">Billing</p>
            <h3 className="font-display text-[22px] font-normal text-black mt-1">Customer Bill</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 h-[36px] px-3 bg-black text-gold-light font-body text-[12px] uppercase tracking-[0.06em] hover:bg-black/90 transition-colors"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-black/[0.04] transition-colors"
              aria-label="Close"
            >
              <X size={18} className="text-black/50" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="border border-black/[0.1] p-5 bg-[#fafafa]">
            <p className="font-display text-[24px] text-black">Look Like</p>
            <p className="font-body text-[10px] uppercase tracking-[0.2em] text-black/40 mt-1">
              Ladies Wear — Bill / Invoice
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 font-body text-[13px]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-black/40 mb-1">Bill to</p>
                <p className="font-medium text-black">{bill.customerName}</p>
                <p className="text-black/70 mt-1 leading-relaxed">
                  {bill.addressLine}
                  <br />
                  {bill.cityStatePin}
                  <br />
                  {bill.customerPhone}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-black/40 mb-1">Bill details</p>
                <p className="text-black/80">
                  Bill No: <span className="text-black">{bill.orderId}</span>
                  <br />
                  Date: {bill.billDate}
                  <br />
                  Payment: {bill.paymentLabel}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="font-body text-[10px] uppercase tracking-[0.08em] text-black/40">Items ordered</p>
              {bill.lines.map((line) => {
                const item = order.items[line.index - 1]
                const img =
                  item?.image?.trim() ||
                  (item ? resolveCartItemImage({ ...item, image: item.image || '' } as CartItem, products) : '')
                return (
                  <div
                    key={line.index}
                    className="flex gap-3 pb-3 border-b border-black/[0.06] last:border-0 last:pb-0"
                  >
                    <div className="w-14 h-[72px] bg-white border border-black/[0.08] overflow-hidden shrink-0">
                      {img ? (
                        <img src={img} alt={line.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-black/[0.04]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 font-body text-[13px]">
                      <p className="font-medium text-black leading-snug">{line.name}</p>
                      <p className="text-black/55 mt-1 text-[12px]">
                        Colour: {line.color} · Size: {line.size}
                      </p>
                      <p className="text-black/70 mt-1">
                        {line.quantity} × Rs. {line.unitPrice} ={' '}
                        <span className="font-medium text-black">Rs. {line.lineTotal}</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-black/[0.1] font-body text-[13px] space-y-2">
              <div className="flex justify-between text-black/70">
                <span>Subtotal</span>
                <span>Rs. {bill.subtotal}</span>
              </div>
              <div className="flex justify-between text-black/70">
                <span>Shipping ({bill.totalWeightKg.toFixed(2)} kg)</span>
                <span>Rs. {bill.deliveryCharge}</span>
              </div>
              <p className="text-[11px] text-black/45 text-right">{bill.shippingNote}</p>
              <div className="flex justify-between text-[16px] font-medium text-black pt-2 border-t border-black/15">
                <span>Grand Total</span>
                <span>Rs. {bill.grandTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
