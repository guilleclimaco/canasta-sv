// "¿Es buen precio?": compara el precio de hoy con el de los últimos 60 días.
import { estado, app, esc, dinero, mejorOpcion } from '../nucleo.js';

export async function cargarResumenLista() {
  const ids = [...new Set(estado.lista.flatMap((i) => (i.opciones || []).map((o) => o.id)))];
  if (!ids.length) { estado.resumenPrecios = new Map(); return; }
  try {
    const filas = await app.D.resumenPrecios(ids);
    estado.resumenPrecios = new Map(filas.map((r) => [r.producto_id, r]));
  } catch (e) { console.warn(e); }
}

/** 'bajo' (el más bajo en 60 días), 'caro' (el más alto) o null */
export function veredicto(producto) {
  const r = estado.resumenPrecios.get(producto?.id);
  if (!r || !(r.max60 > r.min60 + 0.009)) return null;
  if (producto.precio <= r.min60 + 0.005) return 'bajo';
  if (producto.precio >= r.max60 - 0.005) return 'caro';
  return null;
}

export function etiquetaPrecio(item) {
  const v = veredicto(mejorOpcion(item));
  if (v === 'bajo') return '<span class="etq-precio bajo" title="El precio más bajo de los últimos 60 días">▼ buen precio</span>';
  if (v === 'caro') return '<span class="etq-precio caro" title="El precio más alto de los últimos 60 días">▲ está caro</span>';
  return '';
}

/** Gráfica pequeña en SVG de los cambios de precio */
export function sparkline(puntos, ancho = 260, alto = 56) {
  if (!puntos?.length) return '';
  const pts = puntos.map(([f, p]) => [new Date(`${f}T12:00:00`).getTime(), Number(p)]);
  pts.push([Date.now(), pts.at(-1)[1]]); // el precio sigue igual hasta hoy
  const [x0, x1] = [pts[0][0], pts.at(-1)[0]];
  const ys = pts.map((p) => p[1]);
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const X = (x) => 4 + ((x - x0) / Math.max(1, x1 - x0)) * (ancho - 8);
  const Y = (y) => (y1 === y0 ? alto / 2 : 6 + (1 - (y - y0) / (y1 - y0)) * (alto - 12));
  // escalones: el precio se mantiene hasta el siguiente cambio
  let d = `M${X(pts[0][0]).toFixed(1)},${Y(pts[0][1]).toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) d += ` H${X(pts[i][0]).toFixed(1)} V${Y(pts[i][1]).toFixed(1)}`;
  const ult = pts.at(-1);
  return `<svg class="spark" viewBox="0 0 ${ancho} ${alto}" width="100%" height="${alto}" role="img" aria-label="Historial de precio">
    <path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${X(ult[0]).toFixed(1)}" cy="${Y(ult[1]).toFixed(1)}" r="3.5" fill="currentColor"/></svg>`;
}

/** Bloque de historial para la hoja de un artículo */
export function bloqueHistorial(item) {
  const p = mejorOpcion(item);
  const r = estado.resumenPrecios.get(p?.id);
  if (!p || !r) return '';
  const v = veredicto(p);
  return `<div class="historial">
    <div class="sub"><b>${esc(p.nombre)}</b> · últimos 60 días</div>
    ${sparkline(r.puntos)}
    <div class="sub">Hoy ${dinero(p.precio)} · mínimo ${dinero(r.min60)} · máximo ${dinero(r.max60)}
      ${v === 'bajo' ? ' · <b class="ok">es el más bajo</b>' : v === 'caro' ? ' · <b class="mal">conviene esperar</b>' : ''}</div>
  </div>`;
}
