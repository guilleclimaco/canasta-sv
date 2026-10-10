// Precios fuera del súper en la app: sondeo de mercados de la Defensoría y Agromercados del MAG.
import { $, $$, estado, app, esc, dinero, mejorOpcion, abrirHoja, cerrarHoja, aviso, errorAviso, hoyISO } from '../nucleo.js';
import { INGREDIENTES, buscarIngrediente } from '../menu/ingredientes.js';
import { preciosMercado, preciosAgromercado, combinarMercados, precioUnitarioAgro, textoAgro, GRAMOS_POR_UNIDAD, INGREDIENTES_AGROMERCADO } from '../menu/mercado.js';

export async function cargarMercado({ forzar = false } = {}) {
  if (estado.mercado && !forzar) return estado.mercado;
  const [defensoria, agro] = await Promise.all([
    app.D.preciosMercado().catch((e) => { console.warn('Sin sondeo de mercados', e); return []; }),
    app.D.preciosAgromercado ? app.D.preciosAgromercado().catch((e) => { console.warn('Sin precios del agromercado', e); return []; }) : [],
  ]);
  estado.agromercado = agro;
  estado.mercado = combinarMercados(preciosMercado(defensoria, INGREDIENTES), preciosAgromercado(agro, INGREDIENTES));
  return estado.mercado;
}

export const fechaMercado = () => [...(estado.mercado?.values() || [])].map((v) => v.fecha).sort().at(-1) || null;
const nombreOrigen = (o) => (o === 'agromercado' ? 'Agromercado' : 'Mercado');

/** Cuánto costaría en el mercado o agromercado la misma cantidad que un producto del súper */
export function costoEnMercado(ingrediente, cantidadBase) {
  const m = estado.mercado?.get(ingrediente);
  return m ? m.precioUnit * cantidadBase : null;
}

/**
 * Artículos de la lista que salen bastante más baratos en el mercado o el agromercado (≥ 15 %).
 * @returns {Array<{item, super, mercado, ahorro, fuente, origen}>}
 */
export function masBaratoEnMercado(items) {
  const out = [];
  for (const item of items) {
    if (item.comprado) continue;
    const ing = item.ingrediente || buscarIngrediente(item.nombre);
    const op = mejorOpcion(item);
    if (!ing || !op?.contenido || op.unidad !== INGREDIENTES[ing]?.unidad) continue;
    const base = op.contenido * (Number(item.cantidad) || 1);
    const enMercado = costoEnMercado(ing, base);
    const enSuper = op.precio * (Number(item.cantidad) || 1);
    if (enMercado != null && enMercado < enSuper * 0.85) {
      const m = estado.mercado.get(ing);
      out.push({ item, super: enSuper, mercado: enMercado, ahorro: enSuper - enMercado, fuente: m.producto, origen: m.origen });
    }
  }
  return out.sort((a, b) => b.ahorro - a.ahorro);
}

/** Texto bajo la banda de "sale más barato": de dónde vienen los precios */
export function notaMercado(lista) {
  const origenes = new Set(lista.map((x) => x.origen));
  const partes = [];
  if (origenes.has('agromercado')) partes.push('Agromercados del MAG (precios anotados)');
  if (origenes.has('defensoria')) partes.push('sondeo de la Defensoría');
  return `Según ${partes.join(' y ')}.`;
}

/** Etiqueta para las compras del menú */
export function chipMercado(compra) {
  if (!compra.producto || !estado.mercado?.has(compra.ingId)) return '';
  const enMercado = costoEnMercado(compra.ingId, compra.paquetes * compra.producto.contenido);
  if (enMercado == null || enMercado >= compra.costo * 0.85) return '';
  const m = estado.mercado.get(compra.ingId);
  return `<span class="chip-mercado" title="${esc(m.producto)}">🧺 ${nombreOrigen(m.origen)} ~${esc(dinero(enMercado))}</span>`;
}

// ---------------------------------------------------------------- hoja: precios del Agromercado
const dias = (iso) => Math.round((new Date(`${hoyISO()}T12:00:00`) - new Date(`${String(iso).slice(0, 10)}T12:00:00`)) / 864e5);

/** Lista de precios del Agromercado: ver, corregir y agregar ("20 tomates grandes por $1") */
export function hojaAgromercado() {
  const h = abrirHoja(`
    <h3>Precios del Agromercado</h3>
    <p class="sub" style="margin:-6px 0 10px">El MAG publica la lista en sus redes (Facebook, Instagram, X). Anótala aquí tal cual viene: "20 tomates grandes por $1".
      La app la compara con el súper. La ven y la corrigen los dos hogares.</p>
    <div class="cuerpo" id="agro-lista"><div class="cargando" style="min-height:100px"><div class="giro"></div></div></div>
    <div class="pie"><button class="btn-secundario" id="agro-cerrar">Cerrar</button><button class="btn-primario" id="agro-nuevo">Agregar precio</button></div>`);
  $('#agro-cerrar', h).onclick = cerrarHoja;
  $('#agro-nuevo', h).onclick = () => formulario(h, null);
  pintarLista(h);
}

