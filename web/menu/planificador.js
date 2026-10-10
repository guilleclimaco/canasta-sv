// Arma el menú de la semana con los precios reales de las tiendas.
// Lógica pura (sin red ni DOM) para poder probarla.
import { INGREDIENTES, esVerduraOFruta, NO_COMIDA, OTRO_ALIMENTO } from './ingredientes.js';
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
  repetirParaAhorrar: false, // repetir ingredientes (pollo varios días) en vez de variar, para gastar menos
};

const normal = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** ¿El producto es de limpieza, cuidado personal, utensilio o de mascota? (jabón de avena, exprimidor de limón…) */
export function esNoComida(nombre) {
  const n = normal(nombre);
  const palabras = n.split(/[^a-z0-9]+/).filter(Boolean);
  return NO_COMIDA.some((ex) => (ex.includes(' ') ? n.includes(ex) : palabras.some((w) => (ex.length >= 4 ? w.startsWith(ex) : w === ex))));
}

// Palabras con las que empiezan los productos que SON otro alimento: la lista fija (salsa, sopa, jugo…) más la
// primera palabra de cada término del catálogo ("Palomitas … mantequilla" no es margarina; "Pan … con mantequilla"
// tampoco). "Filete" es genérico: "Filete de pechuga" sí es pechuga.
const GENERICAS = new Set(['filete']);
const OTROS = [...new Set([...OTRO_ALIMENTO, ...Object.values(INGREDIENTES).flatMap((i) => (i.terminos || []).map((t) => t.split(' ')[0]))])]
  .filter((w) => !GENERICAS.has(w));

