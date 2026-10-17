import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Bus, MapPin, ShieldCheck } from 'lucide-react';
import { api } from '../../api';
import { ssrData } from '../../ssrData';
import SEO from '../../components/seo/SEO';
import TopNav from '../../components/website/TopNav';
import SiteFooter from '../../components/website/SiteFooter';
import { KEY_ROUTES } from '../../config/seoPages';

const BASE_URL = 'https://katisha.today';

const slugify = (s: string) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export type HubScope = 'rwanda' | 'east-africa';

interface RouteGroup {
  origin: string;
  destination: string;
  agencies: any[];
  minPrice: number;
  estimatedDuration?: string;
}

interface ScopeConfig {
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  routeType: string;
  emptyTitle: string;
  emptyBody: string;
  aboutTitle: string;
  about: string[];
  faqs: { q: string; a: string }[];
}

const SCOPE_CONFIG: Record<HubScope, ScopeConfig> = {
  rwanda: {
    title: 'Bus Booking Rwanda',
    description:
      'Book intercity bus tickets across Rwanda online at RURA-approved prices. Compare Kigali to Musanze, Huye, Rubavu, Rusizi and more — pay with MTN Mobile Money, Airtel Money or M-Pesa.',
    eyebrow: 'Rwanda intercity bus routes',
    h1: 'Bus Booking Rwanda — Intercity Routes & Fares',
    intro:
      'Compare every active intercity bus route in Rwanda served through Katisha. All fares are RURA-approved, tickets are delivered instantly, and every journey can be tracked in real time.',
    routeType: 'intercity',
    emptyTitle: 'Rwanda intercity routes',
    emptyBody: 'Routes are being updated. Browse the booking page or contact us on +250 793 216 191.',
    aboutTitle: 'Intercity bus travel in Rwanda',
    about: [
      'Katisha lists every active intercity bus route in Rwanda in one place, so you can compare operators, departure times and RURA-approved fares before you book. Popular intercity journeys include Kigali to Musanze (Ruhengeri), Kigali to Huye (Butare), Kigali to Rubavu (Gisenyi), Kigali to Rusizi (Kamembe), Kigali to Nyagatare and Kigali to Kayonza.',
      'Booking is entirely online: choose your route and travel date, select your seat on the bus, pay with MTN Mobile Money, Airtel Money or M-Pesa, and receive an instant e-ticket. You can track your bus in real time and manage upcoming trips from the My Tickets page.',
    ],
    faqs: [
      {
        q: 'How do I book an intercity bus ticket in Rwanda?',
        a: 'Search your route on katisha.today — for example Kigali to Musanze — choose the date and departure, pick your seat, and pay with MTN Mobile Money, Airtel Money or M-Pesa. Your e-ticket is issued instantly.',
      },
      {
        q: 'How much is an intercity bus ticket in Rwanda?',
        a: 'All fares on Katisha are RURA-approved prices. The exact fare depends on the route and operator and is shown live when you search, so the price you see is the price you pay.',
      },
      {
        q: 'Which towns in Rwanda can I book on Katisha?',
        a: 'Katisha covers intercity travel between major Rwandan towns and cities, including Kigali, Musanze, Huye, Rubavu, Rusizi, Nyagatare and Kayonza.',
      },
      {
        q: 'Can I choose my seat on the bus?',
        a: 'Yes. After selecting a departure you choose your exact seat from an interactive seat map before paying.',
      },
      {
        q: 'What payment methods are accepted in Rwanda?',
        a: 'Katisha accepts MTN Mobile Money (MoMo), Airtel Money and M-Pesa. Payment is processed instantly and your ticket is confirmed straight away.',
      },
      {
        q: 'How early should I arrive at the bus station?',
        a: 'Aim to arrive at least 30 minutes before departure so you have time to find your bus and load luggage. Check your e-ticket for the exact departure point.',
      },
    ],
  },
  'east-africa': {
    title: 'East Africa Bus Booking',
    description:
      'Book cross-border bus tickets from Rwanda to Uganda, Kenya, Tanzania and beyond. Compare Kigali to Kampala, Nairobi, Dar es Salaam and more at RURA-approved fares.',
    eyebrow: 'East Africa cross-border bus routes',
    h1: 'East Africa Bus Booking — Cross-Border Routes',
    intro:
      'Compare every active cross-border bus route from Rwanda served through Katisha. Book online, pay with Mobile Money, and track your trip to Kampala, Nairobi, Dar es Salaam and beyond.',
    routeType: 'east_africa',
    emptyTitle: 'East Africa cross-border routes',
    emptyBody: 'Cross-border routes are being updated. Browse the booking page or contact us on +250 793 216 191.',
    aboutTitle: 'Cross-border bus travel from Kigali',
    about: [
      'Katisha connects Kigali to Uganda, Kenya, Tanzania, DR Congo and beyond. Each route page lists the licensed operators, RURA-approved fares, departure times and journey duration so you can compare every option before you book.',
      'Cross-border journeys are long-distance, so book ahead to secure the best seats and departures. Pay online with MTN Mobile Money, Airtel Money or M-Pesa, receive your e-ticket instantly, and track your bus while you travel.',
    ],
    faqs: [
      {
        q: 'Which countries can I reach by bus from Kigali?',
        a: 'From Kigali you can book cross-border buses to Uganda (Kampala, Mbarara, Jinja), Kenya (Nairobi, Nakuru, Kisumu), Tanzania (Dar es Salaam, Arusha, Mwanza, Kigoma and more), DR Congo (Lubumbashi, Kasumbalesa), Zambia, Malawi, Zimbabwe, Mozambique and South Africa.',
      },
      {
        q: 'How much is a bus from Kigali to Kampala?',
        a: 'Fares from Kigali to Kampala are RURA-approved and vary by operator. The live price for each departure is shown when you search the route on Katisha, so you always pay the official fare.',
      },
      {
        q: 'Do I need a passport for cross-border bus travel?',
        a: 'Yes. Cross-border trips cross an international border, so carry a valid passport or the travel document required for your destination and any transit countries, and check visa requirements before you travel.',
      },
      {
        q: 'How long do cross-border buses from Kigali take?',
        a: 'Journey times depend on the destination, the operator and border-crossing time. The estimated duration is listed with each scheduled departure on the route page.',
      },
      {
        q: 'Can I pay online for a cross-border bus ticket?',
        a: 'Yes. You can pay for cross-border tickets with MTN Mobile Money, Airtel Money or M-Pesa on Katisha, and your e-ticket is issued instantly after payment.',
      },
      {
        q: 'Can I track my cross-border bus?',
        a: 'Yes. After booking, enter your reference code on the Katisha track page to follow your journey and see updated arrival information.',
      },
    ],
  },
};

