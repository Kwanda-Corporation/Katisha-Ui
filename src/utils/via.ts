/**
 * Shared helpers for rendering route "via" points.
 * Example: route "Nairobi → Kampala" with via "Kagitumba" renders as
 * "Nairobi → Kampala via Kagitumba".
 */

/** Returns " via Kagitumba" (or "" when there is no via). */
export function viaLabel(via?: string | null): string {
  const v = (via || '').trim();
  return v ? ` via ${v}` : '';
}

/**
 * Like viaLabel but omits the via point when it equals the selected
 * destination, so booking "Nairobi → Kagitumba" on a Nairobi → Kampala via
 * Kagitumba route does not render "via Kagitumba" again.
 */
export function viaLabelBefore(via: string | null | undefined, destination?: string): string {
  const v = (via || '').trim();
  if (!v) return '';
  if (destination && v.toLowerCase() === String(destination).trim().toLowerCase()) return '';
  return ` via ${v}`;
}

/** Full route label including the via point, e.g. "Nairobi → Kampala via Kagitumba". */
export function routeLabel(origin?: string, destination?: string, via?: string | null): string {
  return `${origin || ''} → ${destination || ''}${viaLabel(via)}`;
}
