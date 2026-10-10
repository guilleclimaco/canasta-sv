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
  // rango de presupuesto semanal (USD); 0 = se sugiere uno. El menú apunta al medio del rango.
  presupuestoMin: 0,
  presupuestoMax: 0,
  estilos: [],
  proteinas: [], // preferidas: se proponen más seguido
  evitar: [],
  aparatos: ['estufa', 'licuadora'],
  tiempoMax: 0, // minutos máximos de cocina entre semana (0 = sin límite); el fin de semana no aplica
  sinFritos: false,
  soloConocidos: false, // solo platos muy comunes (popularidad ≥ 4)
};

const normal = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** ¿El producto es de limpieza, cuidado personal, utensilio o de mascota? (jabón de avena, exprimidor de limón…) */
export function esNoComida(nombre) {
  const n = normal(nombre);
  const palabras = n.split(/[^a-z0-9]+/).filter(Boolean);
  return NO_COMIDA.some((ex) => (ex.includes(' ') ? n.includes(ex) : palabras.some((w) => (ex.length >= 4 ? w.startsWith(ex) : w === ex))));
}

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
  p.proteinas = [...(p.proteinas || [])];
  p.evitar = [...(p.evitar || [])];
  p.aparatos = [...(p.aparatos || [])];
  // perfiles de antes (un solo número de presupuesto): ese número es el máximo.
  // Ahí "Económico" venía marcado por defecto y hacía que todo saliera lo más barato posible: se quita.
  if (perfil.presupuesto && !perfil.presupuestoMax) {
    p.presupuestoMax = Number(perfil.presupuesto) || 0;
    p.presupuestoMin = Math.round(p.presupuestoMax * 0.75);
    p.estilos = p.estilos.filter((e) => e !== 'economico');
  }
  p.presupuestoMin = Math.max(0, Number(p.presupuestoMin) || 0);
  p.presupuestoMax = Math.max(0, Number(p.presupuestoMax) || 0);
  if (p.presupuestoMax && p.presupuestoMin > p.presupuestoMax) [p.presupuestoMin, p.presupuestoMax] = [p.presupuestoMax, p.presupuestoMin];
  p.tiempoMax = Number(p.tiempoMax) || 0;
  p.sinFritos = !!p.sinFritos;
  p.soloConocidos = !!p.soloConocidos;
  delete p.dias;
  delete p.presupuesto;
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

/** Rango sugerido para la semana: de un menú sencillo a uno con más carne y variedad */
export function presupuestoSugerido(perfil) {
  const base = slotsDe(perfil).reduce((s, x) => s + x.porciones * COSTO_SUGERIDO[TIEMPO[x.comida]], 0);
  return { min: Math.round(base), max: Math.round(base * 1.6) };
}

/** Rango del perfil; si no puso, el sugerido */
export function rangoPresupuesto(perfilEntrada) {
  const p = normalizarPerfil(perfilEntrada);
  if (!p.presupuestoMax) return { ...presupuestoSugerido(p), sugerido: true };
  return { min: p.presupuestoMin, max: p.presupuestoMax, sugerido: false };
}

/** Qué tan bien le cae una receta al perfil (sin contar el costo) */
export function gusto(r, perfil) {
  const estilos = new Set(perfil.estilos || []);
  let g = r.popularidad ?? 3;
  g += r.etiquetas.filter((e) => e !== 'dulce' && estilos.has(e)).length * 0.7;
  if (estilos.has('tradicional') && r.etiquetas.includes('comedor')) g += 0.4;
  if ((perfil.proteinas || []).includes(r.proteina)) g += 0.9;
  return g;
}

/**
 * Recetas que cumplen los filtros del perfil (aparatos, no me gusta, vegetariano, sin frituras, solo conocidos,
 * tiempo máximo entre semana), opcionalmente para un tiempo de comida y un día.
 */
