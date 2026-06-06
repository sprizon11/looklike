import { existsSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import compression from 'compression'
import sharp from 'sharp'
import Razorpay from 'razorpay'
import { z } from 'zod'
import { calcOrderTotals } from './delivery.js'
import {
  deleteOrder,
  deleteProduct,
  getStoreLabel,
  insertOrder,
  insertProduct,
  listOrders,
  listProducts,
  readPaymentProof,
  replaceOrder,
  replaceProduct,
  savePaymentProof,
  seedProducts,
} from './store.js'
import { notifyShopWhatsAppOrder } from './whatsapp-notify.js'

const app = express()

app.use(compression())
app.use(express.json({ limit: '25mb' }))
app.use(
  cors({
    origin: true,
    credentials: false,
  })
)

const PORT = Number(process.env.PORT || 8080)

const MONOREPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function resolveFromRoot(envPath, fallbackRelative) {
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.resolve(MONOREPO_ROOT, envPath)
  }
  return path.resolve(MONOREPO_ROOT, fallbackRelative)
}

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''
const UPI_ID = process.env.UPI_ID || ''
const UPI_PAYEE_NAME = process.env.UPI_PAYEE_NAME || 'Look Like'

const razorpay =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null
const FRONTEND_DIST_DIR = resolveFromRoot(process.env.FRONTEND_DIST_DIR, 'app/dist')
const FRONTEND_INDEX = path.join(FRONTEND_DIST_DIR, 'index.html')

const ProductColorSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    image: z.string().optional(),
    images: z.array(z.string().min(1)).max(3).optional(),
    swatchHex: z.string().optional(),
    stock: z.number().int().nonnegative().optional(),
    sizeStock: z
      .array(
        z.object({
          size: z.string().min(1),
          qty: z.number().int().nonnegative(),
        })
      )
      .optional(),
    outOfStock: z.boolean().optional(),
  })
  .transform((c) => normalizeColorRecord(c))

function isLeggingsCategory(category) {
  return (category || '').toLowerCase().includes('legging')
}

function isLeggingsColorName(name) {
  return /^CL\s*\d/i.test((name || '').trim())
}

function normalizeColorRecord(c) {
  const images =
    Array.isArray(c.images) && c.images.length > 0
      ? c.images.map((s) => s.trim()).filter(Boolean).slice(0, 3)
      : c.image?.trim()
        ? [c.image.trim()]
        : []
  if (images.length === 0) {
    if (isLeggingsColorName(c.name)) {
      return {
        id: c.id,
        name: c.name,
        ...(c.swatchHex ? { swatchHex: c.swatchHex } : {}),
        ...(c.stock !== undefined ? { stock: c.stock } : {}),
        ...(Array.isArray(c.sizeStock) && c.sizeStock.length > 0
          ? {
              sizeStock: c.sizeStock.map((r) => ({
                size: r.size.trim(),
                qty: Math.max(0, Number(r.qty) || 0),
              })),
            }
          : {}),
        ...(c.outOfStock ? { outOfStock: true } : {}),
      }
    }
    throw new Error('Each colour needs at least one image')
  }
  return {
    id: c.id,
    name: c.name,
    images,
    image: images[0],
    ...(c.swatchHex ? { swatchHex: c.swatchHex } : {}),
    ...(c.stock !== undefined ? { stock: c.stock } : {}),
    ...(Array.isArray(c.sizeStock) && c.sizeStock.length > 0
      ? {
          sizeStock: c.sizeStock.map((r) => ({
            size: r.size.trim(),
            qty: Math.max(0, Number(r.qty) || 0),
          })),
        }
      : {}),
    ...(c.outOfStock ? { outOfStock: true } : {}),
  }
}

const ProductCreateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  image: z.string().min(1),
  galleryImages: z.array(z.string().min(1)).max(3).optional(),
  size: z.string().optional(),
  sizeStock: z
    .array(
      z.object({
        size: z.string().min(1),
        qty: z.number().int().nonnegative(),
        outOfStock: z.boolean().optional(),
      })
    )
    .optional(),
  description: z.string().optional(),
  weightKg: z.number().positive().optional(),
  colors: z.array(ProductColorSchema).min(1).optional(),
  outOfStockColors: z.array(z.string().min(1)).optional(),
  kurtiDetails: z
    .object({
      fabric: z.string().optional(),
      lining: z.string().optional(),
      style: z.string().optional(),
      color: z.string().optional(),
      length: z.string().optional(),
      pocket: z.string().optional(),
    })
    .optional(),
  sizeGuide: z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('bottom'),
        rows: z.array(
          z.object({
            size: z.string().min(1),
            hip: z.string().optional(),
            length: z.string().optional(),
          })
        ),
        note: z.string().optional(),
      }),
      z.object({
        type: z.literal('kurti'),
        rows: z.array(
          z.object({
            size: z.string().min(1),
            bust: z.string().optional(),
            length: z.string().optional(),
          })
        ),
        note: z.string().optional(),
      }),
    ])
    .optional(),
})

const ProductUpdateSchema = ProductCreateSchema.partial()

const CartItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  size: z.string().min(1),
  color: z.string().optional(),
  image: z.string().optional(),
  weightKg: z.number().positive().optional(),
})

const CustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().optional(),
  address: z.string().min(3),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(4),
})

const CreatePaymentSchema = z.object({
  customer: CustomerSchema,
  items: z.array(CartItemSchema).min(1),
})

const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
})

const CreateCodOrderSchema = z.object({
  customer: CustomerSchema,
  items: z.array(CartItemSchema).min(1),
})

const ConfirmUpiOrderSchema = z.object({
  upiReference: z.string().optional(),
  paymentProof: z
    .string()
    .min(100, 'Payment screenshot is required')
    .refine((s) => s.startsWith('data:image/'), 'Upload a valid image screenshot'),
})

function now() {
  return Date.now()
}

