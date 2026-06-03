/** Download a QR code SVG element as a PNG file. */
export async function downloadQrPng(svgElement: SVGElement, filename: string) {
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Could not render QR'))
      image.src = url
    })

    const size = Math.max(img.naturalWidth || 320, img.width || 320)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not create image')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)

    const pngUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = pngUrl
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`
    link.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}
