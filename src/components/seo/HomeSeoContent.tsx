import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router';
import { KEY_ROUTES } from '../../config/seoPages';

/**
 * Homepage information section (`/` and `/welcome`).
 *
 * The homepage's interactive UI is just the language picker (see
 * `Onboarding.tsx`), which gives search engines almost nothing to understand the
 * product. This block renders *below* the picker as real, visible content: an
 * H1, an overview of the service, the curated route pages we want indexed, how
 * booking works, the operators, payment methods and an FAQ.
 *
 * It is intentionally rendered server-side (see `entry-server.tsx`) so the
 * pre-rendered `/index.html` ships this content without any JavaScript, and it
 * emits `Service` and `ItemList` structured data. Route links point only at the
 * curated, indexable set (`src/config/seoPages.ts`). The FAQ rich results are
 * already provided by the sitewide `FAQPage` block in `index.html`.
 */

const SITE_URL = 'https://katisha.today';

const PAYMENT_METHODS = ['MTN Mobile Money', 'Airtel Money', 'M-Pesa'];

const OPERATORS = [
  'Simba Coaches',
  'Jaguar Express',
  'Taqwa Classic Coaches',
  'Trinity Express',
];

const BOOKING_STEPS = [
  {
    title: 'Choose your route',
    body: 'Enter your origin and destination — for example Kigali to Kampala — and pick your travel date.',
  },
  {
    title: 'Compare buses',
    body: 'See every operator, departure time and RURA-approved fare for your route in one list.',
  },
  {
    title: 'Pick your seat & pay',
    body: 'Select your exact seat, then pay with MTN Mobile Money, Airtel Money or M-Pesa.',
  },
  {
    title: 'Travel with your e-ticket',
    body: 'Your e-ticket with a reference and QR code is issued instantly — show it to the conductor.',
  },
];

const FAQS = [
  {
    q: 'How do I book a bus ticket online in Rwanda?',
    a: 'Open the Katisha booking page, enter your origin and destination, choose an operator and departure time, select your seat, and pay with MTN Mobile Money, Airtel Money or M-Pesa. Your e-ticket is issued instantly.',
  },
  {
    q: 'Which routes does Katisha cover from Kigali?',
    a: 'Katisha covers cross-border bus routes from Kigali to Uganda, Kenya, Tanzania, the Democratic Republic of Congo, Zambia, Malawi, Zimbabwe, Mozambique and South Africa, plus intercity travel between towns and cities within Rwanda.',
  },
  {
    q: 'Are bus prices on Katisha regulated?',
    a: 'Yes. All fares displayed on Katisha are RURA-approved prices set in compliance with the Rwanda Utilities Regulatory Authority, so the price you see is the price you pay.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'Katisha accepts MTN Mobile Money (MoMo), Airtel Money and M-Pesa. Payment is processed instantly and your ticket is confirmed straight away.',
  },
  {
    q: 'Can I track my bus journey?',
    a: 'Yes. Use your booking reference on the Katisha track page to view the live location, estimated arrival time and journey status.',
  },
  {
    q: 'Is Katisha available in Kinyarwanda, Kiswahili and French?',
    a: 'Yes. Katisha is available in English, Kinyarwanda, Kiswahili and French — choose your language on the homepage.',
  },
];