async function pintarLista(h) {
  const cont = $('#agro-lista', h);
  let filas = [];
  try { filas = await app.D.preciosAgromercado(); } catch (e) { cont.innerHTML = ''; return errorAviso(e); }
  estado.agromercado = filas;
  cont.innerHTML = filas.length ? `<div class="tarjeta">${filas.map((f) => {
    const pu = precioUnitarioAgro(f, INGREDIENTES);
    const ing = INGREDIENTES[f.ingrediente];
    const ref = !pu ? '' : ing.unidad === 'g' ? `${dinero(pu.precioUnit * 453.59)}/lb` : `${dinero(pu.precioUnit)} c/u`;
    const viejo = dias(f.fecha) > 30;
    return `<button class="fila-agro" data-id="${f.id}">
      <span class="n">${esc(f.descripcion)} <span class="unit">· ${esc(textoAgro(f))}</span></span>
      <span class="sub">${ref ? `<b class="precio">${esc(ref)}</b> · ` : ''}<span class="${viejo ? 'vence pronto' : ''}">${viejo ? '⚠ ' : ''}${esc(new Date(`${String(f.fecha).slice(0, 10)}T12:00:00`).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' }))}</span></span>
    </button>`;
  }).join('')}</div>
    <p class="unit" style="margin:8px 4px">⚠ = precio de hace más de un mes: conviene revisarlo con la lista nueva del MAG.</p>`
    : '<div class="vacio">Todavía no hay precios. Toca <b>Agregar precio</b>.</div>';
  $$('.fila-agro', cont).forEach((b) => (b.onclick = () => formulario(h, filas.find((f) => String(f.id) === b.dataset.id))));
}

function formulario(h, fila) {
  const cont = $('#agro-lista', h);
  const f = fila || { ingrediente: 'tomate', descripcion: '', cantidad: '', unidad: 'und', precio: '', gramos_unidad: '' };
  const opciones = [...new Set([...INGREDIENTES_AGROMERCADO, f.ingrediente])].filter((id) => INGREDIENTES[id])
    .map((id) => `<option value="${id}" ${id === f.ingrediente ? 'selected' : ''}>${esc(INGREDIENTES[id].nombre)}</option>`).join('');
  cont.innerHTML = `
    <label class="campo">¿Qué es?<select id="a-ing">${opciones}</select></label>
    <label class="campo">Como lo dice el MAG<input id="a-desc" value="${esc(f.descripcion)}" placeholder="Ej. Tomate grande"></label>
    <div class="dos">
      <label class="campo">Cantidad<input id="a-cant" type="number" inputmode="decimal" min="0" step="0.5" value="${esc(f.cantidad)}" placeholder="20"></label>
      <label class="campo">Se cuenta en<select id="a-uni">
        <option value="und" ${f.unidad === 'und' ? 'selected' : ''}>unidades</option>
        <option value="lb" ${f.unidad === 'lb' ? 'selected' : ''}>libras</option>
        <option value="oz" ${f.unidad === 'oz' ? 'selected' : ''}>onzas</option></select></label>
    </div>
    <label class="campo">Por cuánto ($)<input id="a-precio" type="number" inputmode="decimal" min="0" step="0.05" value="${esc(f.precio)}" placeholder="1.00"></label>
    <label class="campo" id="a-g-campo">Cuánto pesa cada uno (gramos, aprox.)<input id="a-g" type="number" inputmode="decimal" min="0" step="10" value="${esc(f.gramos_unidad || '')}"></label>
    <p class="sub" id="a-calc"></p>
    <div style="display:flex;gap:10px;margin-top:8px">
      ${fila ? '<button class="btn-secundario peligro" id="a-borrar" style="flex:1">Borrar</button>' : ''}
      <button class="btn-secundario" id="a-volver" style="flex:1">Volver</button>
      <button class="btn-primario" id="a-guardar" style="flex:1">Guardar</button>
    </div>`;
  const leer = () => ({ ...(fila || {}), ingrediente: $('#a-ing', cont).value, descripcion: $('#a-desc', cont).value.trim() || INGREDIENTES[$('#a-ing', cont).value].nombre,
    cantidad: Number($('#a-cant', cont).value), unidad: $('#a-uni', cont).value, precio: Number($('#a-precio', cont).value),
    gramos_unidad: Number($('#a-g', cont).value) || null, fecha: hoyISO() });
  const calcular = () => {
    const d = leer();
    const ing = INGREDIENTES[d.ingrediente];
    // el peso por unidad solo hace falta si se vende por unidad y la receta lo mide en gramos
    $('#a-g-campo', cont).style.display = d.unidad === 'und' && ing.unidad === 'g' ? '' : 'none';
    if (d.unidad === 'und' && ing.unidad === 'g' && !$('#a-g', cont).value) $('#a-g', cont).placeholder = GRAMOS_POR_UNIDAD[d.ingrediente] || '';
    const pu = precioUnitarioAgro(d, INGREDIENTES);
    $('#a-calc', cont).textContent = !pu ? 'Llena cantidad y precio para ver cuánto sale.'
      : ing.unidad === 'g' ? `Sale a ${dinero(pu.precioUnit * 453.59)} la libra.` : `Sale a ${dinero(pu.precioUnit)} cada uno.`;
  };
  $$('input, select', cont).forEach((el) => (el.oninput = calcular));
  calcular();
  $('#a-volver', cont).onclick = () => pintarLista(h);
  $('#a-borrar', cont)?.addEventListener('click', async () => {
    try { await app.D.borrarPrecioAgromercado(fila.id); await cargarMercado({ forzar: true }); pintarLista(h); } catch (e) { errorAviso(e); }
  });
  $('#a-guardar', cont).onclick = async () => {
    const d = leer();
    if (!(d.cantidad > 0) || !(d.precio > 0)) return aviso('Pon cantidad y precio.');
    try {
      await app.D.guardarPrecioAgromercado(d);
      await cargarMercado({ forzar: true });
      aviso('Precio del Agromercado guardado');
      pintarLista(h);
      app.render?.();
    } catch (e) { errorAviso(e); }
  };
}
