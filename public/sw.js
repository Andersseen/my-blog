// Self-destructing service worker — NOT a real service worker. Do not add a `fetch` handler.
//
// This site used to ship a caching service worker (removed in fbc27c7). Deleting the file was not
// enough: browsers that had already installed it kept running it forever, and its fetch handler
// returns redirected responses to navigations, which Chrome rejects with
//   "The FetchEvent for "<URL>" resulted in a network error response: a redirected response was
//    used for a request whose redirect mode is not "follow"."
// so every URL that redirects (/en -> /, /ua -> /ua/, ...) showed "This site can't be reached".
//
// Browsers re-fetch /sw.js on navigation, so serving this file heals them: it takes over the old
// worker, wipes its caches, unregisters itself and reloads the open tabs. Once nothing controls
// the page any more the file is inert. Keep it in place; see docs/ai/STATE.md.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
