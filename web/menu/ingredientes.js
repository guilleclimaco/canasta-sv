// Catálogo de ingredientes del recetario.
//  - terminos: cómo se busca en las tiendas (texto normalizado: minúsculas, sin tildes).
//    Todas las palabras de un término deben aparecer en el nombre del producto.
//  - excluir: palabras que descartan productos que no son el ingrediente (ej. "sopa sabor pollo").
//  - unidad: 'g' | 'ml' | 'und' (las cantidades de las recetas usan esta unidad).
//  - ref: precio ESTIMADO en USD por 100 g / 100 ml / 1 und, para cuando aún no hay precio real.
//    (Referencias aproximadas de súper en El Salvador, 2026. El precio real de las tiendas siempre manda.)
//  - basico: true = se asume que siempre hay en casa (sal, especias…); no se cotiza.

const SIN_PROCESADOS = ['sopa', 'consome', 'caldo', 'sabor', 'instantane', 'galleta', 'snack', 'boquita', 'chips',
  'jugo', 'bebida', 'refresco', 'helado', 'perro', 'gato', 'mascota', 'alimento para', 'bebe', 'gerber', 'colado'];

export const INGREDIENTES = {
  // ---------- granos y básicos de despensa ----------
  arroz: { nombre: 'Arroz', terminos: ['arroz blanco', 'arroz'], unidad: 'g', ref: 0.14, excluir: [...SIN_PROCESADOS, 'integral', 'precocido', 'leche', 'harina', 'pollo', 'mexicano', 'salvaje'] },
  frijol: { nombre: 'Frijoles rojos', terminos: ['frijol rojo', 'frijol'], unidad: 'g', ref: 0.23, excluir: [...SIN_PROCESADOS, 'molido', 'volteado', 'negro', 'blanco', 'lata', 'refrito'] },
  lentejas: { nombre: 'Lentejas', terminos: ['lenteja'], unidad: 'g', ref: 0.31, excluir: SIN_PROCESADOS },
  aceite: { nombre: 'Aceite', terminos: ['aceite'], unidad: 'ml', ref: 0.32, excluir: ['oliva', 'motor', 'bebe', 'coco', 'spray', 'aceituna', 'atun', 'sardina', 'corporal', 'cabello', 'masaje', 'aguacate', 'sesamo'] },
  espagueti: { nombre: 'Espagueti', terminos: ['espagueti', 'spaghetti', 'spagueti'], unidad: 'g', ref: 0.22, excluir: SIN_PROCESADOS },
  coditos: { nombre: 'Coditos', terminos: ['codito'], unidad: 'g', ref: 0.22, excluir: SIN_PROCESADOS },
  harina_maiz: { nombre: 'Harina de maíz', terminos: ['harina maiz', 'maseca'], unidad: 'g', ref: 0.17, excluir: [...SIN_PROCESADOS, 'atol', 'trigo'] },
  pan_molido: { nombre: 'Pan molido', terminos: ['pan molido'], unidad: 'g', ref: 0.4, excluir: [] },
  salsa_tomate: { nombre: 'Salsa de tomate', terminos: ['salsa tomate'], unidad: 'g', ref: 0.42, excluir: ['ketchup', 'catsup', 'pizza', 'picante', 'barbacoa'] },
  mayonesa: { nombre: 'Mayonesa', terminos: ['mayonesa'], unidad: 'g', ref: 0.6, excluir: ['chipotle', 'light'] },
  vegetales_mixtos: { nombre: 'Vegetales mixtos', terminos: ['vegetales mixtos', 'mezcla vegetales'], unidad: 'g', ref: 0.44, excluir: SIN_PROCESADOS },

  // ---------- proteínas ----------
  huevo: { nombre: 'Huevos', terminos: ['huevo'], unidad: 'und', ref: 0.18, excluir: ['chocolate', 'pascua', 'codorniz', 'polvo', 'fideo', 'pasta', 'mayonesa'] },
  pechuga: { nombre: 'Pechuga de pollo', terminos: ['pechuga pollo'], unidad: 'g', ref: 0.6, excluir: [...SIN_PROCESADOS, 'empaniz', 'nugget', 'jamon', 'embutido', 'pavo', 'ahumad', 'rebanad'] },
  pollo_piezas: { nombre: 'Pollo en piezas', terminos: ['pierna pollo', 'muslo pollo', 'pollo entero', 'pollo'], unidad: 'g', ref: 0.42, excluir: [...SIN_PROCESADOS, 'pechuga', 'ala', 'nugget', 'empaniz', 'embutido', 'salchicha', 'jamon', 'mortadela', 'croqueta', 'pate', 'higado', 'molleja', 'pata', 'rostizado', 'asado'] },
  alitas: { nombre: 'Alitas de pollo', terminos: ['alita pollo', 'alas pollo'], unidad: 'g', ref: 0.55, excluir: [...SIN_PROCESADOS, 'empaniz', 'bbq', 'preparad'] },
  res_posta: { nombre: 'Carne de res (posta)', terminos: ['posta res', 'posta', 'carne res'], unidad: 'g', ref: 1.01, excluir: [...SIN_PROCESADOS, 'molida', 'costilla', 'hueso', 'higado', 'lengua', 'menudo', 'panza', 'mondongo', 'embutido', 'salchicha', 'enlatad', 'seca'] },
  res_costilla: { nombre: 'Costilla de res', terminos: ['costilla res'], unidad: 'g', ref: 0.66, excluir: SIN_PROCESADOS },
  carne_molida: { nombre: 'Carne molida', terminos: ['carne molida'], unidad: 'g', ref: 0.77, excluir: [...SIN_PROCESADOS, 'pavo', 'pollo', 'soya', 'vegetal'] },
  chuleta_cerdo: { nombre: 'Chuleta de cerdo', terminos: ['chuleta cerdo', 'chuleta'], unidad: 'g', ref: 0.75, excluir: [...SIN_PROCESADOS, 'ahumad'] },
  chorizo: { nombre: 'Chorizo', terminos: ['chorizo'], unidad: 'g', ref: 0.66, excluir: SIN_PROCESADOS },
  salchicha: { nombre: 'Salchichas', terminos: ['salchicha'], unidad: 'g', ref: 0.55, excluir: SIN_PROCESADOS },
  tilapia: { nombre: 'Tilapia', terminos: ['tilapia', 'filete pescado'], unidad: 'g', ref: 0.66, excluir: [...SIN_PROCESADOS, 'empaniz'] },
  atun: { nombre: 'Atún en lata', terminos: ['atun'], unidad: 'g', ref: 0.89, excluir: [...SIN_PROCESADOS, 'ensalada'] },

  // ---------- lácteos ----------
  queso_duro: { nombre: 'Queso duro', terminos: ['queso duro'], unidad: 'g', ref: 0.99, excluir: SIN_PROCESADOS },
  quesillo: { nombre: 'Quesillo', terminos: ['quesillo'], unidad: 'g', ref: 0.88, excluir: SIN_PROCESADOS },
  crema: { nombre: 'Crema', terminos: ['crema salud', 'crema acida', 'crema'], unidad: 'ml', ref: 0.42, excluir: ['dental', 'corporal', 'mano', 'facial', 'afeitar', 'batida', 'cafe', 'helado', 'galleta', 'peinar', 'cabello', 'pastelera', 'zapato', 'sopa', 'maiz', 'cacahuate', 'mani', 'chantilly', 'coco', 'avena'] },
  leche: { nombre: 'Leche', terminos: ['leche entera', 'leche'], unidad: 'ml', ref: 0.14, excluir: ['polvo', 'condensada', 'evaporada', 'soya', 'almendra', 'avena', 'coco', 'saborizada', 'chocolate', 'fresa', 'dulce', 'deslactosada', 'bebe', 'formula', 'crema', 'jabon', 'corporal'] },
  margarina: { nombre: 'Margarina', terminos: ['margarina', 'mantequilla'], unidad: 'g', ref: 0.33, excluir: ['mani', 'cacahuate', 'galleta'] },

  // ---------- verduras y frutas ----------
  tomate: { nombre: 'Tomate', terminos: ['tomate'], unidad: 'g', ref: 0.18, excluir: [...SIN_PROCESADOS, 'salsa', 'pasta', 'pure', 'ketchup', 'deshidratad', 'lata', 'pelado', 'cherry'] },
  cebolla: { nombre: 'Cebolla', terminos: ['cebolla'], unidad: 'g', ref: 0.2, excluir: [...SIN_PROCESADOS, 'polvo', 'aros', 'deshidratad', 'sal', 'encurtid', 'verde'] },
  chile_verde: { nombre: 'Chile verde', terminos: ['chile verde', 'chile dulce', 'pimiento verde'], unidad: 'und', ref: 0.35, excluir: [...SIN_PROCESADOS, 'salsa', 'polvo', 'encurtid'] },
  papa: { nombre: 'Papa', terminos: ['papa'], unidad: 'g', ref: 0.17, excluir: [...SIN_PROCESADOS, 'frita', 'pure', 'papaya', 'tostada', 'congelad', 'hash', 'paprika'] },
  zanahoria: { nombre: 'Zanahoria', terminos: ['zanahoria'], unidad: 'g', ref: 0.13, excluir: [...SIN_PROCESADOS, 'pure', 'rallada'] },
  guisquil: { nombre: 'Güisquil', terminos: ['guisquil', 'chayote'], unidad: 'und', ref: 0.4, excluir: SIN_PROCESADOS },
  yuca: { nombre: 'Yuca', terminos: ['yuca'], unidad: 'g', ref: 0.15, excluir: [...SIN_PROCESADOS, 'frita', 'harina'] },
  elote: { nombre: 'Elote', terminos: ['elote'], unidad: 'und', ref: 0.4, excluir: [...SIN_PROCESADOS, 'lata', 'crema', 'dulce', 'grano', 'pan', 'atol', 'tamal'] },
  repollo: { nombre: 'Repollo', terminos: ['repollo'], unidad: 'und', ref: 1.0, excluir: [...SIN_PROCESADOS, 'ensalada', 'morado'] },
  lechuga: { nombre: 'Lechuga', terminos: ['lechuga'], unidad: 'und', ref: 0.9, excluir: [...SIN_PROCESADOS, 'mezcla', 'ensalada'] },
  pepino: { nombre: 'Pepino', terminos: ['pepino'], unidad: 'und', ref: 0.3, excluir: [...SIN_PROCESADOS, 'encurtid', 'pepinillo', 'jabon', 'crema', 'facial'] },
  brocoli: { nombre: 'Brócoli', terminos: ['brocoli'], unidad: 'g', ref: 0.26, excluir: [...SIN_PROCESADOS, 'mezcla'] },
  limon: { nombre: 'Limón', terminos: ['limon persa', 'limon criollo', 'limon'], unidad: 'und', ref: 0.1, excluir: [...SIN_PROCESADOS, 'te', 'limonada', 'agua', 'cloro', 'lavaplatos', 'jabon', 'desinfectante', 'detergente', 'aroma', 'pie', 'pastel', 'sal', 'pimienta', 'suavizante', 'limpiador'] },
  cilantro: { nombre: 'Cilantro', terminos: ['cilantro'], unidad: 'und', ref: 0.25, excluir: [...SIN_PROCESADOS, 'polvo', 'seco', 'deshidratad'] },
  hierbabuena: { nombre: 'Hierbabuena', terminos: ['hierbabuena', 'hierba buena'], unidad: 'und', ref: 0.25, excluir: [...SIN_PROCESADOS, 'te', 'chicle', 'pasta', 'dental'] },
  rabano: { nombre: 'Rábano', terminos: ['rabano'], unidad: 'und', ref: 0.5, excluir: SIN_PROCESADOS },
  aguacate: { nombre: 'Aguacate', terminos: ['aguacate'], unidad: 'und', ref: 0.75, excluir: [...SIN_PROCESADOS, 'guacamole', 'salsa', 'aceite', 'crema', 'mascarilla'] },

  // ---------- panadería y tortillería ----------
  tortillas: { nombre: 'Tortillas', terminos: ['tortilla maiz', 'tortilla'], unidad: 'und', ref: 0.1, excluir: [...SIN_PROCESADOS, 'harina', 'tostada', 'trigo', 'nacho', 'integral'] },
  pan_frances: { nombre: 'Pan francés', terminos: ['pan frances'], unidad: 'und', ref: 0.15, excluir: [] },
  pan_hamburguesa: { nombre: 'Pan de hamburguesa', terminos: ['pan hamburguesa'], unidad: 'und', ref: 0.3, excluir: [] },

  // ---------- se asume que hay en casa ----------
  sal: { nombre: 'Sal', basico: true },
  pimienta: { nombre: 'Pimienta', basico: true },
  comino: { nombre: 'Comino', basico: true },
  oregano: { nombre: 'Orégano', basico: true },
  consome: { nombre: 'Consomé', basico: true },
  harina_trigo: { nombre: 'Harina de trigo', basico: true },
  vinagre: { nombre: 'Vinagre', basico: true },
  salsa_inglesa: { nombre: 'Salsa inglesa', basico: true },
  achiote: { nombre: 'Achiote', basico: true },
  ajo: { nombre: 'Ajo', basico: true },
  azucar: { nombre: 'Azúcar', basico: true },
};

/** Lista única de términos de búsqueda (para que el robot diario los revise). */
export function terminosDeIngredientes() {
  return [...new Set(Object.values(INGREDIENTES).flatMap((i) => i.terminos || []))];
}

/** Para "lo que ya tengo": ingredientes comunes que suelen estar en la despensa. */
export const DESPENSA_COMUN = ['arroz', 'frijol', 'aceite', 'huevo', 'tortillas', 'cebolla', 'tomate', 'papa', 'salsa_tomate',
  'harina_maiz', 'espagueti', 'coditos', 'lentejas', 'queso_duro', 'crema', 'leche', 'margarina', 'limon', 'mayonesa'];

/** Para "no me gusta": proteínas y algunas verduras que la gente suele evitar. */
export const EVITABLES = [
  ['res', 'Res'], ['cerdo', 'Cerdo'], ['pescado', 'Pescado'], ['pollo', 'Pollo'], ['embutido', 'Embutidos'],
  ['guisquil', 'Güisquil'], ['brocoli', 'Brócoli'], ['lentejas', 'Lentejas'], ['aguacate', 'Aguacate'],
  ['chile_verde', 'Chile verde'], ['repollo', 'Repollo'], ['picante', 'Picante'],
];
