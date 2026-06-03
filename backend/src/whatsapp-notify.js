const SHOP_WHATSAPP_PHONE = (process.env.SHOP_WHATSAPP_PHONE || '919344841180').replace(/\D/g, '')
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || ''

function paymentLabel(order) {
  if (order.status === 'cod') return 'Cash on Delivery'
  if (order.status === 'upi' || order.paymentMethod === 'upi') return 'UPI (online)'
  if (order.status === 'paid') return 'Paid online'
  return order.paymentMethod || order.status || 'Website order'
}

export function formatOrderWhatsAppMessage(order) {
  const { customer, items, amount, id } = order
  const lines = [
    '🛍️ *New order — Look Like*',
    '',
    `Order: ${id}`,
    `Payment: ${paymentLabel(order)}`,
    `Total: Rs. ${amount}`,
    '',
    `*Customer:* ${customer.name}`,
    `*Phone:* ${customer.phone}`,
  ]

  if (customer.email) lines.push(`Email: ${customer.email}`)

  lines.push(
    '',
    '*Delivery address:*',
    customer.address,
    `${customer.city}${customer.state ? `, ${customer.state}` : ''} – ${customer.pincode}`,
    '',
    '*Items:*'
  )

  for (const item of items) {
    lines.push(`• ${item.name} (${item.size}) × ${item.quantity} — Rs. ${item.price * item.quantity}`)
  }

  if (order.upiReference) {
    lines.push('', `UPI ref: ${order.upiReference}`)
  }

  lines.push('', '— Look Like website')

  return lines.join('\n')
}

export function buildOwnerWhatsAppUrl(message) {
  return `https://wa.me/${SHOP_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`
}

async function sendViaCallMeBot(message) {
  if (!WHATSAPP_API_KEY) {
    return { sent: false, reason: 'WHATSAPP_API_KEY not configured' }
  }

  const url = new URL('https://api.callmebot.com/whatsapp.php')
  url.searchParams.set('phone', SHOP_WHATSAPP_PHONE)
  url.searchParams.set('text', message)
  url.searchParams.set('apikey', WHATSAPP_API_KEY)

  const res = await fetch(url.toString(), { method: 'GET' })
  const body = await res.text()

  if (!res.ok) {
    return { sent: false, reason: body || `HTTP ${res.status}` }
  }

  return { sent: true }
}

/** Notify shop owner about a new order. Never throws — order must still succeed. */
export async function notifyShopWhatsAppOrder(order) {
  const message = formatOrderWhatsAppMessage(order)
  const ownerWhatsAppUrl = buildOwnerWhatsAppUrl(message)

  try {
    const result = await sendViaCallMeBot(message)
    return {
      whatsappSent: result.sent,
      ownerWhatsAppUrl,
      notifyReason: result.reason,
    }
  } catch (err) {
    return {
      whatsappSent: false,
      ownerWhatsAppUrl,
      notifyReason: err instanceof Error ? err.message : 'WhatsApp notify failed',
    }
  }
}

export function getShopWhatsAppPhone() {
  return SHOP_WHATSAPP_PHONE
}
