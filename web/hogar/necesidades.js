// Necesidades de la casa: cuánto queda de cada artículo, para cuántos días alcanza, cuánto llevar,
// en qué presentación y cuándo conviene abastecerse por una oferta. Aprende el ritmo real de consumo.
// Lógica pura (sin red ni DOM): la usan la app y el robot de avisos.
import { ARTICULOS_HOGAR } from './catalogo.js';

const DIA = 86400000;
export const CONFIG_HOGAR = {
  horizonte: 15,      // cada cuántos días haces la compra grande
  colchon: 7,         // días extra de seguridad
  aprovechar: true,   // comprar de más cuando hay oferta
  mesesMax: 3,        // hasta cuántos meses abastecerse con una oferta
  descuentoMin: 15,   // % mínimo para considerarlo oferta
};

export const normal = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const palabras = (s) => normal(s).split(/[^a-z0-9]+/).filter(Boolean);
const r2 = (n) => Math.round(n * 100) / 100;
const dias = (desde, hasta) => Math.max(0, (new Date(hasta) - new Date(desde)) / DIA);

/** Términos de búsqueda de un artículo (los del catálogo, o el nombre si es uno propio) */
export function terminosDe(art) {
  const cat = ARTICULOS_HOGAR[art.catalogo];
  return cat ? cat.terminos : [normal(art.nombre)];
}

/** Términos extra con marca preferida, para que el robot también los busque */
export function terminosConMarca(articulos) {
  return [...new Set(articulos.filter((a) => a.activo !== false && a.marca)
    .map((a) => normal(`${terminosDe(a)[0]} ${a.marca}`)))];
}

/** ¿Este producto de tienda sirve para este artículo (y su marca preferida)? */
export function productoValidoHogar(art, p) {
  if (!p?.precio || !p.contenido) return false;
  const cat = ARTICULOS_HOGAR[art.catalogo];
  const unidades = [art.unidad || cat?.unidad, ...(cat?.acepta || [])].filter(Boolean);
  if (unidades.length && !unidades.includes(p.unidad)) return false;
  const nombre = normal(p.busqueda || p.nombre);
  const ws = palabras(nombre);
  const coincide = terminosDe(art).some((t) => palabras(t).every((w) => ws.some((x) => x.startsWith(w))));
  if (!coincide) return false;
  for (const ex of cat?.excluir || []) {
    if (ex.includes(' ')) { if (nombre.includes(ex)) return false; continue; }
    if (ws.some((w) => (ex.length >= 4 ? w.startsWith(ex) : w === ex))) return false;
  }
  if (art.marca && !palabras(art.marca).every((m) => ws.some((x) => x.startsWith(m)))) return false;
  return true;
}

export function stockEstimado(art, hoy = new Date()) {
  const stock = Number(art.stock) || 0;
  if (!art.stock_fecha) return stock;
  return Math.max(0, stock - (Number(art.consumo_mes) || 0) / 30 * dias(art.stock_fecha, hoy));
}

export function diasRestantes(art, hoy = new Date()) {
  const porDia = (Number(art.consumo_mes) || 0) / 30;
  return porDia > 0 ? stockEstimado(art, hoy) / porDia : Infinity;
}

export function estadoDe(diasQuedan, stockEst, horizonte) {
  if (stockEst <= 0.0001 || diasQuedan < 0.5) return 'agotado';
  if (diasQuedan <= 7) return 'urgente';
  if (diasQuedan <= horizonte) return 'pronto';
  return 'ok';
}

/** Productos que sirven, en las tiendas activas, sin presentaciones absurdas para el consumo de la casa */
export function opcionesProducto(art, candidatos, { tiendas = null, mesesMax = CONFIG_HOGAR.mesesMax } = {}) {
  const consumo = Number(art.consumo_mes) || 0;
  const tope = consumo > 0 ? consumo * Math.max(mesesMax, 1) * 1.5 : Infinity;
  const vistos = new Set();
  return (candidatos || [])
    .filter((p) => (!tiendas?.length || tiendas.includes(p.tienda)) && productoValidoHogar(art, p) && p.contenido <= tope)
    .filter((p) => (vistos.has(p.id) ? false : vistos.add(p.id)))
    .sort((a, b) => a.precio / a.contenido - b.precio / b.contenido);
}

