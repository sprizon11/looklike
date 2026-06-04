import { getSupabase } from './supabase-client.js'

const PROOFS_BUCKET = 'payment-proofs'

export function createSupabaseStore({ ProductSchema, OrderSchema }) {
  const supabase = getSupabase()

  function assertClient() {
    if (!supabase) throw new Error('Supabase is not configured')
  }

  function parseProductRow(row) {
    if (!row?.payload) return null
    const parsed = ProductSchema.safeParse(row.payload)
    return parsed.success ? parsed.data : null
  }

  function parseOrderRow(row) {
    if (!row?.payload) return null
    const parsed = OrderSchema.safeParse(row.payload)
    return parsed.success ? parsed.data : null
  }

  function orderForStorage(order) {
    const { paymentProof, ...rest } = order
    if (rest.paymentProofFile) return rest
    if (typeof paymentProof === 'string' && paymentProof.length < 100_000) return order
    return rest
  }

  return {
    label: 'supabase',

    async listProducts() {
      assertClient()
      const { data, error } = await supabase
        .from('products')
        .select('payload')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data || []).map((row) => parseProductRow(row)).filter(Boolean)
    },

    async saveAllProducts(products) {
      assertClient()
      const parsed = products.map((p) => ProductSchema.parse(p))
      if (parsed.length === 0) return
      const rows = parsed.map((p) => ({
        id: p.id,
        payload: p,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      }))
      const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' })
      if (error) throw new Error(error.message)
    },

    async insertProduct(product) {
      assertClient()
      const p = ProductSchema.parse(product)
      const { error } = await supabase.from('products').insert({
        id: p.id,
        payload: p,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })
      if (error) throw new Error(error.message)
    },

    async replaceProduct(product) {
      assertClient()
      const p = ProductSchema.parse(product)
      const { error } = await supabase
        .from('products')
        .update({
          payload: p,
          updated_at: p.updatedAt,
        })
        .eq('id', p.id)
      if (error) throw new Error(error.message)
    },

    async deleteProduct(id) {
      assertClient()
      const { data, error } = await supabase.from('products').delete().eq('id', id).select('id')
      if (error) throw new Error(error.message)
      if (!data?.length) throw new Error('Product not found')
    },

    async listOrders() {
      assertClient()
      const { data, error } = await supabase
        .from('orders')
        .select('payload')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data || []).map((row) => parseOrderRow(row)).filter(Boolean)
    },

    async insertOrder(order) {
      assertClient()
      const slim = orderForStorage(order)
      const o = OrderSchema.parse(slim)
      const { error } = await supabase.from('orders').insert({
        id: o.id,
        payload: o,
        status: o.status,
        created_at: o.createdAt,
        updated_at: o.updatedAt,
      })
      if (error) throw new Error(error.message)
    },

    async replaceOrder(order) {
      assertClient()
      const slim = orderForStorage(order)
      const o = OrderSchema.parse(slim)
      const { error } = await supabase
        .from('orders')
        .update({
          payload: o,
          status: o.status,
          updated_at: o.updatedAt,
        })
        .eq('id', o.id)
      if (error) throw new Error(error.message)
    },

    async deleteOrder(id) {
      assertClient()
      const { data: row, error: fetchErr } = await supabase
        .from('orders')
        .select('payload')
        .eq('id', id)
        .maybeSingle()
      if (fetchErr) throw new Error(fetchErr.message)
      if (!row) throw new Error('Order not found')

      const order = parseOrderRow(row)
      const { error } = await supabase.from('orders').delete().eq('id', id)
      if (error) throw new Error(error.message)

      const proofFile = order?.paymentProofFile
      if (proofFile) {
        await supabase.storage.from(PROOFS_BUCKET).remove([proofFile])
      }
    },

    async savePaymentProof(orderId, dataUrl) {
      assertClient()
      const match = /^data:image\/(\w+);base64,(.+)$/.exec(dataUrl)
      if (!match) throw new Error('Invalid payment screenshot')

      const ext = match[1] === 'png' ? 'png' : 'jpg'
      const buf = Buffer.from(match[2], 'base64')
      const filename = `${orderId}.${ext}`

      const { error } = await supabase.storage.from(PROOFS_BUCKET).upload(filename, buf, {
        contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
        upsert: true,
      })
      if (error) throw new Error(error.message)
      return filename
    },

    async readPaymentProof(filename) {
      assertClient()
      const { data, error } = await supabase.storage.from(PROOFS_BUCKET).download(filename)
      if (error || !data) throw new Error('Payment proof file missing')
      const buffer = Buffer.from(await data.arrayBuffer())
      const ext = filename.split('.').pop()?.toLowerCase()
      return { buffer, contentType: ext === 'png' ? 'image/png' : 'image/jpeg' }
    },
  }
}
