import fs from 'node:fs/promises'
import path from 'node:path'

export function proofsDir(dataDir) {
  return path.join(dataDir, 'proofs')
}

export async function savePaymentProofFile(dataDir, orderId, dataUrl) {
  const match = /^data:image\/(\w+);base64,(.+)$/.exec(dataUrl)
  if (!match) throw new Error('Invalid payment screenshot')

  const ext = match[1] === 'png' ? 'png' : 'jpg'
  const buf = Buffer.from(match[2], 'base64')
  const dir = proofsDir(dataDir)
  await fs.mkdir(dir, { recursive: true })

  const filename = `${orderId}.${ext}`
  await fs.writeFile(path.join(dir, filename), buf)
  return filename
}

export function paymentProofPath(dataDir, filename) {
  return path.join(proofsDir(dataDir), filename)
}
