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

/**
 * La receta como la vas a cocinar: si algo que no te gusta es solo acompañamiento opcional (el curtido de las
 * pupusas), se quita del nombre, los pasos y las compras; el plato queda igual.
 */
export function adaptarReceta(r, perfil) {
  if (!r?.opcionales?.length || !perfil?.evitar?.length) return r;
  const evitar = new Set(perfil.evitar);
  if (!r.opcionales.some((id) => evitar.has(id))) return r;
  const quitar = new Set(r.opcionales); // el curtido va completo o no va
  return {
    ...r,
    nombre: r.nombre.replace(/,? con curtido( y salsa)?/i, (m, salsa) => (salsa ? ' con salsa' : '')).replace(/ y curtido$/i, '').trim(),
    ing: r.ing.filter(([id]) => !quitar.has(id)),
    pasos: r.pasos.map(sinCurtido).filter(Boolean),
    sinCurtido: true,
  };
}

/** Un paso de receta sin el curtido ("Sirve con curtido y salsa" → "Sirve con salsa"); null si el paso era solo el curtido */
function sinCurtido(paso) {
  const t = paso.trim();
  if (/^curtido\b/i.test(t)) return null;
  const conSalsa = /^prepara (el )?curtido[^.]*?(?:,| y) (una salsa[^.]*)\.?$/i.exec(t);
  if (conSalsa) return `Prepara ${conSalsa[2]}.`;
  if (/^prepara (el )?curtido/i.test(t)) return null;
  return t.replace(/con curtido y /gi, 'con ').replace(/, curtido,/gi, ',').replace(/, curtido y /gi, ' y ')
    .replace(/ curtido, /gi, ' ').replace(/ con curtido\.?$/i, '.');
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
      !r.ing.some(([id]) => evitar.has(id) && !(r.opcionales || []).includes(id)) &&
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
export function planificar(opciones) {
  const plan = planificarUnaVez(opciones);
  const perfil = normalizarPerfil(opciones.perfil);
  if (plan.error || !plan.presupuesto || plan.total <= plan.presupuesto.max + 0.01 || perfil.estilos.includes('economico') && perfil.repetirParaAhorrar) return plan;
  // un menú guardado que se recalcula con todo fijo no tiene nada que probar
  if (plan.slots.every((x) => x.sobraDe || (opciones.fijos || {})[claveSlot(x.dia, x.comida)])) return plan;
  // No cupo: probar varios arranques en modo ahorro (repetir ingredientes, apuntar al mínimo). Cómo empieza la semana
  // cambia mucho el resultado; se queda con el que cumple el rango y más gusta, o si ninguno cumple, con el más barato.
  const intentos = [plan];
  const ahorro = { ...opciones.perfil, repetirParaAhorrar: true, estilos: [...new Set([...(perfil.estilos || []), 'economico'])] };
  for (let i = 0; i < 8; i++) {
    const otro = planificarUnaVez({ ...opciones, perfil: i % 2 ? ahorro : { ...opciones.perfil, repetirParaAhorrar: true }, semilla: (opciones.semilla || 1) + (i + 1) * 7919 });
    if (otro.error) continue;
    intentos.push(otro);
    // con 2 que caben ya se puede elegir el que más gusta; probar más solo si todavía no cabe ninguno
    if (intentos.filter((x) => x.total <= plan.presupuesto.max + 0.01).length >= 2) break;
  }
  const max = plan.presupuesto.max;
  const caben = intentos.filter((x) => x.total <= max + 0.01);
  const elegido = caben.length
    ? caben.sort((a, b) => b.gustoTotal - a.gustoTotal)[0]
    : intentos.sort((a, b) => a.total - b.total)[0];
  // el rango que se muestra es el del usuario (no el del modo ahorro)
  elegido.presupuesto = plan.presupuesto;
  elegido.dentroPresupuesto = elegido.total <= max + 0.01 && elegido.total >= plan.presupuesto.min - 0.01;
  elegido.imposible = elegido.total > max + 0.01;
  if (elegido.imposible) elegido.minimoPosible = elegido.total;
  else { delete elegido.minimoPosible; if (caben.length && elegido !== plan) elegido.ahorroForzado = true; }
  return elegido;
}

function planificarUnaVez({
  perfil: perfilEntrada, precios, despensa = new Map(), semilla = 1, fijos = {}, excluir = [],
  recetas = RECETAS, calificaciones = {}, sobras = {}, sinSobras = [], hoy = new Date(),
}) {
  const perfil = normalizarPerfil(perfilEntrada);
  recetas = recetas.map((r) => adaptarReceta(r, perfil)); // sin el curtido si no te gusta el repollo
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
  // Para que sea rápido (se calcula cientos de miles de veces): por ingrediente, sus presentaciones se preparan una sola vez.
  const infoCaja = new Map();
  const infoDe = (id) => {
    let f = infoCaja.get(id);
    if (f === undefined) {
      const ing = INGREDIENTES[id];
      if (!ing || ing.basico) f = null;
      else {
        const pr = precios[id] || { precioUnit: precioRef(id) };
        const opts = [pr.producto, ...(pr.alternativas || [])].filter((x) => x?.contenido && x.precio)
          .map((x) => [x.contenido, x.precio, porPeso(x)]); // todas: para poquito conviene el paquete chico
        const hay = disponible(desp, id);
        f = { opts, unit: pr.precioUnit, und: ing.unidad === 'und', hay: Number.isFinite(hay) ? hay : Infinity };
      }
      infoCaja.set(id, f);
    }
    return f;
  };
  const cajaDe = (id, cant) => {
    const f = infoDe(id);
    if (!f) return 0;
    const exacta = cant - f.hay;
    if (exacta <= 0.0001) return 0;
    const c = f.und ? Math.ceil(exacta - 0.01) : exacta;
    if (c <= 0) return 0;
    if (!f.opts.length) return c * f.unit;
    let m = Infinity;
    for (const [cont, pr, peso] of f.opts) {
      const v = peso ? Math.max(0.5, Math.ceil((c / cont) * 4 - 0.08) / 4) * pr : Math.max(1, Math.ceil(c / cont - 0.08)) * pr;
      if (v < m) m = v;
    }
    return m;
  };
  const cacheAportes = new WeakMap();
  const aportes = (r, porciones) => {
    let porR = cacheAportes.get(r);
    if (!porR) { porR = new Map(); cacheAportes.set(r, porR); }
    let a = porR.get(porciones);
    if (!a) {
      a = r.ing.filter(([id]) => INGREDIENTES[id] && !INGREDIENTES[id].basico).map(([id, cant]) => [id, (cant * porciones) / r.porciones]);
      porR.set(porciones, a);
    }
    return a;
  };
  const sumar = (r, porciones, signo) => {
    for (const [id, q] of aportes(r, porciones)) necesidad.set(id, Math.max(0, (necesidad.get(id) || 0) + signo * q));
  };
  /** Cuánto sube (o baja) la caja si en una comida se cambia `viejo` por `nuevo` (cualquiera puede ser null) */
  const tmpIds = [];
  const tmpQ = [];
  const deltaCaja = (viejo, nuevo, porciones) => {
    tmpIds.length = 0;
    tmpQ.length = 0;
    const acumular = (lista, signo) => {
      for (const [id, q] of lista) {
        const i = tmpIds.indexOf(id);
        if (i >= 0) tmpQ[i] += signo * q;
        else { tmpIds.push(id); tmpQ.push(signo * q); }
      }
    };
    if (viejo) acumular(aportes(viejo, porciones), -1);
    if (nuevo) acumular(aportes(nuevo, porciones), 1);
    let d = 0;
    for (let i = 0; i < tmpIds.length; i++) {
      if (Math.abs(tmpQ[i]) < 1e-9) continue;
      const antes = necesidad.get(tmpIds[i]) || 0;
      d += cajaDe(tmpIds[i], Math.max(0, antes + tmpQ[i])) - cajaDe(tmpIds[i], antes);
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
  // cuántas veces puede salir la misma receta en la semana; ahorrando, como en casa: huevos con frijoles 4 mañanas
  const maxUsos = ahorrar ? { desayuno: 4, refaccion: 4, almuerzo: 2, cena: 3 } : MAX_USOS;
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
  // Costumbres de la semana en El Salvador (premio, más alto = más acorde): pupusas el sábado en la noche;
  // domingo, tamales o pupusas de desayuno y sopa o carne asada de almuerzo; entre semana el desayuno es rápido.
  const costumbre = (s, r) => {
    const t = TIEMPO[s.comida];
    const fam = familia(r);
    const finde = s.dia === 'sab' || s.dia === 'dom';
    let c = 0;
    if (s.comida === 'cena' && fam === 'pupusas') c += s.dia === 'sab' ? 3.5 : s.dia === 'vie' || s.dia === 'dom' ? 0.5 : -0.8;
    if (s.dia === 'dom' && t === 'desayuno' && (fam === 'pupusas' || fam === 'tamales' || r.id === 'desayuno-tipico')) c += 1;
    if (s.dia === 'dom' && t === 'almuerzo' && (fam === 'sopa' || /carne-asada|costilla|chumpe|pavo/.test(r.id))) c += 0.9;
    if (!finde && t === 'desayuno' && (fam === 'pupusas' || fam === 'tamales')) c -= 1;
    if ((t === 'almuerzo' || t === 'cena') && (r.etiquetas || []).includes('dulce')) c -= 1.5; // lo dulce es refacción o desayuno
    return c;
  };
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
    p += u >= maxUsos[t] ? 50 : u * (t === 'desayuno' || t === 'refaccion' ? 1.2 : 4);
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
      p += (familias.get(familia(r)) || 0) * (r.familia ? 3 : 1.2) * (ahorrar ? 0.3 : 1);
      if (r.tecnica) p += (tecnicas.get(r.tecnica) || 0) * 0.9 * (ahorrar ? 0.3 : 1); // no cuatro "entomatados" en la semana
    }
    if (t === 'refaccion') {
      const otra = recetaEn(s.dia, s.comida === 'refaccion_am' ? 'refaccion_pm' : 'refaccion_am');
      if (otra && (otra.etiquetas || []).includes('dulce') === (r.etiquetas || []).includes('dulce')) p += 0.6;
      if (otra?.id === r.id) p += 2;
      if (!finDeSemana && r.minutos > 30) p += 1;
    }
    if (t === 'desayuno' && !finDeSemana && r.minutos > 25) p += 0.8;
    if (t === 'desayuno') p += Math.max(0, (familias.get(familia(r)) || 0) - (ahorrar ? 3 : 1)) * 1.5; // "huevos picados" 5 días, no (ahorrando, sí)
    if ((r.etiquetas || []).includes('finde')) p += finDeSemana ? -0.6 : 0.8; // carne asada, tamales: mejor el fin de semana
    p -= costumbre(s, r);
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
      const porPrecio = [...c].sort((x, y) => costo(x, 4).porPorcion - costo(y, 4).porPorcion);
      finalistas.set(k, [...new Set([...porGusto, ...porPrecio.slice(0, 90), ...porPrecio.slice(-60)])]);
    }
    return finalistas.get(k);
  };
  const principal = (k) => ['almuerzo', 'cena'].includes(TIEMPO[porClave.get(k).comida]);
  // castigo por repetir dentro de la semana, para comparar cambios. Se lleva la cuenta (proteína, familia y estilo,
  // separada para almuerzo/cena y para desayuno/refacción) y se recalcula solo cuando cambia una comida.
  let cuenta = null;
  const contar = () => {
    const c = { true: { prot: new Map(), fam: new Map(), tec: new Map() }, false: { prot: new Map(), fam: new Map(), tec: new Map() } };
    const mas = (m, x) => x != null && m.set(x, (m.get(x) || 0) + 1);
    for (const [k2, id] of Object.entries(elegido)) {
      if (enlaces[k2]) continue;
      const r2 = porId.get(id);
      const g = c[principal(k2)];
      mas(g.prot, r2.proteina); mas(g.fam, familia(r2)); mas(g.tec, r2.tecnica);
    }
    cuenta = c;
  };
  const otrasCon = (k, mapa, clave, valor) => {
    if (valor == null) return 0;
    const propio = porId.get(elegido[k]);
    const n = cuenta[principal(k)][mapa].get(valor) || 0;
    return n - (propio && (mapa === 'fam' ? familia(propio) : mapa === 'prot' ? propio.proteina : propio.tecnica) === valor ? 1 : 0);
  };
  const repetido = (k, r) => {
    const fam = otrasCon(k, 'fam', 'fam', familia(r));
    if (!principal(k)) return Math.max(0, fam - (ahorrar ? 3 : 1)) * 1.5;
    return otrasCon(k, 'prot', 'prot', r.proteina) * (ahorrar ? 0.15 : 0.5) + fam * (ahorrar ? 0.6 : 2)
      + (r.tecnica ? otrasCon(k, 'tec', 'tec', r.tecnica) * (ahorrar ? 0.2 : 0.6) : 0);
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
  /**
   * Movida grande, para cuando ningún cambio de UNA comida baja la caja (el paquete se compra igual por las demás):
   * dejar de comprar un ingrediente en toda la semana, cambiando todas las comidas que lo usan por lo más barato
   * que no lo lleve. Devuelve { valor, cambios, ahorro } sin aplicar nada.
   */
  const probarSinIngrediente = (id) => {
    const usan = slots.filter((sl) => {
      const k = claveSlot(sl.dia, sl.comida);
      return !enlaces[k] && aportes(porId.get(elegido[k]), cocinar(sl)).some(([i]) => i === id);
    });
    if (!usan.length || usan.some((sl) => fijos[claveSlot(sl.dia, sl.comida)])) return null;
    const antes = totalCaja();
    const hechos = [];
    let dG = 0;
    const usadas = usosDe();
    let ok = true;
    for (const sl of usan) {
      const k = claveSlot(sl.dia, sl.comida);
      const actual = porId.get(elegido[k]);
      const gActual = gustoDe.get(actual.id) - repetido(k, actual) + costumbre(sl, actual);
      let mejor = null;
      for (const r of candidatosDe(sl)) {
        if (r.id === actual.id || (usadas.get(r.id) || 0) >= maxUsos[TIEMPO[sl.comida]]) continue;
        if (aportes(r, cocinar(sl)).some(([i]) => i === id)) continue;
        if (r.familia && familia(r) !== familia(actual) && principal(k) && otrasCon(k, 'fam', 'fam', familia(r)) >= 3) continue;
        const d = deltaCaja(actual, r, cocinar(sl));
        const g = gustoDe.get(r.id) - repetido(k, r) + costumbre(sl, r) - gActual;
        const v = g - d * 3; // lo barato manda: se está apagando un incendio
        if (!mejor || v > mejor.v) mejor = { r, v, g };
      }
      if (!mejor) { ok = false; break; }
      hechos.push([k, actual]);
      usadas.set(mejor.r.id, (usadas.get(mejor.r.id) || 0) + 1);
      usadas.set(actual.id, (usadas.get(actual.id) || 1) - 1);
      cambiar(k, mejor.r);
      dG += mejor.g;
    }
    const ahorro = antes - totalCaja();
    const cambios = hechos.map(([k]) => [k, porId.get(elegido[k])]);
    hechos.reverse().forEach(([k, viejo]) => cambiar(k, viejo)); // deshacer: solo se estaba probando
    return ok && ahorro > 0.02 ? { valor: dG / ahorro, cambios, ahorro } : null;
  };
  let total = totalCaja();
  for (let i = 0; i < 120; i++) {
    const arriba = total > rango.max + 0.005;
    const abajo = !arriba && total < rango.min - 0.005 && !estilos.has('economico');
    if (!arriba && !abajo) break;
    contar();
    const usadas = usosDe();
    let mejor = null;
    for (const sl of slots) {
      const k = claveSlot(sl.dia, sl.comida);
      if (fijos[k] || enlaces[k]) continue;
      const actual = porId.get(elegido[k]);
      const gActual = gustoDe.get(actual.id) - repetido(k, actual) + costumbre(sl, actual);
      for (const r of candidatosDe(sl)) {
        if (r.id === actual.id || (usadas.get(r.id) || 0) >= maxUsos[TIEMPO[sl.comida]]) continue;
        // el mismo plato fuerte con otros acompañamientos no entra dos veces en la semana
        // (si el presupuesto no alcanza, hasta dos veces: huevos con frijoles dos noches es normal)
        if (r.familia && familia(r) !== familia(actual) && principal(k) && otrasCon(k, 'fam', 'fam', familia(r)) >= (ahorrar ? 3 : arriba ? 2 : 1)) continue;
        const d = deltaCaja(actual, r, cocinar(sl));
        const dG = gustoDe.get(r.id) - repetido(k, r) + costumbre(sl, r) - gActual;
        let valor;
        if (arriba) {
          if (d > -0.01) continue;
          // gusto que se pierde por cada dólar que baja la caja; los platos raros, último recurso
          valor = (dG - ((r.popularidad ?? 3) <= 2 ? 1.5 : 0)) / -d;
        } else {
          if (d < 0.01 || total + d > rango.max) continue;
          // primero cambios que no bajan el gusto; si no hay, el que pierde menos gusto por dólar (el mínimo es obligatorio)
          valor = dG >= -0.5 ? 1000 + dG + Math.min(d, rango.min - total) * 0.3 : dG / d;
        }
        if (!mejor || valor > mejor.valor) mejor = { k, r, valor, d };
      }
    }
    if (!mejor && arriba) {
      // trabado arriba del máximo: probar dejar de comprar alguno de los ingredientes que más pesan en la caja
      const caros = [...necesidad].filter(([, q]) => q > 0).map(([id, q]) => [id, cajaDe(id, q)])
        .filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).slice(0, 12);
      let grupo = null;
      for (const [id] of caros) {
        const prueba = probarSinIngrediente(id);
        if (prueba && (!grupo || prueba.valor > grupo.valor)) grupo = prueba;
      }
      if (grupo) {
        grupo.cambios.forEach(([k, r]) => cambiar(k, r));
        total = totalCaja();
        continue;
      }
    }
    if (!mejor) break;
    cambiar(mejor.k, mejor.r);
    total = totalCaja();
  }
  // Ya dentro del rango: mejorar gusto y variedad con cambios que no saquen la caja del rango
  for (let i = 0; i < 25; i++) {
    contar();
    const usadas = usosDe();
    let mejor = null;
    for (const sl of slots) {
      const k = claveSlot(sl.dia, sl.comida);
      if (fijos[k] || enlaces[k]) continue;
      const actual = porId.get(elegido[k]);
      const gActual = gustoDe.get(actual.id) - repetido(k, actual) + costumbre(sl, actual);
      for (const r of candidatosDe(sl)) {
        if (r.id === actual.id || (usadas.get(r.id) || 0) >= maxUsos[TIEMPO[sl.comida]]) continue;
        const dG = gustoDe.get(r.id) - repetido(k, r) + costumbre(sl, r) - gActual;
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
  } else if (plan.total < rango.min - 0.01 && !estilos.has('economico')) {
    // ni con los platos más completos se llega al mínimo (pocas comidas para ese presupuesto)
    plan.imposible = true;
    plan.maximoPosible = plan.total;
  }
  plan.presupuesto = rango;
  plan.porVencer = porVencer(desp, hoy);
  plan.gustoTotal = plan.slots.reduce((g, x) => g + (gustoDe.get(x.recetaId) || 0), 0);
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
/**
 * Carne, hígado, verdura "precio indicado por libra": se vende al peso, se pide lo que hace falta (de ¼ en ¼ de libra,
 * mínimo media libra), no la libra entera. Una bolsa de "2 libras" sí es paquete.
 */
export const porPeso = (p) => !!p && /precio indicado por|por (libra|lb)\b/i.test(p.nombre || '') && p.contenido > 440 && p.contenido < 470;
/** Cuánto se compra de una presentación para cubrir `cant`: { n (paquetes, o libras si es al peso), total } */
export function compraDe(p, cant) {
  if (porPeso(p)) {
    const n = Math.max(0.5, Math.ceil((cant / p.contenido) * 4 - 0.08) / 4);
    return { n, total: n * p.precio };
  }
  const n = Math.max(1, Math.ceil(cant / p.contenido - 0.08)); // 8 % de tolerancia
  return { n, total: n * p.precio };
}

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
  for (const p of opciones) mejor = Math.min(mejor, compraDe(p, cant).total);
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
        const { n, total: tot } = compraDe(p, cant);
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
      ingId: id, nombre: ing.nombre, necesita: r2(cant), unidad: ing.unidad, paquetes, alPeso: porPeso(producto),
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