async function fetchAllRoutes(): Promise<any[]> {
  const preloaded = ssrData.getRoutes();
  if (preloaded && Array.isArray(preloaded) && preloaded.length) return preloaded;

  const all: any[] = [];
  let page = 1;
  let pages = 1;
  let attempts = 0;
  while (page <= pages && attempts < 20) {
    attempts++;
    try {
      const res = await api.getRoutes({ status: 'active', limit: '100', page: String(page) });
      const data = res.data || {};
      if (Array.isArray(data.routes) && data.routes.length) all.push(...data.routes);
      pages = Number(data.pages) || 1;
    } catch {
      break;
    }
    page++;
  }
  return all;
}

function groupRoutes(routes: any[], type: string): RouteGroup[] {
  const map = new Map<string, RouteGroup>();
  for (const r of routes) {
    if (String(r.type) !== type) continue;
    if (!r.origin || !r.destination) continue;
    const key = slugify(r.origin) + '-to-' + slugify(r.destination);
    const entry = map.get(key) ?? {
      origin: r.origin,
      destination: r.destination,
      agencies: [] as any[],
      minPrice: Infinity,
      estimatedDuration: r.estimatedDuration,
    };
    const aid = r.agency?._id || r.agency?.id;
    if (aid && !entry.agencies.some((x) => (x.agency?._id || x.agency?.id) === aid)) {
      entry.agencies.push(r);
    }
    const p = Number(r.effectivePrice || r.price) || 0;
    if (p > 0 && p < entry.minPrice) entry.minPrice = p;
    if (!entry.estimatedDuration && r.estimatedDuration) entry.estimatedDuration = r.estimatedDuration;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => (a.destination < b.destination ? -1 : 1));
}

