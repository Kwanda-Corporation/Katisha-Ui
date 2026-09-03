import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { AppProviders } from './App';
import './i18n';

// Under React 19, react-helmet-async renders <Helmet> contents (title, meta,
// link, JSON-LD script, ...) inline in the component tree instead of exposing a
// serialized head via context. So we render the whole page, then hoist the
// head-appropriate tags out of the body markup into the document <head>.
const HEAD_TAG_PATTERNS = [
  /<title>[\s\S]*?<\/title>/gi,
  /<base\b[^>]*\/?>/gi,
  /<meta\b[^>]*\/?>/gi,
  /<link\b[^>]*\/?>/gi,
  /<style\b[^>]*>[\s\S]*?<\/style>/gi,
  /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
  /<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,
];

function splitHead(markup: string): { html: string; head: string } {
  const collected: string[] = [];
  let rest = markup;
  for (const re of HEAD_TAG_PATTERNS) {
    const hoisted: string[] = [];
    rest = rest.replace(re, (m) => {
      hoisted.push(m);
      return '';
    });
    collected.push(...hoisted);
  }
  return { html: rest.trim(), head: collected.join('\n') };
}

// Only the public, indexable pages are pre-rendered (they are the ones that
// need real HTML for crawlers). Everything user/admin-only stays a client-SPA
// (and is noindexed). These pages are statically imported — never React.lazy —
// because renderToString cannot wait on a lazy/suspended boundary.
import Onboarding from './pages/website/Onboarding';
import Home from './pages/website/Home';
import BookingGuide from './pages/website/BookingGuide';
import RouteLandingPage from './pages/website/RouteLandingPage';
import AgencyLandingPage from './pages/website/AgencyLandingPage';

export interface RenderResult {
  html: string;
  head: string;
}

function matchPage(url: string): React.ReactNode {
  const path = url.split('?')[0];
  if (path === '/' || path === '/welcome') return <Onboarding />;
  if (path === '/book') return <Home />;
  if (path === '/guide') return <BookingGuide />;

  const bus = path.match(/^\/bus\/(.+)$/);
  if (bus) return <RouteLandingPage slug={bus[1]} />;

  const agency = path.match(/^\/agency\/([^/]+)\/(.+)$/);
  if (agency) return <AgencyLandingPage id={agency[1]} slug={agency[2]} />;

  return null;
}

export function render(url: string): Promise<RenderResult> {
  const page = matchPage(url);

  let markup = '';
  if (page) {
    markup = renderToString(
      <HelmetProvider>
        <StaticRouter location={url}>
          <AppProviders>{page}</AppProviders>
        </StaticRouter>
      </HelmetProvider>
    );
  }

  const { html, head } = splitHead(markup);
  return Promise.resolve({ html, head });
}
