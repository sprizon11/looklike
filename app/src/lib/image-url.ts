const API_IMAGE_RE = /\/api\/products\/.+\/(image|gallery|color-image)/

/** Ensure API image URLs request the stored original (no server-side resize). */
export function withImageWidth(src: string | undefined, _width?: number): string | undefined {
  if (!src) return src
  if (!API_IMAGE_RE.test(src)) return src
  const q = src.indexOf('?')
  if (q === -1) return src
  const path = src.slice(0, q)
  const params = new URLSearchParams(src.slice(q + 1))
  params.delete('w')
  const rest = params.toString()
  return rest ? `${path}?${rest}` : path
}

export function isApiProductImage(src: string | undefined): boolean {
  return Boolean(src && API_IMAGE_RE.test(src))
}
