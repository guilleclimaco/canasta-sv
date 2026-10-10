// Lectura de precios de tiendas VTEX (Walmart, Maxi Despensa, La Despensa de Don Juan).
// JavaScript puro: lo usan la Edge Function (Deno) y el script de prueba (Node).

export const TIENDAS_VTEX = {
  walmart: { nombre: 'Walmart', base: 'https://www.walmart.com.sv' },
  maxi: { nombre: 'Maxi Despensa', base: 'https://www.maxidespensa.com.sv' },
  donjuan: { nombre: 'La Despensa de Don Juan', base: 'https://www.ladespensadedonjuan.com.sv' },
};

/** minúsculas, sin tildes, espacios simples */
export function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.,%\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const UNIDADES = {
  kg: ['g', 1000], kilo: ['g', 1000], kilos: ['g', 1000], kilogramo: ['g', 1000], kilogramos: ['g', 1000],
  g: ['g', 1], gr: ['g', 1], grs: ['g', 1], gramo: ['g', 1], gramos: ['g', 1],
  lb: ['g', 453.592], lbs: ['g', 453.592], libra: ['g', 453.592], libras: ['g', 453.592],
  oz: ['g', 28.3495], onz: ['g', 28.3495], onzas: ['g', 28.3495],
  ml: ['ml', 1], mililitros: ['ml', 1], cc: ['ml', 1],
  l: ['ml', 1000], lt: ['ml', 1000], lts: ['ml', 1000], litro: ['ml', 1000], litros: ['ml', 1000],
  gal: ['ml', 3785.41], galon: ['ml', 3785.41], galones: ['ml', 3785.41],
};

/**
 * Saca el contenido del nombre: "Arroz 1816gr" -> {contenido:1816, unidad:'g'}
 * "Leche 6 Pack - 1200 ml" -> 1200 ml (total); "Coca Cola 6 x 355 ml" -> 2130 ml; "Huevos 30 unidades" -> 30 und;
 * "Tomate por libra" -> 453.59 g; "Limón persa unidad" -> 1 und.
 * Si no encuentra nada -> {null, null}.
 */
export function parsearContenido(nombre) {
  let n = normalizar(nombre).replace(/(\d),(\d)/g, '$1.$2');
  // Walmart/Maxi/Don Juan: "Tomate - 2 a 4 Unidades, precio Indicado Por Libra (454 g)" → el precio es por libra.
  // Solo cuenta un tamaño fijo de bolsa ("Red 5 Libras"), no "de 10 libras aproximadamente".
  if (/precio\s+(?:indicado\s+)?por\s+(?:libra|lb)\b/.test(n)) {
    const bolsa = n.replace(/precio.*$/, '').replace(/\b\d+(?:\.\d+)?\s*(?:a|-)\s*\d+(?:\.\d+)?\s*(?:libras|lbs|lb)\b/g, ' ').match(/\b(\d+(?:\.\d+)?)\s*(?:libras|lbs|lb)\b(?!\s*aprox)/);
    return { contenido: bolsa ? Math.round(parseFloat(bolsa[1]) * 453.59 * 100) / 100 : 453.59, unidad: 'g' };
  }
  // "3 a 5 Unidades Aproximadamente" y "(1 Lb= 454 g)" son descripciones, no el tamaño
  n = n.replace(/\b\d+\s*(?:a|-)\s*\d+\s*(?:unidades|unidad|und|uds|u)\b(?:\s*aproximadamente)?/g, ' ')
    .replace(/\(?\s*1\s*lb\s*=\s*454\s*g\s*\)?/g, ' ');
  // "Huevo 15U 735 g A 825 g": rango de peso → cuenta por unidades
  const rango = /\b\d+(?:\.\d+)?\s*(?:g|gr|grs|kg|oz|onz)?\s*(?:a|-)\s*\d+(?:\.\d+)?\s*(?:g|gr|grs|gramos|kg|oz|onz|onzas)\b/;
  const conRango = rango.test(n);
  if (conRango) n = n.replace(rango, ' ');
  const re = /(\d+(?:\.\d+)?)\s*(kilogramos|kilogramo|kilos|kilo|kg|gramos|gramo|grs|gr|g|libras|libra|lbs|lb|onzas|onz|oz|mililitros|ml|cc|litros|litro|lts|lt|l|galones|galon|gal)(?![a-z])/;
  const m = n.match(re);
  let pack = 1;
  // los rollos mandan ("12 rollos 300 hojas" son 12); "hojas" solo cuenta si no hay otra cosa (servilletas)
  const p = n.match(/(\d+)\s*rollos?\b/)
    || n.match(/(\d+)\s*(?:pack|pk|unidades|unidad|unid|und|uds|u|piezas|pzas|huevos|tortillas|panes|bolsas|sobres|panales|toallas|servilletas)\b/)
    || n.match(/\b(?:pack|paquete)\s*(?:de\s*)?(\d+)\b/) || n.match(/\b(\d+)\s*x\s*(?=\d+(?:\.\d+)?\s*(?:kg|g|gr|grs|ml|cc|l|lt|lts|oz|onz|lb|lbs)(?![a-z]))/)
    || (!m && n.match(/(\d+)\s*hojas\b/));
  if (p) pack = parseInt(p[1], 10) || 1;
  if (conRango && pack > 1) return { contenido: pack, unidad: 'und' };
  if (!m) {
    if (pack > 1 || (p && /rollo|und|unid|pieza|pza/.test(p[0]))) return { contenido: pack, unidad: 'und' };
    // productos a granel: "Tomate por libra", "Papa lb", "Pollo entero kg"
    const granel = n.match(/(?:^|\s)(?:por\s+|x\s+|el\s+|la\s+)?(libra|lb|lbs|kilo|kg)(?:\s|$)/);
    if (granel) return { contenido: ['kilo', 'kg'].includes(granel[1]) ? 1000 : 453.59, unidad: 'g' };
    if (/(?:^|\s)(?:por\s+)?(?:unidad|und|c\/u)(?:\s|$)/.test(n) || /(?:^|\s)(?:manojo|cabeza)(?:\s|$)/.test(n)) return { contenido: 1, unidad: 'und' };
    return { contenido: null, unidad: null };
  }
  const [unidad, factor] = UNIDADES[m[2]];
  let contenido = parseFloat(m[1]) * factor;
  // En estas tiendas, "N pack/uds - medida" casi siempre trae el TOTAL ("2 Pack - 4540 g", "Colgate 3 pack - 300 ml",
  // "Desodorante 3 Pack - 450 ml"). La medida es de CADA unidad solo si el nombre lo dice:
  // "6 x 355 ml", "2 Uds 67 ml c/u", "2Pack De 354 g" (cuesta igual que el "2 Uds - 708 g").
  const entre = p && m ? n.slice(p.index + p[0].length, m.index) : '';
  const porUnidad = p && (/^\d+\s*x/.test(p[0]) || /^\s*de\s*$/.test(entre) || /\bc u\b|\bc\/u\b|\bcada un[oa]\b/.test(n));
  if (pack > 1 && p && p.index < m.index && porUnidad) contenido *= pack;
  return { contenido: Math.round(contenido * 100) / 100, unidad };
}

