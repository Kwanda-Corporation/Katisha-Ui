import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { HelmetProvider } from 'react-helmet-async'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import './i18n'
import { AppProviders } from './App'
import AppRoutes from './routes'
import { ssrData } from './ssrData'
import { SERVER_ORIGIN, API_BASE } from './config/apiBase'
import { captureReferralCode } from './utils/referral'

// Latch any promoter `?ref=` code on the very first load. A shared link points at
// the marketing home page, so this must run before any routing so the code is
// still in localStorage by the time the booking wizard mounts.
captureReferralCode()

// Let the promoter know someone opened their link.
try {
  const fromUrl = new URLSearchParams(window.location.search).get('ref')
  if (fromUrl) {
    fetch(`${API_BASE}/promoter/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: fromUrl }),
      keepalive: true,
    }).catch(() => {})
  }
} catch {}

// Rehydrate server-side-rendered data so the first client render matches the
// pre-rendered HTML (avoids hydration mismatch / flash) on route & agency
// landing pages that had their data embedded at build time.
try {
  const el = document.getElementById('__KATISHA_SSR__');
  if (el?.textContent) {
    const payload = JSON.parse(el.textContent);
    if (Array.isArray(payload.routes)) ssrData.setRoutes(payload.routes);
    if (Array.isArray(payload.agencies)) ssrData.setAgencies(payload.agencies);
  }
} catch {}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// The service worker is only registered in production builds — in dev it would
// intercept Vite's live module/HMR requests and break hot reload + offline.
// We also unregister any stale worker left over from a previous session so it
// can't keep serving cached files (or failing) against the dev server.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      if (reg.active) {
        reg.active.postMessage({ type: 'set_api_origin', origin: SERVER_ORIGIN });
      }
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        navigator.serviceWorker.ready.then(registration => {
          registration.active?.postMessage({ type: 'set_api_origin', origin: SERVER_ORIGIN });
        });
      });
    }).catch(() => {});
  });
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister().catch(() => {}));
    }).catch(() => {});
  });
}

// Prefetch the main booking page once the browser is idle so the common
// Onboarding → /book flow doesn't wait on an extra chunk after first paint.
if (import.meta.env.PROD) {
  const path = window.location.pathname;
  if (path === '/' || path === '/welcome') {
    const schedulePrefetch = (cb: () => void) => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(cb, { timeout: 2000 });
      } else {
        setTimeout(cb, 2000);
      }
    };
    window.addEventListener('load', () => {
      schedulePrefetch(() => {
        import('./pages/website/Home').catch(() => {});
      });
    });
  }
}

const app = (
  <StrictMode>
    <HelmetProvider>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <BrowserRouter>
            <AppProviders>
              <AppRoutes />
            </AppProviders>
          </BrowserRouter>
        </GoogleOAuthProvider>
      ) : (
        <BrowserRouter>
          <AppProviders>
            <AppRoutes />
          </AppProviders>
        </BrowserRouter>
      )}
    </HelmetProvider>
  </StrictMode>
)

const container = document.getElementById('root')!
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
