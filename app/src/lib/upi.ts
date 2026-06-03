export type UpiPayInput = {
  upiId: string
  payeeName: string
  amount: number
  note?: string
}

type UpiQueryOptions = {
  /** Long notes in deep links can trigger GPay "risky transaction" blocks. */
  includeNote?: boolean
}

function buildUpiQuery(input: UpiPayInput, options: UpiQueryOptions = {}) {
  const { includeNote = false } = options
  const params = new URLSearchParams({
    pa: input.upiId.trim(),
    pn: input.payeeName.trim().slice(0, 50),
    am: input.amount.toFixed(2),
    cu: 'INR',
  })
  if (includeNote && input.note?.trim()) {
    params.set('tn', input.note.trim().slice(0, 50))
  }
  return params.toString()
}

/** For QR codes — short note only (GPay business UPI works best via scan). */
export function buildUpiQrUri(input: UpiPayInput) {
  return `upi://pay?${buildUpiQuery(input, { includeNote: true })}`
}

/** For app deep links — amount + UPI ID only (no note — reduces GPay blocks). */
export function buildUpiPayUri(input: UpiPayInput) {
  return `upi://pay?${buildUpiQuery(input, { includeNote: false })}`
}

export type UpiAppLink = {
  id: 'gpay' | 'phonepe' | 'paytm' | 'any'
  label: string
  subtitle: string
  href: string
}

export function buildUpiAppLinks(input: UpiPayInput): UpiAppLink[] {
  const q = buildUpiQuery(input, { includeNote: false })
  const upiHref = `upi://pay?${q}`

  return [
    {
      id: 'gpay',
      label: 'Google Pay',
      subtitle: 'If blocked, scan QR above',
      href: upiHref,
    },
    {
      id: 'phonepe',
      label: 'PhonePe',
      subtitle: 'Opens PhonePe app',
      href: `phonepe://pay?${q}`,
    },
    {
      id: 'paytm',
      label: 'Paytm',
      subtitle: 'Opens Paytm app',
      href: `paytmmp://pay?${q}`,
    },
    {
      id: 'any',
      label: 'Other UPI app',
      href: upiHref,
      subtitle: 'Choose any installed app',
    },
  ]
}

export function openUpiApp(href: string) {
  window.location.assign(href)
}

export function isMobileDevice() {
  return typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}
