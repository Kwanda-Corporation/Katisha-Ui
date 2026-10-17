/**
 * Katisha static site pre-renderer (SSG).
 *
 * Renders every public, indexable URL to a standalone static HTML file so
 * crawlers (Google, Bing, social scrapers) receive real content without
 * executing JavaScript.
 *
 * REQUIRES a prior `npm run build` (vite build) so that:
 *   - dist/ contains the hashed client assets (/assets/index-*.js|css) and
 *   - dist/index.html carries the correct production <script>/<link> tags.
 * The pre-renderer then reuses dist/index.html as the shell, replaces the
 * homepage-only <head> tags with each page's react-helmet output, injects the
 * server-rendered #root markup, and embeds route/agency data so the client
 * hydrates without a mismatch. Client hydration keeps working because the
 * asset references are unchanged.
 *
 * The route/agency landing page set and their data are fetched live from the
 * API, so every active route + agency in the DB gets a pre-rendered page.
 *
 * Run:  npm run build && node scripts/prerender.mjs
 * API:  PRERENDER_API (default https://api.katisha.today/api)
 */
import { createServer } from 'vite';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const templateFile = path.join(distDir, '.ssr-shell.html');

const API_BASE = (process.env.PRERENDER_API || 'https://api.katisha.today/api').replace(/\/$/, '');

const SITE_URL = 'https://katisha.today';

