import { cartImageRef } from '@/lib/cart-image'

export type CartItem = {
  productId: string
  name: string
  price: number
  image: string
  size: string
  color: string
  quantity: number
  /** Weight per piece in kg */
  weightKg?: number
}

const STORAGE_KEY = 'looklike.cart.v1'
const CHANGE_EVENT = 'looklike-cart-changed'

export class CartStorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CartStorageError'
  }
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function compactCartItemForStorage(item: CartItem): CartItem {
  return {
    ...item,
    image: cartImageRef(item.image),
  }
}

function sanitizeCart(items: CartItem[]): CartItem[] {
  return items.map(compactCartItemForStorage)
}

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  const parsed = safeParse<CartItem[]>(window.localStorage.getItem(STORAGE_KEY))
  if (!Array.isArray(parsed)) return []
  return sanitizeCart(parsed)
}

export function writeCart(next: CartItem[]) {
  if (typeof window === 'undefined') return

  const compact = sanitizeCart(next)
  const payload = JSON.stringify(compact)

  const tryWrite = (data: string) => {
    window.localStorage.setItem(STORAGE_KEY, data)
  }

  try {
    tryWrite(payload)
  } catch (e) {
    const isQuota =
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)

    if (isQuota) {
      try {
        const stripped = JSON.stringify(sanitizeCart(compact.map((i) => ({ ...i, image: '' }))))
        tryWrite(stripped)
      } catch {
        throw new CartStorageError(
          'Cart is full. Open Cart, tap Clear cart, or clear site data for looklike.in in your browser, then try again.'
        )
      }
    } else {
      throw e
    }
  }

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

/** One-time cleanup if cart JSON still contains huge data URLs. */
export function repairCartStorage(): void {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw || !raw.includes('data:image')) return
  try {
    const parsed = safeParse<CartItem[]>(raw)
    if (Array.isArray(parsed)) writeCart(parsed)
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

export function addToCart(item: CartItem) {
  const entry = compactCartItemForStorage(item)
  const current = readCart()
  const idx = current.findIndex(
    (i) => i.productId === entry.productId && i.size === entry.size && i.color === entry.color
  )
  if (idx === -1) {
    writeCart([...current, entry])
  } else {
    const next = [...current]
    next[idx] = { ...next[idx], quantity: next[idx].quantity + entry.quantity }
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
