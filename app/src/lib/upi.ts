export type UpiPayInput = {
  upiId: string
  payeeName: string
  amount: number
  note?: string
}

function buildUpiQuery(input: UpiPayInput) {
  const params = new URLSearchParams({
    pa: input.upiId.trim(),
    pn: input.payeeName.trim(),
    am: input.amount.toFixed(2),
    cu: 'INR',
  })
  if (input.note?.trim()) params.set('tn', input.note.trim())
  return params.toString()
}

export function buildUpiPayUri(input: UpiPayInput) {
  return `upi://pay?${buildUpiQuery(input)}`
}

export type UpiAppLink = {
  id: 'gpay' | 'phonepe' | 'paytm' | 'any'
  label: string
  subtitle: string
  href: string
}

function isAndroid() {
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
}

export function buildUpiAppLinks(input: UpiPayInput): UpiAppLink[] {
  const q = buildUpiQuery(input)

  const gpayHref = isAndroid()
    ? `intent://upi/pay?${q}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
    : `gpay://upi/pay?${q}`

  return [
    {
      id: 'gpay',
      label: 'Google Pay',
      subtitle: 'Opens GPay app',
      href: gpayHref,
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
      subtitle: 'Choose any installed app',
      href: `upi://pay?${q}`,
    },
  ]
}

export function openUpiApp(href: string) {
  window.location.assign(href)
}

export function isMobileDevice() {
  return typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}
