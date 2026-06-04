import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { isSupabaseEnabled } from './supabase-client.js'
import { createJsonStore } from './json-store.js'
import { createSupabaseStore } from './supabase-store.js'

const MONOREPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function resolveFromRoot(envPath, fallbackRelative) {
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.resolve(MONOREPO_ROOT, envPath)
  }
  return path.resolve(MONOREPO_ROOT, fallbackRelative)
}

const DATA_DIR = resolveFromRoot(process.env.DATA_DIR, 'backend/data')

const ProductColorSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  image: z.string().min(1),
  stock: z.number().int().nonnegative().optional(),
})

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  image: z.string().min(1),
  size: z.string().optional(),
  description: z.string().optional(),
  weightKg: z.number().positive().optional(),
  colors: z.array(ProductColorSchema).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const OrderSchema = z.object({
  id: z.string(),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    email: z.string().optional(),
    address: z.string().min(3),
    city: z.string().min(1),
    state: z.string().optional(),
    pincode: z.string().min(4),
  }),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      name: z.string().min(1),
      price: z.number().nonnegative(),
      quantity: z.number().int().positive(),
      size: z.string().min(1),
      color: z.string().optional(),
      image: z.string().optional(),
      weightKg: z.number().positive().optional(),
    })
  ),
  amount: z.number().nonnegative(),
  subtotal: z.number().nonnegative().optional(),
  deliveryCharge: z.number().nonnegative().optional(),
  totalWeightKg: z.number().nonnegative().optional(),
  currency: z.literal('INR'),
  status: z.enum(['pending', 'paid', 'failed', 'cod', 'upi_pending', 'upi']),
  paymentMethod: z.enum(['online', 'cod', 'upi']).optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  upiReference: z.string().optional(),
  paymentProof: z.string().optional(),
  paymentProofFile: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const storeOptions = { ProductSchema, OrderSchema, z }

let store = null

function getStore() {
  if (store) return store
  if (isSupabaseEnabled()) {
    store = createSupabaseStore(storeOptions)
    console.log('Data store: Supabase (persistent cloud database)')
  } else {
    store = createJsonStore({
      ...storeOptions,
      dataDir: DATA_DIR,
      productsFile: path.join(DATA_DIR, 'products.json'),
      ordersFile: path.join(DATA_DIR, 'orders.json'),
    })
    console.log('Data store: local JSON files (set SUPABASE_URL for production persistence)')
  }
  return store
}

export function getStoreLabel() {
  return getStore().label
}

export async function listProducts() {
  return getStore().listProducts()
}

export async function seedProducts(products) {
  return getStore().saveAllProducts(products)
}

export async function insertProduct(product) {
  return getStore().insertProduct(product)
}

export async function replaceProduct(product) {
  return getStore().replaceProduct(product)
}

export async function deleteProduct(id) {
  return getStore().deleteProduct(id)
}

export async function listOrders() {
  return getStore().listOrders()
}

export async function insertOrder(order) {
  return getStore().insertOrder(order)
}

export async function replaceOrder(order) {
  return getStore().replaceOrder(order)
}

export async function deleteOrder(id) {
  return getStore().deleteOrder(id)
}

export async function savePaymentProof(orderId, dataUrl) {
  return getStore().savePaymentProof(orderId, dataUrl)
}

export async function readPaymentProof(filename) {
  return getStore().readPaymentProof(filename)
}
