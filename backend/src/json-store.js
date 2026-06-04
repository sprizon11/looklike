import fs from 'node:fs/promises'
import path from 'node:path'
import { paymentProofPath, proofsDir, savePaymentProofFile as saveLocalProof } from './proofs.js'

export function createJsonStore({ dataDir, productsFile, ordersFile, ProductSchema, OrderSchema, z }) {
  async function ensureDataDir() {
    await fs.mkdir(dataDir, { recursive: true })
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

  function orderForStorage(order) {
    const { paymentProof, ...rest } = order
    if (rest.paymentProofFile) return rest
    if (typeof paymentProof === 'string' && paymentProof.length < 100_000) return order
    return rest
  }

  return {
    label: 'json-files',

    async listProducts() {
      await ensureDataDir()
      const list = await readJson(productsFile, null)
      return Array.isArray(list) ? list : []
    },

    async saveAllProducts(products) {
      const parsed = z.array(ProductSchema).safeParse(products)
      if (!parsed.success) throw new Error('Invalid product data')
      await writeJsonAtomic(productsFile, parsed.data)
    },

    async insertProduct(product) {
      const list = await this.listProducts()
      await this.saveAllProducts([product, ...list])
    },

    async replaceProduct(product) {
      const list = await this.listProducts()
      const idx = list.findIndex((p) => p.id === product.id)
      if (idx === -1) throw new Error('Product not found')
      const next = [...list.slice(0, idx), product, ...list.slice(idx + 1)]
      await this.saveAllProducts(next)
    },

    async deleteProduct(id) {
      const list = await this.listProducts()
      const next = list.filter((p) => p.id !== id)
      if (next.length === list.length) throw new Error('Product not found')
      await this.saveAllProducts(next)
    },

    async listOrders() {
      await ensureDataDir()
      const list = await readJson(ordersFile, [])
      if (!Array.isArray(list)) return []
      const parsed = z.array(OrderSchema).safeParse(list)
      if (parsed.success) return parsed.data
      const out = []
      for (const item of list) {
        let candidate = item
        if (typeof candidate?.paymentProof === 'string' && candidate.paymentProof.length > 100_000) {
          const { paymentProof, ...rest } = candidate
          candidate = rest
        }
        const one = OrderSchema.safeParse(candidate)
        if (one.success) out.push(one.data)
      }
      return out
    },

    async insertOrder(order) {
      const slim = orderForStorage(order)
      const parsed = OrderSchema.safeParse(slim)
      if (!parsed.success) throw new Error('Invalid order data')
      const list = await this.listOrders()
      await writeJsonAtomic(ordersFile, [parsed.data, ...list])
    },

    async replaceOrder(order) {
      const slim = orderForStorage(order)
      const parsed = OrderSchema.safeParse(slim)
      if (!parsed.success) throw new Error('Invalid order data')
      const list = await this.listOrders()
      const idx = list.findIndex((o) => o.id === order.id)
      if (idx === -1) throw new Error('Order not found')
      const next = [...list.slice(0, idx), parsed.data, ...list.slice(idx + 1)]
      const allParsed = z.array(OrderSchema).safeParse(next)
      if (!allParsed.success) throw new Error('Invalid order data')
      await writeJsonAtomic(ordersFile, allParsed.data)
    },

    async deleteOrder(id) {
      const list = await this.listOrders()
      const order = list.find((o) => o.id === id)
      if (!order) throw new Error('Order not found')
      const next = list.filter((o) => o.id !== id)
      const allParsed = z.array(OrderSchema).safeParse(next)
      if (!allParsed.success) throw new Error('Invalid order data')
      await writeJsonAtomic(ordersFile, allParsed.data)
      if (order.paymentProofFile) {
        try {
          await fs.unlink(paymentProofPath(dataDir, order.paymentProofFile))
        } catch {
          // proof file may already be missing
        }
      }
    },

    async savePaymentProof(orderId, dataUrl) {
      await ensureDataDir()
      await fs.mkdir(proofsDir(dataDir), { recursive: true })
      return saveLocalProof(dataDir, orderId, dataUrl)
    },

    async readPaymentProof(filename) {
      const buf = await fs.readFile(paymentProofPath(dataDir, filename))
      const ext = path.extname(filename).slice(1) || 'jpg'
      return { buffer: buf, contentType: ext === 'png' ? 'image/png' : 'image/jpeg' }
    },
  }
}
