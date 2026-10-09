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
};

/**
 * Saca el contenido del nombre: "Arroz 1816gr" -> {contenido:1816, unidad:'g'}
 * "Leche 6 Pack - 1200 ml" -> 7200 ml. Si no encuentra nada -> und.
 */
export function parsearContenido(nombre) {
  const n = normalizar(nombre).replace(/(\d),(\d)/g, '$1.$2');
  const re = /(\d+(?:\.\d+)?)\s*(kilogramos|kilogramo|kilos|kilo|kg|gramos|gramo|grs|gr|g|libras|libra|lbs|lb|onzas|onz|oz|mililitros|ml|cc|litros|litro|lts|lt|l)(?![a-z])/;
  const m = n.match(re);
  let pack = 1;
  const p = n.match(/(\d+)\s*(?:pack|pk|unidades|unid|und|uds|u)\b/) || n.match(/\b(?:pack|paquete)\s*(?:de\s*)?(\d+)\b/) || n.match(/\b(\d+)\s*x\s*\d/);
  if (p) pack = parseInt(p[1], 10) || 1;
  if (!m) return { contenido: pack > 1 ? pack : null, unidad: pack > 1 ? 'und' : null };
  const [unidad, factor] = UNIDADES[m[2]];
  let contenido = parseFloat(m[1]) * factor;
  // "6 x 355 ml" o "6 pack - 1200 ml": si el pack viene ANTES de la medida, multiplicar
  if (pack > 1 && p && p.index < m.index) contenido *= pack;
  return { contenido: Math.round(contenido * 100) / 100, unidad };
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
    const { contenido, unidad } = parsearContenido(nombre);
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
