// Precios de mercados (sondeo semanal de la Defensoría del Consumidor): parser del informe
// y relación con los ingredientes del catálogo. JavaScript puro: lo usan el robot y la app.

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const palabrasDe = (s) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

// [palabras que deben estar en el nombre del producto, ingrediente, gramos por unidad si el mercado vende "por unidad"]
const MAPEO = [
  [['res', 'posta'], 'res_posta'],
  [['res', 'molida'], 'carne_molida'],
  [['cerdo', 'chuleta'], 'chuleta_cerdo'],
  [['pollo', 'pechuga'], 'pechuga'],
  [['pollo', 'entrepierna'], 'pollo_piezas'],
  [['pollo', 'sin', 'menudos'], 'pollo_piezas'],
  [['guineo'], 'banano'],
  [['banano'], 'banano'],
  [['limon'], 'limon'],
  [['naranja'], 'naranja'],
  [['papaya'], 'papaya', 1800],
  [['platano'], 'platano'],
  [['mango'], 'mango'],
  [['manzana'], 'manzana'],
  [['arroz', 'blanco'], 'arroz'],
  [['frijol', 'rojo'], 'frijol'],
  [['huevo', 'grande'], 'huevo'],
  [['huevo', 'mediano'], 'huevo'],
  [['aguacate'], 'aguacate'],
  [['cebolla', 'blanca'], 'cebolla', 200],
  [['cebolla', 'amarilla'], 'cebolla', 200],
  [['chile', 'verde'], 'chile_verde'],
  [['cilantro'], 'cilantro'],
  [['elote'], 'elote'],
  [['guisquil'], 'guisquil'],
  [['lechuga'], 'lechuga'],
  [['papa'], 'papa'],
  [['pepino'], 'pepino'],
  [['rabano'], 'rabano'],
  [['repollo'], 'repollo'],
  [['tomate', 'cocina'], 'tomate', 150],
  [['zanahoria'], 'zanahoria', 120],
  [['brocoli'], 'brocoli', 400],
  [['yuca'], 'yuca'],
];

const UNIDADES_GRAMOS = { libra: 453.59, libras: 453.59, kilogramo: 1000, kilogramos: 1000 };

/** ¿A qué ingrediente corresponde este producto del sondeo? */
export function ingredienteDeMercado(producto) {
  const ws = palabrasDe(producto);
  for (const [req, ing, gUnidad] of MAPEO) {
    // palabras exactas (para que "papa" no sea "papaya")
    if (req.every((w) => ws.includes(w) || ws.some((x) => x === `${w}s` || x === `${w}es`))) return { ing, gUnidad: gUnidad || null };
  }
  return null;
}

/**
 * Precio por unidad base (g o und) de cada ingrediente según el sondeo más reciente.
 * @param {Array} filas [{fecha, producto, unidad, cantidad, promedio}]
 * @param {Record<string,{unidad:string}>} catalogo INGREDIENTES (para saber si el ingrediente va en g o und)
 * @returns {Map<string, {precioUnit, producto, fecha, promedio, cantidad, unidad}>}
 */
export function preciosMercado(filas, catalogo) {
  const res = new Map();
  if (!filas?.length) return res;
  const ultima = filas.map((f) => String(f.fecha).slice(0, 10)).sort().at(-1);
  for (const f of filas) {
    if (String(f.fecha).slice(0, 10) !== ultima || !(Number(f.promedio) > 0)) continue;
    const m = ingredienteDeMercado(f.producto);
    if (!m || !catalogo[m.ing]) continue;
    const base = catalogo[m.ing].unidad;
    const u = norm(f.unidad);
    const cant = Number(f.cantidad) || 1;
    let unidades = null; // cuántas unidades base (g/ml/und) cuesta "promedio"
    if (UNIDADES_GRAMOS[u] && base === 'g') unidades = cant * UNIDADES_GRAMOS[u];
    else if (u.startsWith('unidad') && base === 'und') unidades = cant;
    else if (u.startsWith('unidad') && base === 'g' && m.gUnidad) unidades = cant * m.gUnidad;
    else if (u.startsWith('docena') && base === 'und') unidades = cant * 12;
    if (!unidades) continue; // quintales, sacos de 50 lb, etc.
    const precioUnit = Number(f.promedio) / unidades;
    const prev = res.get(m.ing);
    if (!prev || precioUnit < prev.precioUnit) {
      res.set(m.ing, { precioUnit, producto: f.producto, fecha: ultima, promedio: Number(f.promedio), cantidad: cant, unidad: f.unidad });
    }
  }
  return res;
}

