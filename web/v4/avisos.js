// Avisos al celular (Web Push, gratis). El robot diario decide qué avisar (scraper/alertas.mjs)
// y los manda a cada celular suscrito. En iPhone solo funciona con la app instalada en la pantalla de inicio.
import { estado, app } from '../nucleo.js';
import { CONFIG } from '../config.js';

export const TIPOS_AVISO = [
  ['bajas', 'Algo de mi lista bajó de precio'],
  ['menu', 'Recordatorio para armar el menú (sábado)'],
  ['presupuesto', 'Voy cerca o pasado del presupuesto'],
  ['vence', 'Algo en casa está por vencer'],
  ['hogar', 'Se acaba algo de la casa (jabón, detergente…) u oferta para abastecerme'],
];

export function soporteAvisos() {
  const instalada = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { ok: false, motivo: ios && !instalada
      ? 'En iPhone primero instala la app: Safari → Compartir → Agregar a inicio. Luego ábrela desde el ícono.'
      : 'Este navegador no permite avisos.' };
  }
  if (!CONFIG.VAPID_PUBLIC_KEY || CONFIG.VAPID_PUBLIC_KEY.startsWith('TU-')) return { ok: false, motivo: 'Falta configurar VAPID_PUBLIC_KEY en config.js (ver README).' };
  return { ok: true };
}

const aUint8 = (b64) => {
  const p = '='.repeat((4 - (b64.length % 4)) % 4);
  const s = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

export async function estadoAvisos() {
  if (!soporteAvisos().ok) return { activo: false, prefs: null };
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { activo: false, prefs: null };
  const fila = await app.D.suscripcion(sub.endpoint).catch(() => null);
  return { activo: !!fila, prefs: fila?.prefs || null, sub };
}

export async function activarAvisos(prefs) {
  const s = soporteAvisos();
  if (!s.ok) throw new Error(s.motivo);
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') throw new Error('No diste permiso para avisos. Puedes activarlo en los ajustes del navegador.');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aUint8(CONFIG.VAPID_PUBLIC_KEY) });
  await app.D.guardarSuscripcion(sub.toJSON(), prefs);
  estado.avisos = { activo: true, prefs };
}

export async function desactivarAvisos() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await app.D.borrarSuscripcion(sub.endpoint).catch(() => {});
    await sub.unsubscribe();
  }
  estado.avisos = { activo: false, prefs: null };
}
