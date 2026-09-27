/**
 * Single source of truth for the backend base URL.
 *
 * Previously every module re-derived this with its own
 * `import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api'`, which let a
 * misconfigured build-time value break the whole app:
 *
 *   - a trailing slash produced double-slash URLs (`/api//routes`)
 *   - a plain-http value was used verbatim, so every request from the https
 *     site was blocked by the browser as mixed content
 *   - a host-only value dropped the `/api` prefix the backend is mounted
 *     under, so every request 404'd
 *
 * `normalizeApiBase` makes the value safe to interpolate directly, so a
 * slightly wrong build-time setting degrades gracefully instead of taking the
 * whole site down.
 */
const RAW_API_BASE: string =
  import.meta.env?.VITE_API_URL ?? 'http://localhost:5001/api';

/** Loopback + RFC1918 + link-local, where plain http is legitimate. */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '[::1]' ||
    host.endsWith('.local') ||
    host.endsWith('.localhost')
  ) {
    return true;
  }
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!v4) return false;
  const [a, b] = [Number(v4[1]), Number(v4[2])];
  if (a === 10 || a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

export function normalizeApiBase(raw: string): string {
  let base = (raw ?? '').trim();
  if (!base) return 'http://localhost:5001/api';

  // Collapse any trailing slashes so `${API_BASE}/path` never doubles up.
  base = base.replace(/\/+$/, '');

  let url: URL | null = null;
  try {
    url = new URL(base);
  } catch {
    url = null;
  }

  if (url) {
    // Keep plain http for loopback/private hosts (local + LAN dev servers),
    // but never ship a public origin over http — the site itself is served
    // over https, so the browser would block every request as mixed content.
    if (url.protocol === 'http:' && !isPrivateHost(url.hostname)) {
      url.protocol = 'https:';
    }

    // The API is mounted under /api. If the configured value points at the
    // bare origin, restore the prefix so requests don't 404.
    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/api';
    }

    base = url.toString().replace(/\/+$/, '');
  }

  return base;
}

/** Backend base URL, always without a trailing slash (e.g. https://api.katisha.today/api). */
export const API_BASE: string = normalizeApiBase(RAW_API_BASE);

/** Backend origin with the /api suffix removed (e.g. https://api.katisha.today). */
export const SERVER_ORIGIN: string = API_BASE.replace(/\/api$/i, '');
