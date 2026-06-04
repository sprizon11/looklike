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

const RATE_PER_KG = 80
const TN_FLAT_MAX_KG = 1
const TN_FLAT_RS = 60

/** Tamil Nadu: Rs. 60 flat up to 1 kg billed; above that Rs. 80/kg. Other states: Rs. 80/kg. */
export function deliveryChargeForState(totalWeightKg: number, state: string | undefined) {
  const billedKg = Math.ceil(Math.max(0, totalWeightKg))
  if (billedKg <= 0) return 0
  if (isTamilNadu(state) && billedKg <= TN_FLAT_MAX_KG) return TN_FLAT_RS
  return RATE_PER_KG * billedKg
}

export function formatDeliveryNote(state: string | undefined, billedKg: number) {
  if (isTamilNadu(state)) {
    if (billedKg <= TN_FLAT_MAX_KG) return `Flat Rs. ${TN_FLAT_RS} — Tamil Nadu (up to ${TN_FLAT_MAX_KG} kg)`
    return `Rs. ${RATE_PER_KG}/kg × ${billedKg} kg billed — Tamil Nadu`
  }
  if (state?.trim()) return `Rs. ${RATE_PER_KG}/kg × ${billedKg} kg billed — ${state}`
  return `Tamil Nadu: Rs. ${TN_FLAT_RS} up to ${TN_FLAT_MAX_KG} kg, then Rs. ${RATE_PER_KG}/kg · Other states: Rs. ${RATE_PER_KG}/kg`
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
