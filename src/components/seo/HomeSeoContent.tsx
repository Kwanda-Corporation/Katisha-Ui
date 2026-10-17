import { Helmet } from 'react-helmet-async';
import { ssrData } from '../../ssrData';

/**
 * Crawler-only SEO content for the homepage (`/`).
 *
 * The homepage's visible UI is the language picker (see `Onboarding.tsx`), which
 * gives crawlers almost nothing to understand the product. This block is
 * rendered visually hidden (`sr-only`) — present in the DOM for search engine
 * crawlers and assistive technology, but never shown to sighted users — and
 * gives Google a complete, accurate description of the platform: what Katisha
 * does, every East Africa cross-border route we serve from Kigali, the bus
 * operators, payment methods, and how booking works.
 *
 * It is intentionally rendered server-side (see `entry-server.tsx`) so the
 * pre-rendered `/index.html` ships this content without any JavaScript. The
 * route list is taken from the build-time embedded data (`ssrData`) so it always
 * matches the live route catalogue, with a static fallback for safety.
 */

const slugify = (s: string) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const SITE_URL = 'https://katisha.today';

// Country lookup for the destinations currently served from Kigali. Unknown
// destinations fall back to a generic "East Africa" bucket so newly added
// routes still appear without a code change.
const COUNTRY_BY_DESTINATION: Record<string, string> = {
  // Uganda
  kampala: 'Uganda',
  mbarara: 'Uganda',
  jinja: 'Uganda',
  ntungamo: 'Uganda',
  ntugamo: 'Uganda',
  // Kenya
  nairobi: 'Kenya',
  kisumu: 'Kenya',
  nakuru: 'Kenya',
  busia: 'Kenya',
  // Tanzania
  'dar es salaam': 'Tanzania',
  arusha: 'Tanzania',
  moshi: 'Tanzania',
  dodoma: 'Tanzania',
  morogoro: 'Tanzania',
  mwanza: 'Tanzania',
  kigoma: 'Tanzania',
  bukoba: 'Tanzania',
  shinyanga: 'Tanzania',
  kahama: 'Tanzania',
  tabora: 'Tanzania',
  singida: 'Tanzania',
  manyoni: 'Tanzania',
  nzega: 'Tanzania',
  kabanga: 'Tanzania',
  iringa: 'Tanzania',
  mbeya: 'Tanzania',
  sumbawanga: 'Tanzania',
  tunduma: 'Tanzania',
  // DR Congo
  lubumbashi: 'DR Congo',
  kasumbalesa: 'DR Congo',
  mutambashwala: 'DR Congo',
  'kasumuru border': 'DR Congo',
  // Zambia
  lusaka: 'Zambia',
  // Malawi
  lilongwe: 'Malawi',
  // Zimbabwe
  harare: 'Zimbabwe',
  bulawayo: 'Zimbabwe',
  // Mozambique
  nampula: 'Mozambique',
  // South Africa
  johannesburg: 'South Africa',
};

const COUNTRY_ORDER = [
  'Uganda',
  'Kenya',
  'Tanzania',
  'DR Congo',
  'Zambia',
  'Malawi',
  'Zimbabwe',
  'Mozambique',
  'South Africa',
  'East Africa',
];

interface RouteLink {
  origin: string;
  destination: string;
  slug: string;
  country: string;
}

// Static fallback so the crawler content is always populated even if the
// build-time API fetch failed. Mirrors the live catalogue at the time of
// writing; the live `ssrData` list takes precedence whenever available.
const FALLBACK_ROUTES: Array<{ origin: string; destination: string }> = [
  { origin: 'Kigali', destination: 'Kampala' },
  { origin: 'Kigali', destination: 'Mbarara' },
  { origin: 'Kigali', destination: 'Jinja' },
  { origin: 'Kigali', destination: 'Ntugamo' },
  { origin: 'Kigali', destination: 'Nairobi' },
  { origin: 'Kigali', destination: 'Kisumu' },
  { origin: 'Kigali', destination: 'Nakuru' },
  { origin: 'Kigali', destination: 'Busia' },
  { origin: 'Kigali', destination: 'Dar es Salaam' },
  { origin: 'Kigali', destination: 'Arusha' },
  { origin: 'Kigali', destination: 'Moshi' },
  { origin: 'Kigali', destination: 'Dodoma' },
  { origin: 'Kigali', destination: 'Morogoro' },
  { origin: 'Kigali', destination: 'Mwanza' },
  { origin: 'Kigali', destination: 'Kigoma' },
  { origin: 'Kigali', destination: 'Bukoba' },
  { origin: 'Kigali', destination: 'Shinyanga' },
  { origin: 'Kigali', destination: 'Kahama' },
  { origin: 'Kigali', destination: 'Tabora' },
  { origin: 'Kigali', destination: 'Singida' },
  { origin: 'Kigali', destination: 'Manyoni' },
  { origin: 'Kigali', destination: 'Nzega' },
  { origin: 'Kigali', destination: 'Kabanga' },
  { origin: 'Kigali', destination: 'Iringa' },
  { origin: 'Kigali', destination: 'Mbeya' },
  { origin: 'Kigali', destination: 'Sumbawanga' },
  { origin: 'Kigali', destination: 'Tunduma' },
  { origin: 'Kigali', destination: 'Lubumbashi' },
  { origin: 'Kigali', destination: 'Kasumbalesa' },
  { origin: 'Kigali', destination: 'Mutambashwala' },
  { origin: 'Kigali', destination: 'Kasumuru Border' },
  { origin: 'Kigali', destination: 'Lusaka' },
  { origin: 'Kigali', destination: 'Lilongwe' },
  { origin: 'Kigali', destination: 'Harare' },
  { origin: 'Kigali', destination: 'Bulawayo' },
  { origin: 'Kigali', destination: 'Nampula' },
  { origin: 'Kigali', destination: 'Johannesburg' },
];

