/* Tienda Luna · service worker: permite instalar como app y abrir sin conexión.
   Siempre intenta traer lo último de internet; usa la copia guardada solo si no hay conexión.
   Nunca guarda las llamadas a la planilla. */
const CACHE = 'tl-v3';
const CORE = ['./', './config.js', './manifest.json', './icon-192.png', './icon-panel-192.png', './panel/', './panel/manifest.json'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r ||
    (req.mode === 'navigate' ? caches.match(url.pathname.includes('/panel/') ? './panel/' : './') : undefined))));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './panel/#pedidos';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => c.url.includes('/panel/'));
    if (w) { w.focus(); return w.navigate ? w.navigate(target).catch(() => {}) : null; }
    return self.clients.openWindow(target);
  }));
});
