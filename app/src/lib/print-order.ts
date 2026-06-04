import {
  formatOrderDateTime,
  orderItemsSummary,
  orderStatusLabel,
  type AdminOrder,
} from '@/lib/orders-api'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildPrintHtml(order: AdminOrder) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.color || '—')}</td>
        <td>${escapeHtml(item.size)}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">Rs. ${item.price * item.quantity}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Order ${escapeHtml(order.id)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; padding: 24px; color: #111; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 22px; margin: 0 0 4px; font-weight: normal; }
    .meta { font-size: 13px; color: #555; margin-bottom: 20px; line-height: 1.5; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin: 20px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; text-align: left; vertical-align: top; }
    th { font-size: 11px; text-transform: uppercase; color: #666; }
    .totals { margin-top: 16px; font-size: 14px; }
    .totals p { margin: 4px 0; }
    .total-line { font-weight: bold; font-size: 16px; margin-top: 8px; }
    @media print {
      body { padding: 12px; }
    }
  </style>
</head>
<body>
  <h1>Look Like — Order</h1>
  <p class="meta">
    Order ID: ${escapeHtml(order.id)}<br />
    Placed: ${escapeHtml(formatOrderDateTime(order.createdAt))}<br />
    Payment: ${escapeHtml(orderStatusLabel(order.status))}
  </p>

  <h2>Customer</h2>
  <p>
    ${escapeHtml(order.customer.name)}<br />
    Phone: ${escapeHtml(order.customer.phone)}<br />
    ${order.customer.email ? `Email: ${escapeHtml(order.customer.email)}<br />` : ''}
  </p>

  <h2>Delivery address</h2>
  <p>
    ${escapeHtml(order.customer.address)}<br />
    ${escapeHtml(order.customer.city)}${order.customer.state ? `, ${escapeHtml(order.customer.state)}` : ''} – ${escapeHtml(order.customer.pincode)}
  </p>

  <h2>Items</h2>
  <table>
    <thead>
      <tr><th>Product</th><th>Colour</th><th>Size</th><th>Qty</th><th>Amount</th></tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <p style="font-size:12px;color:#666;margin-top:8px">${escapeHtml(orderItemsSummary(order.items))}</p>

  <div class="totals">
    ${order.subtotal != null ? `<p>Subtotal: Rs. ${order.subtotal}</p>` : ''}
    ${order.deliveryCharge != null ? `<p>Delivery${order.totalWeightKg != null ? ` (${order.totalWeightKg.toFixed(2)} kg)` : ''}: Rs. ${order.deliveryCharge}</p>` : ''}
    <p class="total-line">Total: Rs. ${order.amount}</p>
    ${order.upiReference ? `<p>UPI ref: ${escapeHtml(order.upiReference)}</p>` : ''}
  </div>
</body>
</html>`
}

function printViaIframe(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'Print order')
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'

  let printed = false

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }, 1500)
  }

  const triggerPrint = () => {
    if (printed) return
    printed = true
    const win = iframe.contentWindow
    if (!win) return
    win.focus()
    win.print()
    win.addEventListener('afterprint', cleanup, { once: true })
    window.setTimeout(cleanup, 5000)
  }

  document.body.appendChild(iframe)
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    throw new Error('Could not create print frame')
  }

  doc.open()
  doc.write(html)
  doc.close()

  iframe.onload = () => triggerPrint()
  window.setTimeout(triggerPrint, 400)
}

function printViaBlob(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    URL.revokeObjectURL(url)
    throw new Error('popup_blocked')
  }
  win.onload = () => {
    win.focus()
    win.print()
    URL.revokeObjectURL(url)
  }
}

export function printAdminOrder(order: AdminOrder) {
  const html = buildPrintHtml(order)

  try {
    printViaIframe(html)
  } catch {
    try {
      printViaBlob(html)
    } catch {
      window.alert(
        'Could not open print view. Please allow pop-ups for this site, or use Print from the browser menu.'
      )
    }
  }
}
