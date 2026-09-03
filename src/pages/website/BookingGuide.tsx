import {
  Search, CalendarClock, CreditCard, Ticket, Phone, MapPin,
  Clock3, AlertTriangle, Gift, ShieldCheck, MessageCircle, Mail,
  ChevronRight, CheckCircle2, Route, Compass, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router';
import TopNav from '../../components/website/TopNav';
import { useTranslation } from '../../../node_modules/react-i18next';
import SEO from '../../components/seo/SEO';
import { Reveal } from '../../components/website/ScrollReveal';
import {
  SCRIPT_FONT,
  Sparkles,
  CommaSquiggle,
  SquigglyUnderline,
  WaveDivider,
  StickyCallout,
  TestimonialCard,
  CTAMicrocopy,
} from '../../components/website/HandDrawn';

// Design note: the signature move on this page is the destination grid, which
// is styled as boarding-pass/ticket stubs — perforated divider + punched
// notches — because that's literal, on-brand, and specific to a bus-ticketing
// product rather than a generic card grid. Everything else stays in the site's
// quiet baseline (rounded-sm, thin borders, flat fills); the only other
// sequence cue is the subtle dashed route line through the "How to Book" steps.
//
// Payment cards use typographic wordmarks in each provider's brand color as a
// placeholder until official logo assets are supplied — no fabricated logo art.

// Destination cards link into the existing /book flow (same mechanism the
// homepage search + SEO landing pages use: /book?to=City). Origin is fixed to
// Kigali across the app, so every card here is a Kigali → destination route
// that genuinely exists in the seed route data. Durations come from that same
// route data (estimatedDuration), not invented.
const destinations = [
  { key: 'musanze', to: 'Musanze', time: '2h 30m' },
  { key: 'rubavu', to: 'Rubavu', time: '4h' },
  { key: 'huye', to: 'Huye', time: '3h' },
  { key: 'kampala', to: 'Kampala', time: '9h' },
  { key: 'nairobi', to: 'Nairobi', time: '24h' },
  { key: 'dar', to: 'Dar es Salaam', img: 'dar-es-salaam', time: '24h' },
];

const steps = [
  { key: 'step1', icon: Search },
  { key: 'step2', icon: CalendarClock },
  { key: 'step3', icon: CreditCard },
  { key: 'step4', icon: Ticket },
];

const payments = [
  { key: 'payment1', short: 'MoMo', wordmark: 'MTN MoMo', chipClass: 'bg-[var(--brand-mtn)] text-[var(--text)]' },
  { key: 'payment2', short: 'Airtel', wordmark: 'Airtel', chipClass: 'bg-[var(--brand-airtel)] text-white' },
  { key: 'payment3', short: 'M-Pesa', wordmark: 'M-Pesa', chipClass: 'bg-[var(--brand-mpesa)] text-white' },
];

const sectionId = (key: string) => `guide-${key}`;

function SectionHeading({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="relative flex items-center gap-3 mb-6">
      <CommaSquiggle className="pointer-events-none absolute -left-8 top-0 hidden h-7 w-7 text-[var(--blue)]/40 sm:block" />
      <span className="w-9 h-9 rounded-sm bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center shrink-0">
        <Icon size={16} />
      </span>
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">{title}</h2>
    </div>
  );
}

export default function BookingGuide() {
  const { t } = useTranslation();

  const navItems = [
    { key: 'destinations', label: t('guide.destinationsTitle') },
    { key: 'how', label: t('guide.howToBook') },
    { key: 'payments', label: t('guide.paymentMethods') },
    { key: 'cancellation', label: t('guide.cancellationPolicyTitle') },
    { key: 'free', label: t('guide.freeTicketsTitle') },
    { key: 'support', label: t('guide.supportTitle') },
  ];

  const contactRows = [
    {
      href: 'https://wa.me/250793216191',
      target: '_blank',
      rel: 'noopener noreferrer',
      title: t('guide.whatsapp'),
      value: '+250 793 216 191',
      icon: MessageCircle,
      tileClass: 'bg-[var(--blue-bg)] text-[var(--blue-dark)]',
    },
    {
      href: 'tel:+250793216191',
      target: undefined,
      rel: undefined,
      title: t('guide.phone'),
      value: '+250 793 216 191',
      icon: Phone,
      tileClass: 'bg-[var(--blue-light)] text-[var(--blue)]',
    },
    {
      href: 'mailto:support@katisha.today',
      target: undefined,
      rel: undefined,
      title: 'Email',
      value: 'support@katisha.today',
      icon: Mail,
      tileClass: 'bg-[#FFF7ED] text-[#D97706]',
    },
  ];

  const howTo = {
    '@type': 'HowTo',
    name: 'How to Book a Bus Ticket on Katisha',
    description: 'Step-by-step guide to booking bus tickets online in Rwanda at RURA-approved prices with Katisha.',
    totalTime: 'PT5M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'RWF', value: '1000-50000' },
    tool: [
      { '@type': 'HowToTool', name: 'Smartphone or Computer' },
      { '@type': 'HowToTool', name: 'MTN Mobile Money, Airtel Money, or M-Pesa account' },
    ],
    step: [
      { '@type': 'HowToStep', name: 'Search Routes', text: 'Enter your origin and destination to find available buses and schedules.' },
      { '@type': 'HowToStep', name: 'Select a Trip', text: 'Choose your preferred departure time and seat.' },
      { '@type': 'HowToStep', name: 'Proceed to Payment', text: 'Review your booking details and choose a payment method (MTN MoMo, Airtel Money, or M-Pesa).' },
      { '@type': 'HowToStep', name: 'Get Your Ticket', text: 'Receive your e-ticket via SMS or email and show it at boarding.' },
    ],
  };

  const itemList = {
    '@type': 'ItemList',
    name: 'Popular bus routes from Kigali',
    itemListElement: destinations.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: d.to,
      url: `https://katisha.today/book?to=${encodeURIComponent(d.to)}`,
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="How to Book a Bus Ticket in Rwanda"
        description="Step-by-step guide to booking bus tickets online in Rwanda at RURA-approved prices with Katisha. Learn how to pay with MTN Mobile Money, Airtel Money & M-Pesa. Cancellation policy and travel tips."
        canonical="/guide"
        keywords="bus booking guide Rwanda, how to book bus online Rwanda, RURA bus fares guide, Katisha guide, bus ticket payment Rwanda, MTN Mobile Money bus payment, cancel bus booking Rwanda"
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [howTo, itemList],
        }}
      />

      <TopNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-white">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 sm:h-24 w-full text-[var(--blue)] opacity-[0.14]"
          viewBox="0 0 1200 96"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M-40 72 H 220 C 340 72 380 28 540 28 H 820 C 960 28 1020 68 1240 68"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
          <circle cx="220" cy="72" r="4.5" fill="currentColor" />
          <circle cx="540" cy="28" r="4.5" fill="currentColor" />
          <circle cx="1020" cy="68" r="4.5" fill="currentColor" />
        </svg>
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 pt-12 sm:pt-16 pb-10 sm:pb-12 text-center">
          <CommaSquiggle className="pointer-events-none absolute left-[12%] top-10 hidden h-8 w-8 text-[var(--blue)]/40 md:block" />
          <Sparkles className="pointer-events-none absolute right-[10%] top-14 hidden h-10 w-24 text-[var(--blue)]/50 md:block" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--blue)] mb-3">
            {t('nav.howItWorks')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] tracking-tight leading-tight">
            {t('guide.title')}
          </h1>
          <div className="mx-auto mt-2 inline-block">
            <span className="text-2xl text-[var(--blue)]" style={{ fontFamily: SCRIPT_FONT, fontWeight: 600 }}>
              {t('guide.subtitleScript') || 'simpler than you think'}
            </span>
            <SquigglyUnderline className="mx-auto mt-0.5 h-2.5 w-44 text-[var(--blue)]" />
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--text-sub)]">
            {t('guide.subtitle')}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 text-[13px] font-medium text-[var(--text-muted)]">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-[var(--blue-dark)] shrink-0" />
              <span>RURA-approved pricing · Instant e-tickets · 24/7 support</span>
            </div>
            <StickyCallout arrow="down" className="mt-1">
              {t('guide.arriveEarly')}
            </StickyCallout>
          </div>
        </div>
      </section>

      {/* Sticky quick nav */}
      <nav className="sticky top-0 z-30 bg-white border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 flex gap-6 overflow-x-auto no-scrollbar">
          {navItems.map(item => (
            <a
              key={item.key}
              href={`#${sectionId(item.key)}`}
              className="shrink-0 py-3 border-b-2 border-transparent text-[13px] font-semibold text-[var(--text-sub)] hover:text-[var(--blue)] hover:border-[var(--blue)] transition-colors no-underline whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-10 sm:py-14 flex flex-col gap-12 sm:gap-16">
        {/* Destinations */}
        <section id={sectionId('destinations')} className="scroll-mt-16">
          <Reveal direction="up">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-sm bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center shrink-0">
                  <Compass size={16} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--blue)]">{t('guide.destinationsEyebrow')}</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
                    {t('guide.destinationsTitle')}
                  </h2>
                </div>
              </div>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--text-sub)]">{t('guide.destinationsDesc')}</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {destinations.map((dest, i) => {
              const img = dest.img || dest.key;
              return (
                <Reveal
                  key={dest.key}
                  direction={i % 2 === 0 ? 'left' : 'right'}
                  delay={(i % 3) * 0.12}
                  className="h-full"
                >
                <Link
                  to={`/book?to=${encodeURIComponent(dest.to)}`}
                  aria-label={`${t('guide.bookNow')} — ${dest.to}`}
                  className="group relative block h-full overflow-hidden rounded-sm border border-[var(--border)] bg-white transition-colors duration-200 hover:border-[var(--blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] no-underline"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[var(--blue-bg)]">
                    <img
                      src={`/images/cities/${img}.webp`}
                      alt={dest.to}
                      width={1000}
                      height={750}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
                    />
                    <div className="photo-scrim absolute inset-0" aria-hidden="true" />
                    <div className="absolute inset-x-0 bottom-0 p-3.5">
                      <h3 className="text-[15px] sm:text-base font-bold text-white leading-snug">{dest.to}</h3>
                      <p className="mt-0.5 text-[12px] font-medium text-white/85">{t('guide.fromKigali', { duration: dest.time })}</p>
                    </div>
                  </div>
                  {/* Ticket-stub footer: dashed divider + punched notches */}
                  <div className="relative border-t border-dashed border-[var(--border)] bg-white px-3.5 py-2">
                    <span aria-hidden="true" className="absolute left-[-6px] top-[-6px] h-3 w-3 rounded-full bg-[#F8FAFB]" />
                    <span aria-hidden="true" className="absolute right-[-6px] top-[-6px] h-3 w-3 rounded-full bg-[#F8FAFB]" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] truncate">
                        Kigali → {dest.to}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-bold text-[var(--blue)]">
                        {t('guide.bookNow')}
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* How to Book */}
        <section id={sectionId('how')} className="scroll-mt-16">
          <Reveal direction="up">
            <SectionHeading title={t('guide.howToBook')} icon={Route} />
          </Reveal>
          <div className="relative">
            <div aria-hidden="true" className="absolute top-[30px] left-[12.5%] right-[12.5%] hidden lg:block border-t border-dashed border-[var(--border)]" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ key, icon: Icon }, i) => (
                <Reveal
                  key={key}
                  direction={i % 2 === 0 ? 'left' : 'right'}
                  delay={i * 0.1}
                  className="h-full"
                >
                  <div className="relative h-full rounded-sm border border-[var(--border)] bg-white px-5 pt-3 pb-5">
                  <div className="mb-4 flex justify-center">
                    <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--blue)] text-white text-[13px] font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-sm bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center shrink-0">
                      <Icon size={15} />
                    </span>
                    <h3 className="text-[15px] font-bold text-[var(--text)]">
                      <span className="mr-0.5" style={{ fontFamily: SCRIPT_FONT, fontSize: '1.1rem' }}>{t(`guide.${key}Script`)}</span>
                      {t(`guide.${key}Title`)}
                    </h3>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[var(--text-sub)]">{t(`guide.${key}Desc`)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Social proof — handwritten-style testimonials */}
          <div className="mt-10">
            <Reveal direction="up">
              <div className="mb-5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--blue)]">
                  {t('guide.testimonialsEyebrow') || 'Happy travellers'}
                </p>
                <p className="mt-1 text-2xl text-[var(--text)]" style={{ fontFamily: SCRIPT_FONT, fontWeight: 600 }}>
                  {t('guide.testimonialsTitle') || 'people love the easy way'}
                </p>
              </div>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-3">
              <Reveal direction="up" delay={0}>
                <TestimonialCard
                  initials="JP"
                  quote={t('guide.testimonial1') || 'Booked my Kigali to Kampala trip in under two minutes — the e-ticket arrived instantly.'}
                  name={t('guide.testimonial1Name') || 'Jean-Paul'}
                  title={t('guide.testimonial1Title') || 'Kigali → Kampala'}
                />
              </Reveal>
              <Reveal direction="up" delay={0.08}>
                <TestimonialCard
                  initials="GM"
                  quote={t('guide.testimonial2') || 'Paying with MTN MoMo was seamless, and the fare was exactly the RURA-approved price.'}
                  name={t('guide.testimonial2Name') || 'Grace M.'
                  }
                  title={t('guide.testimonial2Title') || 'Kigali → Nairobi'}
                />
              </Reveal>
              <Reveal direction="up" delay={0.16}>
                <TestimonialCard
                  initials="DK"
                  quote={t('guide.testimonial3') || 'The live tracking is a game changer — I knew exactly when the bus was arriving.'}
                  name={t('guide.testimonial3Name') || 'David K.'}
                  title={t('guide.testimonial3Title') || 'Kigali → Dar es Salaam'}
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section id={sectionId('payments')} className="scroll-mt-16">
          <Reveal direction="up">
            <SectionHeading title={t('guide.paymentMethods')} icon={CreditCard} />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            {payments.map(({ key, short, wordmark, chipClass }, i) => (
              <Reveal
                key={key}
                direction={i % 2 === 0 ? 'left' : 'right'}
                delay={(i % 3) * 0.12}
                className="h-full"
              >
                <div className="rounded-sm border border-[var(--border)] bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold tracking-tight ${chipClass}`}>
                    {wordmark}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{short}</span>
                </div>
                <h3 className="text-[15px] font-bold text-[var(--text)] mb-1">{t(`guide.${key}Name`)}</h3>
                <p className="text-[13px] leading-relaxed text-[var(--text-sub)]">{t(`guide.${key}Desc`)}</p>
              </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Cancellation Policy */}
        <section id={sectionId('cancellation')} className="scroll-mt-16">
          <Reveal direction="up">
            <SectionHeading title={t('guide.cancellationPolicyTitle')} icon={Clock3} />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal direction="left" className="h-full">
              <div className="h-full rounded-sm border border-[var(--border)] bg-white p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 rounded-sm bg-[#FFF4E5] text-[var(--warning)] flex items-center justify-center shrink-0">
                  <AlertTriangle size={15} />
                </span>
                <h3 className="text-[15px] font-bold text-[var(--text)]">{t('guide.lateArrivalTitle')}</h3>
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--text-sub)]">{t('guide.lateArrivalDesc')}</p>
              <span className="mt-4 inline-flex items-center rounded-full bg-[#FFF4E5] px-3 py-1 text-[12px] font-bold text-[var(--warning)]">
                {t('guide.arriveEarly')}
              </span>
            </div>
            </Reveal>
            <Reveal direction="right" className="h-full">
              <div className="h-full rounded-sm border border-[var(--border)] bg-white p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 rounded-sm bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center shrink-0">
                  <CheckCircle2 size={15} />
                </span>
                <h3 className="text-[15px] font-bold text-[var(--text)]">{t('guide.allBookingsTitle')}</h3>
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--text-sub)]">{t('guide.allBookingsDesc')}</p>
              <div className="mt-5" aria-hidden="true">
                <div className="relative">
                  <div className="h-1.5 rounded-full bg-[var(--border)]" />
                  <div className="absolute left-0 top-0 h-1.5 rounded-full bg-[var(--success)]" style={{ width: '70%' }} />
                  <div className="absolute -top-[3px] left-[70%] h-3 w-[2px] rounded-full bg-[var(--warning)]" />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium text-[var(--text-muted)]">
                  <span>{t('guide.cancelWindow')}</span>
                  <span>{t('guide.atDeparture')}</span>
                </div>
              </div>
            </div>
            </Reveal>
          </div>
        </section>

        {/* Free Tickets */}
        <section id={sectionId('free')} className="scroll-mt-16">
          <Reveal direction="up">
            <SectionHeading title={t('guide.freeTicketsTitle')} icon={Gift} />
          </Reveal>
          <Reveal direction="up" delay={0.1}>
            <div className="overflow-hidden rounded-sm border border-[var(--border)] bg-white">
            <div className="grid md:grid-cols-2">
              <div className="p-6 sm:p-7 bg-[var(--blue-bg)]">
                <span className="w-12 h-12 rounded-sm bg-white text-[var(--blue)] flex items-center justify-center mb-4">
                  <Gift size={22} />
                </span>
                <h3 className="text-lg font-bold text-[var(--text)] mb-1.5">{t('guide.freeTicketsTitle')}</h3>
                <p className="text-[13px] leading-relaxed text-[var(--text-sub)]">{t('guide.freeTicketsDesc')}</p>
              </div>
              <div className="p-6 sm:p-7 border-t md:border-t-0 md:border-l border-[var(--border)]">
                <p className="text-[13px] font-bold text-[var(--text)] mb-5">{t('guide.freeTicketsHow')}</p>
                <ol className="relative">
                  <div aria-hidden="true" className="absolute left-[11px] top-2 bottom-2 border-l border-dashed border-[var(--border)]" />
                  {[1, 2, 3].map(n => (
                    <li key={n} className="relative mb-4 last:mb-0 flex items-start gap-3.5">
                      <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--blue-border)] bg-white text-xs font-bold text-[var(--blue-dark)] shrink-0">
                        {n}
                      </span>
                      <span className="pt-0.5 text-[13px] leading-relaxed text-[var(--text-sub)]">{t(`guide.freeTicketsStep${n}`)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            </div>
            </Reveal>
        </section>

        {/* Agents at Stations + Pickup Status */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Reveal direction="left" className="h-full">
            <div className="h-full rounded-sm border border-[var(--border)] bg-white p-6">
            <span className="w-10 h-10 rounded-sm bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center mb-4">
              <MapPin size={18} />
            </span>
            <h3 className="text-[15px] font-bold text-[var(--text)] mb-1.5">{t('guide.agentsAtStation')}</h3>
            <p className="text-[13px] leading-relaxed text-[var(--text-sub)]">{t('guide.agentsAtStationDesc')}</p>
          </div>
          </Reveal>
          <Reveal direction="right" className="h-full">
            <div className="h-full rounded-sm border border-[var(--border)] bg-white p-6">
              <span className="w-10 h-10 rounded-sm bg-[var(--blue-bg)] text-[var(--blue-dark)] flex items-center justify-center mb-4">
                <Clock3 size={18} />
              </span>
              <h3 className="text-[15px] font-bold text-[var(--text)] mb-1.5">{t('guide.pickupStatus')}</h3>
              <p className="text-[13px] leading-relaxed text-[var(--text-sub)]">{t('guide.pickupStatusDesc')}</p>
            </div>
          </Reveal>
        </section>

        {/* Support */}
        <section id={sectionId('support')} className="scroll-mt-16">
          <Reveal direction="up">
            <SectionHeading title={t('guide.supportTitle')} icon={MessageCircle} />
          </Reveal>
          <Reveal direction="up" delay={0.1}>
            <div className="rounded-sm border border-[var(--border)] bg-white">
            {contactRows.map((row, i) => {
              const Icon = row.icon;
              return (
                <div key={row.title}>
                  {i > 0 && <div className="h-px bg-[var(--border)] mx-4" />}
                  <a
                    href={row.href}
                    target={row.target}
                    rel={row.rel}
                    className="flex items-center justify-between gap-3 p-4 sm:p-5 hover:bg-[#F9FAFB] transition-colors no-underline group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${row.tileClass}`}>
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[var(--text)]">{row.title}</p>
                        <p className="text-[13px] text-[var(--text-sub)]">{row.value}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-[var(--blue)] shrink-0">
                      {t('guide.contactUs')}
                      <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </a>
                </div>
              );
            })}
          </div>
          </Reveal>
          <Reveal direction="fade" delay={0.15}>
            <div className="mt-6 flex flex-col items-center">
              <StickyCallout arrow="down" className="mb-2">
                {t('guide.supportDesc')}
              </StickyCallout>
              <CTAMicrocopy>
                {t('guide.supportMicro') || 'RURA-approved · Secure payments · Instant tickets'}
              </CTAMicrocopy>
            </div>
          </Reveal>
        </section>

        {/* Soft wave out of the page */}
        <WaveDivider className="h-12 w-full text-[var(--blue-bg)]" />
      </main>
    </div>
  );
}
