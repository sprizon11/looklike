const DEFAULT_ITEM_WEIGHT_KG = 0.5

export function isTamilNadu(state) {
  if (!state?.trim()) return false
  const n = state.trim().toLowerCase()
  return n === 'tamil nadu' || n === 'tn'
}

/** Tamil Nadu: flat Rs. 60. All other states: Rs. 80 per kg (rounded up). */
export function deliveryChargeForState(totalWeightKg, state) {
  const billedKg = Math.ceil(Math.max(0, totalWeightKg))
  if (billedKg <= 0) return 0
  if (isTamilNadu(state)) return 60
  return 80 * billedKg
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
