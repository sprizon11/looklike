/** Per-unit weight in kg (on cart line items). */
export type WeightedCartLine = {
  quantity: number
  weightKg?: number
}

const DEFAULT_ITEM_WEIGHT_KG = 0.5

export function isTamilNadu(state: string | undefined) {
  if (!state?.trim()) return false
  const n = state.trim().toLowerCase()
  return n === 'tamil nadu' || n === 'tn'
}

/** Tamil Nadu: flat Rs. 60. All other states: Rs. 80 per kg (rounded up). */
export function deliveryChargeForState(totalWeightKg: number, state: string | undefined) {
  const billedKg = Math.ceil(Math.max(0, totalWeightKg))
  if (billedKg <= 0) return 0
  if (isTamilNadu(state)) return 60
  return 80 * billedKg
}

export function formatDeliveryNote(state: string | undefined, billedKg: number) {
  if (isTamilNadu(state)) return 'Flat Rs. 60 — Tamil Nadu'
  if (state?.trim()) return `Rs. 80/kg × ${billedKg} kg billed — ${state}`
  return 'All India · Tamil Nadu Rs. 60 · Other states Rs. 80/kg'
}

export function cartSubtotal(items: { price: number; quantity: number }[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function cartTotalWeightKg(items: WeightedCartLine[]) {
  return items.reduce((sum, i) => sum + (i.weightKg ?? DEFAULT_ITEM_WEIGHT_KG) * i.quantity, 0)
}

export function calcCartTotals(
  items: Array<WeightedCartLine & { price: number }>,
  state?: string
) {
  const subtotal = cartSubtotal(items)
  const totalWeightKg = cartTotalWeightKg(items)
  const billedKg = Math.ceil(totalWeightKg)
  const hasState = Boolean(state?.trim())
  const deliveryCharge = hasState ? deliveryChargeForState(totalWeightKg, state) : null
  const total = subtotal + (deliveryCharge ?? 0)
  return {
    subtotal,
    deliveryCharge,
    totalWeightKg,
    billedKg,
    total,
    hasState,
  }
}

export function formatWeightKg(kg: number) {
  if (kg < 1) return `${kg.toFixed(2)} kg`
  return `${Number(kg.toFixed(2))} kg`
}
