// Arma el menú de la semana con los precios reales de las tiendas.
// Lógica pura (sin red ni DOM) para poder probarla.
import { INGREDIENTES, NO_COMIDA, OTRO_ALIMENTO } from './ingredientes.js';
import { RECETAS } from './recetas.js';

export const DIAS = [
  ['lun', 'Lunes'], ['mar', 'Martes'], ['mie', 'Miércoles'], ['jue', 'Jueves'],
  ['vie', 'Viernes'], ['sab', 'Sábado'], ['dom', 'Domingo'],
];

const LV = ['lun', 'mar', 'mie', 'jue', 'vie'];
const SEMANA = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

/** Comidas del día: [id, nombre, tiempo de receta que usa] */
export const COMIDAS = [
  ['desayuno', 'Desayuno', 'desayuno'],
  ['refaccion_am', 'Refacción mañana', 'refaccion'],
  ['almuerzo', 'Almuerzo', 'almuerzo'],
  ['refaccion_pm', 'Refacción tarde', 'refaccion'],
  ['cena', 'Cena', 'cena'],
];
const TIEMPO = Object.fromEntries(COMIDAS.map(([id, , t]) => [id, t]));
export const nombreComida = Object.fromEntries(COMIDAS.map(([id, n]) => [id, n]));

/** Combinaciones rápidas (luego se puede ajustar día por día) */
export const PRESETS = [
  ['almuerzos', 'Solo almuerzos', { almuerzo: LV }],
  ['des-alm', 'Desayuno + almuerzo', { desayuno: SEMANA, almuerzo: LV }],
  ['alm-cena', 'Almuerzo + cena', { almuerzo: LV, cena: SEMANA }],
  ['alm-ref', 'Almuerzo + refacciones', { refaccion_am: LV, almuerzo: LV, refaccion_pm: LV }],
  ['todo', 'Todo el día', { desayuno: SEMANA, refaccion_am: LV, almuerzo: SEMANA, refaccion_pm: LV, cena: SEMANA }],
];

/** Costo típico por porción (USD), solo para sugerir presupuesto */
export const COSTO_SUGERIDO = { desayuno: 0.9, refaccion: 0.45, almuerzo: 1.6, cena: 1.3 };

/** Máximo de veces que una receta se repite en la semana, según la comida */
const MAX_USOS = { desayuno: 2, refaccion: 3, almuerzo: 1, cena: 1 };

export const PERFIL_INICIAL = {
  adultos: 2,
  ninos: 0,
  // comida -> { dias, porciones (null = las del hogar) }
  comidas: { almuerzo: { dias: [...LV], porciones: null } },
  presupuesto: 0, // USD por semana; 0 = se sugiere uno
  estilos: ['economico'],
  evitar: [],
  aparatos: ['estufa', 'licuadora'],
};

const normal = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** ¿Este producto de tienda sirve como este ingrediente? */
export function productoValido(ingId, p) {
  const ing = INGREDIENTES[ingId];
  if (!ing || ing.basico || !p) return false;
  if (p.unidad !== ing.unidad || !p.contenido || !p.precio) return false;
  const nombre = normal(p.busqueda || p.nombre);
  const palabras = nombre.split(/[^a-z0-9]+/).filter(Boolean);
  // cada palabra del término debe ser una palabra completa del producto, o su plural
  // ("limon" sí en "limones"; "pan" no en "panela"; "papa" no en "papaya" ni "Papadan").
  // Palabras largas (6+) aceptan prefijo: "codito" → "coditos", "pancake" → "pancakes".
  const esPalabra = (x, w) => x === w || x === w + 's' || x === w + 'es' || (w.length >= 6 && x.startsWith(w));
  const coincide = (ing.terminos || []).some((t) => t.split(' ').every((w) => palabras.some((x) => esPalabra(x, w))));
  if (!coincide) return false;
  const propias = new Set((ing.terminos || []).flatMap((t) => t.split(' ')));
  const tiene = (ex) => {
    if (ex.includes(' ')) return nombre.includes(ex);
    // palabras cortas: palabra exacta; largas: prefijo (empaniz → empanizado)
    return palabras.some((w) => (ex.length >= 4 ? w.startsWith(ex) : w === ex));
  };
  if ((ing.excluir || []).some(tiene)) return false;
  // productos que no son comida (jabón de avena, exprimidor de limón…)
  if (NO_COMIDA.some((ex) => !propias.has(ex) && tiene(ex))) return false;
  // empieza con otro alimento: "Frijoles con chorizo" no es chorizo
  const primera = normal(p.nombre || p.busqueda).split(/[^a-z0-9]+/).find(Boolean) || '';
  if (OTRO_ALIMENTO.some((a) => esPalabra(primera, a) && ![...propias].some((w) => esPalabra(primera, w)))) return false;
  return true;
}

