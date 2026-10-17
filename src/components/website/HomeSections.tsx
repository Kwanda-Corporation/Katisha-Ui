import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AgencyLogoCarousel, { type CarouselAgency } from './AgencyLogoCarousel';
import { Reveal } from './ScrollReveal';
import {
  SCRIPT_FONT,
  Sparkles,
  CommaSquiggle,
  SquigglyUnderline,
  CurvedArrow,
  HighlightWord,
  WaveDivider,
  StickyCallout,
  CTAMicrocopy,
} from './HandDrawn';
import { agencyLogo, agencyNeedsDarkBg, cityImage } from '../../services/agencyAssets';
import { getPublicAgenciesOffline } from '../../services/offlineData';

interface Agency {
  _id: string;
  name: string;
  featured?: boolean;
}

const agencySlug = (name: string) => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Kigali → destination routes that exist in the seed data; durations come from
// each route's estimatedDuration, not invented. East African routes only.
const regionalDestinations = [
  { key: 'kampala', to: 'Kampala', slug: 'kigali-to-kampala', time: '9h' },
  { key: 'nairobi', to: 'Nairobi', slug: 'kigali-to-nairobi', time: '20h' },
  { key: 'dar', to: 'Dar es Salaam', slug: 'kigali-to-dar-es-salaam', img: 'dar-es-salaam', time: '26h' },
  { key: 'mbarara', to: 'Mbarara', slug: 'kigali-to-mbarara', time: '7h' },
];

const destinations = [...regionalDestinations];

/* ------------------------------------------------------------------ */
/* Full-viewport, scroll-fading destination panel                     */
/* ------------------------------------------------------------------ */

function DestinationPanel({
  dest,
  index,
  t,
}: {
  dest: (typeof destinations)[number];
  index: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(index === 0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio > 0.5),
      { threshold: [0, 0.5, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ zIndex: index + 1 }}>
      <div ref={contentRef} className="relative h-full w-full">
        {/* City image, full bleed */}
        <img
          src={cityImage(dest.to)}
          alt={dest.to}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Transparent black overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/90 via-zinc-900/90 to-black/70" aria-hidden="true" />

        {/* Centered content, fades + slides up into view */}
        <div
          className={`relative z-10 flex h-full w-full   flex-col items-center justify-center px-6 text-center transition-all duration-1000 ease-out motion-reduce:transition-none ${
            visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
          }`}
        >
          {/* handwritten eyebrow, Odoo-style */}
          <p
            className="mb-1 text-2xl text-white/90"
            style={{ fontFamily: SCRIPT_FONT }}
          >
            Kigali → {dest.to}
          </p>

          <div className="relative">
            <Sparkles className="pointer-events-none absolute -top-8 left-1/2 h-10 w-24 -translate-x-[140%] text-white/70" />
            <h2 className="text-4xl font-bold tracking-tight text-black sm:text-6xl">
              <HighlightWord className="bg-blue-800/90">{dest.to}</HighlightWord>
            </h2>
          </div>

          <p className="mt-4 max-w-md text-base font-medium text-white/85 sm:text-lg">
            {t('guide.fromKigali', { duration: dest.time })}
          </p>

          <div className="relative mt-10">
            <Link
              to={`/book?to=${encodeURIComponent(dest.to)}`}
              aria-label={`${t('guide.bookNow')} — ${dest.to} bus tickets`}
              className="group inline-flex items-center gap-2 rounded-lg  full bg-blue-700 px-7 py-3.5 text-sm font-bold text-white no-underline transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t('guide.bookNow')}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <StickyCallout
              arrow="down"
              className="absolute -top-14 right-1/2 hidden translate-x-[92%] whitespace-nowrap md:inline-block"
              arrowClass="text-white/70"
              paperClass="bg-white/95 text-[var(--blue-deep)]"
            >
              {t('guide.bookNow')}!
            </StickyCallout>
            <CTAMicrocopy className="mt-2 text-white/75" arrowClass="text-white/70">
              {t('guide.arriveEarly')}
            </CTAMicrocopy>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function HomeSections() {
  const { t } = useTranslation();
  const [agencies, setAgencies] = useState<Agency[]>([]);

  useEffect(() => {
    let cancelled = false;
    getPublicAgenciesOffline()
      .then(({ data }) => {
        if (!cancelled) setAgencies(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const carouselItems: CarouselAgency[] = agencies
    .filter(a => agencyLogo(a.name))
    .map(a => ({
      id: a._id,
      _id: a._id,
      name: a.name,
      logo: agencyLogo(a.name)!,
      darkBg: agencyNeedsDarkBg(a.name),
      featured: a.featured,
      slug: agencySlug(a.name),
    }));

  return (
    <div className="flex flex-col">
      {/* Section intro, sits above the full-bleed stack */}
      <section className="relative w-full px-5 py-14 sm:px-6 sm:py-20">
        <Reveal direction="up">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--blue)]">
              {t('guide.destinationsEyebrow')}
            </p>
            <h2
              className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl"
            >
              {t('guide.destinationsTitle')}
            </h2>
            <div className="relative mx-auto mt-2 inline-block">
              <CommaSquiggle className="pointer-events-none absolute -left-10 top-1 h-7 w-7 text-[var(--blue)]/40" />
              <span
                className="text-2xl text-[var(--blue)]"
                style={{ fontFamily: SCRIPT_FONT }}
              >
                one seat at a time
              </span>
              <SquigglyUnderline
                className="mx-auto mt-0.5 h-2.5 w-40 text-[var(--blue)]"
              />
            </div>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--text-sub)]">
              {t('guide.destinationsDesc')}
            </p>
          </div>
        </Reveal>
        {/* Soft wave into the full-bleed destination stack */}
        <WaveDivider className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full text-[var(--blue-bg)]" />
      </section>

      {/* Full-viewport, scroll-fading city stack */}
      <section className="relative w-full" style={{ height: `${destinations.length * 100}vh` }}>
        {destinations.map((dest, i) => (
          <DestinationPanel key={dest.key} dest={dest} index={i} t={t} />
        ))}
      </section>

      {/* Agencies */}
      <section className="relative w-full py-12 sm:py-16">
        {/* Wave back into white from the dark image stack */}
        <WaveDivider flip className="pointer-events-none absolute inset-x-0 top-0 h-14 w-full text-white" />
        <Reveal direction="up">
          <div className="mx-auto mb-2 max-w-7xl px-5 text-center sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--blue)]">
              {t('agencies.eyebrow')}
            </p>
            <div className="relative mx-auto mt-2 inline-block">
              <h2 className="text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
                {t('agencies.title')}
              </h2>
              <SquigglyUnderline className="mx-auto mt-0.5 h-2.5 w-36 text-[var(--blue)]/60" />
            </div>
            <div className="relative mx-auto mt-3 flex max-w-2xl items-start justify-center gap-2">
              <p className="text-[14px] leading-relaxed text-[var(--text-sub)]">
                {t('agencies.desc')}
              </p>
              <CurvedArrow className="mt-1 hidden h-14 w-9 shrink-0 text-[var(--blue)]/60 sm:block" />
            </div>
          </div>
        </Reveal>
        {carouselItems.length > 0 && <AgencyLogoCarousel items={carouselItems} />}
      </section>
    </div>
  );
}