const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Writes a self-contained sitemap.xml directly into dist/ so crawlers get every
// indexable URL even though the public site's /api/* proxy is not guaranteed to
// be reachable at request time. This replaces the old sitemap-index that pointed
// at https://katisha.today/api/seo/sitemap-routes.xml (which 502s).
function writeSitemap(routes, agencies, dynamicRoutes) {
  const now = new Date().toISOString().slice(0, 10);
  const entries = [];
  const add = (loc, priority, changefreq, lastmod = now) =>
    entries.push({ loc, priority, changefreq, lastmod });

  // Core public pages. (/book canonicalises to /, so it is intentionally not
  // listed as a separate URL to avoid a duplicate entry in the sitemap.)
  add(`${SITE_URL}/`, '1.0', 'daily');
  add(`${SITE_URL}/bus/rwanda`, '0.9', 'weekly');
  add(`${SITE_URL}/bus/east-africa`, '0.9', 'weekly');
  add(`${SITE_URL}/guide`, '0.8', 'weekly');
  add(`${SITE_URL}/privacy`, '0.3', 'yearly');

  // Canonical route landing pages (one per origin→destination).
  const seen = new Set();
  for (const r of routes) {
    const origin = r.origin || r.from;
    const dest = r.destination || r.to;
    if (!origin || !dest) continue;
    const key = `${slugify(origin)}-to-${slugify(dest)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const lastmod = r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : now;
    add(`${SITE_URL}/bus/${key}`, '0.8', 'weekly', lastmod);
  }

  // Any extra dynamic landing routes discovered by the renderer.
  for (const route of dynamicRoutes) {
    if (!route.startsWith('/bus/')) continue;
    const key = route.slice('/bus/'.length);
    if (key === 'rwanda' || key === 'east-africa') continue;
    if (seen.has(key)) continue;
    seen.add(key);
    add(`${SITE_URL}${route}`, '0.7', 'weekly');
  }

  // Agency landing pages.
  for (const a of agencies) {
    const id = a._id || a.id;
    if (!id || !a.name) continue;
    const lastmod = a.updatedAt ? new Date(a.updatedAt).toISOString().slice(0, 10) : now;
    add(`${SITE_URL}/agency/${id}/${slugify(a.name)}`, '0.6', 'weekly', lastmod);
  }

  const body = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${xmlEscape(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf-8');
  console.log(`[prerender] wrote sitemap.xml with ${entries.length} URLs`);
}

// ── Public, canonical, indexable static pages ───────────────────────────────
const STATIC_ROUTES = [
  '/',
  '/welcome',
  '/book',
  '/guide',
  '/privacy',
  '/bus/rwanda',
  '/bus/east-africa',
  // Account-area pages: noindex + self-canonical so they never resolve to a
  // duplicate of the homepage shell (their own canonical + robots meta).
  '/my-bookings',
  '/track',
];

// Conflicting homepage `<head>` tags replaced by each page's react-helmet head.
const HEAD_REMOVE_PATTERNS = [
  /<title>[\s\S]*?<\/title>/gi,
  /<meta name="title"[\s\S]*?\/>/gi,
  /<meta name="description"[\s\S]*?\/>/gi,
  /<meta name="keywords"[\s\S]*?\/>/gi,
  // The shell declares a global `index, follow` robots meta; strip it so each
  // page's own robots directive wins (important for noindexed account pages).
  /<meta name="robots"[\s\S]*?\/>/gi,
  /<link rel="canonical"[^>]*\/>/gi,
  // The shell's hreflang alternates all point at the homepage; strip them so
  // each page emits its own self-referencing alternates (or none for noindex).
  /<link rel="alternate"[\s\S]*?\/>/gi,
  /<meta property="og:title"[\s\S]*?\/>/gi,
  /<meta property="og:description"[\s\S]*?\/>/gi,
  /<meta property="og:url"[\s\S]*?\/>/gi,
  /<meta property="og:locale"[\s\S]*?\/>/gi,
  /<meta name="twitter:title"[\s\S]*?\/>/gi,
  /<meta name="twitter:description"[\s\S]*?\/>/gi,
];

function stripConflictingHead(template) {
  let out = template;
  for (const re of HEAD_REMOVE_PATTERNS) out = out.replace(re, '');
  return out;
}

// The SPA fallback shell keeps the generic title/description/OG tags (so link
// previews for client-only routes such as /ticket/… still work) but drops the
// homepage-only robots/canonical/hreflang tags, which would otherwise claim
// every client route as a duplicate of the homepage.
function stripHomepageOnlyHead(template) {
  return template
    .replace(/<meta name="robots"[\s\S]*?\/>/gi, '')
    .replace(/<link rel="canonical"[^>]*\/>/gi, '')
    .replace(/<link rel="alternate"[\s\S]*?\/>/gi, '');
}

function buildOutputPath(route) {
  const norm = route.replace(/^\/|\/$/g, '');
  return norm === '' ? 'index.html' : path.join(norm, 'index.html');
}

async function fetchAPI(pathname) {
  const url = `${API_BASE}${pathname}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function fetchAllPages(pathname, key) {
  const all = [];
  try {
    let page = 1;
    let pages = 1;
    while (page <= pages && page <= 40) {
      const body = await fetchAPI(`${pathname}?page=${page}&limit=100`);
      const data = body?.data || body || {};
      const list = Array.isArray(data[key]) ? data[key] : [];
      if (!list.length) break;
      all.push(...list);
      pages = Number(data.pages) || 1;
      page += 1;
    }
  } catch (e) {
    console.warn(`[prerender] fetch error ${pathname}:`, e?.message || e);
  }
  return all;
}

const vite = await createServer({
  root,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
  const ssrDataModule = await vite.ssrLoadModule('/src/ssrData.ts');

  // Fetch live route + agency data to (a) build the landing-page URL list and
  // (b) render those pages with full content.
  const [routes, agencies] = await Promise.all([
    fetchAllPages('/routes', 'routes'),
    fetchAllPages('/agencies/public', 'agencies'),
  ]);
  ssrDataModule.ssrData.setRoutes(routes.length ? routes : null);
  ssrDataModule.ssrData.setAgencies(agencies.length ? agencies : null);

  // Build the dynamic landing-page URL list from the live data.
  // Only canonical pages are pre-rendered: the destination page per route.
  // Via-town variants redirect client-side to the destination page and are
  // therefore excluded (they would otherwise generate near-duplicate HTML).
  const dynamic = new Set();
  for (const r of routes) {
    if (r.origin && r.destination) dynamic.add(`/bus/${slugify(r.origin)}-to-${slugify(r.destination)}`);
  }
  for (const a of agencies) {
    if (a._id || a.id) dynamic.add(`/agency/${a._id || a.id}/${slugify(a.name)}`);
  }
  const DYNAMIC_ROUTES = [...dynamic].sort();
  const routesToRender = [...new Set([...STATIC_ROUTES, ...DYNAMIC_ROUTES])];

  const template = readFileSync(templateFile, 'utf-8');
  const baseTemplate = stripConflictingHead(template);
  const embedJson = JSON.stringify({ routes, agencies });
  const embedScript = `<script id="__KATISHA_SSR__" type="application/json">${embedJson}</script>`;

  // SPA fallback shell served by nginx for every client-side route that has no
  // pre-rendered file (dashboard/auth, /book?… deep links, via-town variants,
  // unknown paths). Marked noindex so those URLs stop resolving to a duplicate
  // of the homepage ("Alternate page with proper canonical tag").
  const spaShell = stripHomepageOnlyHead(template).replace(
    '</head>',
    '  <meta name="robots" content="noindex, follow" />\n</head>'
  );
  writeFileSync(path.join(distDir, 'spa.html'), spaShell, 'utf-8');
  console.log('[prerender] wrote spa.html (noindex SPA fallback shell)');

  let rendered = 0;
  for (const route of routesToRender) {
    try {
      const { html, head } = await render(route);
      const outPath = path.join(distDir, buildOutputPath(route));
      mkdirSync(path.dirname(outPath), { recursive: true });

      let doc = head
        ? `${baseTemplate.slice(0, baseTemplate.lastIndexOf('</head>'))}\n${head}\n</head>${baseTemplate.slice(baseTemplate.lastIndexOf('</head>') + '</head>'.length)}`
        : baseTemplate;

      doc = doc.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
      doc = doc.replace('</body>', `${embedScript}\n</body>`);

      writeFileSync(outPath, doc, 'utf-8');
      console.log(`[prerender] OK ${route} -> ${path.relative(root, outPath)}`);
      rendered += 1;
    } catch (err) {
      console.error(`[prerender] FAIL ${route}:`, err?.message || err);
    }
  }
  // Write a complete static sitemap for every public URL (independent of the
  // backend sitemap endpoint, which is not reachable via the public /api proxy).
  writeSitemap(routes, agencies, DYNAMIC_ROUTES);

  console.log(`\n[prerender] Done: ${rendered}/${routesToRender.length} pages pre-rendered (${routes.length} routes, ${agencies.length} agencies loaded).`);
} finally {
  await vite.close();
  // The pristine shell is only needed as a build-time template. Remove it so it
  // never ends up in the deployable dist/ output (it would otherwise get served
  // as /__ssr-shell.html or similar). vite build recreates it on the next run.
  try {
    rmSync(templateFile, { force: true });
    console.log('[prerender] cleaned .ssr-shell.html from dist/');
  } catch {
    /* noop */
  }
}