export default function HomeSeoContent() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${SITE_URL}/#bus-booking`,
        name: 'Online bus ticket booking in Rwanda and East Africa',
        serviceType: 'Bus ticket booking',
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: [
          'Rwanda',
          'Uganda',
          'Kenya',
          'Tanzania',
          'DR Congo',
          'Zambia',
          'Malawi',
          'Zimbabwe',
          'Mozambique',
          'South Africa',
        ],
        offers: {
          '@type': 'Offer',
          priceCurrency: 'RWF',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/book`,
        },
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE_URL}/#popular-routes`,
        name: 'Popular bus routes from Kigali, Rwanda',
        numberOfItems: KEY_ROUTES.length,
        itemListElement: KEY_ROUTES.map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${r.origin} to ${r.destination} bus tickets`,
          url: `${SITE_URL}/bus/${r.slug}`,
        })),
      },
    ],
  };

  return (
    <section
      className="w-full bg-white border-t border-[var(--border)] px-4 sm:px-8 py-14"
      aria-label="About booking bus tickets with Katisha"
    >
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <header className="max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
            Book Bus Tickets Online in Rwanda &amp; East Africa
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[var(--text-sub)]">
            Katisha is an online bus ticket booking platform for Rwanda and East Africa. Search,
            compare, reserve and pay for intercity and cross-border bus tickets from Kigali to
            destinations across Uganda, Kenya, Tanzania, the Democratic Republic of Congo, Zambia,
            Malawi, Zimbabwe, Mozambique and South Africa. Every fare is a RURA-approved price,
            tickets are delivered instantly as e-tickets, and you can choose your seat and track your
            journey in real time.
          </p>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[var(--text-sub)]">
            <Link to="/book" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
              Search and book a bus ticket
            </Link>{' '}
            or read the{' '}
            <Link to="/guide" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
              step-by-step booking guide
            </Link>
            .
          </p>
        </header>

        {/* Curated, indexable route pages — the internal links that matter. */}
        <h2 className="mt-12 text-lg sm:text-xl font-bold text-[var(--text)]">
          Popular bus routes from Kigali
        </h2>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {KEY_ROUTES.map((r) => (
            <Link
              key={r.slug}
              to={`/bus/${r.slug}`}
              className="no-underline rounded-lg border border-[var(--border)] bg-white p-5 transition-colors hover:border-[var(--blue)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold text-[var(--text)]">
                  {r.origin} to {r.destination}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)]">{r.country}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-sub)]">{r.blurb}</p>
            </Link>
          ))}
        </div>

        {/* How booking works */}
        <h2 className="mt-14 text-lg sm:text-xl font-bold text-[var(--text)]">
          How to book a bus ticket on Katisha
        </h2>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BOOKING_STEPS.map((step, i) => (
            <div key={step.title} className="rounded-lg border border-[var(--border)] bg-[#FAFBFC] p-5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--blue)] text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-[var(--text)]">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-sub)]">{step.body}</p>
            </div>
          ))}
        </div>

        {/* Operators, payment and intercity routes */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">Bus operators on Katisha</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-sub)]">
              Katisha partners with licensed Rwandan and regional bus operators. Each runs its own
              schedules, buses and seat layouts, so every option for a route is listed together for
              easy comparison.
            </p>
            <ul className="mt-3 text-sm leading-relaxed text-[var(--text-sub)] list-disc pl-5">
              {OPERATORS.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">Payment methods</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-sub)]">
              Pay securely with mobile money. All transactions are processed instantly and the
              e-ticket is issued as soon as payment is confirmed. Fares are set in Rwandan Francs
              (RWF) at RURA-approved prices.
            </p>
            <ul className="mt-3 text-sm leading-relaxed text-[var(--text-sub)] list-disc pl-5">
              {PAYMENT_METHODS.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">Rwanda &amp; East Africa routes</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-sub)]">
              Book intercity travel within Rwanda between Kigali, Musanze, Huye, Rubavu, Rusizi,
              Nyagatare and Kayonza, or cross-border journeys to Kampala, Nairobi, Dar es Salaam,
              Arusha, Mwanza, Kigoma and beyond.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-sub)]">
              <Link to="/bus/rwanda" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
                Rwanda intercity bus routes
              </Link>
              <br />
              <Link to="/bus/east-africa" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
                East Africa cross-border bus routes
              </Link>
            </p>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="mt-14 text-lg sm:text-xl font-bold text-[var(--text)]">Frequently asked questions</h2>
        <div className="mt-4 max-w-3xl divide-y divide-[var(--border)] border-t border-b border-[var(--border)]">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-semibold text-sm text-[var(--text)]">
                {f.q}
                <span className="text-[var(--blue-dark)] shrink-0 text-lg leading-none group-open:hidden">+</span>
                <span className="text-[var(--blue-dark)] shrink-0 text-lg leading-none hidden group-open:block">–</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-sub)]">{f.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-10 text-sm leading-relaxed text-[var(--text-sub)]">
          Questions? Email{' '}
          <a href="mailto:support@katisha.today" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
            support@katisha.today
          </a>{' '}
          or call{' '}
          <a href="tel:+250793216191" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
            +250 793 216 191
          </a>
          . Katisha is based in Kigali, Rwanda. Read our{' '}
          <Link to="/privacy" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
            privacy policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