function id(prefix = 'p') {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${now()}`
}

const DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/')
}

function decodeDataUrl(value) {
  const m = typeof value === 'string' ? value.match(DATA_URL_RE) : null
  if (!m) return null
  try {
    return { mime: m[1], buffer: Buffer.from(m[2], 'base64') }
  } catch {
    return null
  }
}

const GRID_THUMB_W = 420
const IMAGE_CACHE_MAX = 300
const imageBufferCache = new Map()

let cachedProducts = null
let cachedProductsAt = 0
const PRODUCTS_CACHE_MS = 45_000

function invalidateProductsCache() {
  cachedProducts = null
  cachedProductsAt = 0
  imageBufferCache.clear()
}

function parseImageWidth(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 64 || n > 2000) return 0
  return Math.round(n)
}

function getCachedImage(key) {
  const hit = imageBufferCache.get(key)
  if (!hit) return null
  hit.last = Date.now()
  return hit
}

function setCachedImage(key, buffer, mime) {
  if (imageBufferCache.size >= IMAGE_CACHE_MAX) {
    let oldestKey
    let oldestTime = Infinity
    for (const [k, v] of imageBufferCache) {
      if (v.last < oldestTime) {
        oldestTime = v.last
        oldestKey = k
      }
    }
    if (oldestKey) imageBufferCache.delete(oldestKey)
  }
  imageBufferCache.set(key, { buffer, mime, last: Date.now() })
}

async function prepareImageBuffer(buffer, mime, width) {
  if (!width) return { buffer, mime }
  try {
    const out = await sharp(buffer)
      .rotate()
      .resize(width, width, { fit: 'cover', withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer()
    return { buffer: out, mime: 'image/jpeg' }
  } catch {
    return { buffer, mime }
  }
}

/** Serve a decoded data URL (or redirect if it is already a plain URL). */
async function sendProductImage(res, value, width = 0, cacheKey = '') {
  if (!value) {
    res.status(404).end()
    return
  }
  if (!isDataUrl(value)) {
    res.redirect(302, value)
    return
  }

  if (cacheKey) {
    const hit = getCachedImage(cacheKey)
    if (hit) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.setHeader('Content-Type', hit.mime)
      res.end(hit.buffer)
      return
    }
  }

  const decoded = decodeDataUrl(value)
  if (!decoded) {
    res.status(404).end()
    return
  }

  const prepared = await prepareImageBuffer(decoded.buffer, decoded.mime, width)
  if (cacheKey) setCachedImage(cacheKey, prepared.buffer, prepared.mime)

  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  res.setHeader('Content-Type', prepared.mime)
  res.end(prepared.buffer)
}

/** Replace heavy base64 image fields with cacheable URL endpoints (small list payload). */
function leanProduct(p) {
  const v = p.updatedAt || 0
  const mainUrl = isDataUrl(p.image)
    ? `/api/products/${p.id}/image?v=${v}&w=${GRID_THUMB_W}`
    : p.image

  const galleryImages = Array.isArray(p.galleryImages)
    ? p.galleryImages.map((img, i) =>
        isDataUrl(img) ? `/api/products/${p.id}/gallery/${i}?v=${v}` : img
      )
    : p.galleryImages

  const colors = Array.isArray(p.colors)
    ? p.colors.map((c) => {
        const images = Array.isArray(c.images)
          ? c.images.map((img, i) =>
              isDataUrl(img)
                ? `/api/products/${p.id}/color-image/${encodeURIComponent(c.id)}/${i}?v=${v}`
                : img
            )
          : c.images
        const image = isDataUrl(c.image)
          ? `/api/products/${p.id}/color-image/${encodeURIComponent(c.id)}/0?v=${v}`
          : c.image || (Array.isArray(images) ? images[0] : undefined)
        return { ...c, images, image }
      })
    : p.colors

  return { ...p, image: mainUrl, galleryImages, colors }
}

function isInternalImageUrl(value) {
  return typeof value === 'string' && /^\/api\/products\/.+\/(image|gallery|color-image)/.test(value)
}

/**
 * When a save sends back our own image URLs (unchanged photos), restore original base64.
 * Only rewrites fields actually present on `incoming` so partial patches keep existing data.
 */
function restoreImagesFromExisting(incoming, existing) {
  if (!existing) return incoming

  const pickColorImage = (colorId, slot) => {
    const c = (existing.colors || []).find((x) => x.id === colorId)
    if (!c) return undefined
    return c.images?.[slot] ?? (slot === 0 ? c.image : undefined)
  }

  const restore = (value, fallback) => (isInternalImageUrl(value) ? fallback ?? value : value)

  const result = { ...incoming }

  if ('image' in incoming) {
    result.image = restore(incoming.image, existing.image)
  }

  if (Array.isArray(incoming.galleryImages)) {
    result.galleryImages = incoming.galleryImages.map((img, i) =>
      restore(img, existing.galleryImages?.[i])
    )
  }

  if (Array.isArray(incoming.colors)) {
    result.colors = incoming.colors.map((c) => {
      const out = { ...c }
      if (Array.isArray(c.images)) {
        out.images = c.images.map((img, i) => restore(img, pickColorImage(c.id, i)))
      }
      if ('image' in c) {
        out.image = restore(c.image, pickColorImage(c.id, 0))
      }
      return out
    })
  }

  return result
}

function defaultProducts() {
  return []
}

function normalizeProduct(raw) {
  const colors =
    Array.isArray(raw.colors) && raw.colors.length > 0
      ? raw.colors.map((c) => {
          try {
            return normalizeColorRecord(c)
          } catch {
            const img = c.image?.trim() || raw.image
            return { id: c.id || id('color'), name: c.name || 'Default', images: [img], image: img }
          }
        })
      : [{ id: 'color-default', name: 'Default', images: [raw.image], image: raw.image }]
  return {
    ...raw,
    colors,
    image: colors[0]?.image || raw.image,
    weightKg: raw.weightKg ?? 0.5,
  }
}

function prepareProductPayload(data, timestamps) {
  const mainImage = data.image
  let colors
  if (Array.isArray(data.colors) && data.colors.length > 0) {
    colors = data.colors.map((c) => normalizeColorRecord(c))
  } else if (isLeggingsCategory(data.category)) {
    colors = []
  } else {
    colors = [{ id: id('color'), name: 'Default', images: [mainImage], image: mainImage }]
  }
  return {
    ...data,
    colors,
    image: mainImage,
    weightKg: data.weightKg ?? 0.5,
    ...timestamps,
  }
}

async function readProducts({ force = false } = {}) {
  if (!force && cachedProducts && Date.now() - cachedProductsAt < PRODUCTS_CACHE_MS) {
    return cachedProducts
  }

  const list = await listProducts()
  if (list.length === 0) {
    const seeded = defaultProducts().map(normalizeProduct)
    await seedProducts(seeded)
    cachedProducts = seeded
    cachedProductsAt = Date.now()
    return seeded
  }

  cachedProducts = list.map(normalizeProduct)
  cachedProductsAt = Date.now()
  return cachedProducts
}

function calcTotal(items, state) {
  return calcOrderTotals(items, state).amount
}

async function decrementProductStockForOrderItems(items) {
  const products = await readProducts()
  const byId = new Map(products.map((p) => [p.id, p]))
  const updates = new Map()

  for (const item of items || []) {
    const pid = item.productId
    if (!pid) continue
    const existing = updates.get(pid) || byId.get(pid)
    if (!existing) continue

    const qty = Math.max(1, Number(item.quantity) || 1)
    const size = (item.size || '').trim()
    const colorName = (item.color || '').trim()

    if (colorName && Array.isArray(existing.colors) && existing.colors.length > 0) {
      const colorIdx = existing.colors.findIndex(
        (c) => (c.name || '').trim().toLowerCase() === colorName.toLowerCase()
      )
      if (colorIdx >= 0) {
        const color = existing.colors[colorIdx]
        if (Array.isArray(color.sizeStock) && color.sizeStock.length > 0 && size) {
          const nextColorSizeStock = color.sizeStock.map((r) => {
            if ((r.size || '').trim() !== size) return r
            const nextQty = Math.max(0, (Number(r.qty) || 0) - qty)
            return { ...r, qty: nextQty }
          })
          const colorTotal = nextColorSizeStock.reduce(
            (n, r) => n + Math.max(0, Number(r.qty) || 0),
            0
          )
          const nextColor = {
            ...color,
            sizeStock: nextColorSizeStock,
            stock: colorTotal,
            ...(colorTotal <= 0 ? { outOfStock: true } : {}),
          }
          const nextColors = [...existing.colors]
          nextColors[colorIdx] = nextColor
          const productTotal = nextColors.reduce((n, c) => n + Math.max(0, Number(c.stock) || 0), 0)
          updates.set(pid, { ...existing, colors: nextColors, stock: productTotal })
          continue
        }
        if (color.stock !== undefined) {
          const nextColorStock = Math.max(0, (Number(color.stock) || 0) - qty)
          const nextColor = {
            ...color,
            stock: nextColorStock,
            ...(nextColorStock <= 0 ? { outOfStock: true } : {}),
          }
          const nextColors = [...existing.colors]
          nextColors[colorIdx] = nextColor
          const productTotal = nextColors.reduce((n, c) => n + Math.max(0, Number(c.stock) || 0), 0)
          updates.set(pid, { ...existing, colors: nextColors, stock: productTotal })
          continue
        }
      }
    }

    if (Array.isArray(existing.sizeStock) && existing.sizeStock.length > 0 && size) {
      const nextRows = existing.sizeStock.map((r) => {
        if ((r.size || '').trim() !== size) return r
        const nextQty = Math.max(0, (Number(r.qty) || 0) - qty)
        return { ...r, qty: nextQty, outOfStock: nextQty <= 0 ? true : Boolean(r.outOfStock) }
      })
      const sum = nextRows.reduce((n, r) => n + Math.max(0, Number(r.qty) || 0), 0)
      updates.set(pid, { ...existing, sizeStock: nextRows, stock: sum })
      continue
    }

    const nextStock = Math.max(0, (Number(existing.stock) || 0) - qty)
    updates.set(pid, { ...existing, stock: nextStock })
  }

  for (const updated of updates.values()) {
    await replaceProduct(updated)
  }
}

function buildUpiPayUri({ upiId, payeeName, amount, note }, { includeNote = true } = {}) {
  const params = new URLSearchParams({
    pa: upiId.trim(),
    pn: payeeName.trim().slice(0, 50),
    am: amount.toFixed(2),
    cu: 'INR',
  })
  if (includeNote && note?.trim()) params.set('tn', note.trim().slice(0, 50))
  return `upi://pay?${params.toString()}`
}

