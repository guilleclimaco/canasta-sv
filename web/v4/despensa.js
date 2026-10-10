// Despensa viva: lo que hay en casa, con cantidad y fecha de vencimiento.
// Entra sola al marcar algo como comprado; sale sola al marcar una comida como hecha.
import { $, $$, esc, estado, app, aviso, errorAviso, hoyISO, sumarDias, mejorOpcion } from '../nucleo.js';
import { INGREDIENTES, buscarIngrediente, pasilloDeArticulo, PASILLOS } from '../menu/ingredientes.js';
import { cantidadTexto, normalizarDespensa, porVencer } from '../menu/planificador.js';

export async function cargarDespensa() {
  try { estado.despensa = await app.D.despensa(); } catch (e) { estado.despensa = []; console.warn(e); }
}

/** Lo que "siempre hay" (preferencias del menú) + la despensa viva, en el formato del planificador */
export function despensaParaPlan() {
  return normalizarDespensa(new Set(estado.ajustes.despensa || []), estado.despensa);
}

export function porVencerHoy() {
  return porVencer(normalizarDespensa(estado.despensa), new Date(), 3);
}

export function venceTexto(caduca) {
  if (!caduca) return null;
  const hoy = hoyISO();
  const dias = Math.round((new Date(`${caduca}T12:00:00`) - new Date(`${hoy}T12:00:00`)) / 86400000);
  if (dias < 0) return { texto: 'venció', clase: 'mal' };
  if (dias === 0) return { texto: 'vence hoy', clase: 'mal' };
  if (dias === 1) return { texto: 'vence mañana', clase: 'pronto' };
  if (dias <= 3) return { texto: `vence en ${dias} días`, clase: 'pronto' };
  return { texto: `hasta el ${new Date(`${caduca}T12:00:00`).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })}`, clase: '' };
}

const UNIDADES = {
  kg: ['g', 1000], kilo: ['g', 1000], kilos: ['g', 1000], g: ['g', 1], gr: ['g', 1], gramos: ['g', 1],
  lb: ['g', 453.59], lbs: ['g', 453.59], libra: ['g', 453.59], libras: ['g', 453.59], oz: ['g', 28.35],
  l: ['ml', 1000], lt: ['ml', 1000], litro: ['ml', 1000], litros: ['ml', 1000], ml: ['ml', 1],
  und: ['und', 1], unidades: ['und', 1], u: ['und', 1],
};

/** "arroz 2 lb" → {nombre:'Arroz', ingrediente:'arroz', cantidad:907.18, unidad:'g'} */
export function parsearCantidad(texto) {
  let t = String(texto || '').trim();
  let cantidad = null;
  let unidad = null;
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?\s*$/) || t.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?\s+/);
  if (m) {
    const n = parseFloat(m[1].replace(',', '.'));
    const u = UNIDADES[(m[2] || '').toLowerCase()];
    if (u) { cantidad = n * u[1]; unidad = u[0]; } else if (!m[2]) { cantidad = n; unidad = 'und'; }
    if (u || !m[2]) t = t.replace(m[0], ' ').trim();
  }
  const ingrediente = buscarIngrediente(t);
  const ing = INGREDIENTES[ingrediente];
  if (ing && unidad && unidad !== ing.unidad) { cantidad = null; unidad = ing.unidad; } // "tomate 4" (unidades) pero va en gramos
  if (ing && !unidad) unidad = ing.unidad;
  return { nombre: t.charAt(0).toUpperCase() + t.slice(1), ingrediente, cantidad: cantidad == null ? null : Math.round(cantidad * 100) / 100, unidad };
}

function caducaDe(ingrediente) {
  const d = INGREDIENTES[ingrediente]?.dura;
  return d ? sumarDias(hoyISO(), d) : null;
}

/** Al marcar como comprado un artículo de la lista */
export async function agregarDesdeItem(item) {
  // artículos de la casa (v5): suben su propio stock, no entran a la despensa de comida
  if (item.articulo_casa) return (await import('../v5/hogar-ui.js')).compraDesdeLista(item);
  const ingrediente = item.ingrediente || buscarIngrediente(item.nombre);
  const ing = INGREDIENTES[ingrediente];
  const op = mejorOpcion(item) || (item.opciones || [])[0];
  let cantidad = null;
  if (ing && op?.contenido && op.unidad === ing.unidad) cantidad = op.contenido * (Number(item.cantidad) || 1);
  else if (ing?.unidad === 'und') cantidad = Number(item.cantidad) || 1;
  await app.D.agregarDespensa({
    ingrediente: ingrediente || null,
    nombre: ing?.nombre || item.nombre,
    cantidad: cantidad == null ? null : Math.round(cantidad * 100) / 100,
    unidad: ing?.unidad || null,
    caduca: caducaDe(ingrediente),
  });
}

/** Al desmarcar: quita lo último que entró con ese nombre */
export async function quitarDesdeItem(item) {
  if (item.articulo_casa) return (await import('../v5/hogar-ui.js')).deshacerCompraDesdeLista(item);
  const ingrediente = item.ingrediente || buscarIngrediente(item.nombre);
  const nombre = INGREDIENTES[ingrediente]?.nombre || item.nombre;
  const fila = [...estado.despensa].reverse().find((d) => d.nombre === nombre);
  if (fila) await app.D.borrarDespensa(fila.id);
}

/**
 * Descuenta de la despensa los ingredientes de una receta cocinada (primero lo que vence antes).
 * Devuelve lo descontado, para poder devolverlo si se desmarca.
 */
