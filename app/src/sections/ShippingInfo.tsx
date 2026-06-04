import { Truck } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { buildWhatsAppUrl } from '@/lib/shop-contact'

const IMMEDIATE_DISPATCH_MESSAGE =
  'Hi Look Like! Please share the list of products available for immediate dispatch.'

export default function ShippingInfo() {
  const whatsappHref = buildWhatsAppUrl(IMMEDIATE_DISPATCH_MESSAGE)

  return (
    <section id="shipping" className="bg-white py-16 sm:py-20 px-5 sm:px-8 md:px-14 border-t border-black/[0.06]">
      <div className="max-w-[720px] mx-auto">
        <p className="font-body text-[11px] uppercase tracking-[0.18em] text-gold-dark text-center">
          Help
        </p>
        <h2 className="font-display text-[30px] sm:text-[36px] font-normal text-black text-center mt-2 leading-[1.1] tracking-[-0.02em]">
          Shipping &amp; Delivery
        </h2>
        <div className="gold-divider mx-auto mt-5 w-[100px]" />

        <Accordion
          type="single"
          collapsible
          defaultValue="shipping"
          className="mt-10 border border-black/[0.08]"
        >
          <AccordionItem value="shipping" className="border-0">
            <AccordionTrigger className="px-5 sm:px-6 py-5 hover:no-underline [&>svg]:text-black/40">
              <span className="flex items-center gap-3 font-body text-[15px] font-medium text-black">
                <Truck size={20} strokeWidth={1.5} className="text-gold-dark shrink-0" />
                Shipping
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-5 sm:px-6 pb-6">
              <div className="space-y-4 font-body text-[14px] leading-[1.75] text-black/70">
                <p>
                  Orders placed in India are catered by safe and reliable courier companies such as{' '}
                  <strong className="font-medium text-black">DTDC</strong> and{' '}
                  <strong className="font-medium text-black">ST Courier</strong>.
                </p>
                <p>
                  Most of our dresses are <strong className="font-medium text-black">stitched after we receive your order</strong>.
                  Please allow <strong className="font-medium text-black">15–25 working days</strong> for preparation before
                  your order is dispatched.
                </p>
                <p>
                  After dispatch, for deliveries within India, shipping typically takes{' '}
                  <strong className="font-medium text-black">2–5 working days</strong>.
                </p>
                <p>
                  <strong className="font-medium text-black">Delivery charges:</strong> Tamil Nadu — Rs. 60 flat for
                  orders up to 1 kg; above 1 kg, Rs. 80 per kg (rounded up). Other states — Rs. 80 per kg (rounded up).
                  Select your state at checkout to see the exact amount.
                </p>
                <p>
                  Read the <strong className="font-medium text-black">size chart / size guide</strong> carefully before
                  placing your order.
                </p>
                <p>
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
                </p>
                <p>
                  We understand how important timely delivery is to you. While we aren&apos;t responsible for any delays
                  caused by the courier company, we&apos;re always here to help you! If you experience any issues, we&apos;ll
                  gladly assist in tracking your package through our partnering courier service.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  )
}
