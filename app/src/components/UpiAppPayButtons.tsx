import type { MouseEvent } from 'react'
import { buildUpiAppLinks, isMobileDevice, openUpiApp, type UpiPayInput } from '@/lib/upi'

type Props = {
  upiId: string
  payeeName: string
  amount: number
  note?: string
}

const appAccent: Record<string, string> = {
  gpay: 'border-[#4285F4]/30 hover:border-[#4285F4]/60',
  phonepe: 'border-[#5F259F]/30 hover:border-[#5F259F]/60',
  paytm: 'border-[#00BAF2]/30 hover:border-[#00BAF2]/60',
  any: 'border-black/15 hover:border-black/35',
}

export default function UpiAppPayButtons({ upiId, payeeName, amount, note }: Props) {
  const input: UpiPayInput = { upiId, payeeName, amount, note }
  const links = buildUpiAppLinks(input)
  const mobile = isMobileDevice()

  const handleClick = (href: string) => (e: MouseEvent) => {
    e.preventDefault()
    openUpiApp(href)
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/40">Pay directly</p>
        <p className="font-body text-[13px] text-black/60 mt-1">
          {mobile
            ? 'Tap an app — amount Rs. ' + amount.toLocaleString('en-IN') + ' will be pre-filled.'
            : 'On mobile, tap to open the app. On desktop, scan the QR code above.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            onClick={handleClick(link.href)}
            className={`flex flex-col justify-center min-h-[72px] px-4 py-3 border bg-white transition-colors ${appAccent[link.id]}`}
          >
            <span className="font-body text-[14px] font-medium text-black">{link.label}</span>
            <span className="font-body text-[11px] text-black/45 mt-0.5">{link.subtitle}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
