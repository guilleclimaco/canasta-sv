// Arma el menú de la semana con los precios reales de las tiendas.
// Lógica pura (sin red ni DOM) para poder probarla.
import { INGREDIENTES } from './ingredientes.js';
import { RECETAS } from './recetas.js';

export const DIAS = [
  ['lun', 'Lunes'], ['mar', 'Martes'], ['mie', 'Miércoles'], ['jue', 'Jueves'],
  ['vie', 'Viernes'], ['sab', 'Sábado'], ['dom', 'Domingo'],
];

export const PERFIL_INICIAL = {
  adultos: 2,
  ninos: 0,
  dias: ['lun', 'mar', 'mie', 'jue', 'vie'],
  presupuesto: 35, // USD por semana, solo almuerzos
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
  // cada palabra del término debe ser el INICIO de una palabra del producto
  // ("crema" sí en "crema acida", no en "semidescremada")
  const coincide = (ing.terminos || []).some((t) => t.split(' ').every((w) => palabras.some((x) => x.startsWith(w))));
  if (!coincide) return false;
  for (const ex of ing.excluir || []) {
    if (ex.includes(' ')) { if (nombre.includes(ex)) return false; continue; }
    // palabras cortas: palabra exacta; largas: prefijo (empaniz → empanizado)
    if (palabras.some((w) => (ex.length >= 4 ? w.startsWith(ex) : w === ex))) return false;
  }
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

/** Recetas que se pueden hacer con los aparatos y gustos del perfil */
export function recetasPosibles(perfil) {
  const aparatos = new Set([...(perfil.aparatos || []), 'estufa']);
  const evitar = new Set(perfil.evitar || []);
  const soloVeg = (perfil.estilos || []).includes('vegetariano');
  return RECETAS.filter((r) =>
    r.aparatos.every((a) => aparatos.has(a) || a === 'licuadora') &&
    !evitar.has(r.proteina) &&
    !r.ing.some(([id]) => evitar.has(id)) &&
    (!soloVeg || r.etiquetas.includes('vegetariano')));
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
 * Arma el menú.
 * @param {object} o
 * @param {object} o.perfil      ver PERFIL_INICIAL
 * @param {object} o.precios     salida de preciosIngredientes()
 * @param {Set}    o.despensa    ids de ingredientes que ya hay en casa
 * @param {number} o.semilla     cambia la semilla para obtener otro menú
 * @param {object} o.fijos       { dia: recetaId } días que no se deben cambiar
 * @param {string[]} o.excluir   recetas que no se deben usar (p. ej. la que se quiere cambiar)
 */
export function planificar({ perfil, precios, despensa = new Set(), semilla = 1, fijos = {}, excluir = [] }) {
  const porciones = porcionesDe(perfil);
  const dias = DIAS.map(([d]) => d).filter((d) => (perfil.dias || []).includes(d));
  const posibles = recetasPosibles(perfil);
  if (!posibles.length) return { error: 'Ninguna receta cumple con tus gustos y aparatos. Quita algo de "No me gusta".', dias: [], compras: [], total: 0 };
  const rnd = mulberry32(semilla);
  const estilos = new Set(perfil.estilos || []);
  const costos = new Map(posibles.map((r) => [r.id, costoReceta(r, porciones, precios, despensa)]));
  const porId = new Map(RECETAS.map((r) => [r.id, r]));
  for (const id of Object.values(fijos)) if (porId.has(id) && !costos.has(id)) costos.set(id, costoReceta(porId.get(id), porciones, precios, despensa));

  const elegido = {};
  const usados = new Map();
  const ingUsados = new Set();
  const prot = new Map();
  const usar = (dia, r) => {
    elegido[dia] = r.id;
    usados.set(r.id, (usados.get(r.id) || 0) + 1);
    prot.set(r.proteina, (prot.get(r.proteina) || 0) + 1);
    r.ing.forEach(([id]) => ingUsados.add(id));
  };
  // primero los días fijos
  for (const d of dias) if (fijos[d] && porId.has(fijos[d])) usar(d, porId.get(fijos[d]));

  let anterior = null;
  for (const d of dias) {
    if (elegido[d]) { anterior = porId.get(elegido[d]); continue; }
    let mejor = null;
    let mejorScore = Infinity;
    for (const r of posibles) {
      if (excluir.includes(r.id) && posibles.length > excluir.length) continue;
      const c = costos.get(r.id);
      let s = c.aComprar;
      const vecesUsada = usados.get(r.id) || 0;
      if (vecesUsada) s += posibles.length > dias.length ? 100 : 4 * vecesUsada;
      if (anterior && anterior.proteina === r.proteina) s += 1.5;
      s += Math.max(0, (prot.get(r.proteina) || 0) - 1) * 1.0;
      const reusa = r.ing.filter(([id]) => !INGREDIENTES[id]?.basico && ingUsados.has(id)).length;
      s -= Math.min(1, reusa * 0.2); // reaprovecha lo que ya se compra
      s -= r.etiquetas.filter((e) => estilos.has(e)).length * 0.6;
      if (estilos.has('rapido') && r.minutos > 45) s += 1;
      s -= r.ing.filter(([id]) => precios[id]?.oferta).length * 0.3;
      s += (rnd() - 0.5) * 2.6; // variedad entre "Generar otro"
      if (s < mejorScore) { mejorScore = s; mejor = r; }
    }
    usar(d, mejor);
    anterior = mejor;
  }

  let plan = armar(dias, elegido, porId, costos, porciones, precios, despensa);

  // Ajustar al presupuesto: cambiar el día más caro por una receta más barata no usada
  const pres = Number(perfil.presupuesto) || 0;
  for (let i = 0; pres && plan.total > pres && i < 12; i++) {
    const cambiables = plan.dias.filter((x) => !fijos[x.dia]).sort((a, b) => b.costo.aComprar - a.costo.aComprar);
    let cambiado = false;
    for (const x of cambiables) {
      const usadas = new Set(Object.values(elegido));
      const alt = posibles
        .filter((r) => !usadas.has(r.id) && !excluir.includes(r.id) && costos.get(r.id).aComprar < x.costo.aComprar - 0.01)
        .sort((a, b) => costos.get(a.id).aComprar - costos.get(b.id).aComprar)[0];
      if (alt) { elegido[x.dia] = alt.id; cambiado = true; break; }
    }
    if (!cambiado) break;
    plan = armar(dias, elegido, porId, costos, porciones, precios, despensa);
  }
  plan.dentroPresupuesto = !pres || plan.total <= pres;
  plan.presupuesto = pres;
  return plan;
}

function armar(dias, elegido, porId, costos, porciones, precios, despensa) {
  const lista = dias.map((d) => ({ dia: d, recetaId: elegido[d], costo: costos.get(elegido[d]) }));
  const compras = calcularCompras(lista.map((x) => porId.get(x.recetaId)), porciones, precios, despensa);
  return {
    porciones,
    dias: lista,
    compras,
    total: r2(compras.reduce((s, c) => s + c.costo, 0)),
    estimado: compras.some((c) => c.estimado),
  };
}

/** Lista de compras de la semana: suma cantidades y redondea a paquetes reales cuando hay producto. */
export function calcularCompras(recetas, porciones, precios, despensa = new Set()) {
  const necesita = new Map();
  for (const r of recetas) {
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
