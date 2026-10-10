// Service worker mínimo: guarda la "cáscara" de la app para que abra rápido
// y sin señal muestre al menos la interfaz. Los datos siempre vienen de la red.
// Sube VERSION cada vez que cambies archivos de web/ para que los celulares actualicen.
const VERSION = 'canasta-v3.1';
const CASCARA = ['./', 'index.html', 'estilos.css', 'app.js', 'datos.js', 'optimizador.js', 'config.js', 'manifest.webmanifest', 'icons/icon-192.png',
  'menu/ingredientes.js', 'menu/recetas.js', 'menu/recetas-desayunos.js', 'menu/recetas-cenas.js',
  'menu/recetas-refacciones.js', 'menu/planificador.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CASCARA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Supabase y CDN: directo a la red
  // red primero (para ver cambios), caché si no hay señal
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copia = r.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))),
  );
});
