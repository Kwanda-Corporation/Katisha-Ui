import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { WaveDivider } from './HandDrawn';

const QUICK_LINKS = [
  { to: '/book', key: 'nav.bookTicket' },
  { to: '/track', key: 'nav.trackBooking' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/guide', key: 'nav.howItWorks' },
];

const CONTACT_LINES = ['support@katisha.today', '+250 793 216 191', '+250 722 829 315', 'Norsken House, KG 7 Ave, Kigali, Rwanda'];

const PAYMENT_METHODS = ['MTN Mobile Money (MoMo)', 'Airtel Money', 'M-Pesa'];

export default function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer
      className="relative px-4 sm:px-8 pt-16 pb-8"
      style={{ background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)', color: 'white' }}
    >
      <WaveDivider flip className="pointer-events-none absolute inset-x-0 -top-10 h-10 w-full text-white" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-10">
          {/* Brand */}
          <div>
            <img src="/3.png" alt="Katisha — Rwanda bus ticket booking" className="h-14 w-auto object-contain mb-4" />
            <p className="text-[13px] leading-relaxed max-w-xs text-white/75">{t('footer.description')}</p>
            <div className="mt-4 space-y-1.5 text-[13px] text-white/85">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/60">Book with Katisha</p>
              <p>East African bus routes from Kigali</p>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.15em] mb-4 text-white/60">
              {t('footer.quickLinks')}
            </h4>
            <nav className="flex flex-col gap-2.5">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-[13px] text-white/85 hover:text-white no-underline transition-colors"
                >
                  {link.key ? t(link.key) : link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.15em] mb-4 text-white/60">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-2.5 text-[13px] text-white/85">
              {CONTACT_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          {/* Payment methods */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.15em] mb-4 text-white/60">Payment Methods</h4>
            <ul className="space-y-2.5 text-[13px] text-white/85">
              {PAYMENT_METHODS.map((method) => (
                <li key={method}>{method}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/60">
            &copy; 2026 {t('footer.copyright')}
          </p>
          <p className="text-[12px] text-white/60">
            Powered by <span className="font-semibold text-white/90">Kwanda Group</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
