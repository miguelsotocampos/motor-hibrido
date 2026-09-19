// Service worker del visor: permite abrirlo sin internet después de la primera visita.
const CACHE = 'motor-visor-v1';
const CDN = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

function guardar(req, res) {
  if (res && (res.status === 200 || res.type === 'opaque')) {
    const copia = res.clone();
    caches.open(CACHE).then(c => c.put(req, copia));
  }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  if (!propio && !CDN.includes(url.hostname)) return;

  if (propio) {
    // Archivos propios: primero la red (así ves tus cambios), y si no hay internet, la copia guardada
    e.respondWith(fetch(req).then(res => guardar(req, res)).catch(() => caches.match(req)));
  } else {
    // Librerías y tipografías: primero la copia guardada
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => guardar(req, res))));
  }
});