/**
 * VTEX vende a granel con measurementUnit ("kg", "lb", "g") y unitMultiplier (cuánto trae una "unidad" de venta).
 * Solo se usa si el nombre no dice el tamaño. ⚠ Verificar con productos reales (README, paso 1).
 */
export function contenidoPorMedida(item) {
  const mu = String(item?.measurementUnit || '').toLowerCase();
  const mult = Number(item?.unitMultiplier) || 1;
  const f = { kg: ['g', 1000], g: ['g', 1], lb: ['g', 453.59], l: ['ml', 1000], ml: ['ml', 1] }[mu];
  if (!f) return null;
  return { contenido: Math.round(mult * f[1] * 100) / 100, unidad: f[0] };
}

/** Convierte un producto VTEX en filas (una por SKU) para registrar_precios */
export function parsearProducto(tiendaId, base, p) {
  const filas = [];
  for (const item of p.items || []) {
    const seller = (item.sellers || []).find((s) => s.sellerDefault) || (item.sellers || [])[0];
    const o = seller?.commertialOffer;
    if (!o) continue;
    const precio = Number(o.Price);
    if (!precio || precio <= 0) continue; // VTEX pone 0 cuando no hay existencias
    const lista = Number(o.ListPrice) || Number(o.PriceWithoutDiscount) || precio;
    const nombre = item.nameComplete || item.name || p.productName;
    let { contenido, unidad } = parsearContenido(nombre);
    if (!contenido) ({ contenido, unidad } = contenidoPorMedida(item) || { contenido, unidad });
    let url = p.link || (p.linkText ? `${base}/${p.linkText}/p` : null);
    if (url && url.startsWith('/')) url = base + url;
    filas.push({
      tienda: tiendaId,
      sku: String(item.itemId),
      ean: item.ean ? String(item.ean).trim() : null,
      nombre,
      busqueda: normalizar(`${nombre} ${p.brand || ''}`),
      marca: p.brand || null,
      url,
      imagen: item.images?.[0]?.imageUrl || null,
      contenido,
      unidad,
      precio: Math.round(precio * 100) / 100,
      precio_lista: Math.round(Math.max(lista, precio) * 100) / 100,
      disponible: o.IsAvailable !== false && (o.AvailableQuantity ?? 1) > 0,
    });
  }
  return filas;
}

/** Busca un término en una tienda VTEX. max ≤ 50 (límite de VTEX por página). */
export async function buscarEnTienda(tiendaId, termino, { max = 40, fetchImpl = fetch } = {}) {
  const t = TIENDAS_VTEX[tiendaId];
  if (!t) throw new Error(`Tienda desconocida: ${tiendaId}`);
  const url = `${t.base}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(termino)}&_from=0&_to=${Math.min(max, 50) - 1}`;
  const res = await fetchImpl(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; CanastaSV/1.0; uso personal)',
    },
  });
  if (!res.ok) throw new Error(`${tiendaId} respondió ${res.status} para "${termino}"`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.flatMap((p) => parsearProducto(tiendaId, t.base, p));
}

/** Busca varios términos en todas las tiendas VTEX, con poca concurrencia para no saturar. */
export async function buscarTodo(terminos, { max = 40, fetchImpl = fetch, concurrencia = 4 } = {}) {
  const tareas = [];
  for (const termino of terminos) for (const tienda of Object.keys(TIENDAS_VTEX)) tareas.push({ tienda, termino });
  const filas = [];
  const errores = [];
  let i = 0;
  async function trabajador() {
    while (i < tareas.length) {
      const { tienda, termino } = tareas[i++];
      try {
        filas.push(...(await buscarEnTienda(tienda, termino, { max, fetchImpl })));
      } catch (e) {
        errores.push(String(e.message || e));
      }
      await new Promise((r) => setTimeout(r, 250)); // cortesía con los servidores
    }
  }
  await Promise.all(Array.from({ length: concurrencia }, trabajador));
  // quitar duplicados (mismo producto encontrado por dos términos)
  const unicos = new Map(filas.map((f) => [`${f.tienda}:${f.sku}`, f]));
  return { filas: [...unicos.values()], errores };
}
