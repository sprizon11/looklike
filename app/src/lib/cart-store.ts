export type CartItem = {
  productId: string
  name: string
  price: number
  image: string
  size: string
  color: string
  quantity: number
}

const STORAGE_KEY = 'looklike.cart.v1'
const CHANGE_EVENT = 'looklike-cart-changed'

function safeParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  const parsed = safeParse<CartItem[]>(window.localStorage.getItem(STORAGE_KEY))
  return Array.isArray(parsed) ? parsed : []
}

export function writeCart(next: CartItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeCart(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}

  const handler = () => onChange()
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange()
  }

  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', storageHandler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', storageHandler)
  }
}

export function addToCart(item: CartItem) {
  const current = readCart()
  const idx = current.findIndex(
    (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
  )
  if (idx === -1) {
    writeCart([...current, item])
  } else {
    const next = [...current]
    next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity }
    writeCart(next)
  }
}

export function updateCartItem(
  key: Pick<CartItem, 'productId' | 'size' | 'color'>,
  patch: Partial<Pick<CartItem, 'quantity'>>
) {
  const current = readCart()
  const next = current.map((i) => {
    if (i.productId === key.productId && i.size === key.size && i.color === key.color) {
      return { ...i, ...patch }
    }
    return i
  })
  writeCart(next.filter((i) => i.quantity > 0))
}

export function removeCartItem(key: Pick<CartItem, 'productId' | 'size' | 'color'>) {
  const current = readCart()
  writeCart(current.filter((i) => !(i.productId === key.productId && i.size === key.size && i.color === key.color)))
}

export function clearCart() {
  writeCart([])
}

export function cartCount(): number {
  return readCart().reduce((sum, i) => sum + i.quantity, 0)
}
