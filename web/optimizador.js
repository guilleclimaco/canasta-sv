// Decide dónde comprar la lista para gastar menos, sin hacerte ir a 4 súper por centavos.
// Lógica pura (sin red ni DOM) para poder probarla.

/**
 * @param {Array<{id, nombre, cantidad, opciones: Array<{id, tienda, precio, nombre}>}>} items
 * @param {string[]} tiendas  tiendas a las que estás dispuesto a ir
 * @param {number} umbral     ahorro mínimo ($) para que valga la pena ir a una segunda tienda
 */
export function optimizar(items, tiendas, umbral = 3) {
  const conPrecio = items.filter((i) => (i.opciones || []).some((o) => tiendas.includes(o.tienda)));
  const sinPrecio = items.filter((i) => !conPrecio.includes(i));

  // mejor opción de cada artículo en cada tienda
  const mejorEn = new Map(); // itemId -> {tienda -> opcion}
  for (const it of conPrecio) {
    const m = {};
    for (const o of it.opciones) {
      if (!tiendas.includes(o.tienda)) continue;
      if (!m[o.tienda] || o.precio < m[o.tienda].precio) m[o.tienda] = o;
    }
    mejorEn.set(it.id, m);
  }

  const plan = (grupo) => {
    let total = 0;
    const asignacion = [];
    const faltan = [];
    for (const it of conPrecio) {
      const m = mejorEn.get(it.id);
      let mejor = null;
      for (const t of grupo) if (m[t] && (!mejor || m[t].precio < mejor.precio)) mejor = m[t];
      if (!mejor) { faltan.push(it); continue; }
      const sub = round2(mejor.precio * (Number(it.cantidad) || 1));
      total += sub;
      asignacion.push({ item: it, opcion: mejor, tienda: mejor.tienda, subtotal: sub });
    }
    return { tiendas: grupo, total: round2(total), asignacion, faltan };
  };

  const orden = (a, b) => a.faltan.length - b.faltan.length || a.total - b.total;
  const unaTienda = tiendas.map((t) => plan([t])).sort(orden);
  const pares = [];
  for (let i = 0; i < tiendas.length; i++)
    for (let j = i + 1; j < tiendas.length; j++) pares.push(plan([tiendas[i], tiendas[j]]));
  // un par solo cuenta si de verdad usa ambas tiendas
  const dosTiendas = pares
    .filter((p) => new Set(p.asignacion.map((a) => a.tienda)).size === 2)
    .sort(orden);
  const todas = plan(tiendas);

  const s = unaTienda[0];
  const d = dosTiendas[0];
  let mejor = s;
  let razon = 'Todo en un solo lugar sale mejor.';
  if (d && s) {
    const cubreMas = d.faltan.length < s.faltan.length;
    const ahorro = round2(s.total - d.total);
    if (cubreMas) {
      mejor = d;
      razon = `Ninguna tienda sola tiene todo; con dos sí.`;
    } else if (ahorro >= umbral) {
      mejor = d;
      razon = `Ir a dos tiendas te ahorra $${ahorro.toFixed(2)}.`;
    } else if (ahorro > 0) {
      razon = `Ir a dos tiendas solo ahorra $${ahorro.toFixed(2)} (menos de $${Number(umbral).toFixed(2)}); no vale la vuelta.`;
    }
  }
  if (!conPrecio.length) {
    mejor = null;
    razon = 'Elige productos en tu lista para poder comparar.';
  }

  const porTienda = tiendas
    .map((t) => {
      const p = unaTienda.find((x) => x.tiendas[0] === t);
      return { tienda: t, total: p.total, faltan: p.faltan.length };
    })
    .sort((a, b) => a.faltan - b.faltan || a.total - b.total);

  return {
    mejor,
    razon,
    // cuánto ahorras frente a la tienda más cara que tiene lo mismo
    ahorroVsPeor: mejor
      ? round2(Math.max(mejor.total, ...porTienda.filter((p) => p.faltan <= mejor.faltan.length).map((p) => p.total)) - mejor.total)
      : 0,
    unaTienda,
    dosTiendas,
    todas,
    porTienda,
    sinPrecio,
  };
}

/** precio por 100 g / 100 ml / unidad, para comparar tamaños distintos */
export function precioUnitario(p) {
  if (!p?.contenido || !p.unidad || !p.precio) return null;
  if (p.unidad === 'und') return { valor: p.precio / p.contenido, etiqueta: 'c/u' };
  return { valor: (p.precio / p.contenido) * 100, etiqueta: p.unidad === 'g' ? '100 g' : '100 ml' };
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}
