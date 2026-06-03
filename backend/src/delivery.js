const DEFAULT_ITEM_WEIGHT_KG = 0.5

export function deliveryChargeFromWeightKg(totalWeightKg) {
  const billedKg = Math.ceil(Math.max(0, totalWeightKg))
  if (billedKg <= 0) return 0
  if (billedKg <= 1) return 60
  return 100 + (billedKg - 2) * 50
}

export function calcSubtotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function calcCartWeightKg(items) {
  return items.reduce((sum, i) => sum + (i.weightKg ?? DEFAULT_ITEM_WEIGHT_KG) * i.quantity, 0)
}

export function calcOrderTotals(items) {
  const subtotal = calcSubtotal(items)
  const totalWeightKg = calcCartWeightKg(items)
  const deliveryCharge = deliveryChargeFromWeightKg(totalWeightKg)
  const amount = subtotal + deliveryCharge
  return { subtotal, deliveryCharge, totalWeightKg, amount, billedKg: Math.ceil(totalWeightKg) }
}
