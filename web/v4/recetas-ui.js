// Recetas de la familia: agregarlas desde la app para que entren al menú y a la cotización.
import { $, $$, esc, estado, app, abrirHoja, cerrarHoja, aviso, errorAviso } from '../nucleo.js';
import { INGREDIENTES } from '../menu/ingredientes.js';
import { cantidadTexto } from '../menu/planificador.js';
import { parsearCantidad } from './despensa.js';

const normalizar = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const TIEMPOS = [['desayuno', 'Desayuno'], ['refaccion', 'Refacción'], ['almuerzo', 'Almuerzo'], ['cena', 'Cena']];
const PROTEINAS = [['pollo', 'Pollo'], ['res', 'Res'], ['cerdo', 'Cerdo'], ['pescado', 'Pescado'], ['huevo', 'Huevo'], ['embutido', 'Embutido'], ['vegetal', 'Sin carne']];
const ETIQUETAS = [['rapido', 'Rápida'], ['economico', 'Económica'], ['tradicional', 'Típica'], ['saludable', 'Saludable'], ['ninos', 'Para niños'], ['vegetariano', 'Vegetariana'], ['dulce', 'Dulce'], ['lonchera', 'Aguanta lonchera']];
const APARATOS = [['horno', 'Horno'], ['freidora', 'Freidora de aire'], ['licuadora', 'Licuadora']];

// Peso típico de una unidad, para "papa 3" cuando la papa se cotiza en gramos
const PESO_UND = {
  papa: 170, tomate: 120, cebolla: 150, zanahoria: 90, yuca: 400, brocoli: 300, papaya: 1200, pechuga: 250,
  pollo_piezas: 250, chuleta_cerdo: 200, tilapia: 300, res_posta: 450, carne_molida: 450, chorizo: 60, salchicha: 45,
  queso_duro: 450, quesillo: 450, arroz: 450, frijol: 450, lentejas: 450,
};

/**
 * Una línea de ingrediente → [id, cantidad] en la unidad del catálogo, o {nota} si no se reconoce.
 * "pollo 2 lb" → ['pollo_piezas', 907.18]; "papa 3" → ['papa', 510]; "sal" → ['sal', 1]
 */
export function parsearLineaIngrediente(linea) {
  const texto = String(linea || '').trim();
  if (!texto) return null;
  const p = parsearCantidad(texto);
  const id = p.ingrediente || basicoDe(texto);
  if (!id) return { nota: texto };
  const ing = INGREDIENTES[id];
  if (ing.basico) return { id, cantidad: 1 };
  let cantidad = p.cantidad;
  if (cantidad == null) {
    const n = Number((texto.match(/(\d+(?:[.,]\d+)?)/) || [])[1]?.replace(',', '.')) || 1;
    cantidad = ing.unidad === 'und' ? n : n * (PESO_UND[id] || 100);
  }
  return { id, cantidad: Math.round(cantidad * 100) / 100 };
}

function basicoDe(texto) {
  const n = normalizar(texto);
  return Object.entries(INGREDIENTES).find(([, i]) => i.basico && n.startsWith(normalizar(i.nombre).split(' ')[0]))?.[0] || null;
}

const slug = (s) => normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