/** Precio por unidad base (g, ml o und) de referencia */
export function precioRef(ingId) {
  const ing = INGREDIENTES[ingId];
  if (!ing || ing.basico) return 0;
  return ing.unidad === 'und' ? ing.ref : ing.ref / 100;
}

/**
 * Mejor precio de cada ingrediente según los productos encontrados en tiendas.
 * @param {Array} candidatos productos con {termino, tienda, precio, precio_lista, contenido, unidad, busqueda, id, ean, nombre}
 * @param {string[]} tiendas tiendas activas
 * @returns {Record<string, {precioUnit, producto|null, estimado, oferta}>}
 */
export function preciosIngredientes(candidatos, tiendas) {
  const res = {};
  for (const [id, ing] of Object.entries(INGREDIENTES)) {
    if (ing.basico) continue;
    const ref = precioRef(id);
    const validos = (candidatos || [])
      .filter((p) => (!tiendas?.length || tiendas.includes(p.tienda)) && productoValido(id, p))
      .map((p) => ({ p, pu: p.precio / p.contenido }))
      // precio sospechosamente bajo (< 30 % de la referencia) = probablemente otro producto o tamaño mal leído
      .filter((x) => x.pu >= ref * 0.3)
      .sort((a, b) => a.pu - b.pu);
    const mejor = validos[0];
    res[id] = mejor
      ? { precioUnit: mejor.pu, producto: mejor.p, estimado: false, oferta: mejor.p.precio_lista > mejor.p.precio * 1.03, alternativas: validos.slice(0, 20).map((x) => x.p) }
      : { precioUnit: ref, producto: null, estimado: true, oferta: false, alternativas: [] };
  }
  return res;
}

export function porcionesDe(perfil) {
  return Math.max(1, (Number(perfil.adultos) || 0) + 0.5 * (Number(perfil.ninos) || 0));
}

export const claveSlot = (dia, comida) => `${dia}:${comida}`;

/** Acepta perfiles viejos (solo almuerzos con `dias`) y completa lo que falte */
export function normalizarPerfil(perfil = {}) {
  const p = { ...PERFIL_INICIAL, ...perfil };
  let comidas = perfil.comidas;
  if (!comidas) comidas = { almuerzo: { dias: perfil.dias || [...LV], porciones: null } };
  p.comidas = {};
  for (const [id] of COMIDAS) {
    const c = comidas[id];
    if (c?.dias?.length) p.comidas[id] = { dias: SEMANA.filter((d) => c.dias.includes(d)), porciones: Number(c.porciones) || null };
  }
  p.estilos = [...(p.estilos || [])];
  p.evitar = [...(p.evitar || [])];
  p.aparatos = [...(p.aparatos || [])];
  delete p.dias;
  return p;
}

/** Cada comida a planear: [{dia, comida, porciones}] en orden de la semana y del día */
export function slotsDe(perfilEntrada) {
  const perfil = normalizarPerfil(perfilEntrada);
  const base = porcionesDe(perfil);
  const out = [];
  for (const d of SEMANA) {
    for (const [c] of COMIDAS) {
      const cfg = perfil.comidas[c];
      if (cfg?.dias.includes(d)) out.push({ dia: d, comida: c, porciones: cfg.porciones || base });
    }
  }
  return out;
}

export function presupuestoSugerido(perfil) {
  return Math.round(slotsDe(perfil).reduce((s, x) => s + x.porciones * COSTO_SUGERIDO[TIEMPO[x.comida]], 0));
}

