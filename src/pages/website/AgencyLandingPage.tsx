import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock, MapPin, Phone, Bus } from 'lucide-react';
import { api, resolveImageUrl } from '../../api';
import { ssrData } from '../../ssrData';
import SEO from '../../components/seo/SEO';
import TopNav from '../../components/website/TopNav';
import SiteFooter from '../../components/website/SiteFooter';
import { agencyLogo } from '../../services/agencyAssets';
import { viaLabel } from '../../utils/via';
import { SCRIPT_FONT, Sparkles, CommaSquiggle, SquigglyUnderline, StickyCallout, CTAMicrocopy } from '../../components/website/HandDrawn';

const BASE_URL = 'https://katisha.today';

export default function AgencyLandingPage({ id: idProp, slug: slugProp }: { id?: string; slug?: string } = {}) {
  const { t } = useTranslation();
  const params = useParams();
  const id = idProp ?? params.id ?? '';
  const slug = slugProp ?? params.slug ?? '';
  // Pre-render support: build-time SSR data lets us render the agency and its
  // routes synchronously for crawlers instead of a loading spinner.
  const preloadedAgencies = ssrData.getAgencies();
  const preloadedRoutesAll = ssrData.getRoutes();
  const preloadedAgency = (() => {
    if (!preloadedAgencies || !preloadedAgencies.length) return null;
    return preloadedAgencies.find(a => String(a._id || a.id) === String(id)) || null;
  })();
  const preloadedAgencyRoutes = (() => {
    if (!preloadedAgency || !preloadedRoutesAll) return [];
    return preloadedRoutesAll.filter(r => String(r.agency?._id || r.agency?.id) === String(id));
  })();
  const [agency, setAgency] = useState<any | null>(preloadedAgency);
  const [routes, setRoutes] = useState<any[]>(preloadedAgencyRoutes);
  const [loading, setLoading] = useState(preloadedAgency ? false : true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);

    (async () => {
      try {
        const agencyRes = await api.getPublicAgency(id);
        if (!active) return;
        setAgency(agencyRes.data?.agency || null);
        if (!agencyRes.data?.agency) {
          setNotFound(true);
          return;
        }
        try {
          const routesRes = await api.getRoutes({ agencyId: id, status: 'active', limit: '100' });
          if (active) setRoutes(routesRes.data?.routes || []);
        } catch {
          if (active) setRoutes([]);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const name = agency?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const localLogo = agencyLogo(name);
  const logo = localLogo || (agency?.logo ? resolveImageUrl(agency.logo) : undefined);

  const workingSummary = Array.isArray(agency?.workingHours) && agency.workingHours.length
    ? `${agency.workingHours.length} days a week`
    : undefined;

  const totalStops = routes.reduce((sum, r) => sum + (r.via ? 1 : 0), 0);

  const title = `${name} Bus Tickets | Book Online, Routes & Prices`;
  const description = agency
    ? `Book ${name} bus tickets online in Rwanda at RURA-approved prices. ${routes.length} routes available from Kigali. Pay with MTN Mobile Money, Airtel Money & M-Pesa. Real-time tracking.`
    : `Book ${name} bus tickets online in Rwanda at RURA-approved prices with Katisha.`;

  const jsonLd = agency
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Katisha', item: `${BASE_URL}/book` },
              { '@type': 'ListItem', position: 2, name: name, item: `${BASE_URL}/agency/${id}/${slug}` },
            ],
          },
          {
            '@type': 'TravelAgency',
            name,
            url: `${BASE_URL}/agency/${id}/${slug}`,
            ...(logo ? { logo: { '@type': 'ImageObject', url: logo } } : {}),
            ...(agency.phone ? { telephone: agency.phone } : {}),
            ...(agency.address ? { address: agency.address } : {}),
            ...(Array.isArray(agency.provinces) && agency.provinces.length
              ? { areaServed: agency.provinces.map((p: string) => ({ '@type': 'Place', name: p })) }
              : {}),
            ...(routes.length
              ? {
                  makesOffer: routes.slice(0, 10).map(r => ({
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: `${r.origin} to ${r.destination}`,
                      serviceType: 'Bus ticket',
                    },
                    price: String(Number(r.price) || 0),
                    priceCurrency: 'RWF',
                  })),
                }
              : {}),
          },
        ],
      }
    : undefined;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO
        title={title}
        description={description}
        canonical={`/agency/${id}/${slug}`}
        keywords={`${name} bus, ${name} bus ticket, ${name} buses Kigali, ${name} bus fare, ${name} booking online, Katisha ${name}`}
        noindex={notFound}
        jsonLd={jsonLd}
        hreflang={[
          { lang: 'en', href: `${BASE_URL}/agency/${id}/${slug}` },
          { lang: 'x-default', href: `${BASE_URL}/agency/${id}/${slug}` },
        ]}
      />

      <TopNav />

      <main className="flex-1 w-full">
        <section className="w-full px-4 sm:px-8 py-14 sm:py-20">
          <div className="max-w-7xl mx-auto text-center">
            {loading ? (
              <div className="flex items-center justify-center gap-3 text-sm text-[var(--text-sub)]">
                <span className="w-5 h-5 rounded-full border-2 border-[var(--border)] border-t-[var(--blue)] animate-spin" />
                {t('booking.loading', 'Loading agency...')}
              </div>
            ) : notFound ? (
              <>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 text-[var(--text)]">{name}</h1>
                <p className="text-sm sm:text-base max-w-2xl mx-auto text-[var(--text-sub)]">
                  We couldn't find this agency. Search for another bus agency or contact us on +250 793 216 191.
                </p>
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-sm font-semibold text-sm no-underline"
                  style={{ background: 'var(--blue)', color: 'white' }}
                >
                  Book a Bus Ticket <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <nav className="text-[11px] font-bold uppercase tracking-[0.22em] mb-6 text-[var(--text-muted)]">
                  <Link to="/book" className="no-underline transition-colors hover:text-[var(--blue)] text-[var(--text-muted)]">
                    Katisha
                  </Link>
                  <span className="mx-2 opacity-60">/</span>
                  <span className="text-[var(--text-sub)]">{name}</span>
                </nav>

                {logo ? (
                  <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-3 border border-[var(--border)] shadow-lg flex items-center justify-center">
                    <img src={logo} alt={`${name} logo`} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[var(--blue-bg)] border border-[var(--border)] text-[var(--blue-dark)] flex items-center justify-center text-4xl font-black">
                    {(name || '?')[0]}
                  </div>
                )}

                <p className="mt-5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.24em] text-[var(--blue)]">
                  Official partner on Katisha
                </p>
                <div className="relative inline-block mt-2">
                  <CommaSquiggle className="pointer-events-none absolute -left-10 top-2 hidden h-8 w-8 text-[var(--blue)]/40 sm:block" />
                  <Sparkles className="pointer-events-none absolute -right-14 -top-4 hidden h-10 w-24 text-[var(--blue)]/50 sm:block" />
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.05] text-[var(--text)]">
                    {name}
                  </h1>
                  <SquigglyUnderline className="mx-auto mt-1 h-3 w-48 text-[var(--blue)]" />
                </div>

                <div className="relative mt-6 flex flex-wrap justify-center gap-2">
                  <StickyCallout arrow="down" className="pointer-events-none absolute -top-14 right-[8%] hidden lg:inline-block" paperClass="bg-[rgba(8, 84, 174,0.08)] text-[var(--blue-dark)]">
                    RURA-approved fares
                  </StickyCallout>
                  {agency.phone && (
                    <a
                      href={`tel:${agency.phone}`}
                      className="no-underline inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-[var(--blue-light)] text-[var(--blue-dark)] transition-colors hover:bg-[var(--blue-bg)]"
                    >
                      <Phone size={13} /> {agency.phone}
                    </a>
                  )}
                  {agency.address && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-[var(--blue-light)] text-[var(--blue-dark)]">
                      <MapPin size={13} /> {agency.address}
                    </span>
                  )}
                  {workingSummary && (
                    <span className="inline-flex items-center  gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-[var(--blue-light)] text-[var(--blue-dark)]">
                      <Clock size={13} /> {workingSummary}
                    </span>
                  )}
                </div>

                <p className="mt-6 mx-auto max-w-7xl text-center text-[15px] sm:text-base leading-relaxed text-[var(--text-sub)]">
                  Book {name} bus tickets online at RURA-approved prices
                  {routes.length > 0 && <> across {routes.length} routes</>}. Pay with <br/> MTN Mobile Money, Airtel
                  Money or M-Pesa and track your journey in real time.
                </p>
                <p className="mt-2 text-center text-xl text-[var(--blue)]" style={{ fontFamily: SCRIPT_FONT, fontWeight: 600 }}>
                  safe & simple
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
                  <div>
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text)]">{routes.length}</p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Routes
                    </p>
                  </div>
                  <div className="hidden sm:block w-px h-10 bg-[var(--border)]" />
                  <div>
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text)]">{totalStops}</p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Via routes
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Link
                      to="/book"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-sm font-bold text-sm no-underline transition-transform hover:scale-[1.03]"
                      style={{ background: 'var(--blue)', color: 'white' }}
                    >
                      Book Now <ArrowRight size={16} />
                    </Link>
                    <CTAMicrocopy className="mt-2 text-[var(--text-sub)]" arrowClass="text-[var(--blue)]/60">
                      Instant e-tickets · Live tracking
                    </CTAMicrocopy>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {agency && !notFound && (
          <section className="w-full px-4 sm:px-8 py-10">
            <div className="max-w-7xl mx-auto">
              <div className="relative inline-block">
                <CommaSquiggle className="pointer-events-none absolute -left-9 top-0.5 hidden h-7 w-7 text-[var(--blue)]/40 sm:block" />
                <h2 className="text-lg sm:text-xl font-bold mb-1 text-[var(--text)]">
                  <span className="mr-1 text-[var(--blue)]" style={{ fontFamily: SCRIPT_FONT, fontSize: '1.35rem' }}>all routes</span>
                  {name} routes & prices
                </h2>
              </div>
              <p className="text-sm mb-6 text-[var(--text-sub)]">
                {routes.length === 0
                  ? 'Routes are being updated. Please check back soon or contact the agency.'
                  : 'All fares are RURA-approved. Pick a route and book your seat in minutes.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map(r => {
                  const price = Number(r.price) || 0;
                  return (
                    <div key={r._id} className="rounded-md border border-[var(--border)] bg-white p-5 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-md bg-[var(--blue-bg)] text-[var(--blue-dark)] flex items-center justify-center shrink-0">
                          <Bus size={16} />
                        </span>
                        <p className="font-semibold text-[var(--text)]">{r.origin} → {r.destination}<span className="font-medium text-[var(--text-muted)]">{viaLabel(r.via)}</span></p>
                        <p className="ml-auto text-right font-bold text-[var(--blue-dark)] shrink-0">
                          {price ? `${price.toLocaleString()} RWF` : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        {r.estimatedDuration && (
                          <span className="flex items-center gap-1"><Clock size={12} /> {r.estimatedDuration}</span>
                        )}
                        {r.via ? (
                          <span className="flex items-center gap-1"><MapPin size={12} /> via {r.via}</span>
                        ) : (
                          <span className="flex items-center gap-1"><MapPin size={12} /> Non-stop</span>
                        )}
                      </div>
                      <Link
                        to={`/book?to=${encodeURIComponent(r.destination)}&agency=${encodeURIComponent(id)}`}
                        className="inline-flex items-center justify-center gap-2 mt-auto px-4 py-2.5 rounded-sm text-sm font-semibold no-underline transition-colors"
                        style={{ background: 'var(--blue)', color: 'white' }}
                      >
                        Book {r.origin} → {r.destination}{viaLabel(r.via)} <ArrowRight size={15} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
