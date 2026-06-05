/** Product photos in admin — saved as square JPEG after upload. */
export const PRODUCT_IMAGE_SIZE = 1200
export const PRODUCT_IMAGE_QUALITY = 0.8

/** Payment screenshots — keep small for API/storage. */
export const PAYMENT_PROOF_MAX_WIDTH = 480
export const PAYMENT_PROOF_QUALITY = 0.65

/**
 * Resize & compress before saving (large phone photos break the API).
 * Default: fit inside a box, keeps aspect ratio (not forced square).
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1200,
  quality = 0.82,
  maxHeight = maxWidth
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not process image')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Shop product / colour photos: centre-cropped square, then scaled to size×size px.
 */
export async function compressProductImage(
  file: File,
  size = PRODUCT_IMAGE_SIZE,
  quality = PRODUCT_IMAGE_QUALITY
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file')
  }

  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = Math.floor((bitmap.width - side) / 2)
  const sy = Math.floor((bitmap.height - side) / 2)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not process image')
  }

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}