/** Recetas que se pueden hacer con los aparatos y gustos del perfil (y opcionalmente para un tiempo de comida) */
export function recetasPosibles(perfil, tiempo = null) {
  const aparatos = new Set([...(perfil.aparatos || []), 'estufa']);
  const evitar = new Set(perfil.evitar || []);
  const soloVeg = (perfil.estilos || []).includes('vegetariano');
  return RECETAS.filter((r) =>
    (!tiempo || (r.tiempos || ['almuerzo']).includes(tiempo)) &&
    r.aparatos.every((a) => aparatos.has(a) || a === 'licuadora') &&
    !evitar.has(r.proteina) &&
    !r.ing.some(([id]) => evitar.has(id)) &&
    (!soloVeg || r.etiquetas.includes('vegetariano') || r.proteina === 'vegetal'));
}

/** Costo de una receta escalada, prorrateado (lo que "se come"), y la parte que hay que comprar */
export function costoReceta(receta, porciones, precios, despensa = new Set()) {
  const f = porciones / receta.porciones;
  let total = 0;
  let aComprar = 0;
  let estimado = false;
  for (const [id, cant] of receta.ing) {
    const ing = INGREDIENTES[id];
    if (!ing || ing.basico) continue;
    const pr = precios[id] || { precioUnit: precioRef(id), estimado: true };
    const c = cant * f * pr.precioUnit;
    total += c;
    if (!despensa.has(id)) aComprar += c;
    if (pr.estimado) estimado = true;
  }
  return { total: r2(total), porPorcion: r2(total / porciones), aComprar: r2(aComprar), estimado };
}

/**
 * Arma el menú de la semana: una receta por cada comida elegida de cada día.
 * @param {object} o
 * @param {object} o.perfil      ver PERFIL_INICIAL (también acepta el formato viejo de solo almuerzos)
 * @param {object} o.precios     salida de preciosIngredientes()
 * @param {Set}    o.despensa    ids de ingredientes que ya hay en casa
 * @param {number} o.semilla     cambia la semilla para obtener otro menú
 * @param {object} o.fijos       { "lun:almuerzo": recetaId } comidas que no se deben cambiar
 * @param {string[]} o.excluir   recetas que no se deben usar en las comidas que se recalculan
 */