/** ¿Este producto de tienda sirve como este ingrediente? */
export function productoValido(ingId, p) {
  const ing = INGREDIENTES[ingId];
  if (!ing || ing.basico || !p) return false;
  // `acepta`: otra unidad que vale lo mismo (la crema se vende en g y la receta la mide en ml; 1 g ≈ 1 ml)
  if ((p.unidad !== ing.unidad && !(ing.acepta || []).includes(p.unidad)) || !p.contenido || !p.precio) return false;
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
  // primera palabra de verdad: "6 Pack Kikitos…" empieza con kikitos, no con 6
  const primera = normal(p.nombre || p.busqueda).split(/[^a-z0-9]+/).find((w) => w && !/^\d/.test(w) && !['pack', 'paquete', 'pk'].includes(w)) || '';
  if (OTROS.some((a) => esPalabra(primera, a) && ![...propias].some((w) => esPalabra(primera, w)))) return false;
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

/** Modos de "cocinar una vez, comer dos veces" */
export const MODOS_SOBRAS = [
  ['no', 'No'],
  ['almuerzo_a_cena', 'Lo que sobra del almuerzo es la cena'],
  ['cena_a_almuerzo', 'La cena se cocina doble y va de almuerzo al día siguiente (lonchera)'],
];

/** Acepta perfiles viejos (solo almuerzos con `dias`) y completa lo que falte */
export function normalizarPerfil(perfil = {}) {
  const p = { ...PERFIL_INICIAL, sobras: 'no', ...perfil };
  let comidas = perfil.comidas;
  if (!comidas) comidas = { almuerzo: { dias: perfil.dias || [...LV], porciones: null } };
  p.comidas = {};
  for (const [id] of COMIDAS) {
    const c = comidas[id];
    if (c?.dias?.length) {
      p.comidas[id] = { dias: SEMANA.filter((d) => c.dias.includes(d)), porciones: Number(c.porciones) || null, lonchera: !!c.lonchera };
    }
  }
  p.estilos = [...(p.estilos || [])];
  p.proteinas = [...(p.proteinas || [])];
  p.evitar = [...(p.evitar || [])];
  p.aparatos = [...(p.aparatos || [])];
  if (!MODOS_SOBRAS.some(([m]) => m === p.sobras)) p.sobras = 'no';
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
  p.repetirParaAhorrar = !!p.repetirParaAhorrar;
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
  const etiquetas = r.etiquetas || [];
  let g = r.popularidad ?? 3;
  g += etiquetas.filter((e) => e !== 'dulce' && estilos.has(e)).length * 0.7;
  if (estilos.has('tradicional') && etiquetas.includes('comedor')) g += 0.4;
  if ((perfil.proteinas || []).includes(r.proteina)) g += 0.9;
  return g;
}

/**
 * Recetas que cumplen los filtros del perfil (aparatos, no me gusta, vegetariano, sin frituras, solo conocidos,
 * tiempo máximo entre semana), opcionalmente para un tiempo de comida y un día.
 */
export function recetasPosibles(perfilEntrada, tiempo = null, recetas = RECETAS, dia = null) {
  const perfil = normalizarPerfil(perfilEntrada);
  const aparatos = new Set([...(perfil.aparatos || []), 'estufa']);
  const evitar = new Set(perfil.evitar || []);
  const soloVeg = (perfil.estilos || []).includes('vegetariano');
  const entreSemana = dia && !['sab', 'dom'].includes(dia);
  return recetas.filter((r) => {
    const etiquetas = r.etiquetas || [];
    return (!tiempo || (r.tiempos || ['almuerzo']).includes(tiempo)) &&
      (r.aparatos || []).every((a) => aparatos.has(a) || a === 'licuadora') &&
      !evitar.has(r.proteina) &&
      !r.ing.some(([id]) => evitar.has(id)) &&
      !etiquetas.some((e) => evitar.has(e)) &&
      !(evitar.has('picante') && etiquetas.includes('picante')) &&
      (!soloVeg || etiquetas.includes('vegetariano') || r.proteina === 'vegetal') &&
      (!perfil.sinFritos || !etiquetas.includes('frito')) &&
      (!perfil.soloConocidos || (r.popularidad ?? 3) >= 4) &&
      (!entreSemana || !perfil.tiempoMax || r.minutos <= perfil.tiempoMax);
  });
}

/**
 * Despensa en un solo formato: Map id -> { cantidad (Infinity = "siempre hay"), caduca }
 * Acepta: Set de ids (lo que "siempre hay"), Map, o filas de la tabla despensa [{ingrediente, cantidad, caduca}].
 */
export function normalizarDespensa(...fuentes) {
  const m = new Map();
  const sumar = (id, cantidad, caduca) => {
    if (!id) return;
    const prev = m.get(id);
    const c = cantidad == null ? Infinity : Number(cantidad);
    const cad = [prev?.caduca, caduca].filter(Boolean).sort()[0] || null;
    m.set(id, { cantidad: (prev?.cantidad || 0) + c, caduca: cad });
  };
  for (const f of fuentes) {
    if (!f) continue;
    if (f instanceof Set) f.forEach((id) => sumar(id, null, null));
    else if (f instanceof Map) f.forEach((v, id) => sumar(id, v?.cantidad ?? null, v?.caduca ?? null));
    else if (Array.isArray(f)) f.forEach((x) => sumar(x.ingrediente, x.cantidad, x.caduca));
  }
  return m;
}

const disponible = (desp, id) => desp.get(id)?.cantidad ?? 0;

/** Ingredientes de la despensa que vencen en `dias` días o menos */
export function porVencer(despensa, hoy = new Date(), dias = 3) {
  const desp = despensa instanceof Map ? despensa : normalizarDespensa(despensa);
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + dias);
  const lim = limite.toISOString().slice(0, 10);
  return [...desp].filter(([, v]) => v.caduca && v.caduca <= lim && v.cantidad > 0).map(([id]) => id);
}

export function tieneVerdura(receta) {
  return receta.ing.some(([id]) => esVerduraOFruta(id));
}

/** Costo de una receta escalada, prorrateado (lo que "se come"), y la parte que hay que comprar */
export function costoReceta(receta, porciones, precios, despensa = new Map()) {
  const desp = despensa instanceof Map ? despensa : normalizarDespensa(despensa);
  const f = porciones / receta.porciones;
  let total = 0;
  let aComprar = 0;
  let estimado = false;
  for (const [id, cant] of receta.ing) {
    const ing = INGREDIENTES[id];
    if (!ing || ing.basico) continue;
    const pr = precios[id] || { precioUnit: precioRef(id), estimado: true };
    const necesita = cant * f;
    total += necesita * pr.precioUnit;
    aComprar += Math.max(0, necesita - disponible(desp, id)) * pr.precioUnit;
    if (pr.estimado) estimado = true;
  }
  return { total: r2(total), porPorcion: r2(total / porciones), aComprar: r2(aComprar), estimado };
}

