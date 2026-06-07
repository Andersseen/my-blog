const CACHE_NAME = 'my-blog-v2';
const STATIC_ASSETS = [
  '/',
  '/fonts/atkinson-regular.woff',
  '/fonts/atkinson-bold.woff',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Helper: only cache successful, non-redirected responses
async function safeCachePut(cache, request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') {
    return;
  }
  // Never cache redirected responses (301/302) to avoid SW navigation errors
  if (response.redirected) {
    return;
  }
  const clone = response.clone();
  try {
    await cache.put(request, clone);
  } catch {
    // ignore cache write failures
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Precache each asset individually and skip failures/redirects
      await Promise.all(
        STATIC_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { redirect: 'follow' });
            await safeCachePut(cache, url, response);
          } catch {
            // ignore failed precache entries
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then(async (cached) => {
      // If cached response is a redirect, ignore it and fetch fresh
      if (cached && cached.status >= 300 && cached.status < 400) {
        cached = undefined;
      }

      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request, { redirect: 'follow' });
        // Cache static assets safely
        if (request.url.match(/\.(js|css|woff|woff2|png|svg|webp|json)$/)) {
          const cache = await caches.open(CACHE_NAME);
          await safeCachePut(cache, request, response);
        }
        return response;
      } catch {
        // Fallback for offline navigation
        if (request.mode === 'navigate') {
          return (await caches.match('/')) || new Response('Offline', { status: 503 });
        }
        return new Response('Offline', { status: 503 });
      }
    })
  );
});
