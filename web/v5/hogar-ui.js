// Pestaña "Hogar": artículos de cuidado personal y limpieza que se compran por NECESIDAD.
// La app estima cuánto queda de cada cosa, dice qué llevar en la próxima compra, cuánto, de qué tienda
// y cuándo conviene abastecerse por una oferta. Todo entra a la misma Lista.
import { $, $$, esc, dinero, estado, app, abrirHoja, cerrarHoja, aviso, errorAviso, chip, tiendasActivas, tiendaCorta, round2, mejorOpcion } from '../nucleo.js';
import { ARTICULOS_HOGAR, CATEGORIAS_HOGAR, terminosHogar, usuariosDe, consumoInicial } from '../hogar/catalogo.js';
import {
  CONFIG_HOGAR, planHogar, recomendar, registrarCompra, reportarStock, stockEstimado, diasRestantes, textoDias, textoConsumo,
  terminosConMarca, normal, productoValidoHogar,
} from '../hogar/necesidades.js';
import { cantidadTexto } from '../menu/planificador.js';

const NOMBRE_CAT = Object.fromEntries(CATEGORIAS_HOGAR);
const CAT_LISTA = { personal: 'Cuidado personal', limpieza: 'Limpieza' };
const QUEDA = [['0', 'Nada'], ['0.25', 'Poquito'], ['0.5', 'La mitad'], ['1', 'Lleno'], ['2', 'Lleno + 1 guardado']];

export const configHogar = () => ({ ...CONFIG_HOGAR, ...(estado.ajustes.hogar_config || {}) });
const tamPaquete = (a) => ARTICULOS_HOGAR[a.catalogo]?.paquete || 1;
const cant = (n, u) => cantidadTexto(n, u || 'und').replace(/ \(.*\)$/, '');

export async function cargarHogar({ forzar = false } = {}) {
  if (estado.hogarCargado && !forzar) return;
  estado.hogar = await app.D.hogarArticulos();
  const terminos = [...terminosHogar(), ...terminosConMarca(estado.hogar)];
  estado.hogarCands = await app.D.candidatosHogar(terminos).catch(() => []);
  estado.hogarCargado = true;
}

export function planActualHogar() {
  return planHogar(estado.hogar || [], estado.hogarCands || [], { ...configHogar(), tiendas: tiendasActivas() });
}

/** Producto elegido + equivalentes en otras tiendas (parecido tamaño), para que "Comprar" compare */
function productosParaLista(rec) {
  if (!rec.producto) return [];
  const ids = new Set([rec.producto.id]);
  const porTienda = new Map();
  for (const p of rec.opciones) {
    if (rec.producto.ean && p.ean === rec.producto.ean) { ids.add(p.id); continue; }
    const parecido = Math.abs(p.contenido - rec.producto.contenido) / rec.producto.contenido <= 0.4;
    if (parecido && p.tienda !== rec.producto.tienda && !porTienda.has(p.tienda)) porTienda.set(p.tienda, p.id);
  }
  porTienda.forEach((id) => ids.add(id));
  return [...ids];
}

const enLista = (art) => estado.lista.some((i) => !i.comprado && i.articulo_casa === art.id);

async function agregarALista(recs) {
  let n = 0;
  for (const r of recs) {
    if (enLista(r.art)) continue;
    // si ya lo habías anotado a mano ("papel higiénico"), se liga ese en vez de duplicarlo
    const aMano = estado.lista.find((i) => !i.comprado && !i.articulo_casa && normal(i.nombre) === normal(r.art.nombre));
    if (aMano) {
      const cambios = { articulo_casa: r.art.id, categoria: CAT_LISTA[r.art.categoria] || 'Limpieza' };
      if (!(aMano.productos || []).length) Object.assign(cambios, { productos: productosParaLista(r), cantidad: Math.max(1, r.paquetes || 1) });
      await app.D.actualizarItem(aMano.id, cambios);
      n++;
      continue;
    }
    await app.D.agregarItem({
      nombre: r.art.marca ? `${r.art.nombre} ${r.art.marca}` : r.art.nombre,
      cantidad: Math.max(1, r.paquetes || 1),
      categoria: CAT_LISTA[r.art.categoria] || 'Limpieza',
      productos: productosParaLista(r),
      articulo_casa: r.art.id,
    });
    n++;
  }
  await app.cargarLista();
  return n;
}