export function planificar({ perfil: perfilEntrada, precios, despensa = new Set(), semilla = 1, fijos = {}, excluir = [] }) {
  const perfil = normalizarPerfil(perfilEntrada);
  const slots = slotsDe(perfil);
  if (!slots.length) return { error: 'Elige al menos una comida y un día.', slots: [], compras: [], total: 0 };
  const porTiempo = {};
  for (const t of new Set(slots.map((x) => TIEMPO[x.comida]))) {
    porTiempo[t] = recetasPosibles(perfil, t);
    if (!porTiempo[t].length) {
      return { error: `No hay recetas de ${t} que cumplan con tus gustos y aparatos. Quita algo de "No me gusta".`, slots: [], compras: [], total: 0 };
    }
  }
  const porId = new Map(RECETAS.map((r) => [r.id, r]));
  const rnd = mulberry32(semilla);
  const estilos = new Set(perfil.estilos || []);
  const cacheCosto = new Map();
  const costo = (r, porciones) => {
    const k = `${r.id}|${porciones}`;
    if (!cacheCosto.has(k)) cacheCosto.set(k, costoReceta(r, porciones, precios, despensa));
    return cacheCosto.get(k);
  };

  const elegido = {}; // clave -> recetaId
  const usos = new Map();
  const ingUsados = new Set();
  const protPrincipal = new Map(); // proteína -> veces en almuerzo/cena
  const usar = (slot, r) => {
    elegido[claveSlot(slot.dia, slot.comida)] = r.id;
    usos.set(r.id, (usos.get(r.id) || 0) + 1);
    r.ing.forEach(([id]) => ingUsados.add(id));
    if (['almuerzo', 'cena'].includes(TIEMPO[slot.comida])) protPrincipal.set(r.proteina, (protPrincipal.get(r.proteina) || 0) + 1);
  };
  const recetaEn = (dia, comida) => porId.get(elegido[claveSlot(dia, comida)]);
  const diaAnterior = (d) => SEMANA[SEMANA.indexOf(d) - 1];

  // primero los fijos
  for (const s of slots) {
    const id = fijos[claveSlot(s.dia, s.comida)];
    if (id && porId.has(id)) usar(s, porId.get(id));
  }

  const puntaje = (s, r) => {
    const t = TIEMPO[s.comida];
    const c = costo(r, s.porciones);
    let p = (c.aComprar / s.porciones) * 4; // costo normalizado a 4 porciones
    const u = usos.get(r.id) || 0;
    p += u >= MAX_USOS[t] ? 50 : u * (t === 'desayuno' || t === 'refaccion' ? 1.2 : 4);
    const ayer = diaAnterior(s.dia) && recetaEn(diaAnterior(s.dia), s.comida);
    if (ayer?.id === r.id) p += 3;
    const finDeSemana = s.dia === 'sab' || s.dia === 'dom';
    if (t === 'almuerzo' || t === 'cena') {
      const otra = recetaEn(s.dia, t === 'almuerzo' ? 'cena' : 'almuerzo');
      if (otra?.proteina === r.proteina) p += 1.5;
      if (ayer?.proteina === r.proteina) p += 1.2;
      p += Math.max(0, (protPrincipal.get(r.proteina) || 0) - 1) * 0.6;
    }
    if (t === 'refaccion') {
      const otra = recetaEn(s.dia, s.comida === 'refaccion_am' ? 'refaccion_pm' : 'refaccion_am');
      if (otra && otra.etiquetas.includes('dulce') === r.etiquetas.includes('dulce')) p += 0.6;
      if (otra?.id === r.id) p += 2;
      if (!finDeSemana && r.minutos > 30) p += 1; // entre semana, refacciones sencillas
    }
    if (t === 'desayuno' && !finDeSemana && r.minutos > 25) p += 0.8; // entre semana, desayunos rápidos
    const reusa = r.ing.filter(([id]) => !INGREDIENTES[id]?.basico && ingUsados.has(id)).length;
    p -= Math.min(1, reusa * 0.15);
    p -= r.etiquetas.filter((e) => e !== 'dulce' && estilos.has(e)).length * 0.6;
    if (estilos.has('rapido') && r.minutos > 45) p += 1;
    p -= r.ing.filter(([id]) => precios[id]?.oferta).length * 0.3;
    p += (rnd() - 0.5) * 2.6; // variedad entre "Generar otro"
    return p;
  };

  for (const s of slots) {
    if (elegido[claveSlot(s.dia, s.comida)]) continue;
    const t = TIEMPO[s.comida];
    let candidatas = porTiempo[t].filter((r) => !excluir.includes(r.id));
    if (!candidatas.length) candidatas = porTiempo[t];
    let mejor = null;
    let mejorP = Infinity;
    for (const r of candidatas) {
      const p = puntaje(s, r);
      if (p < mejorP) { mejorP = p; mejor = r; }
    }
    usar(s, mejor);
  }

  let plan = armar(slots, elegido, porId, costo, precios, despensa);

  // Ajustar al presupuesto: cambiar la comida más cara por una receta más barata del mismo tipo
  const pres = Number(perfil.presupuesto) || 0;
  for (let i = 0; pres && plan.total > pres && i < 30; i++) {
    const cambiables = plan.slots
      .filter((x) => !fijos[claveSlot(x.dia, x.comida)])
      .sort((a, b) => b.costo.aComprar / b.porciones - a.costo.aComprar / a.porciones);
    let cambiado = false;
    for (const x of cambiables) {
      const t = TIEMPO[x.comida];
      const usadas = new Map();
      Object.values(elegido).forEach((id) => usadas.set(id, (usadas.get(id) || 0) + 1));
      const alt = porTiempo[t]
        .filter((r) => (usadas.get(r.id) || 0) < MAX_USOS[t] && !excluir.includes(r.id) &&
          costo(r, x.porciones).aComprar < x.costo.aComprar - 0.01)
        .sort((a, b) => costo(a, x.porciones).aComprar - costo(b, x.porciones).aComprar)[0];
      if (alt) { elegido[claveSlot(x.dia, x.comida)] = alt.id; cambiado = true; break; }
    }
    if (!cambiado) break;
    plan = armar(slots, elegido, porId, costo, precios, despensa);
  }
  plan.dentroPresupuesto = !pres || plan.total <= pres;
  plan.presupuesto = pres;
  return plan;
}

