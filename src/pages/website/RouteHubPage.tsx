import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Bus, MapPin, ShieldCheck } from 'lucide-react';
import { api } from '../../api';
import { ssrData } from '../../ssrData';
import SEO from '../../components/seo/SEO';
import TopNav from '../../components/website/TopNav';
import SiteFooter from '../../components/website/SiteFooter';

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

const SCOPE_CONFIG: Record<
  HubScope,
  {
    title: string;
    description: string;
    eyebrow: string;
    h1: string;
    intro: string;
    routeType: string;
    emptyTitle: string;
    emptyBody: string;
  }
> = {
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
      </main>

      <SiteFooter />
    </div>
  );
}