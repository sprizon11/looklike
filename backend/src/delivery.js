const DEFAULT_ITEM_WEIGHT_KG = 0.5

export function isTamilNadu(state) {
  if (!state?.trim()) return false
  const n = state.trim().toLowerCase()
  return n === 'tamil nadu' || n === 'tn'
}

const RATE_PER_KG = 80
const TN_FLAT_MAX_KG = 1
const TN_FLAT_RS = 60

/** Tamil Nadu: Rs. 60 flat up to 1 kg billed; above that Rs. 80/kg. Other states: Rs. 80/kg. */
export function deliveryChargeForState(totalWeightKg, state) {
  const billedKg = Math.ceil(Math.max(0, totalWeightKg))
  if (billedKg <= 0) return 0
  if (isTamilNadu(state) && billedKg <= TN_FLAT_MAX_KG) return TN_FLAT_RS
  return RATE_PER_KG * billedKg
}

export function calcSubtotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function calcCartWeightKg(items) {
  return items.reduce((sum, i) => sum + (i.weightKg ?? DEFAULT_ITEM_WEIGHT_KG) * i.quantity, 0)
}

export function calcOrderTotals(items, state) {
  const subtotal = calcSubtotal(items)
  const totalWeightKg = calcCartWeightKg(items)
  const deliveryCharge = deliveryChargeForState(totalWeightKg, state)
  const amount = subtotal + deliveryCharge
  return { subtotal, deliveryCharge, totalWeightKg, amount, billedKg: Math.ceil(totalWeightKg) }
}
