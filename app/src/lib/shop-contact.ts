/** Shop WhatsApp — used for Order on WhatsApp links and order alerts */
export const SHOP_WHATSAPP_PHONE =
  (import.meta.env.VITE_SHOP_WHATSAPP as string | undefined)?.replace(/\D/g, '') || '919344841180'

export const SHOP_INSTAGRAM_URL =
  (import.meta.env.VITE_SHOP_INSTAGRAM as string | undefined)?.trim() ||
  'https://www.instagram.com/look_like_tirupur?igsh=OTVhOGdoNDFsaXkx'

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${SHOP_WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(message: string) {
  window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer')
}

/** Normalize Indian mobile numbers for wa.me links (e.g. 9344841180 → 919344841180). */
export function normalizeWhatsAppPhone(raw: string) {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 10) digits = `91${digits}`
  return digits
}

export function buildCustomerWhatsAppUrl(phone: string, message: string) {
  const normalized = normalizeWhatsAppPhone(phone)
  if (!normalized || normalized.length < 11) return null
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

export function openCustomerWhatsApp(phone: string, message: string) {
  const url = buildCustomerWhatsAppUrl(phone, message)
  if (!url) {
    window.alert('Customer phone number is not valid for WhatsApp.')
    return false
  }
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export type OrderNotifyInfo = {
  whatsappSent?: boolean
  ownerWhatsAppUrl?: string
}

/** If server could not auto-notify, open WhatsApp so customer can send order to shop (one tap). */
export function tryOwnerWhatsAppFallback(info?: OrderNotifyInfo) {
  if (info?.whatsappSent) return
  if (!info?.ownerWhatsAppUrl) return
  window.open(info.ownerWhatsAppUrl, '_blank', 'noopener,noreferrer')
}