/** Qué comida es sobra de cuál: { "mar:almuerzo": "lun:cena" } */
export function enlacesSobras(slots, perfil, manual = {}, sinSobras = []) {
  const hay = new Set(slots.map((s) => claveSlot(s.dia, s.comida)));
  const map = {};
  SEMANA.forEach((d, i) => {
    if (perfil.sobras === 'almuerzo_a_cena' && hay.has(claveSlot(d, 'almuerzo')) && hay.has(claveSlot(d, 'cena'))) {
      map[claveSlot(d, 'cena')] = claveSlot(d, 'almuerzo');
    }
    const sig = SEMANA[i + 1];
    if (perfil.sobras === 'cena_a_almuerzo' && sig && hay.has(claveSlot(d, 'cena')) && hay.has(claveSlot(sig, 'almuerzo'))) {
      map[claveSlot(sig, 'almuerzo')] = claveSlot(d, 'cena');
    }
  });
  const orden = new Map(slots.map((s, i) => [claveSlot(s.dia, s.comida), i]));
  for (const [t, s] of Object.entries(manual || {})) {
    if (hay.has(t) && hay.has(s) && orden.get(s) < orden.get(t)) map[t] = s;
  }
  for (const t of sinSobras || []) delete map[t];
  for (const [t, s] of Object.entries(map)) if (map[s]) delete map[t]; // sin cadenas de sobras de sobras
  return map;
}

/**
 * Arma el menú de la semana: una receta por cada comida elegida de cada día.
 * @param {object} o
 * @param {object} o.perfil          ver PERFIL_INICIAL (también acepta el formato viejo de solo almuerzos)
 * @param {object} o.precios         salida de preciosIngredientes()
 * @param {Set|Map|Array} o.despensa lo que hay en casa (ver normalizarDespensa)
 * @param {number} o.semilla         cambia la semilla para obtener otro menú
 * @param {object} o.fijos           { "lun:almuerzo": recetaId } comidas que no se deben cambiar
 * @param {string[]} o.excluir       recetas que no se deben usar en las comidas que se recalculan
 * @param {Array}  o.recetas         recetario (por defecto RECETAS + las de la familia que pase la app)
 * @param {object} o.calificaciones  { recetaId: 1 | -1 }
 * @param {object} o.sobras          enlaces manuales { "mar:almuerzo": "lun:cena" }
 * @param {string[]} o.sinSobras     comidas donde se quitó a mano la sobra automática
 * @param {Date}   o.hoy             para calcular lo que está por vencer
 */