function buildRouteLinks(routes: Array<Record<string, unknown>>): RouteLink[] {
  const seen = new Set<string>();
  const links: RouteLink[] = [];
  for (const r of routes) {
    const origin = (r.origin ?? r.from) as string | undefined;
    const destination = (r.destination ?? r.to) as string | undefined;
    if (!origin || !destination) continue;
    const slug = `${slugify(origin)}-to-${slugify(destination)}`;
    if (seen.has(slug)) continue;
    seen.add(slug);
    links.push({
      origin,
      destination,
      slug,
      country: COUNTRY_BY_DESTINATION[String(destination).toLowerCase()] || 'East Africa',
    });
  }
  return links.sort((a, b) =>
    a.country === b.country
      ? a.destination.localeCompare(b.destination)
      : COUNTRY_ORDER.indexOf(a.country) - COUNTRY_ORDER.indexOf(b.country),
  );
}

const AGENCIES = [
  'Simba Coaches',
  'Jaguar Express',
  'Taqwa Classic Coaches',
  'Trinity Express',
];

export default function HomeSeoContent() {
  const preloaded = ssrData.getRoutes();
  const routes = preloaded && preloaded.length ? preloaded : FALLBACK_ROUTES;
  const links = buildRouteLinks(routes);

  const grouped = COUNTRY_ORDER.map((country) => ({
    country,
    links: links.filter((l) => l.country === country),
  })).filter((g) => g.links.length > 0);

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
        '@id': `${SITE_URL}/#east-africa-routes`,
        name: 'East Africa cross-border bus routes from Kigali, Rwanda',
        numberOfItems: links.length,
        itemListElement: links.map((l, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${l.origin} to ${l.destination} bus tickets`,
          url: `${SITE_URL}/bus/${l.slug}`,
        })),
      },
    ],
  };

  return (
    <section className="sr-only" aria-label="About Katisha bus ticket booking">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <h1>Book Bus Tickets Online in Rwanda &amp; East Africa — Katisha</h1>
      <p>
        Katisha is an online bus ticket booking platform for Rwanda and East Africa. It lets
        travellers search, compare, reserve and pay for intercity and cross-border bus tickets from
        Kigali, Rwanda to destinations across Uganda, Kenya, Tanzania, the Democratic Republic of
        Congo, Zambia, Malawi, Zimbabwe, Mozambique and South Africa. Every fare shown on Katisha is
        a RURA-approved price, tickets are delivered instantly as e-tickets, and passengers can
        select their seat and track their journey in real time.
      </p>

      <h2>What Katisha does</h2>
      <ul>
        <li>Search and compare live bus schedules and fares for routes from Kigali, Rwanda.</li>
        <li>Book intercity bus tickets inside Rwanda and cross-border bus tickets across East Africa.</li>
        <li>Choose your seat on the bus with an interactive seat map.</li>
        <li>Receive an instant electronic ticket (e-ticket) with a reference code and QR code after payment.</li>
        <li>Pay securely with MTN Mobile Money, Airtel Money or M-Pesa.</li>
        <li>Track your bus journey in real time and view your upcoming trips under “My Tickets”.</li>
        <li>Compare bus operators and departure times on a single route before booking.</li>
      </ul>

      <h2>Bus companies and operators on Katisha</h2>
      <p>
        Katisha partners with licensed Rwandan and regional bus operators, including {AGENCIES.join(', ')}.
        Each operator runs its own schedules, buses and seat layouts, and every available option for a
        route is listed together so travellers can compare price, departure time and operator.
      </p>

      <h2>Rwanda intercity bus routes</h2>
      <p>
        Katisha covers intercity bus travel within Rwanda between major towns and cities, including
        Kigali, Musanze, Huye, Rubavu, Rusizi, Nyagatare and Kayonza. Read more about Rwandan
        intercity routes at <a href={`${SITE_URL}/bus/rwanda`}>Bus Booking Rwanda — Intercity Routes &amp; Fares</a>.
      </p>

      <h2>East Africa cross-border bus routes from Kigali, Rwanda</h2>
      <p>
        Katisha connects Rwanda to its neighbours and beyond. The following cross-border bus routes
        depart from or connect through Kigali. Each link is an interactive page with fares, schedules,
        operators and booking for that specific route.
      </p>
      {grouped.map((group) => (
        <section key={group.country}>
          <h3>Rwanda to {group.country} bus routes</h3>
          <ul>
            {group.links.map((l) => (
              <li key={l.slug}>
                <a href={`${SITE_URL}/bus/${l.slug}`}>
                  {l.origin} to {l.destination} bus tickets
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <h2>How to book a bus ticket on Katisha</h2>
      <ol>
        <li>Choose your language and open the booking page.</li>
        <li>Enter your origin and destination (for example Kigali to Kampala).</li>
        <li>Compare the available bus operators, departure times and fares for your route.</li>
        <li>Pick your seat on the bus.</li>
        <li>Enter the passenger details and pay with Mobile Money.</li>
        <li>Receive your e-ticket instantly and present it to the conductor or agent.</li>
      </ol>
      <p>
        Start booking at <a href={`${SITE_URL}/book`}>the Katisha booking page</a>, or read the
        step-by-step <a href={`${SITE_URL}/guide`}>bus booking guide</a>. Browse all
        <a href={`${SITE_URL}/bus/east-africa`}> East Africa cross-border routes</a>.
      </p>

      <h2>Payment methods</h2>
      <p>
        Katisha accepts MTN Mobile Money (MoMo), Airtel Money and M-Pesa for secure online payment.
        All transactions are processed instantly and the e-ticket is issued as soon as payment is
        confirmed. Fares are set in Rwandan Francs (RWF) at RURA-approved prices.
      </p>

      <h2>Countries and regions served</h2>
      <p>
        From Kigali, Rwanda, Katisha serves cross-border and long-distance bus travel to Uganda
        (Kampala, Mbarara, Jinja, Ntungamo), Kenya (Nairobi, Nakuru, Kisumu, Busia), Tanzania (Dar es
        Salaam, Arusha, Moshi, Dodoma, Morogoro, Mwanza, Kigoma, Bukoba, Shinyanga, Kahama, Tabora,
        Singida, Manyoni, Nzega, Kabanga, Iringa, Mbeya, Sumbawanga, Tunduma), the Democratic Republic
        of Congo (Lubumbashi, Kasumbalesa, Mutambashwala, Kasumuru Border), Zambia (Lusaka), Malawi
        (Lilongwe), Zimbabwe (Harare, Bulawayo), Mozambique (Nampula) and South Africa (Johannesburg).
      </p>

      <h2>Why book with Katisha</h2>
      <ul>
        <li>RURA-approved, transparent bus fares with no hidden charges.</li>
        <li>Licensed bus operators with real seat availability.</li>
        <li>Instant e-tickets and live journey tracking.</li>
        <li>Secure Mobile Money payment with MTN, Airtel and M-Pesa.</li>
        <li>Compare every operator and departure time for a route in one place.</li>
      </ul>

      <h2>Frequently asked questions</h2>
      <h3>How do I book a bus ticket online in Rwanda?</h3>
      <p>
        Open the Katisha booking page, enter your origin and destination, choose an operator and
        departure time, select your seat, and pay with MTN Mobile Money, Airtel Money or M-Pesa. Your
        e-ticket is issued instantly.
      </p>
      <h3>Which routes does Katisha cover from Kigali?</h3>
      <p>
        Katisha covers cross-border bus routes from Kigali to Uganda, Kenya, Tanzania, DR Congo,
        Zambia, Malawi, Zimbabwe, Mozambique and South Africa, plus intercity travel within Rwanda.
      </p>
      <h3>Are bus prices on Katisha regulated?</h3>
      <p>
        Yes. All fares displayed on Katisha are RURA-approved prices set in compliance with the Rwanda
        Utilities Regulatory Authority.
      </p>
      <h3>What payment methods are accepted?</h3>
      <p>Katisha accepts MTN Mobile Money, Airtel Money and M-Pesa.</p>
      <h3>Can I track my bus journey?</h3>
      <p>
        Yes. Use your booking reference on the Katisha track page to view the live location, estimated
        arrival time and journey status.
      </p>
      <h3>Is Katisha available in Kinyarwanda, Kiswahili and French?</h3>
      <p>
        Yes. Katisha is available in English, Kinyarwanda, Kiswahili and French. Choose your language
        on the homepage.
      </p>

      <h2>Contact Katisha</h2>
      <p>
        Email <a href="mailto:support@katisha.today">support@katisha.today</a> or call
        <a href="tel:+250793216191">+250 793 216 191</a>. Katisha is based in Kigali, Rwanda. Read our
        <a href={`${SITE_URL}/privacy`}> privacy policy</a>.
      </p>
    </section>
  );
}
