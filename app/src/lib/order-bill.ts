import {
  formatOrderDateTime,
  orderStatusLabel,
  type AdminOrder,
  type OrderItem,
} from '@/lib/orders-api'
import {
  cartSubtotal,
  cartTotalWeightKg,
  deliveryChargeForState,
  formatDeliveryNote,
  type WeightedCartLine,
} from '@/lib/delivery'
import { openCustomerWhatsApp } from '@/lib/shop-contact'

export type OrderBillLine = {
  index: number
  name: string
  color: string
  size: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type OrderBill = {
  orderId: string
  billDate: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  addressLine: string
  cityStatePin: string
  state?: string
  lines: OrderBillLine[]
  subtotal: number
  deliveryCharge: number
  totalWeightKg: number
  billedKg: number
  shippingNote: string
  grandTotal: number
  paymentLabel: string
  upiReference?: string
}

function defaultItemWeight(): number {
  return 0.5
}

function resolveOrderTotals(order: AdminOrder) {
  const subtotal = order.subtotal ?? cartSubtotal(order.items)
  const weighted: WeightedCartLine[] = order.items.map((i) => ({
    quantity: i.quantity,
    weightKg: defaultItemWeight(),
  }))
  const totalWeightKg = order.totalWeightKg ?? cartTotalWeightKg(weighted)
  const billedKg = Math.ceil(totalWeightKg)
  const state = order.customer.state
  const deliveryCharge =
    order.deliveryCharge ?? deliveryChargeForState(totalWeightKg, state)
  const grandTotal = order.amount ?? subtotal + deliveryCharge
  return { subtotal, deliveryCharge, totalWeightKg, billedKg, grandTotal }
}

export function buildOrderBill(order: AdminOrder): OrderBill {
  const { subtotal, deliveryCharge, totalWeightKg, billedKg, grandTotal } =
    resolveOrderTotals(order)

  const lines: OrderBillLine[] = order.items.map((item: OrderItem, idx) => ({
    index: idx + 1,
    name: item.name,
    color: item.color?.trim() || '—',
    size: item.size,
    quantity: item.quantity,
    unitPrice: item.price,
    lineTotal: item.price * item.quantity,
  }))

  const cityStatePin = `${order.customer.city}${
    order.customer.state ? `, ${order.customer.state}` : ''
  } – ${order.customer.pincode}`

  return {
    orderId: order.id,
    billDate: formatOrderDateTime(order.createdAt),
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    customerEmail: order.customer.email,
    addressLine: order.customer.address,
    cityStatePin,
    state: order.customer.state,
    lines,
    subtotal,
    deliveryCharge,
    totalWeightKg,
    billedKg,
    shippingNote: formatDeliveryNote(order.customer.state, billedKg),
    grandTotal,
    paymentLabel: orderStatusLabel(order.status),
    upiReference: order.upiReference,
  }
}

export function formatBillWhatsAppMessage(order: AdminOrder) {
  const bill = buildOrderBill(order)
  const lines = [
    '🧾 *Look Like — Your Bill*',
    '',
    `Hi ${bill.customerName},`,
    '',
    `Bill No: ${bill.orderId}`,
    `Date: ${bill.billDate}`,
    `Payment: ${bill.paymentLabel}`,
    '',
    '*Items ordered:*',
  ]

  for (const line of bill.lines) {
    lines.push(
      `${line.index}. *${line.name}*`,
      `   Colour: ${line.color} · Size: ${line.size}`,
      `   ${line.quantity} × Rs. ${line.unitPrice} = Rs. ${line.lineTotal}`
    )
  }

  lines.push(
    '',
    `Subtotal: Rs. ${bill.subtotal}`,
    `Shipping (${bill.totalWeightKg.toFixed(2)} kg): Rs. ${bill.deliveryCharge}`,
    `_${bill.shippingNote}_`,
    `*Grand Total: Rs. ${bill.grandTotal}*`
  )

  if (bill.upiReference) {
    lines.push('', `UPI ref: ${bill.upiReference}`)
  }

  lines.push('', 'Thank you for shopping with Look Like! 💛')

  return lines.join('\n')
}

export function sendOrderBillWhatsApp(order: AdminOrder) {
  const message = formatBillWhatsAppMessage(order)
  return openCustomerWhatsApp(order.customer.phone, message)
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildBillPrintHtml(order: AdminOrder) {
  const bill = buildOrderBill(order)
  const linesHtml = bill.lines
    .map(
      (line) => `
      <tr>
        <td style="text-align:center">${line.index}</td>
        <td>${escapeHtml(line.name)}</td>
        <td>${escapeHtml(line.color)}</td>
        <td>${escapeHtml(line.size)}</td>
        <td style="text-align:center">${line.quantity}</td>
        <td style="text-align:right">Rs. ${line.unitPrice}</td>
        <td style="text-align:right">Rs. ${line.lineTotal}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Bill ${escapeHtml(bill.orderId)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; padding: 24px; color: #111; max-width: 800px; margin: 0 auto; }
    .brand { font-size: 26px; letter-spacing: 0.04em; margin: 0; font-weight: normal; }
    .tagline { font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #888; margin: 4px 0 0; }
    .bill-title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; margin: 20px 0 12px; color: #333; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 13px; line-height: 1.55; margin-bottom: 20px; }
    .meta-grid h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin: 0 0 6px; font-weight: normal; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
    th, td { border: 1px solid #ddd; padding: 8px 6px; text-align: left; vertical-align: top; }
    th { font-size: 10px; text-transform: uppercase; color: #666; background: #fafafa; }
    .totals { margin-top: 16px; font-size: 14px; max-width: 320px; margin-left: auto; }
    .totals p { margin: 6px 0; display: flex; justify-content: space-between; gap: 24px; }
    .totals .grand { font-weight: bold; font-size: 17px; border-top: 2px solid #111; padding-top: 8px; margin-top: 8px; }
    .shipping-note { font-size: 11px; color: #666; margin-top: 4px; text-align: right; }
  </style>
</head>
<body>
  <h1 class="brand">Look Like</h1>
  <p class="tagline">Ladies Wear</p>
  <p class="bill-title">Customer Bill / Invoice</p>

  <div class="meta-grid">
    <div>
      <h3>Bill to</h3>
      <p>
        <strong>${escapeHtml(bill.customerName)}</strong><br />
        ${escapeHtml(bill.addressLine)}<br />
        ${escapeHtml(bill.cityStatePin)}<br />
        Phone: ${escapeHtml(bill.customerPhone)}
        ${bill.customerEmail ? `<br />Email: ${escapeHtml(bill.customerEmail)}` : ''}
      </p>
    </div>
    <div>
      <h3>Bill details</h3>
      <p>
        Bill No: ${escapeHtml(bill.orderId)}<br />
        Date: ${escapeHtml(bill.billDate)}<br />
        Payment: ${escapeHtml(bill.paymentLabel)}
        ${bill.upiReference ? `<br />UPI ref: ${escapeHtml(bill.upiReference)}` : ''}
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Dress / Product</th>
        <th>Colour</th>
        <th>Size</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${linesHtml}</tbody>
  </table>

  <div class="totals">
    <p><span>Subtotal</span><span>Rs. ${bill.subtotal}</span></p>
    <p>
      <span>Shipping (${bill.totalWeightKg.toFixed(2)} kg)</span>
      <span>Rs. ${bill.deliveryCharge}</span>
    </p>
    <p class="shipping-note" style="display:block">${escapeHtml(bill.shippingNote)}</p>
    <p class="grand"><span>Grand Total</span><span>Rs. ${bill.grandTotal}</span></p>
  </div>
</body>
</html>`
}
