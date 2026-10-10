// Artículos de la casa que se compran por NECESIDAD (no por menú ni presupuesto).
//
//  unidad      'g' | 'ml' | 'und' (rollos, piezas, pañales…). `acepta` permite otra unidad equivalente 1:1
//              (desodorante en barra (g) o aerosol (ml); lavaplatos líquido (ml) o en pasta (g)).
//  consumo     cuánto se gasta al MES: { hogar } fijo de la casa + { persona } por cada persona que lo usa.
//  quien       quiénes cuentan como "persona": 'todos' (adultos + ½ por niño), 'adultos', 'usuarios' (lo pones tú,
//              ej. pañales = bebés, toallas sanitarias = quienes las usan).
//  paquete     tamaño típico, para preguntar "¿cuánto te queda?" en paquetes.
//  ref         precio ESTIMADO por unidad base (USD) si aún no hay precio real de las tiendas.
//  porDefecto  si aparece marcado al configurar.
//  Los consumos son estimados iniciales; la app los ajusta sola con lo que compras y reportas.

export const CATEGORIAS_HOGAR = [
  ['personal', 'Cuidado personal'],
  ['limpieza', 'Limpieza'],
];

const NO_MASCOTA = ['perro', 'gato', 'mascota'];

export const ARTICULOS_HOGAR = {
  // ---------------- cuidado personal ----------------
  pasta_dental: {
    nombre: 'Pasta dental', categoria: 'personal', unidad: 'ml', quien: 'todos', consumo: { persona: 50 }, paquete: 100, ref: 0.025, porDefecto: true,
    terminos: ['pasta dental', 'crema dental'], excluir: ['cepillo', 'enjuague', 'hilo', ...NO_MASCOTA],
  },
  cepillo_dientes: {
    nombre: 'Cepillo de dientes', categoria: 'personal', unidad: 'und', quien: 'todos', consumo: { persona: 0.34 }, paquete: 1, ref: 1.5, porDefecto: true,
    terminos: ['cepillo dental', 'cepillo dientes', 'cepillo de dientes'], excluir: ['electrico', 'repuesto', 'cabello', 'ropa', 'zapato', 'inodoro', 'cobertor', 'protector', 'estuche', ...NO_MASCOTA],
  },
  jabon_bano: {
    nombre: 'Jabón de baño', categoria: 'personal', unidad: 'g', quien: 'todos', consumo: { persona: 150 }, paquete: 110, ref: 0.008, porDefecto: true,
    terminos: ['jabon tocador', 'jabon de tocador', 'jabon antibacterial', 'jabon de baño', 'jabon'],
    excluir: ['lavaplato', 'trastes', 'platos', 'ropa', 'lavar', 'polvo', 'detergente', 'xtra', 'zote', 'liquido', 'manos', 'intimo', 'surf', 'reina', 'max poder', 'espumil', ...NO_MASCOTA],
  },
  shampoo: {
    nombre: 'Shampoo', categoria: 'personal', unidad: 'ml', quien: 'todos', consumo: { persona: 150 }, paquete: 400, ref: 0.012, porDefecto: true,
    terminos: ['shampoo', 'champu'], excluir: ['alfombra', 'auto', 'carro', 'seco', 'sachet', ...NO_MASCOTA],
  },
  acondicionador: {
    nombre: 'Acondicionador', categoria: 'personal', unidad: 'ml', quien: 'todos', consumo: { persona: 100 }, paquete: 400, ref: 0.013,
    terminos: ['acondicionador'], excluir: ['ropa', 'suavizante', ...NO_MASCOTA],
  },
  desodorante: {
    nombre: 'Desodorante', categoria: 'personal', unidad: 'ml', acepta: ['g'], quien: 'adultos', consumo: { persona: 80 }, paquete: 150, ref: 0.03, porDefecto: true,
    terminos: ['desodorante', 'antitranspirante'], excluir: ['ambiental', 'pies', 'calzado', 'inodoro', 'hogar', 'ambientador', 'auto'],
  },
  papel_higienico: {
    nombre: 'Papel higiénico', categoria: 'personal', unidad: 'und', quien: 'todos', consumo: { persona: 7 }, paquete: 12, ref: 0.45, porDefecto: true,
    terminos: ['papel higienico'], excluir: ['humedo', 'toallitas', 'soporte', 'porta', 'dispensador'],
  },
  toallas_sanitarias: {
    nombre: 'Toallas sanitarias', categoria: 'personal', unidad: 'und', quien: 'usuarios', usuariosDefecto: 1, consumo: { persona: 20 }, paquete: 10, ref: 0.12,
    terminos: ['toallas sanitarias', 'toalla sanitaria', 'toallas femeninas', 'toalla femenina'], excluir: ['humedas', 'cocina', 'papel'],
  },
  panales: {
    nombre: 'Pañales', categoria: 'personal', unidad: 'und', quien: 'usuarios', usuariosDefecto: 1, consumo: { persona: 180 }, paquete: 40, ref: 0.25,
    terminos: ['panal', 'panales'], excluir: ['toallitas', 'humedas', 'crema', 'adulto', 'bolsa'],
  },
  rastrillos: {
    nombre: 'Rastrillos de afeitar', categoria: 'personal', unidad: 'und', quien: 'usuarios', usuariosDefecto: 1, consumo: { persona: 2 }, paquete: 4, ref: 0.9,
    terminos: ['rastrillo', 'maquina de afeitar', 'afeitadora desechable'], excluir: ['electrica', 'gel', 'espuma', 'crema'],
  },
  crema_corporal: {
    nombre: 'Crema corporal', categoria: 'personal', unidad: 'ml', quien: 'todos', consumo: { persona: 120 }, paquete: 400, ref: 0.012,
    terminos: ['crema corporal', 'locion corporal'], excluir: ['bebe', 'solar', 'bloqueador'],
  },
  enjuague_bucal: {
    nombre: 'Enjuague bucal', categoria: 'personal', unidad: 'ml', quien: 'adultos', consumo: { persona: 300 }, paquete: 500, ref: 0.012,
    terminos: ['enjuague bucal'], excluir: [],
  },

  // ---------------- limpieza ----------------
  detergente_ropa: {
    nombre: 'Detergente para ropa', categoria: 'limpieza', unidad: 'g', quien: 'todos', consumo: { hogar: 1000, persona: 700 }, paquete: 2000, ref: 0.003, porDefecto: true,
    terminos: ['detergente en polvo', 'detergente'], excluir: ['lavaplato', 'platos', 'trastes', 'vajilla', 'liquido'],
  },
  suavizante: {
    nombre: 'Suavizante de ropa', categoria: 'limpieza', unidad: 'ml', quien: 'todos', consumo: { hogar: 300, persona: 200 }, paquete: 1000, ref: 0.004, porDefecto: true,
    terminos: ['suavizante'], excluir: ['cabello', 'acondicionador'],
  },
  cloro: {
    nombre: 'Cloro / lejía', categoria: 'limpieza', unidad: 'ml', quien: 'todos', consumo: { hogar: 1000, persona: 150 }, paquete: 1000, ref: 0.0015, porDefecto: true,
    terminos: ['cloro', 'lejia', 'blanqueador'], excluir: ['pastilla', 'tableta', 'piscina', 'dental'],
  },
  desinfectante_piso: {
    nombre: 'Desinfectante para piso (olor)', categoria: 'limpieza', unidad: 'ml', quien: 'todos', consumo: { hogar: 1500 }, paquete: 1000, ref: 0.003, porDefecto: true,
    terminos: ['desinfectante', 'limpiador multiusos', 'fabuloso', 'poett', 'mistolin'], excluir: ['toallitas', 'aerosol', 'spray', 'manos', 'gel', 'ropa', 'inodoro', 'blanqueador', 'cloro', 'lejia'],
  },
  lavaplatos: {
    nombre: 'Lavaplatos', categoria: 'limpieza', unidad: 'ml', acepta: ['g'], quien: 'todos', consumo: { hogar: 300, persona: 150 }, paquete: 750, ref: 0.004, porDefecto: true,
    terminos: ['lavaplatos', 'lavatrastes', 'lava platos', 'jabon para platos', 'axion'], excluir: ['esponja', 'guantes', 'maquina', 'lavavajillas'],
  },
  esponjas: {
    nombre: 'Esponjas de cocina', categoria: 'limpieza', unidad: 'und', quien: 'todos', consumo: { hogar: 3 }, paquete: 3, ref: 0.4, porDefecto: true,
    terminos: ['esponja'], excluir: ['maquillaje', 'bano', 'corporal', 'facial', 'bebe', 'pincel', 'pintura', 'rodillo'],
  },
  bolsas_basura: {
    nombre: 'Bolsas para basura', categoria: 'limpieza', unidad: 'und', quien: 'todos', consumo: { hogar: 30 }, paquete: 10, ref: 0.08, porDefecto: true,
    terminos: ['bolsa para basura', 'bolsas para basura', 'bolsa basura', 'bolsas basura', 'bolsas de basura'], excluir: ['mascota'],
  },
  jabon_ropa: {
    nombre: 'Jabón de lavar (barra)', categoria: 'limpieza', unidad: 'g', quien: 'todos', consumo: { hogar: 600 }, paquete: 400, ref: 0.004,
    terminos: ['jabon de lavar', 'jabon para ropa', 'jabon en barra', 'xtra'], excluir: ['tocador', 'antibacterial', 'liquido', 'manos'],
  },
  papel_toalla: {
    nombre: 'Papel toalla', categoria: 'limpieza', unidad: 'und', quien: 'todos', consumo: { hogar: 2 }, paquete: 2, ref: 1.2,
    terminos: ['papel toalla', 'toalla de cocina', 'papel de cocina'], excluir: ['humedo'],
  },
  servilletas: {
    nombre: 'Servilletas', categoria: 'limpieza', unidad: 'und', quien: 'todos', consumo: { hogar: 150 }, paquete: 200, ref: 0.004,
    terminos: ['servilleta'], excluir: ['humeda', 'dispensador', 'servilletero', 'porta'],
  },
  limpiavidrios: {
    nombre: 'Limpiavidrios', categoria: 'limpieza', unidad: 'ml', quien: 'todos', consumo: { hogar: 250 }, paquete: 500, ref: 0.008,
    terminos: ['limpiavidrios', 'limpia vidrios'], excluir: [],
  },
  insecticida: {
    nombre: 'Insecticida', categoria: 'limpieza', unidad: 'ml', quien: 'todos', consumo: { hogar: 200 }, paquete: 400, ref: 0.02,
    terminos: ['insecticida', 'raid', 'baygon'], excluir: ['trampa', 'cebo', 'electrico'],
  },
  ambientador: {
    nombre: 'Ambientador', categoria: 'limpieza', unidad: 'ml', quien: 'todos', consumo: { hogar: 300 }, paquete: 300, ref: 0.015,
    terminos: ['ambientador', 'aromatizante ambiental', 'glade'], excluir: ['auto', 'carro', 'electrico', 'repuesto'],
  },
};

export function terminosHogar() {
  return [...new Set(Object.values(ARTICULOS_HOGAR).flatMap((a) => a.terminos))];
}

/** Personas que usan un artículo, según el hogar */
export function usuariosDe(clave, hogar = {}, override = null) {
  if (override != null) return Number(override);
  const a = ARTICULOS_HOGAR[clave];
  const adultos = Number(hogar.adultos) || 1;
  const ninos = Number(hogar.ninos) || 0;
  if (!a) return adultos;
  if (a.quien === 'adultos') return adultos;
  if (a.quien === 'usuarios') return a.usuariosDefecto ?? 1;
  return adultos + 0.5 * ninos;
}

/** Consumo mensual estimado (unidad base) para la casa */
export function consumoInicial(clave, usuarios) {
  const c = ARTICULOS_HOGAR[clave]?.consumo || {};
  return Math.round(((c.hogar || 0) + (c.persona || 0) * usuarios) * 100) / 100;
}