const descuentoPct = (p) => (p.precio_lista > p.precio ? Math.round(100 * (1 - p.precio / p.precio_lista)) : 0);

/**
 * Recomendación para un artículo.
 * @returns {{estado, dias, stockEst, necesidad, motivo: 'comprar'|'oferta'|null, producto, paquetes, costo, oferta, opciones, estimado}}
 */
export function recomendar(art, candidatos, opciones = {}) {
  const o = { ...CONFIG_HOGAR, ...opciones };
  const hoy = o.hoy || new Date();
  const consumo = Number(art.consumo_mes) || 0;
  const porDia = consumo / 30;
  const stockEst = stockEstimado(art, hoy);
  const d = diasRestantes(art, hoy);
  const estado = estadoDe(d, stockEst, o.horizonte);
  const ops = opcionesProducto(art, candidatos, o);
  const necesidad = Math.max(0, porDia * (o.horizonte + o.colchon) - stockEst);
  const capacidad = Math.max(0, consumo * o.mesesMax - stockEst); // lo máximo que vale la pena tener en casa
  const ref = ARTICULOS_HOGAR[art.catalogo]?.ref;

  let motivo = null;
  let producto = null;
  let paquetes = 0;
  let oferta = null;

  if (necesidad > 0) {
    motivo = 'comprar';
    // mejor precio por unidad entre las presentaciones que no hacen comprar más de lo que cabe
    const sirven = ops.filter((p) => Math.ceil(necesidad / p.contenido) * p.contenido <= Math.max(capacidad, p.contenido));
    producto = sirven[0] || ops.slice().sort((a, b) => a.precio - b.precio)[0] || null;
    if (producto) paquetes = Math.max(1, Math.ceil(necesidad / producto.contenido - 0.05));
  }

  // ¿hay oferta que valga la pena para abastecerse? (la más barata por unidad entre las que tienen descuento)
  if (o.aprovechar && consumo > 0) {
    const p = ops.find((x) => descuentoPct(x) >= o.descuentoMin);
    if (p) {
      const n = Math.min(6, Math.floor(capacidad / p.contenido));
      const nNecesario = necesidad > 0 ? Math.max(1, Math.ceil(necesidad / p.contenido - 0.05)) : 0;
      const igualOMejor = !producto || p.precio / p.contenido <= producto.precio / producto.contenido + 1e-9;
      if (n >= 1 && n >= nNecesario && igualOMejor) {
        producto = p;
        paquetes = n;
        oferta = { pct: descuentoPct(p), ahorro: r2((p.precio_lista - p.precio) * n), meses: r2((stockEst + n * p.contenido) / consumo) };
        if (!motivo) motivo = 'oferta';
      }
    }
  }
  if (producto && paquetes === 0 && motivo) paquetes = 1;

  const costo = producto ? r2(paquetes * producto.precio) : r2(necesidad * (ref || 0));
  return { estado, dias: d, stockEst, necesidad, motivo, producto, paquetes, costo, oferta, opciones: ops, estimado: !producto };
}

