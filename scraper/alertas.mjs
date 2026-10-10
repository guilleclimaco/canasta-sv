// Avisos al celular (Web Push, gratis). Corre después del robot de precios.
//   node scraper/alertas.mjs          calcula y envía
//   node scraper/alertas.mjs --seco   solo muestra qué enviaría
// Variables: SUPABASE_URL, SUPABASE_SERVICE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:tu@correo)
// Las llaves VAPID se generan una sola vez con:  npx web-push generate-vapid-keys
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configurado } from './supabase.mjs';

const r2 = (n) => Math.round(n * 100) / 100;

/** Fecha de hoy en El Salvador (UTC-6, sin horario de verano) */
export function hoySV(ahora = new Date()) {
  return new Date(ahora.getTime() - 6 * 3600 * 1000).toISOString().slice(0, 10);
}
const sumarDias = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const diaSemana = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay(); // 0 = domingo

/**
 * Decide qué avisos mandar hoy. Función pura (sin red) para poder probarla.
 * @returns {Array<{tipo, clave, titulo, cuerpo, url}>}
 */
export function calcularAvisos(datos, hoy) {
  const out = [];
  const enviados = datos.enviados || {};
  const nuevo = (a) => { if (!enviados[a.clave]) out.push(a); };

  // 1) Bajas de precio en productos de la lista
  const prodPorId = new Map((datos.productos || []).map((p) => [p.id, p]));
  const resumen = new Map((datos.resumen || []).map((r) => [r.producto_id, r]));
  const bajas = [];
  const vistos = new Set();
  for (const item of datos.lista || []) {
    if (item.comprado) continue;
    for (const id of item.productos || []) {
      const p = prodPorId.get(id);
      const r = resumen.get(id);
      if (!p || !r?.puntos || r.puntos.length < 2 || vistos.has(item.nombre)) continue;
      const [fechaUlt, precioUlt] = r.puntos.at(-1);
      const [, precioAnt] = r.puntos.at(-2);
      if (fechaUlt >= sumarDias(hoy, -1) && Number(precioUlt) < Number(precioAnt) * 0.97) {
        vistos.add(item.nombre);
        const minimo = Number(precioUlt) <= Number(r.min60) + 0.001;
        bajas.push(`${item.nombre}: $${Number(precioUlt).toFixed(2)} en ${p.tienda_nombre || p.tienda}${minimo ? ' (mínimo de 60 días)' : ''}`);
      }
    }
  }
  if (bajas.length) {
    nuevo({
      tipo: 'bajas', clave: `bajas:${hoy}`, url: './#lista',
      titulo: bajas.length === 1 ? '⬇ Bajó algo de tu lista' : `⬇ ${bajas.length} cosas de tu lista bajaron`,
      cuerpo: bajas.slice(0, 4).join('\n'),
    });
  }

  // 2) Presupuesto del mes
  const pres = (datos.presupuestos || []).reduce((s, p) => s + Number(p.monto), 0);
  const gastado = (datos.gastos || []).reduce((s, g) => s + Number(g.monto), 0);
  const mes = hoy.slice(0, 7);
  if (pres > 0 && gastado >= pres) {
    nuevo({ tipo: 'presupuesto', clave: `presupuesto100:${mes}`, url: './#gastos', titulo: '⚠ Te pasaste del presupuesto', cuerpo: `Llevas $${r2(gastado).toFixed(2)} de $${r2(pres).toFixed(2)} este mes.` });
  } else if (pres > 0 && gastado >= pres * 0.9) {
    nuevo({ tipo: 'presupuesto', clave: `presupuesto90:${mes}`, url: './#gastos', titulo: 'Vas en el 90 % del presupuesto', cuerpo: `Llevas $${r2(gastado).toFixed(2)} de $${r2(pres).toFixed(2)}. Te quedan $${r2(pres - gastado).toFixed(2)}.` });
  }

  // 3) Despensa por vencer (hoy o mañana)
  const manana = sumarDias(hoy, 1);
  const vence = (datos.despensa || []).filter((d) => d.caduca && d.caduca <= manana && d.cantidad !== 0);
  if (vence.length) {
    nuevo({
      tipo: 'vence', clave: `vence:${hoy}`, url: './#menu', titulo: '🥬 Úsalo pronto',
      cuerpo: vence.slice(0, 5).map((d) => `${d.nombre} (${d.caduca < hoy ? 'ya venció' : d.caduca === hoy ? 'vence hoy' : 'vence mañana'})`).join(', '),
    });
  }

  // 4) Sábado: armar el menú de la semana que viene
  if (diaSemana(hoy) === 6 && !datos.menuSiguiente) {
    nuevo({ tipo: 'menu', clave: `menu:${hoy}`, url: './#menu', titulo: '🍽 Arma el menú de la semana', cuerpo: 'Ya están los precios de hoy. En 2 minutos queda la semana y la lista del súper.' });
  }
  return out;
}

