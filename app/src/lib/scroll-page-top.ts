/** Force window to the top — needed after Lenis / long home-page scroll before route change. */
export function scrollPageToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

/** Repeat scroll-to-top so lazy routes and layout shifts cannot leave the page mid-way. */
export function scrollPageToTopAfterPaint() {
  scrollPageToTop()
  const delays = [0, 50, 150, 350, 600]
  const timers = delays.map((ms) => window.setTimeout(scrollPageToTop, ms))
  return () => timers.forEach((t) => window.clearTimeout(t))
}
