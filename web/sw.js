// Service worker mínimo: guarda la "cáscara" de la app para que abra rápido
// y sin señal muestre al menos la interfaz. Los datos siempre vienen de la red.
// Sube VERSION cada vez que cambies archivos de web/ para que los celulares actualicen.
const VERSION = 'canasta-v5.7';
const CASCARA = ['./', 'index.html', 'estilos.css', 'app.js', 'datos.js', 'optimizador.js', 'config.js', 'manifest.webmanifest', 'icons/icon-192.png',
  'menu/ingredientes.js', 'menu/recetas.js', 'menu/recetas-desayunos.js', 'menu/recetas-cenas.js',
  'menu/recetas-refacciones.js', 'menu/recetas-comedor.js', 'menu/recetas-generadas.js', 'menu/planificador.js', 'menu/mercado.js', 'nucleo.js',
  'v4/despensa.js', 'v4/historial.js', 'v4/mercado-ui.js', 'v4/super.js', 'v4/compartir.js', 'v4/escaner.js',
  'v4/ticket.js', 'v4/avisos.js', 'v4/recetas-ui.js', 'v4/ia.js', 'v4/resumen.js',
  'hogar/catalogo.js', 'hogar/necesidades.js', 'v5/hogar-ui.js'];

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

// ---------- Avisos al celular (los manda el robot diario, scraper/alertas.mjs) ----------
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { cuerpo: e.data?.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Canasta', {
    body: d.cuerpo || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: d.tag || 'canasta',
    data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const v of ventanas) {
      if (v.url.startsWith(self.registration.scope)) { await v.focus(); return v.navigate(destino); }
    }
    return self.clients.openWindow(destino);
  })());
});