export function recetasPosibles(perfilEntrada, tiempo = null, dia = null) {
  const perfil = normalizarPerfil(perfilEntrada);
  const aparatos = new Set([...(perfil.aparatos || []), 'estufa']);
  const evitar = new Set(perfil.evitar || []);
  const soloVeg = (perfil.estilos || []).includes('vegetariano');
  const entreSemana = dia && !['sab', 'dom'].includes(dia);
  return RECETAS.filter((r) =>
    (!tiempo || (r.tiempos || ['almuerzo']).includes(tiempo)) &&
    r.aparatos.every((a) => aparatos.has(a) || a === 'licuadora') &&
    !evitar.has(r.proteina) &&
    !r.ing.some(([id]) => evitar.has(id)) &&
    !(evitar.has('picante') && r.etiquetas.includes('picante')) &&
    (!soloVeg || r.etiquetas.includes('vegetariano') || r.proteina === 'vegetal') &&
    (!perfil.sinFritos || !r.etiquetas.includes('frito')) &&
    (!perfil.soloConocidos || (r.popularidad ?? 3) >= 4) &&
    (!entreSemana || !perfil.tiempoMax || r.minutos <= perfil.tiempoMax));
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

  // recetas posibles por comida y día (el tiempo máximo solo aplica entre semana)
  const posibles = new Map();
  const posiblesDe = (s) => {
    const k = `${TIEMPO[s.comida]}|${['sab', 'dom'].includes(s.dia) ? 'finde' : 'semana'}`;
    if (!posibles.has(k)) posibles.set(k, recetasPosibles(perfil, TIEMPO[s.comida], s.dia));
    return posibles.get(k);
  };
  for (const s of slots) {
    if (!posiblesDe(s).length) {
      const nombre = nombreComida[s.comida].toLowerCase();
      return { error: `No hay recetas de ${nombre} que cumplan con tus filtros. Quita algo de "No me gusta", sube el tiempo máximo o desmarca "Sin frituras" / "Solo platos conocidos".`, slots: [], compras: [], total: 0 };
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
  const gustoDe = new Map(RECETAS.map((r) => [r.id, gusto(r, perfil)]));

  // Presupuesto: se apunta al medio del rango ("Económico" apunta al mínimo). Cada comida recibe
  // una parte según su peso típico (un almuerzo cuesta más que una refacción).
  const rango = rangoPresupuesto(perfil);
  const objetivo = estilos.has('economico') ? rango.min : (rango.min + rango.max) / 2;
  const peso = (s) => s.porciones * COSTO_SUGERIDO[TIEMPO[s.comida]];
  const pesoTotal = slots.reduce((t, s) => t + peso(s), 0) || 1;
  const metaPorcion = (s) => (objetivo * peso(s)) / pesoTotal / s.porciones;

  const elegido = {}; // clave -> recetaId
  const usos = new Map();
  const ingUsados = new Set();
  const protPrincipal = new Map(); // proteína -> veces en almuerzo/cena
  const familias = new Map(); // familia de plato (pupusas, sopa, huevos…) -> veces en la semana
  const familia = (r) => r.familia || r.id.split('-')[0];
  const usar = (slot, r) => {
    elegido[claveSlot(slot.dia, slot.comida)] = r.id;
    usos.set(r.id, (usos.get(r.id) || 0) + 1);
    r.ing.forEach(([id]) => ingUsados.add(id));
    familias.set(familia(r), (familias.get(familia(r)) || 0) + 1);
    if (['almuerzo', 'cena'].includes(TIEMPO[slot.comida])) protPrincipal.set(r.proteina, (protPrincipal.get(r.proteina) || 0) + 1);
  };
  const recetaEn = (dia, comida) => porId.get(elegido[claveSlot(dia, comida)]);
  const diaAnterior = (d) => SEMANA[SEMANA.indexOf(d) - 1];

  // primero los fijos
  for (const s of slots) {
    const id = fijos[claveSlot(s.dia, s.comida)];
    if (id && porId.has(id)) usar(s, porId.get(id));
  }

  // Menor puntaje = mejor. Manda el gusto (platos conocidos y lo que te gusta); el costo solo
  // pesa por cuánto se aleja de lo que te toca gastar en esa comida.
  const puntaje = (s, r) => {
    const t = TIEMPO[s.comida];
    let p = -gustoDe.get(r.id) * 1.1;
    const meta = metaPorcion(s);
    const pp = costo(r, s.porciones).aComprar / s.porciones;
    if (meta > 0) {
      const desvio = (pp - meta) / meta;
      p += desvio > 0 ? desvio * 2.2 : -desvio * 0.8;
    }
    const u = usos.get(r.id) || 0;
    p += u >= MAX_USOS[t] ? 50 : u * (t === 'desayuno' || t === 'refaccion' ? 1.2 : 4);
    const ayer = diaAnterior(s.dia) && recetaEn(diaAnterior(s.dia), s.comida);
    if (ayer?.id === r.id) p += 3;
    const finDeSemana = s.dia === 'sab' || s.dia === 'dom';
    if (t === 'almuerzo' || t === 'cena') {
      const otra = recetaEn(s.dia, t === 'almuerzo' ? 'cena' : 'almuerzo');
      if (otra?.proteina === r.proteina) p += 1.5;
      if (ayer?.proteina === r.proteina) p += 1.2;
      const n = protPrincipal.get(r.proteina) || 0; // misma proteína en la semana: cada vez pesa más
      p += n * 0.5 + Math.max(0, n - 1) * 0.9;
      p += (familias.get(familia(r)) || 0) * 1.2; // dos pupusas o dos sopas en la semana, menos probable
    }
    if (t === 'refaccion') {
      const otra = recetaEn(s.dia, s.comida === 'refaccion_am' ? 'refaccion_pm' : 'refaccion_am');
      if (otra && otra.etiquetas.includes('dulce') === r.etiquetas.includes('dulce')) p += 0.6;
      if (otra?.id === r.id) p += 2;
      if (!finDeSemana && r.minutos > 30) p += 1; // entre semana, refacciones sencillas
    }
    if (t === 'desayuno' && !finDeSemana && r.minutos > 25) p += 0.8; // entre semana, desayunos rápidos
    if (r.etiquetas.includes('finde')) p += finDeSemana ? -0.6 : 0.8; // carne asada, tamales: mejor el fin de semana
    const reusa = r.ing.filter(([id]) => !INGREDIENTES[id]?.basico && ingUsados.has(id)).length;
    p -= Math.min(0.6, reusa * 0.1);
    if (estilos.has('rapido') && r.minutos > 45) p += 1;
    p -= r.ing.filter(([id]) => precios[id]?.oferta).length * 0.2;
    p += (rnd() - 0.5) * 1.4; // variedad entre "Generar otro"
    return p;
  };

  for (const s of slots) {
    if (elegido[claveSlot(s.dia, s.comida)]) continue;
    let candidatas = posiblesDe(s).filter((r) => !excluir.includes(r.id));
    if (!candidatas.length) candidatas = posiblesDe(s);
    let mejor = null;
    let mejorP = Infinity;
    for (const r of candidatas) {
      const p = puntaje(s, r);
      if (p < mejorP) { mejorP = p; mejor = r; }
    }
    usar(s, mejor);
  }

  let plan = armar(slots, elegido, porId, costo, precios, despensa);

  // Acomodar al rango: si se pasa del máximo, cambiar la comida donde se ahorra más perdiendo menos gusto;
  // si queda por debajo del mínimo, mejorar la comida donde se gana más gusto sin pasarse del máximo.
  const conteo = () => {
    const m = new Map();
    Object.values(elegido).forEach((id) => m.set(id, (m.get(id) || 0) + 1));
    return m;
  };
  for (let i = 0; i < 40; i++) {
    const arriba = plan.total > rango.max + 0.01;
    const abajo = !arriba && plan.total < rango.min - 0.01 && !estilos.has('economico');
    if (!arriba && !abajo) break;
    const usadas = conteo();
    let mejorCambio = null;
    for (const x of plan.slots) {
      const k = claveSlot(x.dia, x.comida);
      if (fijos[k]) continue;
      const actual = porId.get(x.recetaId);
      // variedad: cuántas otras comidas principales ya tienen esa proteína o esa familia de plato
      const principal = ['almuerzo', 'cena'].includes(TIEMPO[x.comida]);
      const otras = principal ? plan.slots.filter((y) => y !== x && ['almuerzo', 'cena'].includes(TIEMPO[y.comida])).map((y) => porId.get(y.recetaId)) : [];
      const repetido = (r) => otras.filter((o) => o.proteina === r.proteina).length * 0.5 + otras.filter((o) => familia(o) === familia(r)).length * 0.8;
      const cActual = x.costo.aComprar;
      for (const r of posiblesDe(x)) {
        if (r.id === actual.id || excluir.includes(r.id) || (usadas.get(r.id) || 0) >= MAX_USOS[TIEMPO[x.comida]]) continue;
        const dif = costo(r, x.porciones).aComprar - cActual;
        const dGusto = gustoDe.get(r.id) - gustoDe.get(actual.id) - (repetido(r) - repetido(actual));
        let valor;
        if (arriba) {
          if (dif > -0.05) continue;
          // gusto que se pierde por cada dólar ahorrado (mientras más cerca de 0, mejor); los platos raros, último recurso
          valor = (dGusto - ((r.popularidad ?? 3) <= 2 ? 1.5 : 0)) / -dif;
        } else {
          if (dif < 0.05 || plan.total + dif > rango.max) continue;
          if (dGusto < -0.5) continue; // no "mejorar" a un plato que gusta menos
          valor = dGusto + Math.min(dif, rango.min - plan.total) * 0.3;
        }
        if (!mejorCambio || valor > mejorCambio.valor) mejorCambio = { k, r, valor };
      }
    }
    if (!mejorCambio) break;
    elegido[mejorCambio.k] = mejorCambio.r.id;
    plan = armar(slots, elegido, porId, costo, precios, despensa);
  }
  plan.dentroPresupuesto = plan.total <= rango.max + 0.01 && plan.total >= rango.min - 0.01;
  plan.presupuesto = rango;
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
