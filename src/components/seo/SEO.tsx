import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  keywords?: string;
  jsonLd?: Record<string, any>;
  /** Extra hreflang language alternates (in addition to the canonical page).
   *  Each alternate is rendered as <link rel="alternate" hreflang="X" href="Y" />. */
  hreflang?: Array<{ lang: string; href: string }>;
}

const BASE_URL = 'https://katisha.today';
const DEFAULT_TITLE = 'Katisha — Rwanda Bus Tickets & Online Booking';
const DEFAULT_DESC = 'Book East African bus tickets online in Rwanda at RURA-approved prices. Compare routes from Kigali to Kampala, Nairobi, Dar es Salaam, Mbarara & more, across Jaguar Express, Simba Express, Trinity Express & Taqwa Classic Coaches. Pay via Mobile Money.';
const DEFAULT_KEYWORDS = 'bus tickets Rwanda, East Africa bus tickets, bus ticket booking East Africa, bus booking Rwanda, book bus tickets Rwanda, online bus booking Rwanda, Kigali bus tickets, Kigali bus booking, Kigali to Kampala bus, Kigali to Nairobi bus, Kigali to Dar es Salaam bus, Kigali to Mbarara bus, RURA approved bus fares, Katisha booking, bus travel East Africa, Jaguar Express bus, Simba Express bus, Trinity Express bus, Taqwa Classic Coaches bus, Mobile Money bus payment';
const DEFAULT_OG = `${BASE_URL}/og-cover.png`;

export default function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
  keywords,
  jsonLd,
  hreflang,
}: SEOProps) {
  const pageTitle = title ? `${title} | Katisha` : DEFAULT_TITLE;
  const pageDesc = description || DEFAULT_DESC;
  const pageUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const pageImage = ogImage || DEFAULT_OG;
  const pageKeywords = keywords || DEFAULT_KEYWORDS;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDesc} />
      <meta name="keywords" content={pageKeywords} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <link rel="canonical" href={pageUrl} />

      {!noindex &&
        (hreflang || []).map(({ lang, href }) => (
          <link key={lang} rel="alternate" hrefLang={lang} href={href} />
        ))}

      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:site_name" content="Katisha" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={pageImage} />
      <meta name="twitter:image:alt" content={pageTitle} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
