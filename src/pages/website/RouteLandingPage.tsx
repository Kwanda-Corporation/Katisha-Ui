import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from '../../../node_modules/react-i18next';
import { Bus, ArrowRight, Clock, MapPin, Phone } from 'lucide-react';
import { api } from '../../api';
import { viaLabelBefore } from '../../utils/via';
import { ssrData } from '../../ssrData';
import SEO from '../../components/seo/SEO';
import TopNav from '../../components/website/TopNav';
import SiteFooter from '../../components/website/SiteFooter';

const BASE_URL = 'https://katisha.today';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// District names mapped to the served town/city the routes actually terminate at.
const TOWN_ALIASES: Record<string, string> = {
  Rusizi: 'Kamembe',
};

interface ResolvedRoute {
  origin: string;
  destination: string;
  agencies: any[];
  minPrice: number;
}

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

function buildRouteMap(routes: any[]): Record<string, ResolvedRoute> {
  const map: Record<string, ResolvedRoute> = {};

  const add = (r: any, dest: string, price: number) => {
    const key = `${slugify(r.origin)}-to-${slugify(dest)}`;
    const entry = map[key] || (map[key] = { origin: r.origin, destination: dest, agencies: [], minPrice: Infinity });
    const aid = r.agency?._id || r.agency?.id;
    if (!aid || entry.agencies.some(x => (x.agency?._id || x.agency?.id) === aid)) return;
    entry.agencies.push(r);
    const p = Number(price) || Number(r.price) || 0;
    if (p > 0 && p < entry.minPrice) entry.minPrice = p;
  };

  for (const r of routes) {
    add(r, r.destination, r.price);
    if (r.via && String(r.via).trim()) add(r, r.via, r.price);
    for (const [district, town] of Object.entries(TOWN_ALIASES)) {
      if (String(town).toLowerCase() === String(r.destination || '').toLowerCase()) {
        add(r, district, r.price);
      }
    }
  }

  return map;
}

