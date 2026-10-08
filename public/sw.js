// Replaces the old next-pwa/workbox service worker on devices that installed the app.
// The app is online-only, so this worker clears the old caches and unregisters itself.
// The PWA stays installable through manifest.json.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
