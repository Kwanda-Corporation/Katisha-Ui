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

const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── Public, canonical, indexable static pages ───────────────────────────────
const STATIC_ROUTES = [
  '/',
  '/welcome',
  '/book',
  '/guide',
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
  /<link rel="canonical"[^>]*\/>/gi,
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
