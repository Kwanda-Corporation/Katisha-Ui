/**
 * Curated, canonical route pages Katisha deliberately exposes to search engines.
 *
 * The live catalogue has 200+ route/agency landing pages, most of which are thin
 * and near-duplicate, so they are pre-rendered but served `noindex` (see
 * `scripts/prerender.mjs`). The sitemap and every internal-linking block on the
 * site (footer, homepage, hub pages, route pages) point at this small set so
 * crawl budget and link equity concentrate on pages that can realistically rank.
 *
 * Keep this list in sync with `INDEXABLE_ROUTES` in `scripts/prerender.mjs`.
 */
export const SITE_URL = 'https://katisha.today';

export interface KeyRoute {
  /** URL slug: `/bus/{slug}`. */
  slug: string;
  /** Anchor text used in link blocks. */
  label: string;
  origin: string;
  destination: string;
  /** Destination country (used for grouping/labels). */
  country: string;
  /** One-line, keyword-rich description for cards and cross-links. */
  blurb: string;
}

export const KEY_ROUTES: KeyRoute[] = [
  {
    slug: 'kigali-to-kampala',
    label: 'Kigali to Kampala bus',
    origin: 'Kigali',
    destination: 'Kampala',
    country: 'Uganda',
    blurb: 'Cross-border buses from Kigali to Uganda’s capital via the Gatuna/Katuna border.',
  },
  {
    slug: 'kigali-to-nairobi',
    label: 'Kigali to Nairobi bus',
    origin: 'Kigali',
    destination: 'Nairobi',
    country: 'Kenya',
    blurb: 'Long-distance buses from Kigali to Nairobi through Uganda and western Kenya.',
  },
  {
    slug: 'kigali-to-dar-es-salaam',
    label: 'Kigali to Dar es Salaam bus',
    origin: 'Kigali',
    destination: 'Dar es Salaam',
    country: 'Tanzania',
    blurb: 'Kigali to Dar es Salaam coaches across Tanzania to the Indian Ocean coast.',
  },
  {
    slug: 'kigali-to-mwanza',
    label: 'Kigali to Mwanza bus',
    origin: 'Kigali',
    destination: 'Mwanza',
    country: 'Tanzania',
    blurb: 'Kigali to Mwanza buses to the Lake Victoria port city in northern Tanzania.',
  },
  {
    slug: 'kigali-to-arusha',
    label: 'Kigali to Arusha bus',
    origin: 'Kigali',
    destination: 'Arusha',
    country: 'Tanzania',
    blurb: 'Kigali to Arusha coaches towards Kilimanjaro and the northern safari circuit.',
  },
  {
    slug: 'kigali-to-kigoma',
    label: 'Kigali to Kigoma bus',
    origin: 'Kigali',
    destination: 'Kigoma',
    country: 'Tanzania',
    blurb: 'Kigali to Kigoma buses to the port town on Lake Tanganyika.',
  },
];

export const KEY_ROUTE_SLUGS = new Set(KEY_ROUTES.map((r) => r.slug));