export function planificar({
  perfil: perfilEntrada, precios, despensa = new Map(), semilla = 1, fijos = {}, excluir = [],
  recetas = RECETAS, calificaciones = {}, sobras = {}, sinSobras = [], hoy = new Date(),
}) {
  const perfil = normalizarPerfil(perfilEntrada);
  const desp = despensa instanceof Map ? despensa : normalizarDespensa(despensa);
  const slots = slotsDe(perfil);
  if (!slots.length) return { error: 'Elige al menos una comida y un día.', slots: [], compras: [], total: 0 };
  // recetas posibles por comida y día (el tiempo máximo solo aplica entre semana)
  const posibles = new Map();
  const posiblesDe = (s) => {
    const k = `${TIEMPO[s.comida]}|${['sab', 'dom'].includes(s.dia) ? 'finde' : 'semana'}`;
    if (!posibles.has(k)) posibles.set(k, recetasPosibles(perfil, TIEMPO[s.comida], recetas, s.dia));
    return posibles.get(k);
  };
  for (const s of slots) {
    if (!posiblesDe(s).length) {
      const nombre = nombreComida[s.comida].toLowerCase();
      return { error: `No hay recetas de ${nombre} que cumplan con tus filtros. Quita algo de "No me gusta", sube el tiempo máximo o desmarca "Sin frituras" / "Solo platos conocidos".`, slots: [], compras: [], total: 0 };
    }
  }
  const porId = new Map(recetas.map((r) => [r.id, r]));
  const rnd = mulberry32(semilla);
  const estilos = new Set(perfil.estilos || []);
  const vence = new Set(porVencer(desp, hoy));
  const enlaces = enlacesSobras(slots, perfil, sobras, sinSobras); // destino -> origen
  const destinosDe = {};
  for (const [t, s] of Object.entries(enlaces)) (destinosDe[s] ||= []).push(t);
  const porClave = new Map(slots.map((s) => [claveSlot(s.dia, s.comida), s]));
  // porciones a cocinar = las propias + las de sus sobras
  const cocinar = (s) => s.porciones + (destinosDe[claveSlot(s.dia, s.comida)] || []).reduce((a, t) => a + porClave.get(t).porciones, 0);

  const cacheCosto = new Map();
  const costo = (r, porciones) => {
    const k = `${r.id}|${porciones}`;
    if (!cacheCosto.has(k)) cacheCosto.set(k, costoReceta(r, porciones, precios, desp));
    return cacheCosto.get(k);
  };

  const gustoDe = new Map(recetas.map((r) => [r.id, gusto(r, perfil)]));

  // ---- carrito: lo que de verdad se paga en la caja ----
  // Cada ingrediente cuesta los paquetes enteros que hacen falta para TODO lo de la semana (como en la lista de
  // compras). Por eso repetir un ingrediente ya comprado (el pollo, la bolsa de arroz) sale casi gratis, y meter
  // uno nuevo cuesta su paquete completo aunque se use poquito.
  const necesidad = new Map(); // ingrediente -> cantidad total de la semana
  const cacheCaja = new Map();
  const cajaDe = (id, cant) => {
    const k = `${id}|${Math.round(cant * 100)}`;
    if (!cacheCaja.has(k)) cacheCaja.set(k, costoCaja(id, cant, precios, desp));
    return cacheCaja.get(k);
  };
  const aportes = (r, porciones) => r.ing.filter(([id]) => INGREDIENTES[id] && !INGREDIENTES[id].basico)
    .map(([id, cant]) => [id, (cant * porciones) / r.porciones]);
  const sumar = (r, porciones, signo) => {
    for (const [id, q] of aportes(r, porciones)) necesidad.set(id, Math.max(0, (necesidad.get(id) || 0) + signo * q));
  };
  /** Cuánto sube (o baja) la caja si en una comida se cambia `viejo` por `nuevo` (cualquiera puede ser null) */
  const deltaCaja = (viejo, nuevo, porciones) => {
    const cambio = new Map();
    if (viejo) for (const [id, q] of aportes(viejo, porciones)) cambio.set(id, (cambio.get(id) || 0) - q);
    if (nuevo) for (const [id, q] of aportes(nuevo, porciones)) cambio.set(id, (cambio.get(id) || 0) + q);
    let d = 0;
    for (const [id, q] of cambio) {
      if (Math.abs(q) < 1e-9) continue;
      const antes = necesidad.get(id) || 0;
      d += cajaDe(id, Math.max(0, antes + q)) - cajaDe(id, antes);
    }
    return d;
  };
  const totalCaja = () => [...necesidad].reduce((t, [id, q]) => t + cajaDe(id, q), 0);

  // Presupuesto: se apunta al medio del rango ("Económico" apunta al mínimo). Cada comida recibe
  // una parte según su peso típico (un almuerzo cuesta más que una refacción).
  const rango = rangoPresupuesto(perfil);
  const objetivo = estilos.has('economico') ? rango.min
    : perfil.repetirParaAhorrar ? rango.min + (rango.max - rango.min) * 0.25 : (rango.min + rango.max) / 2;
  const ahorrar = perfil.repetirParaAhorrar;
  const peso = (s) => s.porciones * COSTO_SUGERIDO[TIEMPO[s.comida]];
  const pesoTotal = slots.reduce((t, s) => t + peso(s), 0) || 1;
  const metaPorcion = (s) => (objetivo * peso(s)) / pesoTotal / s.porciones;

  const elegido = {}; // clave -> recetaId
  const usos = new Map();
  const ingUsados = new Set();
  const protPrincipal = new Map(); // proteína -> veces en almuerzo/cena
  const familias = new Map(); // familia de plato (pupusas, sopa, huevos…) -> veces en la semana
  const familia = (r) => r.familia || String(r.id).split('-')[0];
  const tecnicas = new Map(); // estilo de cocina (entomatado, encebollado…) -> veces en almuerzo/cena
  const verduraDia = new Set();
  const usar = (slot, r) => {
    elegido[claveSlot(slot.dia, slot.comida)] = r.id;
    sumar(r, cocinar(slot), 1);
    usos.set(r.id, (usos.get(r.id) || 0) + 1);
    familias.set(familia(r), (familias.get(familia(r)) || 0) + 1);
    if (r.tecnica && ['almuerzo', 'cena'].includes(TIEMPO[slot.comida])) tecnicas.set(r.tecnica, (tecnicas.get(r.tecnica) || 0) + 1);
    r.ing.forEach(([id]) => { ingUsados.add(id); vence.delete(id); });
    if (['almuerzo', 'cena'].includes(TIEMPO[slot.comida])) protPrincipal.set(r.proteina, (protPrincipal.get(r.proteina) || 0) + 1);
    if (tieneVerdura(r)) verduraDia.add(slot.dia);
    for (const t of destinosDe[claveSlot(slot.dia, slot.comida)] || []) {
      elegido[t] = r.id; // la sobra lleva la misma receta
      if (tieneVerdura(r)) verduraDia.add(porClave.get(t).dia);
    }
  };
  const recetaEn = (dia, comida) => porId.get(elegido[claveSlot(dia, comida)]);
  const diaAnterior = (d) => SEMANA[SEMANA.indexOf(d) - 1];
  const ultimaDelDia = new Map();
  for (const s of slots) if (!enlaces[claveSlot(s.dia, s.comida)]) ultimaDelDia.set(s.dia, claveSlot(s.dia, s.comida));

  const candidatasPara = (s) => {
    let c = posiblesDe(s);
    if (destinosDe[claveSlot(s.dia, s.comida)]) {
      const conSobras = c.filter((r) => r.sobras);
      if (conSobras.length) c = conSobras;
    }
    if (perfil.comidas[s.comida]?.lonchera) {
      const lonch = c.filter((r) => (r.etiquetas || []).includes('lonchera'));
      if (lonch.length) c = lonch;
    }
    const sinExcluir = c.filter((r) => !excluir.includes(r.id));
    return sinExcluir.length ? sinExcluir : c;
  };

  // primero los fijos (y sus sobras)
  for (const s of slots) {
    const k = claveSlot(s.dia, s.comida);
    if (enlaces[k]) continue;
    const id = fijos[k];
    if (id && porId.has(id)) usar(s, porId.get(id));
  }

  // Menor puntaje = mejor. Manda el gusto (platos conocidos y lo que te gusta); el costo solo
  // pesa por cuánto se aleja de lo que te toca gastar en esa comida.
  const puntaje = (s, r) => {
    const t = TIEMPO[s.comida];
    let p = -gustoDe.get(r.id) * 1.1;
    const meta = metaPorcion(s);
    const pp = deltaCaja(null, r, cocinar(s)) / cocinar(s); // lo que esta receta agrega a la caja, por porción
    if (meta > 0) {
      const desvio = Math.min(4, (pp - meta) / meta);
      p += desvio > 0 ? desvio * 2.2 : -desvio * 0.8;
    }
    const u = usos.get(r.id) || 0;
    p += u >= MAX_USOS[t] ? 50 : u * (t === 'desayuno' || t === 'refaccion' ? 1.2 : 4);
    if (calificaciones[r.id] === -1) p += 30;
    if (calificaciones[r.id] === 1) p -= 0.8;
    const ayer = diaAnterior(s.dia) && recetaEn(diaAnterior(s.dia), s.comida);
    if (ayer?.id === r.id) p += 3;
    const finDeSemana = s.dia === 'sab' || s.dia === 'dom';
    if (t === 'almuerzo' || t === 'cena') {
      const otra = recetaEn(s.dia, t === 'almuerzo' ? 'cena' : 'almuerzo');
      if (otra?.proteina === r.proteina && otra.id !== r.id) p += 1.5;
      if (ayer?.proteina === r.proteina) p += 1.2;
      const n = protPrincipal.get(r.proteina) || 0; // misma proteína en la semana: cada vez pesa más
      p += ahorrar ? Math.max(0, n - 2) * 0.4 : n * 0.5 + Math.max(0, n - 1) * 0.9;
      // el mismo plato fuerte con otros acompañamientos (o dos pupusas, dos sopas) en la semana: casi nunca
      p += (familias.get(familia(r)) || 0) * (r.familia ? 3 : 1.2);
      if (r.tecnica) p += (tecnicas.get(r.tecnica) || 0) * 0.9; // no cuatro "entomatados" en la semana
    }
    if (t === 'refaccion') {
      const otra = recetaEn(s.dia, s.comida === 'refaccion_am' ? 'refaccion_pm' : 'refaccion_am');
      if (otra && (otra.etiquetas || []).includes('dulce') === (r.etiquetas || []).includes('dulce')) p += 0.6;
      if (otra?.id === r.id) p += 2;
      if (!finDeSemana && r.minutos > 30) p += 1;
    }
    if (t === 'desayuno' && !finDeSemana && r.minutos > 25) p += 0.8;
    if (t === 'desayuno') p += Math.max(0, (familias.get(familia(r)) || 0) - 1) * 1.5; // "huevos picados" 5 días, no
    if ((r.etiquetas || []).includes('finde')) p += finDeSemana ? -0.6 : 0.8; // carne asada, tamales: mejor el fin de semana
    // balance: que cada día tenga verdura o fruta
    if (!verduraDia.has(s.dia) && tieneVerdura(r)) p -= ultimaDelDia.get(s.dia) === claveSlot(s.dia, s.comida) ? 1.2 : 0.3;
    // usar primero lo que está por vencer
    p -= Math.min(1.6, r.ing.filter(([id]) => vence.has(id)).length * 0.8);
    const reusa = r.ing.filter(([id]) => !INGREDIENTES[id]?.basico && ingUsados.has(id)).length;
    p -= ahorrar ? Math.min(2.4, reusa * 0.35) : Math.min(0.6, reusa * 0.1);
    if (estilos.has('rapido') && r.minutos > 45) p += 1;
    p -= r.ing.filter(([id]) => precios[id]?.oferta).length * 0.2;
    p += (rnd() - 0.5) * 1.4; // variedad entre "Generar otro"
    return p;
  };

  for (const s of slots) {
    const k = claveSlot(s.dia, s.comida);
    if (elegido[k] || enlaces[k]) continue;
    let mejor = null;
    let mejorP = Infinity;
    for (const r of candidatasPara(s)) {
      const p = puntaje(s, r);
      if (p < mejorP) { mejorP = p; mejor = r; }
    }
    usar(s, mejor);
  }

  const armarPlan = () => armar(slots, elegido, enlaces, destinosDe, porId, costo, cocinar, precios, desp);
  let plan = armarPlan();

  // ---- Rango OBLIGATORIO, medido con la caja (lo que de verdad se paga) ----
  // Si se pasa del máximo: cambiar la comida que más baja la caja perdiendo menos gusto (a veces es repetir un
  // ingrediente ya comprado). Si queda bajo el mínimo: mejorar la comida que más gusto suma sin pasarse.
  // Para que sea rápido con ~3000 recetas, en cada comida se prueban las más gustadas y las más baratas.
  const finalistas = new Map();
  const candidatosDe = (s) => {
    const k = `${TIEMPO[s.comida]}|${['sab', 'dom'].includes(s.dia) ? 'f' : 's'}|${destinosDe[claveSlot(s.dia, s.comida)] ? 'sob' : ''}|${perfil.comidas[s.comida]?.lonchera ? 'l' : ''}`;
    if (!finalistas.has(k)) {
      const c = candidatasPara(s).filter((r) => calificaciones[r.id] !== -1);
      const porGusto = [...c].sort((x, y) => gustoDe.get(y.id) - gustoDe.get(x.id)).slice(0, 90);
      const porPrecio = [...c].sort((x, y) => costo(x, 4).porPorcion - costo(y, 4).porPorcion).slice(0, 90);
      finalistas.set(k, [...new Set([...porGusto, ...porPrecio])]);
    }
    return finalistas.get(k);
  };
  const principal = (k) => ['almuerzo', 'cena'].includes(TIEMPO[porClave.get(k).comida]);
  // castigo por repetir dentro de la semana, para comparar cambios
  const repetido = (k, r) => {
    const otras = Object.entries(elegido).filter(([k2]) => k2 !== k && !enlaces[k2] && principal(k2) === principal(k)).map(([, id]) => porId.get(id));
    if (!principal(k)) return Math.max(0, otras.filter((o) => familia(o) === familia(r)).length - 1) * 1.5;
    return otras.filter((o) => o.proteina === r.proteina).length * (ahorrar ? 0.15 : 0.5) + otras.filter((o) => familia(o) === familia(r)).length * 2
      + (r.tecnica ? otras.filter((o) => o.tecnica === r.tecnica).length * 0.6 : 0);
  };
  const cambiar = (k, r) => {
    const sl = porClave.get(k);
    sumar(porId.get(elegido[k]), cocinar(sl), -1);
    sumar(r, cocinar(sl), 1);
    elegido[k] = r.id;
    for (const t2 of destinosDe[k] || []) elegido[t2] = r.id; // sus sobras también
  };
  const usosDe = () => {
    const m = new Map();
    for (const [k, id] of Object.entries(elegido)) if (!enlaces[k]) m.set(id, (m.get(id) || 0) + 1);
    return m;
  };
  let total = totalCaja();
  for (let i = 0; i < 120; i++) {
    const arriba = total > rango.max + 0.005;
    const abajo = !arriba && total < rango.min - 0.005 && !estilos.has('economico');
    if (!arriba && !abajo) break;
    const usadas = usosDe();
    let mejor = null;
    for (const sl of slots) {
      const k = claveSlot(sl.dia, sl.comida);
      if (fijos[k] || enlaces[k]) continue;
      const actual = porId.get(elegido[k]);
      const gActual = gustoDe.get(actual.id) - repetido(k, actual);
      for (const r of candidatosDe(sl)) {
        if (r.id === actual.id || (usadas.get(r.id) || 0) >= MAX_USOS[TIEMPO[sl.comida]]) continue;
        // el mismo plato fuerte con otros acompañamientos no entra dos veces en la semana
        if (r.familia && familia(r) !== familia(actual) && principal(k)
          && Object.entries(elegido).some(([k2, id]) => k2 !== k && !enlaces[k2] && principal(k2) && familia(porId.get(id)) === familia(r))) continue;
        const d = deltaCaja(actual, r, cocinar(sl));
        const dG = gustoDe.get(r.id) - repetido(k, r) - gActual;
        let valor;
        if (arriba) {
          if (d > -0.01) continue;
          // gusto que se pierde por cada dólar que baja la caja; los platos raros, último recurso
          valor = (dG - ((r.popularidad ?? 3) <= 2 ? 1.5 : 0)) / -d;
        } else {
          if (d < 0.01 || total + d > rango.max) continue;
          if (dG < -0.5) continue; // no "mejorar" a un plato que gusta menos
          valor = dG + Math.min(d, rango.min - total) * 0.3;
        }
        if (!mejor || valor > mejor.valor) mejor = { k, r, valor, d };
      }
    }
    if (!mejor) break;
    cambiar(mejor.k, mejor.r);
    total = totalCaja();
  }
  // Ya dentro del rango: mejorar gusto y variedad con cambios que no saquen la caja del rango
  for (let i = 0; i < 25; i++) {
    const usadas = usosDe();
    let mejor = null;
    for (const sl of slots) {
      const k = claveSlot(sl.dia, sl.comida);
      if (fijos[k] || enlaces[k]) continue;
      const actual = porId.get(elegido[k]);
      const gActual = gustoDe.get(actual.id) - repetido(k, actual);
      for (const r of candidatosDe(sl)) {
        if (r.id === actual.id || (usadas.get(r.id) || 0) >= MAX_USOS[TIEMPO[sl.comida]]) continue;
        const dG = gustoDe.get(r.id) - repetido(k, r) - gActual;
        if (dG < 0.6) continue;
        const d = deltaCaja(actual, r, cocinar(sl));
        const nuevo = total + d;
        const dentroAntes = total <= rango.max + 0.005 && (total >= rango.min - 0.005 || estilos.has('economico'));
        if (nuevo > rango.max + 0.005) continue;
        if (dentroAntes && nuevo < rango.min - 0.005 && !estilos.has('economico')) continue;
        const valor = dG - Math.max(0, d) * (estilos.has('economico') ? 0.6 : ahorrar ? 0.35 : 0.08);
        if (!mejor || valor > mejor.valor) mejor = { k, r, valor };
      }
    }
    if (!mejor) break;
    cambiar(mejor.k, mejor.r);
    total = totalCaja();
  }
  plan = armarPlan();
  plan.dentroPresupuesto = plan.total <= rango.max + 0.01 && (plan.total >= rango.min - 0.01 || estilos.has('economico'));
  if (plan.total > rango.max + 0.01) {
    // ni con lo más barato que cumple tus filtros alcanza: decirlo claro
    plan.imposible = true;
    plan.minimoPosible = plan.total;
  }
  plan.presupuesto = rango;
  plan.porVencer = porVencer(desp, hoy);
  return plan;
}

