import { AlertCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/shop-contact'

const IMMEDIATE_DISPATCH_MESSAGE =
  'Hi Look Like! Please share the list of products available for immediate dispatch.'

type OrderDisclaimerProps = {
  className?: string
  compact?: boolean
}

export default function OrderDisclaimer({ className = '', compact = false }: OrderDisclaimerProps) {
  const whatsappHref = buildWhatsAppUrl(IMMEDIATE_DISPATCH_MESSAGE)

  return (
    <aside
      className={`border border-gold/25 bg-[#faf8f2] p-4 ${className}`}
      aria-label="Order disclaimer"
    >
      <div className="flex gap-3">
        <AlertCircle
          size={compact ? 18 : 20}
          strokeWidth={1.5}
          className="shrink-0 text-gold-dark mt-0.5"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-gold-dark">
            Disclaimer
          </p>
          <ul
            className={`mt-2 space-y-2 font-body text-black/70 list-disc pl-4 ${
              compact ? 'text-[12px] leading-[1.55]' : 'text-[13px] leading-[1.65]'
            }`}
          >
            <li>
              Read the size chart / size guide carefully before placing the order.
            </li>
            <li>
              Once your order is <strong className="font-medium text-black">confirmed</strong>, we dispatch the
              same day. Delivery to your door in <strong className="font-medium text-black">2–3 days</strong> via{' '}
              <strong className="font-medium text-black">ST Courier</strong> or{' '}
              <strong className="font-medium text-black">DTDC Courier</strong>.
            </li>
            <li>
              A few products are available for immediate dispatch.{' '}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold-dark underline underline-offset-2 hover:text-black transition-colors"
              >
                DM us on WhatsApp
              </a>{' '}
              for the immediate dispatch product list.
            </li>
          </ul>
        </div>
      </div>
    </aside>
  )
}