/** Arma la receta a partir del formulario; devuelve {receta, errores} */
export function recetaDesdeFormulario(f) {
  const errores = [];
  const ing = [];
  const notas = [];
  for (const l of String(f.ingredientes || '').split('\n')) {
    const r = parsearLineaIngrediente(l);
    if (!r) continue;
    if (r.nota) notas.push(r.nota); else ing.push([r.id, r.cantidad]);
  }
  const pasos = String(f.pasos || '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (!f.nombre?.trim()) errores.push('Ponle nombre.');
  if (!f.tiempos?.length) errores.push('Elige en qué comidas va.');
  if (!ing.length) errores.push('Agrega al menos un ingrediente que la app reconozca.');
  if (!pasos.length) errores.push('Escribe al menos un paso.');
  const receta = {
    id: f.id || `propia-${slug(f.nombre || 'receta')}`,
    nombre: f.nombre?.trim(),
    minutos: Number(f.minutos) || 30,
    porciones: Number(f.porciones) || 4,
    tiempos: f.tiempos || [],
    aparatos: ['estufa', ...(f.aparatos || [])],
    etiquetas: f.etiquetas || [],
    proteina: f.proteina || 'vegetal',
    ing,
    pasos: notas.length ? [...pasos, `Además: ${notas.join(', ')}.`] : pasos,
    propia: true,
  };
  return { receta, errores, notas };
}

export function abrirMisRecetas() {
  const lista = estado.recetasPropias || [];
  const h = abrirHoja(`
    <h3>Recetas de la familia</h3>
    <p class="sub" style="margin:-6px 0 10px">Entran al menú como las demás y se cotizan con los precios de las tiendas.</p>
    <div class="cuerpo">${lista.length ? lista.map((r) => `
      <div class="opcion-receta" data-id="${esc(r.id)}">
        <span class="n">${esc(r.nombre)}</span>
        <span class="sub">${r.tiempos.map((t) => TIEMPOS.find(([x]) => x === t)?.[1]).join(', ')} · ${r.minutos} min · ${r.ing.length} ingredientes</span>
        <span style="display:flex;gap:8px;margin-top:6px"><button class="btn-texto" data-accion="editar">Editar</button><button class="btn-texto peligro" data-accion="borrar">Borrar</button></span>
      </div>`).join('') : '<div class="vacio">Aún no hay recetas propias. ¿La sopa de la abuela? ¿Los frijoles de tu tía? Agrégalas aquí.</div>'}
    </div>
    <div class="pie"><button class="btn-primario" id="nueva">+ Nueva receta</button></div>`);
  $('#nueva', h).onclick = () => formularioReceta();
  $$('[data-accion]', h).forEach((b) => (b.onclick = async () => {
    const id = b.closest('[data-id]').dataset.id;
    const r = lista.find((x) => x.id === id);
    if (b.dataset.accion === 'editar') return formularioReceta(r);
    if (!confirm(`¿Borrar "${r.nombre}"?`)) return;
    try {
      await app.D.borrarRecetaPropia(id);
      await recargarRecetasPropias();
      abrirMisRecetas();
    } catch (e) { errorAviso(e); }
  }));
}

export async function recargarRecetasPropias() {
  try { estado.recetasPropias = await app.D.recetasPropias(); } catch (e) { console.warn(e); estado.recetasPropias = []; }
  estado.menuCargado = false;
}

/** Formulario para crear o editar. `base` puede venir de una idea de la IA. */
export function formularioReceta(base = null) {
  const r = base || { tiempos: ['almuerzo'], etiquetas: [], aparatos: ['estufa'], proteina: 'pollo', porciones: 4, minutos: 30 };
  const lineasIng = (r.ing || []).map(([id, c]) => {
    const ing = INGREDIENTES[id];
    if (!ing) return '';
    if (ing.basico) return ing.nombre.toLowerCase();
    return ing.unidad === 'und' ? `${ing.nombre.toLowerCase()} ${c}` : `${ing.nombre.toLowerCase()} ${Math.round(c)} ${ing.unidad}`;
  }).filter(Boolean).join('\n');
  const chips = (grupo, op, sel) => `<div class="chips" data-grupo="${grupo}">${op.map(([id, t]) => `<button type="button" class="filtro" data-id="${id}" aria-pressed="${(sel || []).includes(id)}">${esc(t)}</button>`).join('')}</div>`;
  const h = abrirHoja(`
    <h3>${base?.nombre && base?.propia ? 'Editar receta' : 'Nueva receta'}</h3>
    <div class="cuerpo">
      <label class="campo">Nombre<input id="r-nombre" value="${esc(r.nombre || '')}" placeholder="ej. Sopa de gallina de la abuela"></label>
      <div class="campo">¿En qué comidas va?${chips('tiempos', TIEMPOS, r.tiempos)}</div>
      <div class="dos">
        <label class="campo">Minutos<input id="r-min" type="number" inputmode="numeric" value="${r.minutos}"></label>
        <label class="campo">Rinde (porciones)<input id="r-porc" type="number" inputmode="numeric" value="${r.porciones}"></label>
      </div>
      <label class="campo">Proteína principal<select id="r-prot">${PROTEINAS.map(([id, t]) => `<option value="${id}" ${id === r.proteina ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <div class="campo">Cómo es${chips('etiquetas', ETIQUETAS, r.etiquetas)}</div>
      <div class="campo">Necesita${chips('aparatos', APARATOS, r.aparatos)}</div>
      <label class="campo">Ingredientes (uno por línea: "pollo 2 lb", "papa 3", "arroz 1 lb", "sal")
        <textarea id="r-ing" rows="6" placeholder="pollo 2 lb&#10;papa 3&#10;zanahoria 2&#10;cebolla 1&#10;sal">${esc(lineasIng)}</textarea></label>
      <div id="r-prev" class="prev-ing"></div>
      <label class="campo">Pasos (uno por línea)<textarea id="r-pasos" rows="5">${esc((r.pasos || []).join('\n'))}</textarea></label>
      <div class="error" id="r-err"></div>
    </div>
    <div class="pie"><button class="btn-secundario" id="cancelar">Cancelar</button><button class="btn-primario" id="guardar">Guardar</button></div>`);
  const sel = { tiempos: [...(r.tiempos || [])], etiquetas: [...(r.etiquetas || [])], aparatos: (r.aparatos || []).filter((a) => a !== 'estufa') };
  $$('.chips', h).forEach((g) => $$('.filtro', g).forEach((b) => (b.onclick = () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on));
    const k = g.dataset.grupo;
    sel[k] = on ? [...sel[k], b.dataset.id] : sel[k].filter((x) => x !== b.dataset.id);
  })));
  const vista = () => {
    const lineas = $('#r-ing', h).value.split('\n').map((l) => [l, parsearLineaIngrediente(l)]).filter(([, p]) => p);
    $('#r-prev', h).innerHTML = lineas.map(([l, p]) => p.nota
      ? `<span class="no">✗ ${esc(l)} <i>(no la reconozco; se guarda como nota)</i></span>`
      : `<span class="si">✓ ${esc(INGREDIENTES[p.id].nombre)}${INGREDIENTES[p.id].basico ? '' : `: ${esc(cantidadTexto(p.cantidad, INGREDIENTES[p.id].unidad))}`}</span>`).join('');
  };
  $('#r-ing', h).oninput = vista;
  vista();
  $('#cancelar', h).onclick = cerrarHoja;
  $('#guardar', h).onclick = async (ev) => {
    const { receta, errores } = recetaDesdeFormulario({
      id: base?.propia ? base.id : null,
      nombre: $('#r-nombre', h).value, minutos: $('#r-min', h).value, porciones: $('#r-porc', h).value,
      proteina: $('#r-prot', h).value, ingredientes: $('#r-ing', h).value, pasos: $('#r-pasos', h).value, ...sel,
    });
    if (errores.length) { $('#r-err', h).textContent = errores.join(' '); return; }
    ev.currentTarget.disabled = true;
    try {
      await app.D.guardarRecetaPropia(receta);
      await recargarRecetasPropias();
      cerrarHoja();
      aviso(`"${receta.nombre}" ya entra en tus menús`);
      app.render();
    } catch (e) { ev.currentTarget.disabled = false; errorAviso(e); }
  };
}