function armar(slots, elegido, enlaces, destinosDe, porId, costo, cocinar, precios, desp) {
  const cero = { total: 0, porPorcion: 0, aComprar: 0, estimado: false };
  const lista = slots.map((s) => {
    const k = claveSlot(s.dia, s.comida);
    const r = porId.get(elegido[k]);
    if (enlaces[k]) return { ...s, recetaId: r.id, sobraDe: enlaces[k], porcionesCocinar: 0, costo: cero };
    const pc = cocinar(s);
    const c = costo(r, pc);
    // el costo por porción es de la receta; lo "a comprar" incluye las porciones de las sobras
    return { ...s, recetaId: r.id, porcionesCocinar: pc, paraSobras: destinosDe[k] || [], costo: c };
  });
  const compras = calcularCompras(
    lista.filter((x) => !x.sobraDe).map((x) => ({ receta: porId.get(x.recetaId), porciones: x.porcionesCocinar })),
    precios, desp,
  );
  const porComida = {};
  for (const x of lista) porComida[x.comida] = r2((porComida[x.comida] || 0) + x.costo.aComprar);
  const dias = [...new Set(lista.map((x) => x.dia))];
  const diasSinVerdura = dias.filter((d) => !lista.some((x) => x.dia === d && tieneVerdura(porId.get(x.recetaId))));
  return {
    slots: lista,
    compras,
    porComida,
    total: r2(compras.reduce((s, c) => s + c.costo, 0)),
    estimado: compras.some((c) => c.estimado),
    balance: { dias: dias.length, diasSinVerdura },
  };
}

