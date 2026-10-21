/* Service worker: la app abre al instante desde la copia guardada en el equipo y se actualiza en segundo plano.
   Si Netlify tiene una versión nueva de la página, se avisa a la app para que se recargue sola.
   Los datos no pasan por aquí: se piden a Google Apps Script. */
const CACHE = 'efectivo-v4';
const SHELL = ['/', '/index.html', '/config.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const notify = async () => { const cs = await self.clients.matchAll({ type: 'window' }); cs.forEach(c => c.postMessage({ type: 'update' })); };
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/.well-known/')) return;
  const nav = e.request.mode === 'navigate', key = nav ? '/index.html' : e.request;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key);
    const net = fetch(e.request, { cache: 'no-cache' }).then(async r => {
      if (r.ok) {
        if (nav && hit) { const [a, b] = await Promise.all([hit.clone().text(), r.clone().text()]); if (a !== b) { await c.put(key, r.clone()); notify(); return r; } }
        await c.put(key, r.clone());
      }
      return r;
    }).catch(() => hit);
    if (hit) { e.waitUntil(net); return hit; }
    return net;
  }));
});
