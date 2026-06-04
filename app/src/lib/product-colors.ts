export type ProductColor = {
  id: string
  name: string
  image: string
  stock?: number
}

export function normalizeProductColors(
  colors: ProductColor[] | undefined,
  fallbackImage: string
): ProductColor[] {
  if (Array.isArray(colors) && colors.length > 0) {
    return colors.filter((c) => c.name?.trim() && c.image?.trim())
  }
  return [{ id: 'color-default', name: 'Default', image: fallbackImage }]
}

export function getApiBaseForProofs() {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (raw?.trim()) return raw.replace(/\/+$/, '')
  if (import.meta.env.PROD) return ''
  return ''
}

export function paymentProofImageUrl(orderId: string) {
  return `${getApiBaseForProofs()}/api/orders/${encodeURIComponent(orderId)}/payment-proof`
}

export function orderPaymentProofSrc(order: {
  id: string
  paymentProof?: string
  paymentProofFile?: string
}) {
  if (order.paymentProof) return order.paymentProof
  if (order.paymentProofFile) return paymentProofImageUrl(order.id)
  return null
}

export function newColorId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `color-${crypto.randomUUID()}`
  return `color-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}