/**
 * Lista de compras de la semana: suma cantidades, descuenta la despensa y redondea a paquetes reales.
 * @param {Array<{receta, porciones}>} items
 */
/** Lo que se paga en la caja por `cantTotal` de un ingrediente: paquetes enteros, descontando lo que hay en casa */
export function costoCaja(id, cantTotal, precios, despensa = new Map()) {
  const ing = INGREDIENTES[id];
  if (!ing || ing.basico) return 0;
  const desp = despensa instanceof Map ? despensa : normalizarDespensa(despensa);
  const exacta = cantTotal - disponible(desp, id);
  if (exacta <= 0.0001) return 0;
  const cant = ing.unidad === 'und' ? Math.ceil(exacta - 0.01) : exacta;
  if (cant <= 0) return 0;
  const pr = precios[id] || { precioUnit: precioRef(id) };
  const opciones = [pr.producto, ...(pr.alternativas || [])].filter((p) => p?.contenido && p.precio);
  if (!opciones.length) return cant * pr.precioUnit;
  let mejor = Infinity;
  for (const p of opciones) mejor = Math.min(mejor, Math.max(1, Math.ceil(cant / p.contenido - 0.08)) * p.precio);
  return mejor;
}

export function calcularCompras(items, precios, despensa = new Map()) {
  const desp = despensa instanceof Map ? despensa : normalizarDespensa(despensa);
  const necesita = new Map();
  for (const { receta: r, porciones } of items) {
    const f = porciones / r.porciones;
    for (const [id, cant] of r.ing) {
      const ing = INGREDIENTES[id];
      if (!ing || ing.basico) continue;
      necesita.set(id, (necesita.get(id) || 0) + cant * f);
    }
  }
  const out = [];
  for (const [id, total] of necesita) {
    const cantExacta = total - disponible(desp, id);
    if (cantExacta <= 0.0001) continue;
    const ing = INGREDIENTES[id];
    const cant = ing.unidad === 'und' ? Math.ceil(cantExacta - 0.01) : cantExacta; // no se compra medio huevo
    if (cant <= 0) continue;
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
        const tot = n * p.precio;
        if (!mejor || tot < mejor.total - 0.005 || (Math.abs(tot - mejor.total) < 0.005 && p.precio / p.contenido < mejor.p.precio / mejor.p.contenido)) {
          mejor = { p, n, total: tot };
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
      enCasa: Number.isFinite(disponible(desp, id)) && disponible(desp, id) > 0 ? r2(disponible(desp, id)) : 0,
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
