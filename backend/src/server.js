import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import Razorpay from 'razorpay'
import { z } from 'zod'

const app = express()

app.use(express.json({ limit: '10mb' }))
app.use(
  cors({
    origin: true,
    credentials: false,
  })
)

const PORT = Number(process.env.PORT || 8080)
const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data')
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json')
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json')

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

const razorpay =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null
const FRONTEND_DIST_DIR =
  process.env.FRONTEND_DIST_DIR ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../app/dist')

const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  image: z.string().min(1),
  size: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const ProductCreateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  image: z.string().min(1),
  size: z.string().optional(),
  description: z.string().optional(),
})

const ProductUpdateSchema = ProductCreateSchema.partial()

const CartItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  size: z.string().min(1),
  image: z.string().optional(),
})

const CustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().optional(),
  address: z.string().min(3),
  city: z.string().min(1),
  state: z.string().optional(),
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

const OrderSchema = z.object({
  id: z.string(),
  customer: CustomerSchema,
  items: z.array(CartItemSchema),
  amount: z.number().nonnegative(),
  currency: z.literal('INR'),
  status: z.enum(['pending', 'paid', 'failed', 'cod']),
  paymentMethod: z.enum(['online', 'cod']).optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const CreateCodOrderSchema = z.object({
  customer: CustomerSchema,
  items: z.array(CartItemSchema).min(1),
})

function now() {
  return Date.now()
}

function id(prefix = 'p') {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${now()}`
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJsonAtomic(filePath, value) {
  await ensureDataDir()
  const tmp = `${filePath}.tmp`
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8')
  await fs.rename(tmp, filePath)
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

async function readProducts() {
  await ensureDataDir()
  const list = await readJson(PRODUCTS_FILE, null)
  if (!Array.isArray(list) || list.length === 0) {
    const seeded = defaultProducts()
    await writeJsonAtomic(PRODUCTS_FILE, seeded)
    return seeded
  }
  const parsed = z.array(ProductSchema).safeParse(list)
  if (!parsed.success) {
    const seeded = defaultProducts()
    await writeJsonAtomic(PRODUCTS_FILE, seeded)
    return seeded
  }
  return parsed.data
}

async function writeProducts(next) {
  const parsed = z.array(ProductSchema).safeParse(next)
  if (!parsed.success) throw new Error('Invalid product data')
  await writeJsonAtomic(PRODUCTS_FILE, parsed.data)
}

async function readOrders() {
  await ensureDataDir()
  const list = await readJson(ORDERS_FILE, [])
  const parsed = z.array(OrderSchema).safeParse(list)
  return parsed.success ? parsed.data : []
}

async function writeOrders(next) {
  const parsed = z.array(OrderSchema).safeParse(next)
  if (!parsed.success) throw new Error('Invalid order data')
  await writeJsonAtomic(ORDERS_FILE, parsed.data)
}

function calcTotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

app.get('/health', (_req, res) => res.json({ ok: true }))

app.get('/api/payments/config', (_req, res) => {
  res.json({
    enabled: Boolean(razorpay),
    keyId: RAZORPAY_KEY_ID || null,
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

  const amount = calcTotal(input.data.items)
  if (amount <= 0) {
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
      amount: Math.round(amount * 100),
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
      amount,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'online',
      razorpayOrderId: rzOrder.id,
      createdAt: t,
      updatedAt: t,
    }

    const orders = await readOrders()
    await writeOrders([pending, ...orders])

    res.status(201).json({
      orderId,
      amount,
      currency: 'INR',
      razorpayOrderId: rzOrder.id,
      keyId: RAZORPAY_KEY_ID,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
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

  const orders = await readOrders()
  const idx = orders.findIndex((o) => o.id === input.data.orderId)
  if (idx === -1) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

  const t = now()
  const updated = {
    ...orders[idx],
    status: 'paid',
    paymentMethod: 'online',
    razorpayPaymentId: input.data.razorpay_payment_id,
    updatedAt: t,
  }
  const next = [...orders.slice(0, idx), updated, ...orders.slice(idx + 1)]
  await writeOrders(next)

  res.json({ ok: true, order: updated })
})

app.post('/api/orders/cod', async (req, res) => {
  const input = CreateCodOrderSchema.safeParse(req.body)
  if (!input.success) {
    res.status(400).json({ error: 'Invalid payload', details: input.error.flatten() })
    return
  }

  const amount = calcTotal(input.data.items)
  if (amount <= 0) {
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
    amount,
    currency: 'INR',
    status: 'cod',
    paymentMethod: 'cod',
    createdAt: t,
    updatedAt: t,
  }

  const orders = await readOrders()
  await writeOrders([order, ...orders])

  res.status(201).json({ ok: true, orderId, order })
})

app.get('/api/orders', async (_req, res) => {
  const orders = await readOrders()
  const visible = orders.filter((o) => o.status === 'paid' || o.status === 'cod')
  res.json({ orders: visible })
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

  const current = await readProducts()
  const t = now()
  const next = {
    id: id(),
    ...input.data,
    createdAt: t,
    updatedAt: t,
  }
  await writeProducts([next, ...current])
  res.status(201).json({ product: next })
})

app.patch('/api/products/:id', async (req, res) => {
  const patch = ProductUpdateSchema.safeParse(req.body)
  if (!patch.success) {
    res.status(400).json({ error: 'Invalid payload', details: patch.error.flatten() })
    return
  }

  const current = await readProducts()
  const idx = current.findIndex((p) => p.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  const t = now()
  const updated = { ...current[idx], ...patch.data, updatedAt: t }
  const next = [...current.slice(0, idx), updated, ...current.slice(idx + 1)]
  await writeProducts(next)
  res.json({ product: updated })
})

app.delete('/api/products/:id', async (req, res) => {
  const current = await readProducts()
  const next = current.filter((p) => p.id !== req.params.id)
  if (next.length === current.length) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await writeProducts(next)
  res.json({ ok: true })
})

// Serve the frontend (single deployment)
app.use(express.static(FRONTEND_DIST_DIR))
app.get('/', async (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIST_DIR, 'index.html'))
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on :${PORT}`)
})

