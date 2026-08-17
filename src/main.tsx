import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import './i18n'
import App from './App'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api'
const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      ) : (
        <App />
      )}
    </HelmetProvider>
  </StrictMode>,
)