/** Plan de todos los artículos activos, agrupado para la pantalla */
export function planHogar(articulos, candidatos, opciones = {}) {
  const recs = articulos.filter((a) => a.activo !== false).map((a) => ({ art: a, ...recomendar(a, candidatos, opciones) }));
  const orden = { agotado: 0, urgente: 1, pronto: 2, ok: 3 };
  recs.sort((a, b) => orden[a.estado] - orden[b.estado] || a.dias - b.dias);
  const llevar = recs.filter((r) => r.motivo);
  return {
    recs,
    comprarYa: recs.filter((r) => r.motivo === 'comprar' && ['agotado', 'urgente'].includes(r.estado)),
    pronto: recs.filter((r) => r.motivo === 'comprar' && !['agotado', 'urgente'].includes(r.estado)),
    ofertas: recs.filter((r) => r.motivo === 'oferta'),
    bien: recs.filter((r) => !r.motivo),
    totalCompra: r2(llevar.reduce((s, r) => s + r.costo, 0)),
    ahorroOfertas: r2(llevar.reduce((s, r) => s + (r.oferta?.ahorro || 0), 0)),
    gastoMensual: r2(recs.reduce((s, r) => s + gastoMensual(r.art, r.opciones[0]), 0)),
  };
}

export function gastoMensual(art, mejor) {
  const consumo = Number(art.consumo_mes) || 0;
  const unit = mejor ? mejor.precio / mejor.contenido : ARTICULOS_HOGAR[art.catalogo]?.ref || 0;
  return r2(consumo * unit);
}

/** Al comprar: sube el stock (sobre lo que se estima que queda) y acumula para aprender */
export function registrarCompra(art, cantidad, hoy = new Date()) {
  return {
    stock: r2(stockEstimado(art, hoy) + cantidad),
    stock_fecha: new Date(hoy).toISOString(),
    compras_desde: r2((Number(art.compras_desde) || 0) + cantidad),
    ref_fecha: art.ref_fecha || new Date(hoy).toISOString(),
    ref_stock: art.ref_fecha ? art.ref_stock : r2(stockEstimado(art, hoy)),
  };
}

/**
 * Cuando dices cuánto queda de verdad ("se acabó", "queda la mitad"): corrige el stock y
 * aprende el ritmo real comparando con lo que había + lo comprado desde la última vez.
 */
export function reportarStock(art, reportado, hoy = new Date()) {
  const patch = {
    stock: r2(Math.max(0, reportado)),
    stock_fecha: new Date(hoy).toISOString(),
    ref_stock: r2(Math.max(0, reportado)),
    ref_fecha: new Date(hoy).toISOString(),
    compras_desde: 0,
  };
  let observado = null;
  if (art.ref_fecha) {
    const d = dias(art.ref_fecha, hoy);
    const consumido = (Number(art.ref_stock) || 0) + (Number(art.compras_desde) || 0) - reportado;
    if (d >= 10 && consumido > 0) {
      observado = consumido / d * 30;
      const viejo = Number(art.consumo_mes) || observado;
      const acotado = Math.min(viejo * 4, Math.max(viejo / 4, observado)); // un dato raro no lo cambia todo
      patch.consumo_mes = r2(0.6 * viejo + 0.4 * acotado);
    }
  }
  return { patch, observado: observado == null ? null : r2(observado) };
}

/** "~3 días", "~2 semanas", "~1 mes" */
export function textoDias(d) {
  if (!Number.isFinite(d)) return 'sin consumo';
  if (d < 0.5) return 'se acabó';
  if (d < 1.5) return '~1 día';
  if (d < 10) return `~${Math.round(d)} días`;
  if (d < 25) return `~${Math.round(d / 7)} semanas`;
  const m = Math.round(d / 30);
  return m <= 1 ? '~1 mes' : `~${m} meses`;
}

/** "1 de 100 ml cada ~2 semanas" */
export function textoConsumo(art) {
  const cat = ARTICULOS_HOGAR[art.catalogo];
  const paquete = cat?.paquete;
  const c = Number(art.consumo_mes) || 0;
  if (!paquete || !c) return '';
  const cadaDias = (paquete / c) * 30;
  const u = art.unidad || cat.unidad;
  const tam = u === 'und' ? (paquete === 1 ? '' : ` de ${paquete}`) : ` de ${paquete} ${u}`;
  return `gastan ~1${tam} cada ${textoDias(cadaDias).replace('~', '')}`;
}
