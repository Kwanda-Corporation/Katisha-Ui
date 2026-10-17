// Shared asset helpers for bus-agency branding across the booking flow.

const AGENCY_LOGO_MAP: Record<string, string> = {
  volcano: '/images/agencies/volcano.webp',
  ritco: '/images/agencies/ritco.webp',
  jaguar: '/images/agencies/jaguar.webp',
  trinity: '/images/agencies/trinity.webp',
  simba: '/images/agencies/simba.webp',
  taqwa: '/images/agencies/taqwa.webp',
  mash: '/images/agencies/mashpoa.webp',
};

// Returns the locally served logo for a known agency name, if any.
export function agencyLogo(name?: string): string | undefined {
  const n = (name || '').toLowerCase();
  for (const [key, src] of Object.entries(AGENCY_LOGO_MAP)) {
    if (n.includes(key)) return src;
  }
  return undefined;
}

// Agencies whose logo is white/light and therefore only visible on a dark
// background (e.g. RITCO's white wordmark).
const LIGHT_LOGO_AGENCIES = ['ritco'];

export function agencyNeedsDarkBg(name?: string): boolean {
  const n = (name || '').toLowerCase();
  return LIGHT_LOGO_AGENCIES.some(k => n.includes(k));
}

const KNOWN_CITY_IMAGES = [
  'kampala', 'nairobi', 'bujumbura', 'dar-es-salaam', 'mombasa', 'dodoma',
  'juba', 'mbarara', 'busia', 'musanze', 'rubavu', 'huye', 'karongi',
  'rusizi', 'nyagatare',
];

// Returns a locally served city photo for a destination name, falling back to
// a neutral default so a background is always available.
export function cityImage(destination?: string): string {
  const slug = (destination || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (slug && KNOWN_CITY_IMAGES.includes(slug)) return `/images/cities/${slug}.webp`;
  return '/images/cities/kampala.webp';
}