app.get('/health', (_req, res) => res.json({ ok: true, store: getStoreLabel() }))

app.get('/api/payments/config', (_req, res) => {
  res.json({
    razorpay: {
      enabled: Boolean(razorpay),
      keyId: RAZORPAY_KEY_ID || null,
    },
    upi: {
      enabled: Boolean(UPI_ID),
      upiId: UPI_ID || null,
      payeeName: UPI_PAYEE_NAME,
    },
  })
})

app.post('/api/payments/create-order', async (req, res) => {
  if (!razorpay) {
    res.status(503).json({ error: 'Payment gateway is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' })
    return
  }

  const input = CreatePaymentSchema.safeParse(req.body)
  if (!input.success) {
    res.status(400).json({ error: 'Invalid payload', details: input.error.flatten() })
    return
  }

  const totals = calcOrderTotals(input.data.items, input.data.customer.state)
  if (totals.amount <= 0) {
    res.status(400).json({ error: 'Invalid order amount' })
    return
  }

  const orderId = id('ord')
  const t = now()
  const customer = {
    ...input.data.customer,
    email: input.data.customer.email || undefined,
  }

  try {
    const rzOrder = await razorpay.orders.create({
      amount: Math.round(totals.amount * 100),
      currency: 'INR',
      receipt: orderId,
      notes: {
        customer_name: customer.name,
        customer_phone: customer.phone,
      },
    })

    const pending = {
      id: orderId,
      customer,
      items: input.data.items,
      amount: totals.amount,
      subtotal: totals.subtotal,
      deliveryCharge: totals.deliveryCharge,
      totalWeightKg: totals.totalWeightKg,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'online',
      razorpayOrderId: rzOrder.id,
      createdAt: t,
      updatedAt: t,
    }

    await insertOrder(pending)

    res.status(201).json({
      orderId,
      amount: totals.amount,
      currency: 'INR',
      razorpayOrderId: rzOrder.id,
      keyId: RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('Razorpay create order failed:', err)
    res.status(500).json({ error: 'Could not create payment order' })
  }
})

app.post('/api/payments/verify', async (req, res) => {
  if (!RAZORPAY_KEY_SECRET) {
    res.status(503).json({ error: 'Payment gateway is not configured' })
    return
  }

  const input = VerifyPaymentSchema.safeParse(req.body)
  if (!input.success) {
    res.status(400).json({ error: 'Invalid payload', details: input.error.flatten() })
    return
  }

  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${input.data.razorpay_order_id}|${input.data.razorpay_payment_id}`)
    .digest('hex')

  if (expected !== input.data.razorpay_signature) {
    res.status(400).json({ error: 'Invalid payment signature' })
    return
  }

  const orders = await listOrders()
  const current = orders.find((o) => o.id === input.data.orderId)
  if (!current) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

  const t = now()
  const updated = {
    ...current,
    status: 'paid',
    paymentMethod: 'online',
    razorpayPaymentId: input.data.razorpay_payment_id,
    updatedAt: t,
  }
  await replaceOrder(updated)

  res.json({ ok: true, order: updated })
})

app.post('/api/orders/upi', async (req, res) => {
  if (!UPI_ID) {
    res.status(503).json({ error: 'UPI payments are not configured. Add UPI_ID on the server.' })
    return
  }

  const input = CreateCodOrderSchema.safeParse(req.body)
  if (!input.success) {
    res.status(400).json({ error: 'Invalid payload', details: input.error.flatten() })
    return
  }

  const totals = calcOrderTotals(input.data.items, input.data.customer.state)
  if (totals.amount <= 0) {
    res.status(400).json({ error: 'Invalid order amount' })
    return
  }

  const orderId = id('ord')
  const t = now()
  const customer = {
    ...input.data.customer,
    email: input.data.customer.email || undefined,
  }

  const order = {
    id: orderId,
    customer,
    items: input.data.items,
    subtotal: totals.subtotal,
    deliveryCharge: totals.deliveryCharge,
    totalWeightKg: totals.totalWeightKg,
    amount: totals.amount,
    currency: 'INR',
    status: 'upi_pending',
    paymentMethod: 'upi',
    createdAt: t,
    updatedAt: t,
  }

  await insertOrder(order)
  await decrementProductStockForOrderItems(order.items)

  const upiUri = buildUpiPayUri({
    upiId: UPI_ID,
    payeeName: UPI_PAYEE_NAME,
    amount: totals.amount,
    note: 'LookLike',
  })

  res.status(201).json({
    ok: true,
    orderId,
    amount: totals.amount,
    subtotal: totals.subtotal,
    deliveryCharge: totals.deliveryCharge,
    totalWeightKg: totals.totalWeightKg,
    billedKg: totals.billedKg,
    currency: 'INR',
    upiId: UPI_ID,
    payeeName: UPI_PAYEE_NAME,
    upiUri,
    order,
  })
})

app.post('/api/orders/:id/upi-confirm', async (req, res) => {
  const input = ConfirmUpiOrderSchema.safeParse(req.body)
  if (!input.success) {
    res.status(400).json({ error: 'Invalid payload', details: input.error.flatten() })
    return
  }

  const orders = await listOrders()
  const current = orders.find((o) => o.id === req.params.id)
  if (!current) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

  if (current.status !== 'upi_pending') {
    res.status(400).json({ error: 'Order is not awaiting UPI payment' })
    return
  }

  try {
    const t = now()
    const upiReference = input.data.upiReference?.trim() || undefined
    const paymentProofFile = await savePaymentProof(current.id, input.data.paymentProof)
    const updated = {
      ...current,
      status: 'upi',
      upiReference,
      paymentProofFile,
      updatedAt: t,
    }
    await replaceOrder(updated)

    const whatsapp = await notifyShopWhatsAppOrder(updated)

    res.json({ ok: true, order: updated, ...whatsapp })
  } catch (err) {
    console.error('UPI confirm failed:', err)
    res.status(500).json({
      error: 'Could not save order. Try a smaller payment screenshot (under 2 MB).',
    })
  }
})

app.get('/api/orders/:id/payment-proof', async (req, res) => {
  const orders = await listOrders()
  const order = orders.find((o) => o.id === req.params.id)
  if (!order?.paymentProofFile) {
    res.status(404).json({ error: 'Payment proof not found' })
    return
  }
  try {
    const { buffer, contentType } = await readPaymentProof(order.paymentProofFile)
    res.setHeader('Content-Type', contentType)
    res.send(buffer)
  } catch {
    res.status(404).json({ error: 'Payment proof file missing' })
  }
})

app.post('/api/orders/cod', async (req, res) => {
  const input = CreateCodOrderSchema.safeParse(req.body)
  if (!input.success) {
    res.status(400).json({ error: 'Invalid payload', details: input.error.flatten() })
    return
  }

  const totals = calcOrderTotals(input.data.items, input.data.customer.state)
  if (totals.amount <= 0) {
    res.status(400).json({ error: 'Invalid order amount' })
    return
  }

  const orderId = id('ord')
  const t = now()
  const customer = {
    ...input.data.customer,
    email: input.data.customer.email || undefined,
  }

  const order = {
    id: orderId,
    customer,
    items: input.data.items,
    subtotal: totals.subtotal,
    deliveryCharge: totals.deliveryCharge,
    totalWeightKg: totals.totalWeightKg,
    amount: totals.amount,
    currency: 'INR',
    status: 'cod',
    paymentMethod: 'cod',
    createdAt: t,
    updatedAt: t,
  }

  await insertOrder(order)
  await decrementProductStockForOrderItems(order.items)

  const whatsapp = await notifyShopWhatsAppOrder(order)

  res.status(201).json({ ok: true, orderId, order, ...whatsapp })
})

app.get('/api/orders', async (_req, res) => {
  const orders = await listOrders()
  const visible = orders.filter((o) => o.status === 'paid' || o.status === 'cod' || o.status === 'upi')
  res.json({ orders: visible })
})

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await deleteOrder(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message === 'Order not found') {
      res.status(404).json({ error: 'Not found' })
      return
    }
    console.error('Delete order failed:', err)
    res.status(500).json({ error: 'Could not delete order' })
  }
})

app.get('/api/products', async (_req, res) => {
  const products = await readProducts()
  res.json({ products: products.map(leanProduct) })
})

// Full product with original base64 images — used by admin edit so photos survive re-save.
app.get('/api/products/:id/full', async (req, res) => {
  const products = await readProducts()
  const product = products.find((p) => p.id === req.params.id)
  if (!product) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json({ product })
})

// Cacheable image endpoints (decode + resize once; browser caches the binary).
app.get('/api/products/:id/image', async (req, res) => {
  const products = await readProducts()
  const product = products.find((p) => p.id === req.params.id)
  if (!product) {
    res.status(404).end()
    return
  }
  const width = parseImageWidth(req.query.w)
  const cacheKey = `${product.id}:image:${product.updatedAt}:${width || 0}`
  await sendProductImage(res, product.image, width, cacheKey)
})

app.get('/api/products/:id/gallery/:slot', async (req, res) => {
  const products = await readProducts()
  const product = products.find((p) => p.id === req.params.id)
  if (!product) {
    res.status(404).end()
    return
  }
  const slot = Number(req.params.slot)
  const width = parseImageWidth(req.query.w)
  const cacheKey = `${product.id}:gallery:${slot}:${product.updatedAt}:${width || 0}`
  await sendProductImage(res, product.galleryImages?.[slot], width, cacheKey)
})

app.get('/api/products/:id/color-image/:colorId/:slot', async (req, res) => {
  const products = await readProducts()
  const product = products.find((p) => p.id === req.params.id)
  if (!product) {
    res.status(404).end()
    return
  }
  const color = product.colors?.find((c) => c.id === req.params.colorId)
  const slot = Number(req.params.slot)
  const value = color?.images?.[slot] || (slot === 0 ? color?.image : undefined)
  const width = parseImageWidth(req.query.w)
  const cacheKey = `${product.id}:color:${req.params.colorId}:${slot}:${product.updatedAt}:${width || 0}`
  await sendProductImage(res, value, width, cacheKey)
})

app.post('/api/products', async (req, res) => {
  const input = ProductCreateSchema.safeParse(req.body)
  if (!input.success) {
    res.status(400).json({ error: 'Invalid payload', details: input.error.flatten() })
    return
  }

  const t = now()
  const next = prepareProductPayload(input.data, { createdAt: t, updatedAt: t, id: id() })
  try {
    await insertProduct(next)
    invalidateProductsCache()
    res.status(201).json({ product: next })
  } catch (err) {
    console.error('Insert product failed:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Could not save product' })
  }
})

app.patch('/api/products/:id', async (req, res) => {
  const patch = ProductUpdateSchema.safeParse(req.body)
  if (!patch.success) {
    res.status(400).json({ error: 'Invalid payload', details: patch.error.flatten() })
    return
  }

  const current = await readProducts()
  const existing = current.find((p) => p.id === req.params.id)
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  const t = now()
  const restored = restoreImagesFromExisting({ ...patch.data }, existing)
  const merged = { ...existing, ...restored, updatedAt: t }
  const updated = prepareProductPayload(merged, {
    createdAt: existing.createdAt,
    updatedAt: t,
    id: existing.id,
  })
  try {
    await replaceProduct(updated)
    invalidateProductsCache()
    res.json({ product: updated })
  } catch (err) {
    console.error('Update product failed:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Could not save product' })
  }
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    await deleteProduct(req.params.id)
    invalidateProductsCache()
    res.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message === 'Product not found') {
      res.status(404).json({ error: 'Not found' })
      return
    }
    console.error('Delete product failed:', err)
    res.status(500).json({ error: 'Could not delete product' })
  }
})

if (!existsSync(FRONTEND_INDEX)) {
  console.error(`Frontend build missing at ${FRONTEND_DIST_DIR}. Run: npm run build`)
} else {
  app.use(express.static(FRONTEND_DIST_DIR))
  app.get('/', (_req, res) => {
    res.sendFile(FRONTEND_INDEX)
  })
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(FRONTEND_INDEX)
  })
}

app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`)
  console.log(`Serving frontend from ${FRONTEND_DIST_DIR}`)
  console.log(`Data store: ${getStoreLabel()}`)
})