// ---------------------------------------------------------------------
// Parser del texto del PDF
// ---------------------------------------------------------------------
const CATEGORIAS = ['carnes', 'frutas', 'granos', 'harinas', 'huevos', 'verduras', 'lacteos', 'mariscos', 'pescados', 'hortalizas', 'abarrotes'];
const UNIDAD_RE = '(libras?|unidad(?:es)?|quintal(?:es)?|docenas?|kilogramos?|botellas?|galon(?:es)?|litros?|manojos?)';
const VALOR_RE = /\$\s?\d+(?:[.,]\d+)?|n\.?\s?d\.?/gi;
const RUIDO = /precio|categor|producto|cantidad|unidad\s*$|centro|occidente|oriente|minimo|maximo|promedio|fuente|fecha de sondeo|informe|defensoria|ley de proteccion|competencia|mercado|^\d+\s*$/;

/**
 * Convierte las líneas de texto del informe en filas.
 * Tolera: unidad/cantidad que solo aparecen en la primera fila de cada grupo, "n.d." y nombres partidos en dos líneas.
 */
export function parsearSondeo(lineas, fecha) {
  const filas = [];
  let categoria = null;
  let ultCant = null;
  let ultUnidad = null;
  let anterior = '';
  for (const bruta of lineas) {
    let linea = String(bruta).replace(/\s+/g, ' ').trim();
    if (!linea) continue;
    // ¿empieza con una categoría?
    const primera = norm(linea.split(' ')[0]);
    if (CATEGORIAS.includes(primera)) {
      categoria = linea.split(' ')[0];
      ultCant = null; ultUnidad = null;
      linea = linea.slice(categoria.length).trim();
      if (!linea) { anterior = ''; continue; }
    }
    const valores = linea.match(VALOR_RE) || [];
    if (valores.length < 6) {
      // posible primera parte de un nombre partido
      anterior = RUIDO.test(norm(linea)) ? '' : linea;
      continue;
    }
    const seis = valores.slice(-6);
    const idx = linea.search(new RegExp(seis[0].replace(/[$.]/g, '\\$&')));
    let cabeza = linea.slice(0, idx).trim();
    const mu = cabeza.match(new RegExp(`(?:^|\\s)(?:(\\d+(?:[.,]\\d+)?)\\s+)?${UNIDAD_RE}$`, 'i'));
    let cantidad = null;
    let unidad = null;
    if (mu) {
      cantidad = mu[1] ? parseFloat(mu[1].replace(',', '.')) : null;
      unidad = mu[2];
      cabeza = cabeza.slice(0, mu.index).trim();
    } else {
      const soloCant = cabeza.match(/\s(\d+(?:[.,]\d+)?)$/);
      if (soloCant) { cantidad = parseFloat(soloCant[1].replace(',', '.')); cabeza = cabeza.slice(0, soloCant.index).trim(); }
    }
    if (!cabeza || /^[(a-z]/.test(cabeza)) cabeza = `${anterior} ${cabeza}`.trim();
    anterior = '';
    if (!cabeza) continue;
    unidad = unidad || ultUnidad;
    cantidad = cantidad ?? (unidad && unidad === ultUnidad ? ultCant : null) ?? 1;
    ultUnidad = unidad;
    ultCant = cantidad;
    const num = (v) => (/n\.?\s?d/i.test(v) ? null : parseFloat(v.replace('$', '').replace(',', '.').trim()));
    const [centro, occidente, oriente, minimo, maximo, promedio] = seis.map(num);
    filas.push({
      fecha, categoria, producto: cabeza, cantidad, unidad: unidad ? unidad.charAt(0).toUpperCase() + unidad.slice(1).toLowerCase() : '',
      centro, occidente, oriente, minimo, maximo, promedio,
    });
  }
  return filas;
}

/** "04.05.2025_Informe..." → "2025-05-04" */
export function fechaDeArchivo(url) {
  const m = String(url).match(/(\d{2})\.(\d{2})\.(\d{4})_Informe/i);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

// ---------------------------------------------------------------------
// Agromercados del MAG: precios anotados a mano ("20 tomates grandes por $1")
// ---------------------------------------------------------------------
const GRAMOS_LIBRA = 453.59;
const GRAMOS_ONZA = 28.35;
/** Gramos que pesa una unidad, para ingredientes que la receta mide en gramos pero el agromercado vende por unidad */
export const GRAMOS_POR_UNIDAD = { tomate: 150, cebolla: 200, papa: 200, zanahoria: 120, brocoli: 400, sandia: 2500, papaya: 1800,
  ayote: 400, yuca: 500, pipian: 300, coliflor: 600, ejote: 10, melon: 1500 };
/** Ingredientes que se suelen encontrar en un agromercado (para el formulario) */
export const INGREDIENTES_AGROMERCADO = ['tomate', 'cebolla', 'papa', 'limon', 'banano', 'platano', 'chile_verde', 'zanahoria', 'repollo', 'pepino',
  'aguacate', 'guisquil', 'yuca', 'elote', 'cilantro', 'lechuga', 'brocoli', 'rabano', 'ayote', 'ejote', 'pipian', 'loroco', 'sandia', 'papaya',
  'pina', 'mango', 'naranja', 'melon', 'arroz', 'frijol', 'huevo', 'queso_duro', 'crema'];

/**
 * Precio por unidad base (g, ml o und) según el agromercado.
 * @returns {{precioUnit:number, unidades:number}|null} null si no se puede convertir (ej. por unidad sin peso)
 */
export function precioUnitarioAgro(fila, catalogo) {
  const ing = catalogo[fila.ingrediente];
  const cant = Number(fila.cantidad);
  const precio = Number(fila.precio);
  if (!ing || ing.basico || !(cant > 0) || !(precio > 0)) return null;
  let unidades = null;
  if (fila.unidad === 'lb' && ing.unidad === 'g') unidades = cant * GRAMOS_LIBRA;
  else if (fila.unidad === 'oz' && ing.unidad === 'g') unidades = cant * GRAMOS_ONZA;
  else if (fila.unidad === 'und' && ing.unidad === 'und') unidades = cant;
  else if (fila.unidad === 'und' && ing.unidad === 'g') {
    const g = Number(fila.gramos_unidad) || GRAMOS_POR_UNIDAD[fila.ingrediente];
    if (g) unidades = cant * g;
  }
  return unidades ? { precioUnit: precio / unidades, unidades } : null;
}

/** Igual que preciosMercado() pero con las filas del agromercado (se queda con la opción más barata de cada ingrediente) */
export function preciosAgromercado(filas, catalogo) {
  const res = new Map();
  for (const f of filas || []) {
    const pu = precioUnitarioAgro(f, catalogo);
    if (!pu) continue;
    const prev = res.get(f.ingrediente);
    if (!prev || pu.precioUnit < prev.precioUnit) {
      res.set(f.ingrediente, { precioUnit: pu.precioUnit, producto: `${f.descripcion} (${textoAgro(f)})`, fecha: String(f.fecha).slice(0, 10),
        promedio: Number(f.precio), cantidad: Number(f.cantidad), unidad: f.unidad, origen: 'agromercado' });
    }
  }
  return res;
}

/** "20 por $1.00", "12 lb por $4.00" */
export function textoAgro(f) {
  const u = f.unidad === 'und' ? '' : ` ${f.unidad}`;
  return `${Number(f.cantidad)}${u} por $${Number(f.precio).toFixed(2)}`;
}

/** Junta Defensoría y Agromercado: por ingrediente, el precio más barato (y de dónde viene) */
export function combinarMercados(...mapas) {
  const res = new Map();
  for (const m of mapas) {
    for (const [ing, v] of m || []) {
      const prev = res.get(ing);
      if (!prev || v.precioUnit < prev.precioUnit) res.set(ing, { origen: 'defensoria', ...v });
    }
  }
  return res;
}
