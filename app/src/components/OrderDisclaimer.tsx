import { useState } from 'react'
import { AlertCircle, ChevronDown, Package } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/shop-contact'

const IMMEDIATE_DISPATCH_MESSAGE =
  'Hi Look Like! Please share the list of products available for immediate dispatch.'

type OrderDisclaimerProps = {
  className?: string
  compact?: boolean
}

export default function OrderDisclaimer({ className = '', compact = false }: OrderDisclaimerProps) {
  const [returnOpen, setReturnOpen] = useState(false)
  const whatsappHref = buildWhatsAppUrl(IMMEDIATE_DISPATCH_MESSAGE)
  const textSize = compact ? 'text-[12px] leading-[1.55]' : 'text-[13px] leading-[1.65]'

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

          <div className="mt-4 pt-4 border-t border-gold/20">
            <button
              type="button"
              onClick={() => setReturnOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-3 text-left"
              aria-expanded={returnOpen}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Package size={compact ? 16 : 18} strokeWidth={1.5} className="shrink-0 text-black/55" />
                <span className={`font-display text-black ${compact ? 'text-[15px]' : 'text-[16px]'}`}>
                  Return Policy
                </span>
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-black/45 transition-transform ${returnOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {returnOpen && (
              <div className={`mt-3 font-body text-black/70 space-y-2 ${textSize}`}>
                <p className="font-medium text-black">No Exchange ! No Return !!</p>
                <p>
                  While we ensure products are defect-free, Incase of any defects , Please record a continuous &
                  uncut video of the unboxing. Its Necessary to process any claims for exchange or return.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