export async function consumirReceta(receta, porciones) {
  const f = porciones / receta.porciones;
  const consumos = [];
  for (const [id, cant] of receta.ing) {
    const ing = INGREDIENTES[id];
    if (!ing || ing.basico) continue;
    let falta = cant * f;
    const filas = estado.despensa
      .filter((d) => d.ingrediente === id && d.cantidad != null && d.cantidad > 0)
      .sort((a, b) => String(a.caduca || '9999').localeCompare(String(b.caduca || '9999')));
    for (const d of filas) {
      if (falta <= 0) break;
      const usa = Math.min(d.cantidad, falta);
      falta -= usa;
      d.cantidad = Math.round((d.cantidad - usa) * 100) / 100;
      consumos.push({ ingrediente: id, nombre: d.nombre, cantidad: usa, unidad: d.unidad, caduca: d.caduca });
      if (d.cantidad <= Math.max(0.5, usa * 0.01)) await app.D.borrarDespensa(d.id);
      else await app.D.actualizarDespensa(d.id, { cantidad: d.cantidad });
    }
  }
  await cargarDespensa();
  return consumos;
}

export async function restaurarConsumo(consumos = []) {
  for (const c of consumos) await app.D.agregarDespensa({ ingrediente: c.ingrediente, nombre: c.nombre, cantidad: Math.round(c.cantidad * 100) / 100, unidad: c.unidad, caduca: c.caduca || null });
  await cargarDespensa();
}

const paso = (d) => (d.unidad === 'und' ? 1 : d.unidad === 'ml' ? 250 : d.cantidad >= 1000 ? 250 : 100);

/** Pantalla "En casa" (dentro de la pestaña Lista) */
export function vistaDespensa(cont) {
  const filas = estado.despensa;
  const vencen = filas.filter((d) => ['mal', 'pronto'].includes(venceTexto(d.caduca)?.clase));
  const grupos = PASILLOS.map((p) => [p, filas.filter((d) => pasilloDeArticulo(d.nombre, d.ingrediente) === p)]).filter(([, l]) => l.length);
  const siempre = (estado.ajustes.despensa || []).map((id) => INGREDIENTES[id]?.nombre).filter(Boolean);
  cont.innerHTML = `
    <form class="agregar" id="f-desp" autocomplete="off">
      <input name="q" placeholder="Agregar a la casa… ej. arroz 2 lb" aria-label="Agregar a la despensa">
      <button class="btn-primario" aria-label="Agregar">+</button>
    </form>
    ${vencen.length ? `<div class="banda-vence">🥬 Úsalo pronto: ${vencen.map((d) => `<b>${esc(d.nombre)}</b> (${esc(venceTexto(d.caduca).texto)})`).join(', ')}.
      <a href="#menu">El menú ya lo toma en cuenta →</a></div>` : ''}
    ${grupos.length ? grupos.map(([p, l]) => `
      <h2 class="titulo">${esc(p)}</h2>
      <div class="tarjeta">${l.map((d) => {
        const v = venceTexto(d.caduca);
        return `<div class="fila-desp" data-id="${d.id}">
          <div class="info">
            <div class="n">${esc(d.nombre)}</div>
            <div class="sub">${d.cantidad == null ? 'hay' : esc(cantidadTexto(d.cantidad, d.unidad || 'und'))}${v ? ` · <span class="vence ${v.clase}">${esc(v.texto)}</span>` : ''}</div>
          </div>
          ${d.cantidad != null ? `<button class="mini" data-accion="menos" aria-label="Menos">−</button><button class="mini" data-accion="mas" aria-label="Más">+</button>` : ''}
          <button class="mas" data-accion="borrar" aria-label="Ya no hay">×</button>
        </div>`;
      }).join('')}</div>`).join('')
    : `<div class="vacio tarjeta"><b>No hay nada anotado en casa</b>Lo que marques como comprado en la lista entra aquí solo. El menú lo usa para no hacerte comprar de más.</div>`}
    ${siempre.length ? `<p class="sub" style="margin:12px 4px">Siempre hay (preferencias del menú): ${siempre.map(esc).join(', ')}.</p>` : ''}`;

  $('#f-desp', cont).onsubmit = async (ev) => {
    ev.preventDefault();
    const texto = ev.target.q.value.trim();
    if (!texto) return;
    const p = parsearCantidad(texto);
    ev.target.q.value = '';
    try {
      await app.D.agregarDespensa({ ingrediente: p.ingrediente, nombre: INGREDIENTES[p.ingrediente]?.nombre || p.nombre, cantidad: p.cantidad, unidad: p.unidad, caduca: caducaDe(p.ingrediente) });
      await cargarDespensa();
      estado.menuCargado = false;
      app.render();
    } catch (e) { errorAviso(e); }
  };
  $$('.fila-desp', cont).forEach((el) => {
    const d = filas.find((x) => String(x.id) === el.dataset.id);
    $$('[data-accion]', el).forEach((b) => (b.onclick = async () => {
      try {
        if (b.dataset.accion === 'borrar') await app.D.borrarDespensa(d.id);
        else {
          const n = Math.max(0, d.cantidad + (b.dataset.accion === 'mas' ? 1 : -1) * paso(d));
          if (n <= 0) await app.D.borrarDespensa(d.id);
          else await app.D.actualizarDespensa(d.id, { cantidad: n });
        }
        await cargarDespensa();
        estado.menuCargado = false;
        app.render();
      } catch (e) { errorAviso(e); }
    }));
  });
}

export function avisoEntro(item) {
  if (item.articulo_casa) return aviso(`${item.nombre}: anotado en Casa`);
  aviso(`${item.nombre} pasó a "En casa"`);
}
