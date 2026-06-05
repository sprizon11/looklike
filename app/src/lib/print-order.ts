import type { AdminOrder } from '@/lib/orders-api'
import { buildBillPrintHtml } from '@/lib/order-bill'

function printViaIframe(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'Print order')
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'

  let printed = false

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }, 1500)
  }

  const triggerPrint = () => {
    if (printed) return
    printed = true
    const win = iframe.contentWindow
    if (!win) return
    win.focus()
    win.print()
    win.addEventListener('afterprint', cleanup, { once: true })
    window.setTimeout(cleanup, 5000)
  }

  document.body.appendChild(iframe)
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    throw new Error('Could not create print frame')
  }

  doc.open()
  doc.write(html)
  doc.close()

  iframe.onload = () => triggerPrint()
  window.setTimeout(triggerPrint, 400)
}

function printViaBlob(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    URL.revokeObjectURL(url)
    throw new Error('popup_blocked')
  }
  win.onload = () => {
    win.focus()
    win.print()
    URL.revokeObjectURL(url)
  }
}

export function printAdminOrder(order: AdminOrder) {
  const html = buildBillPrintHtml(order)

  try {
    printViaIframe(html)
  } catch {
    try {
      printViaBlob(html)
    } catch {
      window.alert(
        'Could not open print view. Please allow pop-ups for this site, or use Print from the browser menu.'
      )
    }
  }
}
