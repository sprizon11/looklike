import { existsSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
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

const ProductColorSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  image: z.string().min(1),
  stock: z.number().int().nonnegative().optional(),
})

const ProductCreateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  image: z.string().min(1),
  size: z.string().optional(),
  description: z.string().optional(),
  weightKg: z.number().positive().optional(),
  colors: z.array(ProductColorSchema).min(1).optional(),
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

function defaultProducts() {
  const t = now()
  return [
    {
      id: 'p-1',
      name: 'Side Open Kurti - Liva',
      category: 'Kurti',
      price: 599,
      stock: 24,
      image: '/images/product-kurti-1.jpg',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-2',
      name: 'Side Open Kurti - Avaassa',
      category: 'Kurti',
      price: 699,
      stock: 18,
      image: '/images/product-kurti-2.jpg',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-3',
      name: 'Ankle Length Leggings',
      category: 'Leggings',
      price: 299,
      stock: 45,
      image: '/images/product-leggings-1.jpg',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-4',
      name: 'Premium Palazzo Pants',
      category: 'Palazzo',
      price: 399,
      stock: 32,
      image: '/images/product-palazzo-1.jpg',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-5',
      name: 'Printed Casual Kurti',
      category: 'Kurti',
      price: 499,
      stock: 15,
      image: '/images/kurti-various-1.jpg',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-6',
      name: 'Embroidered Party Kurti',
      category: 'Kurti',
      price: 899,
      stock: 8,
      image: '/images/kurti-various-2.jpg',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-7',
      name: 'Cotton Daily Wear Leggings',
      category: 'Leggings',
      price: 249,
      stock: 56,
      image: '/images/leggings-various-1.jpg',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'p-8',
      name: 'Flared Palazzo - Solid',
      category: 'Palazzo',
      price: 449,
      stock: 21,
      image: '/images/palazzo-various-1.jpg',
      createdAt: t,
      updatedAt: t,
    },
  ]
}

function normalizeProduct(raw) {
  const colors =
    Array.isArray(raw.colors) && raw.colors.length > 0
      ? raw.colors
      : [{ id: 'color-default', name: 'Default', image: raw.image }]
  return {
    ...raw,
    colors,
    image: colors[0]?.image || raw.image,
    weightKg: raw.weightKg ?? 0.5,
  }
}

function prepareProductPayload(data, timestamps) {
  const colors =
    Array.isArray(data.colors) && data.colors.length > 0
      ? data.colors
      : [{ id: id('color'), name: 'Default', image: data.image }]
  return {
    ...data,
    colors,
    image: colors[0].image,
    weightKg: data.weightKg ?? 0.5,
    ...timestamps,
  }
}

async function readProducts() {
  const list = await listProducts()
  if (list.length === 0) {
    const seeded = defaultProducts().map(normalizeProduct)
    await seedProducts(seeded)
    return seeded
  }
  return list.map(normalizeProduct)
}

function calcTotal(items, state) {
  return calcOrderTotals(items, state).amount
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
  res.json({ products })
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
  const merged = { ...existing, ...patch.data, updatedAt: t }
  const updated = prepareProductPayload(merged, {
    createdAt: existing.createdAt,
    updatedAt: t,
    id: existing.id,
  })
  try {
    await replaceProduct(updated)
    res.json({ product: updated })
  } catch (err) {
    console.error('Update product failed:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Could not save product' })
  }
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    await deleteProduct(req.params.id)
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
