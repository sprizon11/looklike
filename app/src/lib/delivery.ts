/** Per-unit weight in kg (on cart line items). */
export type WeightedCartLine = {
  quantity: number
  weightKg?: number
}

const DEFAULT_ITEM_WEIGHT_KG = 0.5

/** 1 kg → Rs.60, 2 kg → Rs.100, then +Rs.50 per extra kg (3→150, 4→200, …). */
export function deliveryChargeFromWeightKg(totalWeightKg: number) {
  const billedKg = Math.ceil(Math.max(0, totalWeightKg))
  if (billedKg <= 0) return 0
  if (billedKg <= 1) return 60
  return 100 + (billedKg - 2) * 50
}

export function cartSubtotal(items: { price: number; quantity: number }[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function cartTotalWeightKg(items: WeightedCartLine[]) {
  return items.reduce((sum, i) => sum + (i.weightKg ?? DEFAULT_ITEM_WEIGHT_KG) * i.quantity, 0)
}

export function calcCartTotals(items: Array<WeightedCartLine & { price: number }>) {
  const subtotal = cartSubtotal(items)
  const totalWeightKg = cartTotalWeightKg(items)
  const deliveryCharge = deliveryChargeFromWeightKg(totalWeightKg)
  const total = subtotal + deliveryCharge
  return { subtotal, deliveryCharge, totalWeightKg, total, billedKg: Math.ceil(totalWeightKg) }
}

export function formatWeightKg(kg: number) {
  if (kg < 1) return `${kg.toFixed(2)} kg`
  return `${Number(kg.toFixed(2))} kg`
}
