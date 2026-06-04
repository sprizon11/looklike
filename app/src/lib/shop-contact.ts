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
