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
}

const BASE_URL = 'https://katisha.today';
const DEFAULT_TITLE = 'Katisha: Bus Ticket Booking Rwanda | Book Online & Track Your Journey';
const DEFAULT_DESC = 'Book bus tickets online in Rwanda at RURA-approved prices. Compare routes & agencies from Kigali to all provinces & East Africa. Pay via MTN Mobile Money, Airtel Money & M-Pesa. Trusted by 10,000+ travellers.';
const DEFAULT_KEYWORDS = 'bus ticket booking Rwanda, book bus online Rwanda, RURA approved bus prices, Kigali bus tickets, East Africa bus travel, East African bus routes, cross-border bus Rwanda, Nyabugogo bus station, bus from Kigali to Kampala, bus from Kigali to Nairobi, bus from Kigali to Dar es Salaam, Katisha bus booking, MTN Mobile Money bus payment, Airtel Money bus payment, M-Pesa bus payment';
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
}: SEOProps) {
  const pageTitle = title ? `${title} | Katisha` : DEFAULT_TITLE;
  const pageDesc = description || DEFAULT_DESC;
  const pageUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const pageImage = ogImage || DEFAULT_OG;
  const pageKeywords = keywords || DEFAULT_KEYWORDS;

  return (
    <>
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDesc} />
      <meta name="keywords" content={pageKeywords} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <link rel="canonical" href={pageUrl} />

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
    {/* Hidden links for crawlers to discover agent/admin login */}
    <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
      <a href="/login">Agent Login</a>
      <a href="/login">Agency Admin Login</a>
      <a href="/login">System Admin Login</a>
      <a href="/register">Register Account</a>
    </div>
    </>
  );
}
