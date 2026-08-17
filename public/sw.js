/* Katisha offline-first service worker
 * Strategy:
 *  - Precache the app shell (index.html + public assets) at install.
 *  - Runtime-cache hashed /assets/* files (immutable) cache-first.
 *  - Runtime-cache other static files (images/fonts) cache-first.
 *  - Navigation requests: network-first, fall back to cached index.html.
 *  - API images (uploaded tickets / logos) cached once seen so they open offline.
 *  - Keep push-notification handling.
 */
const CACHE = 'katisha-shell-v1';

const STATIC_EXT = /\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf)$/i;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/favicon-96x96.png',
  '/favicon-144x144.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-152x152.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/mstile-150x150.png',
  '/1.png',
  '/2.png',
  '/notification.wav',
  '/robots.txt',
];

let apiOrigin = null;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url)));
      // Precache the hashed JS/CSS referenced by the built index.html so a
      // freshly installed SW can serve the whole app with no further requests.
      try {
        const shell = await cache.match('/index.html');
        const html = shell ? await shell.text() : await (await fetch('/index.html')).text();
        const refs = html.match(/(?:src|href)="(\/assets\/[^"]+)"/g) || [];
        const urls = refs.map((r) => r.replace(/(?:src|href)="/, '').replace(/"$/, ''));
        await Promise.allSettled(urls.map((u) => cache.add(u)));
      } catch {}
    })(),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// The app tells us where the API lives so we can cache uploaded images.
self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;

  if (event.data.type === 'set_api_origin') {
    apiOrigin = event.data.origin || null;
    return;
  }

  if (event.data.type === 'show_notification') {
    const { title, body, tag } = event.data;
    self.registration.showNotification(title || 'Katisha', {
      body: body || '',
      tag: tag || 'default',
      icon: '/2.png',
      badge: '/favicon-32x32.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL('/', self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (windowClients.length > 0) {
        const client = windowClients[0];
        client.focus();
        if (client.url !== urlToOpen) client.navigate(urlToOpen);
        return;
      }
      self.clients.openWindow(urlToOpen);
    }),
  );
});

function isApiImageUrl(url) {
  if (!apiOrigin) return false;
  const u = new URL(url);
  if (u.origin !== new URL(apiOrigin).origin) return false;
  return u.pathname.includes('/uploads/') || STATIC_EXT.test(u.pathname);
}

function offlineResponse() {
  return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineResponse();
  }
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
      if (fallbackUrl && fallbackUrl !== request.url) cache.put(fallbackUrl, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const shell = await caches.match(fallbackUrl);
      if (shell) return shell;
    }
    return offlineResponse();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation: offline should still show the app.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/index.html'));
    return;
  }

  // Hashed build assets are immutable — cache-first.
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Other same-origin static files (public images, fonts, icons).
  if (url.origin === self.location.origin && STATIC_EXT.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Uploaded ticket / logo images from the API origin.
  if (isApiImageUrl(url.href)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else (e.g. webmanifest, sitemap): network-first, cache fallback.
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
    return;
  }
});