// ---------------------------------------------------------------- vista principal
export async function vistaHogar(v) {
  if (!estado.hogarCargado) v.innerHTML = '<div class="cargando"><div class="giro"></div></div>';
  try { await cargarHogar(); } catch (e) { return errorAviso(e); }
  if (estado.tab !== 'hogar') return;
  if (!estado.hogar.length) return configuracionInicial(v);

  const cfg = configHogar();
  const plan = planActualHogar();
  const llevar = [...plan.comprarYa, ...plan.pronto, ...plan.ofertas];
  const faltan = llevar.filter((r) => !enLista(r.art));
  const fila = (r) => {
    const a = r.art;
    const u = a.unidad;
    const desc = r.oferta ? `<span class="badge">−${r.oferta.pct}%</span>` : '';
    const queLlevar = r.motivo
      ? (r.producto
        ? `<div class="sub llevar">Lleva ${r.paquetes > 1 ? `${r.paquetes} × ` : ''}${esc(r.producto.nombre)} ${chip(r.producto.tienda)} <b class="precio">${dinero(r.costo)}</b> ${desc}</div>`
        : `<div class="sub llevar">Lleva ~${esc(cant(r.necesidad, u))} <span class="unit">(precio estimado ${dinero(r.costo)})</span></div>`)
      : '';
    const pct = Math.min(100, (r.dias / Math.max(cfg.horizonte * 2, 30)) * 100);
    return `<button class="hogar-item est-${r.estado}" data-id="${a.id}">
      <span class="punto"></span>
      <span class="info">
        <span class="n">${esc(a.nombre)}${a.marca ? ` <span class="unit">· ${esc(a.marca)}</span>` : ''}${enLista(a) ? ' <span class="tag">en la lista</span>' : ''}</span>
        <span class="sub">${r.estado === 'agotado' ? '<b class="mal">Se acabó</b>' : `Te queda para ${esc(textoDias(r.dias))}`}${r.oferta ? ` · <span class="ok">con la oferta tienes para ${esc(textoDias(r.oferta.meses * 30))}</span>` : ''}</span>
        <span class="medidor-mini"><i style="width:${pct}%"></i></span>
        ${queLlevar}
      </span>
    </button>`;
  };
  const seccion = (titulo, recs, nota = '') => (recs.length ? `<h2 class="titulo">${titulo}</h2>${nota}<div class="tarjeta">${recs.map(fila).join('')}</div>` : '');

  v.innerHTML = `
    <section class="tarjeta reco" style="margin-top:8px">
      <div class="eti">Para tu próxima compra (cada ${cfg.horizonte} días)</div>
      <div class="monto precio">${dinero(plan.totalCompra)}</div>
      <div class="razon">${llevar.length ? `${llevar.length} artículo${llevar.length === 1 ? '' : 's'} de la casa` : 'No hace falta nada por ahora 🎉'}</div>
      ${plan.ahorroOfertas > 0.009 ? `<span class="ahorro">Aprovechando ofertas ahorras ${dinero(plan.ahorroOfertas)}</span>` : ''}
    </section>
    ${faltan.length ? `<button class="btn-primario" id="a-lista" style="width:100%;margin-top:12px">Agregar ${faltan.length} a la lista</button>` : ''}
    ${seccion('<span class="punto-est est-agotado"></span>Comprar ya', plan.comprarYa)}
    ${seccion('<span class="punto-est est-pronto"></span>Para la próxima compra', plan.pronto)}
    ${seccion('🏷️ Aprovecha la oferta', plan.ofertas, '<p class="sub" style="margin:-4px 4px 8px">No se te acaba todavía, pero está con descuento y no te sobra.</p>')}
    ${plan.bien.length ? `<details class="bien"><summary class="titulo"><span class="punto-est est-ok"></span>Todo bien (${plan.bien.length})</summary><div class="tarjeta">${plan.bien.map(fila).join('')}</div></details>` : ''}
    <p class="sub" style="margin:14px 4px">Tu casa gasta ~<b>${dinero(plan.gastoMensual)}</b> al mes en estos artículos. Los precios son los mejores de tus tiendas.</p>
    <div style="display:flex;gap:10px">
      <button class="btn-secundario" style="flex:1" id="agregar-art">+ Agregar artículo</button>
      <button class="btn-secundario" style="flex:1" id="ajustes-hogar">Ajustes</button>
    </div>`;

  $('#a-lista', v)?.addEventListener('click', async (ev) => {
    ev.currentTarget.disabled = true;
    try {
      const n = await agregarALista(faltan);
      aviso(`${n} artículo${n === 1 ? '' : 's'} agregado${n === 1 ? '' : 's'} a la lista. "Comprar" te dice dónde.`);
      app.render();
    } catch (e) { errorAviso(e); }
  });
  $$('.hogar-item', v).forEach((b) => (b.onclick = () => hojaArticulo(Number(b.dataset.id))));
  $('#agregar-art', v).onclick = hojaAgregarArticulo;
  $('#ajustes-hogar', v).onclick = hojaAjustesHogar;
}

