const API_IMAGE_RE = /\/api\/products\/.+\/(image|gallery|color-image)/

/** Grid / card thumbnails */
export const GRID_IMAGE_W = 420
/** Colour swatches on product page */
export const SWATCH_IMAGE_W = 240
/** Main product hero on detail page */
export const DETAIL_IMAGE_W = 720

/** Set width query for server-side thumbnail resizing on API image URLs. */
export function withImageWidth(src: string | undefined, width?: number): string | undefined {
  if (!src || !width) return src
  if (!API_IMAGE_RE.test(src)) return src
  if (/[?&]w=\d+/.test(src)) {
    return src.replace(/([?&])w=\d+/, `$1w=${width}`)
  }
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}`
}

export function isApiProductImage(src: string | undefined): boolean {
  return Boolean(src && API_IMAGE_RE.test(src))
}