function armar(slots, elegido, porId, costo, precios, despensa) {
  const lista = slots.map((s) => {
    const r = porId.get(elegido[claveSlot(s.dia, s.comida)]);
    return { ...s, recetaId: r.id, costo: costo(r, s.porciones) };
  });
  const compras = calcularCompras(lista.map((x) => ({ receta: porId.get(x.recetaId), porciones: x.porciones })), precios, despensa);
  const porComida = {};
  for (const x of lista) porComida[x.comida] = r2((porComida[x.comida] || 0) + x.costo.aComprar);
  return {
    slots: lista,
    compras,
    porComida,
    total: r2(compras.reduce((s, c) => s + c.costo, 0)),
    estimado: compras.some((c) => c.estimado),
  };
}

/**
 * Lista de compras de la semana: suma cantidades y redondea a paquetes reales cuando hay producto.
 * @param {Array<{receta, porciones}>} items
 */
export function calcularCompras(items, precios, despensa = new Set()) {
  const necesita = new Map();
  for (const { receta: r, porciones } of items) {
    const f = porciones / r.porciones;
    for (const [id, cant] of r.ing) {
      const ing = INGREDIENTES[id];
      if (!ing || ing.basico || despensa.has(id)) continue;
      necesita.set(id, (necesita.get(id) || 0) + cant * f);
    }
  }
  const out = [];
  for (const [id, cantExacta] of necesita) {
    const ing = INGREDIENTES[id];
    const cant = ing.unidad === 'und' ? Math.ceil(cantExacta - 0.01) : cantExacta; // no se compra medio huevo
    const pr = precios[id] || { precioUnit: precioRef(id), estimado: true, producto: null };
    let paquetes = null;
    let costo;
    let producto = pr.producto || null;
    if (producto?.contenido) {
      // para comprar conviene la presentación que cubre lo necesario al menor costo total
      // (6 huevos: mejor el cartón de 12 que el de 30, aunque el de 30 salga más barato por unidad)
      const opciones = [producto, ...(pr.alternativas || [])].filter((p) => p?.contenido && p.precio);
      let mejor = null;
      for (const p of opciones) {
        const n = Math.max(1, Math.ceil(cant / p.contenido - 0.08)); // 8 % de tolerancia
        const total = n * p.precio;
        if (!mejor || total < mejor.total - 0.005 || (Math.abs(total - mejor.total) < 0.005 && p.precio / p.contenido < mejor.p.precio / mejor.p.contenido)) {
          mejor = { p, n, total };
        }
      }
      producto = mejor.p;
      paquetes = mejor.n;
      costo = mejor.total;
    } else {
      costo = cant * pr.precioUnit;
    }
    out.push({
      ingId: id, nombre: ing.nombre, necesita: r2(cant), unidad: ing.unidad, paquetes,
      producto, alternativas: pr.alternativas || [], costo: r2(costo), estimado: !!pr.estimado,
    });
  }
  return out.sort((a, b) => b.costo - a.costo);
}

/** "450 g (1 lb)", "1.2 kg", "750 ml", "6" */
export function cantidadTexto(n, unidad) {
  if (unidad === 'und') return `${Math.ceil(n * 2) / 2}`.replace('.5', '½').replace(/^0½$/, '½');
  if (unidad === 'g') {
    const lb = n / 453.59;
    const base = n >= 1000 ? `${r1(n / 1000)} kg` : `${Math.round(n / 10) * 10} g`;
    return lb >= 0.4 ? `${base} (${r1(lb)} lb)` : base;
  }
  return n >= 1000 ? `${r1(n / 1000)} L` : `${Math.round(n / 10) * 10} ml`;
}

/** Cantidad de un ingrediente dentro de una receta escalada, en texto */
export function ingredienteEnReceta(id, cant, receta, porciones) {
  const ing = INGREDIENTES[id];
  if (!ing) return id;
  if (ing.basico) return `${ing.nombre} (al gusto)`;
  return `${ing.nombre}: ${cantidadTexto(cant * (porciones / receta.porciones), ing.unidad)}`;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r2 = (n) => Math.round(n * 100) / 100;
const r1 = (n) => Math.round(n * 10) / 10;