export default function RouteHubPage({ scope = 'rwanda' }: { scope?: HubScope } = {}) {
  const cfg = SCOPE_CONFIG[scope] || SCOPE_CONFIG.rwanda;
  const [loading, setLoading] = useState(() => {
    const preloaded = ssrData.getRoutes();
    return !preloaded || !preloaded.length;
  });
  const [groups, setGroups] = useState<RouteGroup[]>(() =>
    groupRoutes(ssrData.getRoutes() || [], cfg.routeType)
  );

  useEffect(() => {
    let active = true;
    fetchAllRoutes()
      .then((routes) => {
        if (!active) return;
        setGroups(groupRoutes(routes, cfg.routeType));
      })
      .catch(() => {
        if (active) setGroups([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cfg.routeType]);

  const visible = useMemo(() => groups.slice(0, 40), [groups]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Katisha', item: `${BASE_URL}/book` },
          { '@type': 'ListItem', position: 2, name: cfg.h1, item: `${BASE_URL}/bus/${scope === 'east-africa' ? 'east-africa' : 'rwanda'}` },
        ],
      },
      visible.length > 0 && {
        '@type': 'ItemList',
        name: cfg.title,
        itemListElement: visible.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${g.origin} to ${g.destination} bus`,
          url: `${BASE_URL}/bus/${slugify(g.origin)}-to-${slugify(g.destination)}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: cfg.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ].filter(Boolean),
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO
        title={cfg.title}
        description={cfg.description}
        canonical={`/bus/${scope === 'east-africa' ? 'east-africa' : 'rwanda'}`}
        keywords={`${cfg.title.toLowerCase()}, bus tickets Rwanda, bus booking East Africa, ${scope === 'east-africa' ? 'cross border bus tickets, Kigali to Kampala bus, Kigali to Nairobi bus, Kigali to Dar es Salaam bus' : 'Kigali to Musanze bus, Kigali to Huye bus, Kigali to Rubavu bus, Rwanda intercity bus'}, RURA approved bus fares, Katisha`}
        jsonLd={jsonLd}
      />

      <TopNav />

      <main className="flex-1 w-full">
        <section
          className="w-full px-4 sm:px-8 py-12 sm:py-16 text-white"
          style={{ background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)' }}
        >
          <div className="max-w-7xl mx-auto">
            <p className="text-[11px] uppercase tracking-[.18em] mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <Link to="/book" className="no-underline" style={{ color: 'rgba(255,255,255,0.6)' }}>Katisha</Link>
              <span className="mx-2">›</span>
              {cfg.eyebrow}
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold mb-3">{cfg.h1}</h1>
            <p className="text-sm sm:text-base max-w-2xl" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {cfg.intro}
            </p>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-lg font-semibold text-sm no-underline transition-transform hover:translate-y-[-1px]"
              style={{ background: 'var(--blue)', color: 'white' }}
            >
              Book a Bus Ticket <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="w-full px-4 sm:px-8 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6 text-sm font-semibold text-[var(--text)]">
              <ShieldCheck size={16} className="text-[var(--blue-dark)] shrink-0" />
              All fares are RURA-approved. Compare routes, agencies and prices below.
            </div>

            {loading ? (
              <div className="flex items-center gap-3 text-sm text-[var(--text-sub)]">
                <span className="w-5 h-5 rounded-full border-2 border-[var(--border)] border-t-[var(--blue)] animate-spin" />
                Loading routes...
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-lg border border-[var(--border)] bg-[#FAFBFC] p-8 text-center">
                <h2 className="text-lg font-bold text-[var(--text)] mb-1">{cfg.emptyTitle}</h2>
                <p className="text-sm text-[var(--text-sub)] max-w-xl mx-auto">{cfg.emptyBody}</p>
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-semibold no-underline"
                  style={{ background: 'var(--blue)', color: 'white' }}
                >
                  Browse all routes <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visible.map((g) => {
                  const count = g.agencies.length;
                  return (
                    <div key={`${slugify(g.origin)}-to-${slugify(g.destination)}`} className="rounded-lg border border-[var(--border)] bg-white p-5 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-lg bg-[var(--blue-bg)] text-[var(--blue-dark)] flex items-center justify-center text-lg font-bold shrink-0">
                          <Bus size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text)] truncate">
                            {g.origin} → {g.destination}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <MapPin size={11} /> {count} {count === 1 ? 'agency' : 'agencies'} · RURA-approved fare
                          </p>
                        </div>
                        {g.minPrice > 0 && (
                          <div className="ml-auto text-right shrink-0">
                            <p className="font-bold text-[var(--blue-dark)]">{g.minPrice.toLocaleString()} RWF</p>
                            <p className="text-[11px] text-[var(--text-muted)]">from</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        {g.estimatedDuration && (
                          <span className="text-xs text-[var(--text-muted)]">{g.estimatedDuration}</span>
                        )}
                        <Link
                          to={`/bus/${slugify(g.origin)}-to-${slugify(g.destination)}`}
                          className="inline-flex items-center justify-center gap-2 ml-auto px-4 py-2.5 rounded-lg text-sm font-semibold no-underline transition-colors"
                          style={{ background: 'var(--blue)', color: 'white' }}
                        >
                          Route details <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Editorial content + FAQ: real, unique copy that explains the hub and
            gives search engines something to rank beyond the route list. */}
        <section className="w-full px-4 sm:px-8 py-10 border-t border-[var(--border)] bg-[#FAFBFC]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <h2 className="text-lg sm:text-xl font-bold mb-3 text-[var(--text)]">{cfg.aboutTitle}</h2>
              {cfg.about.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed mb-3 text-[var(--text-sub)]">
                  {paragraph}
                </p>
              ))}
              <p className="text-sm leading-relaxed text-[var(--text-sub)]">
                Ready to travel?{' '}
                <Link to="/book" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
                  Search and book a bus ticket
                </Link>{' '}
                or read the{' '}
                <Link to="/guide" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
                  step-by-step booking guide
                </Link>
                .{' '}
                {scope === 'east-africa' ? (
                  <>
                    You can also browse{' '}
                    <Link to="/bus/rwanda" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
                      Rwanda intercity bus routes
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    Compare{' '}
                    <Link to="/bus/east-africa" className="no-underline font-medium" style={{ color: 'var(--blue-dark)' }}>
                      East Africa cross-border bus routes
                    </Link>
                    .
                  </>
                )}
              </p>

              <h2 className="text-lg sm:text-xl font-bold mt-10 mb-3 text-[var(--text)]">
                Frequently asked questions
              </h2>
              <div className="divide-y divide-[var(--border)] border-t border-b border-[var(--border)]">
                {cfg.faqs.map((f) => (
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
            </div>

            <aside>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-4">
                Popular bus routes from Kigali
              </h3>
              <nav className="flex flex-col gap-2.5 text-sm">
                {KEY_ROUTES.map((r) => (
                  <Link key={r.slug} to={`/bus/${r.slug}`} className="no-underline hover:underline" style={{ color: 'var(--blue-dark)' }}>
                    {r.label}
                  </Link>
                ))}
              </nav>
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mt-8 mb-4">
                More
              </h3>
              <nav className="flex flex-col gap-2.5 text-sm">
                <Link to="/book" className="no-underline hover:underline" style={{ color: 'var(--blue-dark)' }}>
                  Book a bus ticket
                </Link>
                <Link to="/guide" className="no-underline hover:underline" style={{ color: 'var(--blue-dark)' }}>
                  How bus booking works
                </Link>
                <Link to="/bus/rwanda" className="no-underline hover:underline" style={{ color: 'var(--blue-dark)' }}>
                  Rwanda intercity bus routes
                </Link>
                <Link to="/bus/east-africa" className="no-underline hover:underline" style={{ color: 'var(--blue-dark)' }}>
                  East Africa cross-border routes
                </Link>
              </nav>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}