// ---------------------------------------------------------------- configuración inicial
function configuracionInicial(v) {
  const perfil = estado.ajustes.perfil_menu || {};
  const casa = { adultos: perfil.adultos || 2, ninos: perfil.ninos || 0 };
  const sel = new Set(Object.entries(ARTICULOS_HOGAR).filter(([, a]) => a.porDefecto).map(([k]) => k));
  const queda = {};
  let horizonte = 15;
  const pintar = () => {
    v.innerHTML = `
      <section class="intro"><h2>Lo que se usa en la casa</h2>
        <p>Pasta dental, jabón, detergente, cloro… La app calcula cuándo se te acaba cada cosa, qué llevar en la próxima compra, de qué tienda y cuándo conviene comprar de más porque está en oferta.</p></section>
      <div class="tarjeta paso">
        <h4>¿Cuántos son en la casa?</h4>
        <div class="dos">
          <div class="campo">Adultos<div class="stepper"><button type="button" data-p="adultos:-1">−</button><b>${casa.adultos}</b><button type="button" data-p="adultos:1">+</button></div></div>
          <div class="campo">Niños<div class="stepper"><button type="button" data-p="ninos:-1">−</button><b>${casa.ninos}</b><button type="button" data-p="ninos:1">+</button></div></div>
        </div>
        <h4>¿Cada cuánto haces la compra grande?</h4>
        <div class="chips">${[[7, 'Cada semana'], [15, 'Cada quincena'], [30, 'Cada mes']].map(([d, t]) => `<button type="button" class="filtro" data-h="${d}" aria-pressed="${d === horizonte}">${t}</button>`).join('')}</div>
        ${CATEGORIAS_HOGAR.map(([c, t]) => `
          <h4>${esc(t)}: ¿qué usan?</h4>
          <div class="chips">${Object.entries(ARTICULOS_HOGAR).filter(([, a]) => a.categoria === c).map(([k, a]) => `<button type="button" class="filtro" data-k="${k}" aria-pressed="${sel.has(k)}">${esc(a.nombre)}</button>`).join('')}</div>`).join('')}
        <h4>¿Cuánto te queda de cada cosa?</h4>
        <p class="unit" style="margin:-4px 0 8px">Más o menos está bien; la app se va corrigiendo sola.</p>
        <div class="tabla-queda">${[...sel].map((k) => `
          <div class="fila-queda"><span>${esc(ARTICULOS_HOGAR[k].nombre)}</span>
            <select data-q="${k}">${QUEDA.map(([vq, t]) => `<option value="${vq}" ${String(queda[k] ?? '0.5') === vq ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`).join('')}</div>
      </div>
      <button class="btn-primario" id="crear" style="width:100%;margin-top:14px">Listo</button>`;
    $$('[data-p]', v).forEach((b) => (b.onclick = () => {
      const [k, d] = b.dataset.p.split(':');
      casa[k] = Math.max(k === 'adultos' ? 1 : 0, Math.min(12, casa[k] + Number(d)));
      pintar();
    }));
    $$('[data-h]', v).forEach((b) => (b.onclick = () => { horizonte = Number(b.dataset.h); pintar(); }));
    $$('[data-k]', v).forEach((b) => (b.onclick = () => { sel.has(b.dataset.k) ? sel.delete(b.dataset.k) : sel.add(b.dataset.k); pintar(); }));
    $$('[data-q]', v).forEach((s) => (s.onchange = () => { queda[s.dataset.q] = s.value; }));
    $('#crear', v).onclick = async (ev) => {
      if (!sel.size) return aviso('Elige al menos un artículo.');
      ev.currentTarget.disabled = true;
      const ahora = new Date().toISOString();
      try {
        const filas = [...sel].map((k) => {
          const a = ARTICULOS_HOGAR[k];
          const usuarios = usuariosDe(k, casa);
          const stock = round2(Number(queda[k] ?? 0.5) * a.paquete);
          return {
            catalogo: k, nombre: a.nombre, categoria: a.categoria, unidad: a.unidad, usuarios,
            consumo_mes: consumoInicial(k, usuarios), stock, stock_fecha: ahora, ref_stock: stock, ref_fecha: ahora, compras_desde: 0,
          };
        });
        await app.D.crearHogarArticulos(filas);
        const cfg = { ...configHogar(), horizonte, casa };
        await app.D.guardarAjuste('hogar_config', cfg);
        estado.ajustes.hogar_config = cfg;
        await cargarHogar({ forzar: true });
        app.render();
      } catch (e) { ev.currentTarget.disabled = false; errorAviso(e); }
    };
  };
  pintar();
}

// ---------------------------------------------------------------- detalle de un artículo
async function hojaArticulo(id) {
  const a = estado.hogar.find((x) => x.id === id);
  if (!a) return;
  const cfg = configHogar();
  const r = recomendar(a, estado.hogarCands, { ...cfg, tiendas: tiendasActivas() });
  const u = a.unidad;
  const paq = tamPaquete(a);
  const prodCompra = r.producto || r.opciones[0] || null;
  let paquetes = Math.max(1, r.paquetes || 1);
  const h = abrirHoja(`
    <h3>${esc(a.nombre)}</h3>
    <p class="sub" style="margin:-6px 0 10px">${esc(NOMBRE_CAT[a.categoria] || '')} · ${esc(textoConsumo(a) || `gastan ~${cant(a.consumo_mes, u)} al mes`)}</p>
    <div class="cuerpo">
      <div class="estado-art est-${r.estado}">
        <b>${r.estado === 'agotado' ? 'Se acabó' : `Te queda ~${esc(cant(r.stockEst, u))}`}</b>
        <span class="sub">${r.estado === 'agotado' ? 'Hay que comprar.' : `alcanza para ${esc(textoDias(r.dias))}`}</span>
      </div>

      <h4>¿Cuánto te queda en realidad?</h4>
      <div class="chips" id="queda">${QUEDA.map(([vq, t]) => `<button type="button" class="filtro" data-q="${vq}">${t}</button>`).join('')}</div>
      <p class="unit" style="margin:4px 0 0">En paquetes de ${esc(cant(paq, u))}. Con esto la app aprende cuánto gastan de verdad.</p>

      <h4>Ya compré</h4>
      ${prodCompra ? `<label class="campo">Producto<select id="prod">${r.opciones.slice(0, 8).map((p) => `<option value="${p.id}" ${p.id === prodCompra.id ? 'selected' : ''}>${esc(p.nombre)} · ${esc(tiendaCorta(p.tienda))} · ${dinero(p.precio)}</option>`).join('')}</select></label>` : ''}
      <div class="campo">¿Cuántos${prodCompra ? '' : ` paquetes de ${esc(cant(paq, u))}`}?
        <div class="stepper"><button type="button" id="menos">−</button><b id="n">${paquetes}</b><button type="button" id="mas">+</button></div>
      </div>
      <button type="button" class="btn-primario" id="compre" style="width:100%">Ya lo compré</button>

      ${r.opciones.length ? `<h4>Dónde sale más barato</h4>
      <div class="tarjeta">${r.opciones.slice(0, 5).map((p) => `<div class="linea opcion-hogar"><span class="n">${chip(p.tienda)} ${esc(p.nombre)}${p.precio_lista > p.precio ? ` <span class="badge">−${Math.round(100 * (1 - p.precio / p.precio_lista))}%</span>` : ''}</span>
        <span class="precio">${dinero(p.precio)} <span class="unit">${dinero((p.precio / p.contenido) * (u === 'und' ? 1 : 100))}/${u === 'und' ? 'u' : `100 ${u}`}</span></span></div>`).join('')}</div>`
      : '<p class="sub">Todavía no hay precios de este artículo; el robot los trae en la próxima corrida.</p>'}

      <h4>Preferencias</h4>
      <label class="campo">Marca preferida (vacío = la más barata)<input id="marca" value="${esc(a.marca || '')}" placeholder="ej. Colgate"></label>
      <div class="campo">Personas que lo usan
        <div class="stepper"><button type="button" id="u-menos">−</button><b id="u">${a.usuarios ?? usuariosDe(a.catalogo, cfg.casa)}</b><button type="button" id="u-mas">+</button></div></div>
      <div id="historial-art" class="sub"></div>
      <button class="btn-texto peligro" id="dejar">Ya no lo usamos</button>
    </div>
    <div class="pie"><button class="btn-primario" id="guardar">Guardar preferencias</button></div>`);

  // historial
  app.D.movimientosHogar(a.id).then((ms) => {
    const c = ms.filter((m) => m.tipo === 'compra').slice(0, 5);
    if (c.length) $('#historial-art', h).innerHTML = `<b>Últimas compras:</b> ${c.map((m) => `${new Date(m.fecha).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })} (${esc(cant(m.cantidad, u))}${m.precio ? `, ${dinero(m.precio)}` : ''})`).join(' · ')}`;
  }).catch(() => {});

  const recargar = async () => { await cargarHogar({ forzar: true }); app.render(); };
  $$('#queda [data-q]', h).forEach((b) => (b.onclick = async () => {
    try {
      const reportado = Number(b.dataset.q) * paq;
      const { patch, observado } = reportarStock(a, reportado, new Date());
      await app.D.actualizarHogarArticulo(a.id, patch);
      await app.D.movimientoHogar({ articulo_id: a.id, tipo: 'reporte', cantidad: reportado });
      cerrarHoja();
      aviso(observado != null ? `Anotado. Aprendí: gastan ~${cant(patch.consumo_mes, u)} al mes.` : 'Anotado.');
      await recargar();
    } catch (e) { errorAviso(e); }
  }));
  const pintarN = () => ($('#n', h).textContent = paquetes);
  $('#menos', h).onclick = () => { paquetes = Math.max(1, paquetes - 1); pintarN(); };
  $('#mas', h).onclick = () => { paquetes += 1; pintarN(); };
  $('#compre', h).onclick = async () => {
    const p = prodCompra ? r.opciones.find((x) => String(x.id) === $('#prod', h).value) : null;
    const cantidad = (p?.contenido || paq) * paquetes;
    // si estaba en la lista, se marca comprado (y la compra queda ligada, por si se desmarca)
    const enLaLista = estado.lista.find((i) => !i.comprado && i.articulo_casa === a.id);
    try {
      await app.D.actualizarHogarArticulo(a.id, registrarCompra(a, cantidad, new Date()));
      await app.D.movimientoHogar({ articulo_id: a.id, tipo: 'compra', cantidad, precio: p ? round2(p.precio * paquetes) : null, tienda: p?.tienda || null, producto_id: p?.id || null, lista_id: enLaLista?.id || null });
      if (enLaLista) { await app.D.actualizarItem(enLaLista.id, { comprado: true }); await app.cargarLista(); }
      cerrarHoja();
      aviso(`${a.nombre}: ahora tienes para ${textoDias(diasRestantes({ ...a, ...registrarCompra(a, cantidad, new Date()) }))}`);
      await recargar();
    } catch (e) { errorAviso(e); }
  };
  let usuarios = Number(a.usuarios ?? usuariosDe(a.catalogo, cfg.casa));
  const pintarU = () => ($('#u', h).textContent = usuarios);
  $('#u-menos', h).onclick = () => { usuarios = Math.max(0.5, usuarios - 1); pintarU(); };
  $('#u-mas', h).onclick = () => { usuarios += 1; pintarU(); };
  $('#dejar', h).onclick = async () => {
    try { await app.D.actualizarHogarArticulo(a.id, { activo: false }); cerrarHoja(); aviso(`${a.nombre} ya no se sigue`); await recargar(); } catch (e) { errorAviso(e); }
  };
  $('#guardar', h).onclick = async () => {
    const marca = $('#marca', h).value.trim() || null;
    const viejos = Number(a.usuarios ?? usuariosDe(a.catalogo, cfg.casa)) || 1;
    const cambios = { marca };
    if (usuarios !== viejos) {
      cambios.usuarios = usuarios;
      // el consumo por persona se mantiene; la parte fija de la casa no cambia
      const fijo = ARTICULOS_HOGAR[a.catalogo]?.consumo?.hogar || 0;
      cambios.consumo_mes = round2(fijo + Math.max(0, a.consumo_mes - fijo) * (usuarios / viejos));
    }
    try {
      await app.D.actualizarHogarArticulo(a.id, cambios);
      if (marca) await app.D.agregarTerminos([normal(`${ARTICULOS_HOGAR[a.catalogo]?.terminos[0] || a.nombre} ${marca}`)]);
      cerrarHoja();
      await recargar();
    } catch (e) { errorAviso(e); }
  };
}

// ---------------------------------------------------------------- agregar artículos
function hojaAgregarArticulo() {
  const activos = new Set(estado.hogar.filter((a) => a.activo !== false).map((a) => a.catalogo));
  const inactivos = estado.hogar.filter((a) => a.activo === false);
  const cfg = configHogar();
  const h = abrirHoja(`
    <h3>Agregar artículo</h3>
    <div class="cuerpo">
      ${CATEGORIAS_HOGAR.map(([c, t]) => `<h4>${esc(t)}</h4><div class="chips">${Object.entries(ARTICULOS_HOGAR)
        .filter(([k, a]) => a.categoria === c && !activos.has(k))
        .map(([k, a]) => `<button type="button" class="filtro" data-k="${k}">${esc(a.nombre)}</button>`).join('') || '<span class="sub">Ya están todos.</span>'}</div>`).join('')}
      <h4>Otro que no está en la lista</h4>
      <div class="dos">
        <label class="campo">Nombre<input id="otro-n" placeholder="ej. Talco"></label>
        <label class="campo">Se mide en<select id="otro-u"><option value="und">unidades</option><option value="ml">ml</option><option value="g">gramos</option></select></label>
      </div>
      <div class="dos">
        <label class="campo">Categoría<select id="otro-c">${CATEGORIAS_HOGAR.map(([c, t]) => `<option value="${c}">${t}</option>`).join('')}</select></label>
        <label class="campo">Gastan al mes (aprox.)<input id="otro-m" type="number" inputmode="decimal" placeholder="ej. 200"></label>
      </div>
      <button class="btn-secundario" id="otro-ok" style="width:100%">Agregar este</button>
    </div>`);
  const crear = async (fila) => {
    const ahora = new Date().toISOString();
    await app.D.crearHogarArticulos([{ stock: 0, stock_fecha: ahora, ref_stock: 0, ref_fecha: ahora, compras_desde: 0, ...fila }]);
    cerrarHoja();
    aviso(`${fila.nombre} agregado. Toca el artículo para decir cuánto te queda.`);
    await cargarHogar({ forzar: true });
    app.render();
  };
  $$('[data-k]', h).forEach((b) => (b.onclick = async () => {
    const k = b.dataset.k;
    const a = ARTICULOS_HOGAR[k];
    const previo = inactivos.find((x) => x.catalogo === k);
    try {
      if (previo) { await app.D.actualizarHogarArticulo(previo.id, { activo: true }); cerrarHoja(); await cargarHogar({ forzar: true }); app.render(); return; }
      const usuarios = usuariosDe(k, cfg.casa);
      await crear({ catalogo: k, nombre: a.nombre, categoria: a.categoria, unidad: a.unidad, usuarios, consumo_mes: consumoInicial(k, usuarios) });
    } catch (e) { errorAviso(e); }
  }));
  $('#otro-ok', h).onclick = async () => {
    const nombre = $('#otro-n', h).value.trim();
    const consumo = Number($('#otro-m', h).value);
    if (!nombre || !consumo) return aviso('Pon el nombre y cuánto gastan al mes.');
    try {
      await crear({ catalogo: null, nombre, categoria: $('#otro-c', h).value, unidad: $('#otro-u', h).value, consumo_mes: consumo });
      await app.D.agregarTerminos([normal(nombre)]);
    } catch (e) { errorAviso(e); }
  };
}

function hojaAjustesHogar() {
  const cfg = configHogar();
  const h = abrirHoja(`
    <h3>Ajustes de la casa</h3>
    <div class="cuerpo">
      <div class="campo">¿Cada cuánto haces la compra grande?
        <select id="hz">${[[7, 'Cada semana'], [15, 'Cada quincena'], [30, 'Cada mes']].map(([d, t]) => `<option value="${d}" ${d === cfg.horizonte ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <label class="fila-check"><input type="checkbox" id="aprov" ${cfg.aprovechar ? 'checked' : ''}><span>Sugerirme comprar de más cuando hay oferta</span></label>
      <div class="dos">
        <label class="campo">Abastecerme hasta<select id="meses">${[1, 2, 3, 6].map((m) => `<option value="${m}" ${m === cfg.mesesMax ? 'selected' : ''}>${m} ${m === 1 ? 'mes' : 'meses'}</option>`).join('')}</select></label>
        <label class="campo">Si el descuento es de<select id="desc">${[10, 15, 20, 30].map((d) => `<option value="${d}" ${d === cfg.descuentoMin ? 'selected' : ''}>${d} % o más</option>`).join('')}</select></label>
      </div>
    </div>
    <div class="pie"><button class="btn-secundario" id="cancelar">Cancelar</button><button class="btn-primario" id="guardar">Guardar</button></div>`);
  $('#cancelar', h).onclick = cerrarHoja;
  $('#guardar', h).onclick = async () => {
    const nuevo = { ...cfg, horizonte: Number($('#hz', h).value), aprovechar: $('#aprov', h).checked, mesesMax: Number($('#meses', h).value), descuentoMin: Number($('#desc', h).value) };
    try {
      await app.D.guardarAjuste('hogar_config', nuevo);
      estado.ajustes.hogar_config = nuevo;
      cerrarHoja();
      app.render();
    } catch (e) { errorAviso(e); }
  };
}

// ---------------------------------------------------------------- integración con la lista
/** Al marcar como comprado en la lista un artículo de la casa: sube su stock */
export async function compraDesdeLista(item) {
  await cargarHogar();
  const a = (estado.hogar || []).find((x) => x.id === item.articulo_casa);
  if (!a) return;
  const op = mejorOpcion(item) || (item.opciones || [])[0];
  const cantidad = (op?.contenido || tamPaquete(a)) * (Number(item.cantidad) || 1);
  await app.D.actualizarHogarArticulo(a.id, registrarCompra(a, cantidad, new Date()));
  await app.D.movimientoHogar({ articulo_id: a.id, tipo: 'compra', cantidad, precio: op ? round2(op.precio * (Number(item.cantidad) || 1)) : null, tienda: op?.tienda || null, producto_id: op?.id || null, lista_id: item.id });
  await cargarHogar({ forzar: true });
}

/** Al desmarcarlo: deshace esa compra */
export async function deshacerCompraDesdeLista(item) {
  await cargarHogar();
  const a = (estado.hogar || []).find((x) => x.id === item.articulo_casa);
  if (!a) return;
  const m = await app.D.ultimoMovimientoDeLista(item.id);
  if (!m) return;
  await app.D.actualizarHogarArticulo(a.id, {
    stock: round2(Math.max(0, stockEstimado(a) - m.cantidad)),
    stock_fecha: new Date().toISOString(),
    compras_desde: round2(Math.max(0, (a.compras_desde || 0) - m.cantidad)),
  });
  await app.D.borrarMovimientoHogar(m.id);
  await cargarHogar({ forzar: true });
}

/** Para Ofertas: ¿este producto es de algo que usamos en la casa? */
export function esDeLaCasa(producto) {
  return (estado.hogar || []).some((a) => a.activo !== false && productoValidoHogar(a, producto));
}
