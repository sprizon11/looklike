const API_IMAGE_RE = /\/api\/products\/.+\/(image|gallery|color-image)/

/** Append a width query for server-side thumbnail resizing on API image URLs. */
export function withImageWidth(src: string | undefined, width?: number): string | undefined {
  if (!src || !width) return src
  if (!API_IMAGE_RE.test(src)) return src
  if (/[?&]w=\d+/.test(src)) return src
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}`
}
