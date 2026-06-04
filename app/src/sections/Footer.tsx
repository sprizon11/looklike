import Logo from '@/components/Logo'
import { buildWhatsAppUrl } from '@/lib/shop-contact'

export default function Footer() {
  const scrollToSection = (href: string) => {
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer id="footer" className="bg-[#f7f7f7] pt-[80px] pb-[40px] px-[30px] md:px-[60px]">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[40px]">
          {/* Brand */}
          <div>
            <Logo variant="dark" size="md" align="start" />
            <p className="font-body text-[14px] italic text-black/50 mt-5 max-w-[240px] leading-[1.6]">
              &ldquo;Style ah choose pannunga, Look ah change pannunga&rdquo;
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body text-[13px] font-medium uppercase tracking-[0.08em] text-black mb-4 inline-flex flex-col">
              SHOP
              <span className="mt-1.5 h-[2px] w-7 bg-gold-gradient" />
            </h4>
            <ul className="space-y-2">
              {[
                { label: 'Kurtis', href: '#products' },
                { label: 'Leggings', href: '#products' },
                { label: 'Palazzos', href: '#products' },
                { label: 'New Arrivals', href: '#featured' },
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="font-body text-[14px] font-normal text-black/50 hover:text-black transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="font-body text-[13px] font-medium uppercase tracking-[0.08em] text-black mb-4 inline-flex flex-col">
              HELP
              <span className="mt-1.5 h-[2px] w-7 bg-gold-gradient" />
            </h4>
            <ul className="space-y-2">
              {['About Us', 'Shipping Info', 'Return Policy'].map((label) => (
                <li key={label}>
                  <span className="font-body text-[14px] font-normal text-black/50">{label}</span>
                </li>
              ))}
              <li>
                <button
                  onClick={() => scrollToSection('#footer')}
                  className="font-body text-[14px] font-normal text-black/50 hover:text-black transition-colors duration-200"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body text-[13px] font-medium uppercase tracking-[0.08em] text-black mb-4 inline-flex flex-col">
              CONTACT
              <span className="mt-1.5 h-[2px] w-7 bg-gold-gradient" />
            </h4>
            <p className="font-body text-[14px] font-normal text-black/50 leading-[1.7]">
              31/10A, Jawahar Nagar,<br />
              Kongu Main Road,<br />
              Tirupur, Tamil Nadu
            </p>
            <a
              href={buildWhatsAppUrl('Hi Look Like!')}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-body text-[14px] font-normal text-black/50 hover:text-black transition-colors duration-200 mt-2"
            >
              +91 93448 41180
            </a>
            <p className="font-body text-[13px] font-normal text-black/30 mt-2">
              GST: 33CSRPT6961N1ZM
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="gold-divider mt-[60px]" />
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-[12px] text-black/30">
            2025 Look Like. All rights reserved.
          </p>
          <a
            href="https://instagram.com/look_like_tirupur"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[12px] text-black/50 hover:text-gold-dark transition-colors duration-200"
          >
            Follow us on Instagram
          </a>
        </div>
      </div>
    </footer>
  )
}