// ---------------------------------------------------------------------
async function rest(ruta, opciones = {}) {
  const URL_BASE = process.env.SUPABASE_URL.replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  const h = { apikey: KEY, 'Content-Type': 'application/json', ...(KEY.startsWith('sb_') ? {} : { Authorization: `Bearer ${KEY}` }), ...(opciones.headers || {}) };
  const r = await fetch(`${URL_BASE}/rest/v1/${ruta}`, { ...opciones, headers: h });
  if (!r.ok) throw new Error(`${ruta}: ${r.status} ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

export async function correrAlertas({ seco = false } = {}) {
  if (!configurado()) throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY');
  const hoy = hoySV();
  const mes = `${hoy.slice(0, 7)}-01`;
  const finMes = sumarDias(`${hoy.slice(0, 7)}-28`, 4).slice(0, 7) + '-01';
  const lunesSiguiente = sumarDias(hoy, ((8 - diaSemana(hoy)) % 7) || 7);

  // La llave secreta ve todos los hogares: se calcula y se envía por separado para cada uno,
  // así nadie recibe avisos de la lista, gastos o despensa de otro hogar.
  const [miembros, subs, lista, presupuestos, gastos, despensa, menus, ajustes, tiendas] = await Promise.all([
    rest('miembros?select=email,hogar'),
    rest('avisos_suscripciones?select=*'),
    rest('lista?select=hogar,nombre,productos,comprado&comprado=eq.false'),
    rest(`presupuestos?select=hogar,monto&mes=eq.${mes}`),
    rest(`gastos?select=hogar,monto&fecha=gte.${mes}&fecha=lt.${finMes}`),
    rest('despensa?select=hogar,nombre,cantidad,caduca&caduca=not.is.null'),
    rest(`menus?select=hogar,semana&semana=eq.${lunesSiguiente}`),
    rest('ajustes?select=hogar,valor&clave=eq.avisos_enviados'),
    rest('tiendas?select=id,nombre'),
  ]);
  const hogarDe = new Map(miembros.map((m) => [m.email.toLowerCase(), m.hogar]));
  const ids = [...new Set(lista.flatMap((i) => i.productos || []))];
  const nombresTienda = Object.fromEntries(tiendas.map((t) => [t.id, t.nombre]));
  const productos = ids.length ? (await rest(`productos?select=id,nombre,tienda,precio&id=in.(${ids.join(',')})`))
    .map((p) => ({ ...p, tienda_nombre: nombresTienda[p.tienda] })) : [];
  const resumen = ids.length ? await rest('rpc/resumen_precios', { method: 'POST', body: JSON.stringify({ ids }) }) : [];
  const de = (filas, h) => filas.filter((f) => f.hogar === h);

  let webpush = null;
  let total = 0;
  let enviadosOk = 0;
  for (const hogar of [...new Set(miembros.map((m) => m.hogar))]) {
    const enviados = de(ajustes, hogar)[0]?.valor || {};
    const avisos = calcularAvisos({
      lista: de(lista, hogar), productos, resumen, presupuestos: de(presupuestos, hogar), gastos: de(gastos, hogar),
      despensa: de(despensa, hogar), menuSiguiente: de(menus, hogar).length > 0, enviados,
    }, hoy);
    total += avisos.length;
    console.log(`Avisos para hoy (${hoy}), hogar ${hogar}: ${avisos.length}`);
    avisos.forEach((a) => console.log(` - [${a.tipo}] ${a.titulo} — ${a.cuerpo.replace(/\n/g, ' | ')}`));
    if (seco || !avisos.length) continue;

    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn('Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY: no se envía nada.');
      return { avisos: total, enviados: 0 };
    }
    if (!webpush) {
      webpush = (await import('web-push')).default;
      webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:canasta@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    }
    for (const s of subs.filter((x) => hogarDe.get(String(x.email).toLowerCase()) === hogar)) {
      for (const a of avisos) {
        if (s.prefs?.[a.tipo] === false) continue;
        try {
          await webpush.sendNotification(s.datos, JSON.stringify({ titulo: a.titulo, cuerpo: a.cuerpo, url: a.url, tag: a.tipo }), { TTL: 12 * 3600 });
          enviadosOk++;
        } catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await rest(`avisos_suscripciones?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE' });
            console.log('Suscripción vencida, eliminada.');
            break;
          }
          console.warn('No se pudo enviar:', e.statusCode || e.message);
        }
      }
    }
    // recordar lo enviado en ese hogar (y olvidar lo de hace más de 40 días)
    const limite = sumarDias(hoy, -40);
    const nuevos = Object.fromEntries(Object.entries(enviados).filter(([, f]) => f >= limite));
    avisos.forEach((a) => { nuevos[a.clave] = hoy; });
    await rest('ajustes?on_conflict=hogar,clave', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ hogar, clave: 'avisos_enviados', valor: nuevos }),
    });
  }
  console.log(`Enviados: ${enviadosOk}`);
  return { avisos: total, enviados: enviadosOk };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  correrAlertas({ seco: process.argv.includes('--seco') }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
