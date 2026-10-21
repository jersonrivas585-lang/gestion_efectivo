/* Service worker
   - La página (index.html) se pide primero a Netlify: así siempre se usa la versión publicada.
     Si no hay señal o tarda más de 4 s, se abre la copia guardada.
   - Íconos y demás archivos: copia guardada, actualizada en segundo plano.
   - Los datos no pasan por aquí: se piden a Google Apps Script. */
const CACHE = 'efectivo-v5';
const SHELL = ['/index.html', '/config.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/.well-known/')) return;
  const nav = e.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/config.js';
  if (nav) {
    const key = url.pathname === '/config.js' ? '/config.js' : '/index.html';
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const r = await Promise.race([fetch(e.request, { cache: 'no-store' }), timeout(4000)]);
        if (r && r.ok) { await c.put(key, r.clone()); return r; }
        throw new Error('bad');
      } catch (err) { return (await c.match(key)) || fetch(e.request); }
    })());
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    if (hit) { e.waitUntil(net); return hit; }
    return net;
  }));
});