export default function RouteLandingPage({ slug: slugProp }: { slug?: string } = {}) {
  const { t } = useTranslation();
  const { slug: slugParam = '' } = useParams();
  const slug = slugProp ?? slugParam;

  const sep = slug.indexOf('-to-');
  const rawFrom = sep >= 0 ? slug.slice(0, sep) : slug;
  const rawTo = sep >= 0 ? slug.slice(sep + 4) : '';
  // Pre-render support: when the build-time SSR pass embeds route data, resolve
  // the landing page synchronously so crawlers see the full agency/fare content
  // instead of a loading state. Otherwise fall through to client-side fetch.
  const preloadedRoutes = ssrData.getRoutes();
  const preloadedRoute = (() => {
    if (!preloadedRoutes || !preloadedRoutes.length) return null;
    const key = `${slugify(rawFrom)}-to-${slugify(rawTo)}`;
    return buildRouteMap(preloadedRoutes)[key] || null;
  })();
  const [resolved, setResolved] = useState<ResolvedRoute | null>(preloadedRoute);
  const [loading, setLoading] = useState(preloadedRoute ? false : true);

  useEffect(() => {
    let active = true;
    fetchAllRoutes()
      .then(routes => {
        if (!active) return;
        const map = buildRouteMap(routes);
        setResolved(map[`${slugify(rawFrom)}-to-${slugify(rawTo)}`] || null);
      })
      .catch(() => {
        if (active) setResolved(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [rawFrom, rawTo]);

  const originName = resolved?.origin || rawFrom.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const destName = resolved?.destination || rawTo.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const routeKey = `${slugify(originName)}-to-${slugify(destName)}`;

  const title = `Bus from ${originName} to ${destName} | Book Online - Fares & Agencies`;
  const description = resolved
    ? `Book a ${originName} to ${destName} bus online at RURA-approved fares from RWF ${Number(resolved.minPrice).toLocaleString()}. Compare ${resolved.agencies.length} bus agencies, departures & live tracking. Pay with MTN MoMo, Airtel Money & M-Pesa.`
    : `Book bus tickets from ${originName} to ${destName} in Rwanda online. Compare agencies, prices and schedules with Katisha.`;

  const jsonLd = resolved
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Katisha', item: `${BASE_URL}/book` },
              { '@type': 'ListItem', position: 2, name: `${originName} to ${destName} bus`, item: `${BASE_URL}/bus/${routeKey}` },
            ],
          },
          {
            '@type': 'Service',
            name: `${originName} to ${destName} bus tickets`,
            url: `${BASE_URL}/bus/${routeKey}`,
            serviceType: 'Bus ticket booking',
            provider: {
              '@type': 'TravelAgency',
              name: 'Katisha',
              url: `${BASE_URL}/book`,
            },
            areaServed: {
              '@type': 'City',
              name: destName,
            },
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'RWF',
              lowPrice: String(Number(resolved.minPrice) || 0),
              highPrice: String(Math.round((Number(resolved.minPrice) || 0) * 2) + 1000),
              offerCount: String(resolved.agencies.length || 1),
              availability: 'https://schema.org/InStock',
            },
          },
        ],
      }
    : undefined;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO
        title={title}
        description={description}
        canonical={`/bus/${routeKey}`}
        keywords={`${originName} to ${destName} bus, bus ticket ${originName} ${destName}, ${originName} ${destName} bus fare, bus from ${originName} to ${destName}, ${destName} bus station, Katisha ${originName} ${destName}`}
        noindex={!resolved && !loading}
        jsonLd={jsonLd}
      />

      <TopNav />

      <main className="flex-1 w-full">
        <section
          className="w-full px-4 sm:px-8 py-12 sm:py-16 text-white"
          style={{ background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)' }}
        >
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center gap-3 text-white/80 text-sm">
                <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                {t('booking.loading', 'Loading routes...')}
              </div>
            ) : resolved ? (
              <>
                <p className="text-[11px] uppercase tracking-[.18em] mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <Link to="/book" className="no-underline" style={{ color: 'rgba(255,255,255,0.6)' }}>Katisha</Link>
                  <span className="mx-2">›</span>
                  {originName} to {destName}
                </p>
                <h1 className="text-2xl sm:text-4xl font-bold mb-3">
                  Bus from {originName} to {destName}
                </h1>
                <p className="text-sm sm:text-base max-w-2xl" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {resolved.agencies.length} bus {resolved.agencies.length === 1 ? 'agency' : 'agencies'} serving this route at RURA-approved prices
                  {resolved.minPrice > 0 && <> starting from RWF {Number(resolved.minPrice).toLocaleString()}</>}. Book online and pay with MTN Mobile Money, Airtel Money or M-Pesa.
                </p>
                <Link
                  to={`/book?to=${encodeURIComponent(resolved.destination)}`}
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-sm font-semibold text-sm no-underline transition-transform hover:translate-y-[-1px]"
                  style={{ background: 'var(--blue)', color: 'white' }}
                >
                  Book Now <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-4xl font-bold mb-3">
                  {originName} to {destName} Bus
                </h1>
                <p className="text-sm sm:text-base max-w-2xl" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  We couldn't find an active route from {originName} to {destName} right now. Search for another route or
                  contact us on +250 793 216 191.
                </p>
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-sm font-semibold text-sm no-underline"
                  style={{ background: 'var(--blue)', color: 'white' }}
                >
                  Book a Bus Ticket <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </section>

        {resolved && (
          <section className="w-full px-4 sm:px-8 py-10">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-lg sm:text-xl font-bold mb-1 text-[var(--text)]">
                {originName} to {destName} buses & prices
              </h2>
              <p className="text-sm mb-6 text-[var(--text-sub)]">
                All fares are RURA-approved. Choose an agency and book your seat in minutes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resolved.agencies.map(r => {
                  const agency = r.agency || {};
                  const price = Number(r.effectivePrice || r.price) || 0;
                  return (
                    <div
                      key={r._id}
                      className="rounded-md border border-[var(--border)] bg-white p-5 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-md bg-[var(--blue-bg)] text-[var(--blue-dark)] flex items-center justify-center text-lg font-bold shrink-0">
                          {(agency.name || '?')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text)] truncate">{agency.name || 'Bus agency'}</p>
                          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <MapPin size={11} /> {originName} → {destName}<span className="text-[var(--text-muted)]">{viaLabelBefore(r.via, resolved.destination)}</span>
                          </p>
                        </div>
                        <div className="ml-auto text-right shrink-0">
                          <p className="font-bold text-[var(--blue-dark)]">{price ? `${price.toLocaleString()} RWF` : '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        {r.estimatedDuration && (
                          <span className="flex items-center gap-1"><Clock size={12} /> {r.estimatedDuration}</span>
                        )}
                        {r.via ? (
                          <span className="flex items-center gap-1"><Bus size={12} /> via {r.via}</span>
                        ) : (
                          <span className="flex items-center gap-1"><Bus size={12} /> Non-stop</span>
                        )}
                      </div>
                      <Link
                        to={`/book?to=${encodeURIComponent(resolved.destination)}&agency=${encodeURIComponent(agency._id || agency.id || '')}`}
                        className="inline-flex items-center justify-center gap-2 mt-auto px-4 py-2.5 rounded-sm text-sm font-semibold no-underline transition-colors"
                        style={{ background: 'var(--blue)', color: 'white' }}
                      >
                        Book {agency.name || 'this agency'} <ArrowRight size={15} />
                      </Link>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 rounded-md border border-[var(--border)] bg-[#FAFBFC] p-6">
                <h3 className="font-semibold text-sm mb-3 text-[var(--text)]">Need help with your {originName} to {destName} trip?</h3>
                <div className="flex flex-col sm:flex-row gap-3 text-sm text-[var(--text-sub)]">
                  <a href="tel:+250793216191" className="no-underline flex items-center gap-2" style={{ color: 'var(--text-sub)' }}>
                    <Phone size={14} /> +250 793 216 191
                  </a>
                  <a href="mailto:support@katisha.today" className="no-underline flex items-center gap-2" style={{ color: 'var(--text-sub)' }}>
                    ✉ support@katisha.today
                  </a>
                  <Link to="/guide" className="no-underline" style={{ color: 'var(--blue-dark)' }}>How it works</Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
