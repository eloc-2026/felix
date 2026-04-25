/* VibeCodeCentral preview cache-buster — installed 2026-04-25T14:41:41.576Z.
 * Replaces the project's service worker with a pass-through that deletes
 * all caches and unregisters itself on install. The user manually reloads
 * on the affected device to pick up fresh assets.
 *
 * NOTE: do not call client.navigate() from activate. It combines with the
 * project's main.js re-registering the SW on every page load to produce
 * an install → activate → reload → install loop. The browser keeps seeing
 * /service-worker.js with the passthrough contents, installs it fresh
 * each time, and our activate fires again. */
const VCC_BUILD = "2026-04-25T14:41:41.576Z";

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
    try { await self.registration.unregister(); } catch (e) { /* ignore */ }
  })());
});

// No fetch listener: the browser handles requests directly (pass-through).
