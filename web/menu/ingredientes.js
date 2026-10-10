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

// Productos que NO son comida aunque lleven el nombre de un ingrediente ("Lavaplatos con avena",
// "Exprimidor de limón", "Papel higiénico Naranja"). Aplica a TODOS los ingredientes, salvo que la
// palabra sea parte del propio término (ej. "cabello" en "cabello de ángel").
// Palabras de 4+ letras cuentan como prefijo (jabon → jabones).
export const NO_COMIDA = [
  // limpieza y lavandería
  'jabon', 'detergente', 'lavaplatos', 'lavatrastos', 'suavizante', 'cloro', 'desinfectante', 'limpiador',
  'limpia', 'desengrasante', 'aromatizante', 'ambientador', 'insecticida', 'repelente', 'esponja', 'escoba',
  // cuidado personal
  'shampoo', 'champu', 'acondicionador', 'peinar', 'tinte', 'corporal', 'facial', 'locion', 'desodorante',
  'antitranspirante', 'perfume', 'colonia', 'toallita', 'panal', 'rasurador', 'afeitar', 'labial',
  'mascarilla', 'exfoliante', 'bloqueador', 'protector solar', 'neutroskin', 'pert', 'sedal', 'nivea', 'hinds',
  'dental', 'enjuague', 'cepillo', 'higienico', 'servilleta', 'papel', 'panuelo', 'suero',
  // cocina, hogar y otros
  'exprimidor', 'cuchillo', 'rallador', 'colador', 'utensilio', 'sarten', 'olla', 'vaso', 'taza', 'plato',
  'recipiente', 'adaptador', 'vela', 'maceta', 'semilla', 'batlle', 'jardin', 'juguete', 'potato head', 'decoracion',
  // mascotas
  'alimento para', 'mascota', 'perro', 'gato', 'gatito', 'cachorro', 'pedigree', 'whiskas', 'alimiau', 'dog chow', 'cat chow',
];

// Si el nombre del producto EMPIEZA con otro alimento, el producto es ese alimento:
// "Frijoles con chorizo" son frijoles, "Salchicha de pechuga" es salchicha, "Yogurt de papaya" es yogurt.
export const OTRO_ALIMENTO = ['frijol', 'arroz', 'salchicha', 'yogurt', 'yogur', 'crema', 'queso', 'leche', 'galleta',
  'cereal', 'jamon', 'gelatina', 'vegetales', 'huevo', 'aceite', 'mayonesa', 'sopa', 'jugo', 'bebida', 'refresco',
  'salsa', 'chorizo', 'atun', 'mantequilla', 'margarina', 'sazonador', 'consome', 'caldo', 'boquita',
  'snack', 'chips', 'helado', 'mermelada', 'pure', 'harina', 'croqueta', 'mix', 'mezcla', 'guisante', 'chicharo', 'pan', 'pizza', 'nacho'];

export const INGREDIENTES = {
  // ---------- granos y básicos de despensa ----------
  arroz: { nombre: 'Arroz', terminos: ['arroz blanco', 'arroz'], unidad: 'g', ref: 0.14, excluir: [...SIN_PROCESADOS, 'integral', 'precocido', 'leche', 'harina', 'pollo', 'mexicano', 'salvaje'] },
  frijol: { nombre: 'Frijoles rojos', terminos: ['frijol rojo', 'frijol'], unidad: 'g', ref: 0.23, excluir: [...SIN_PROCESADOS, 'molido', 'volteado', 'negro', 'blanco', 'lata', 'refrito'] },
  lentejas: { nombre: 'Lentejas', terminos: ['lenteja'], unidad: 'g', ref: 0.31, excluir: SIN_PROCESADOS },
  aceite: { nombre: 'Aceite', terminos: ['aceite'], unidad: 'ml', ref: 0.32, excluir: ['oliva', 'motor', 'bebe', 'coco', 'spray', 'aceituna', 'atun', 'sardina', 'corporal', 'cabello', 'masaje', 'aguacate', 'sesamo'] },
  espagueti: { nombre: 'Espagueti', terminos: ['espagueti', 'spaghetti', 'spagueti'], unidad: 'g', ref: 0.22, excluir: SIN_PROCESADOS },
  coditos: { nombre: 'Coditos', terminos: ['codito'], unidad: 'g', ref: 0.22, excluir: [...SIN_PROCESADOS, 'queso'] },
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
  res_posta: { nombre: 'Carne de res (posta)', terminos: ['posta res', 'posta', 'carne res'], unidad: 'g', ref: 1.01, excluir: [...SIN_PROCESADOS, 'molida', 'costilla', 'hueso', 'higado', 'lengua', 'menudo', 'panza', 'mondongo', 'embutido', 'salchicha', 'enlatad', 'seca', 'cerdo', 'patties', 'tortas'] },
  res_costilla: { nombre: 'Costilla de res', terminos: ['costilla res'], unidad: 'g', ref: 0.66, excluir: SIN_PROCESADOS },
  carne_molida: { nombre: 'Carne molida', terminos: ['carne molida'], unidad: 'g', ref: 0.77, excluir: [...SIN_PROCESADOS, 'pavo', 'pollo', 'soya', 'vegetal'] },
  chuleta_cerdo: { nombre: 'Chuleta de cerdo', terminos: ['chuleta cerdo', 'chuleta'], unidad: 'g', ref: 0.75, excluir: [...SIN_PROCESADOS, 'ahumad', 'res'] },
  chorizo: { nombre: 'Chorizo', terminos: ['chorizo'], unidad: 'g', ref: 0.66, excluir: [...SIN_PROCESADOS, 'refrito', 'fijoles'] },
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
  cebolla: { nombre: 'Cebolla', terminos: ['cebolla'], unidad: 'g', ref: 0.2, excluir: [...SIN_PROCESADOS, 'polvo', 'aros', 'deshidratad', 'sal', 'encurtid', 'verde', 'crema'] },
  chile_verde: { nombre: 'Chile verde', terminos: ['chile verde', 'chile dulce', 'pimiento verde'], unidad: 'und', ref: 0.35, excluir: [...SIN_PROCESADOS, 'salsa', 'polvo', 'encurtid'] },
  papa: { nombre: 'Papa', terminos: ['papa'], unidad: 'g', ref: 0.17, excluir: [...SIN_PROCESADOS, 'frita', 'pure', 'papaya', 'tostada', 'congelad', 'hash', 'paprika', 'freir', 'sazonad', 'congelad', 'hashbrown', 'tortita'] },
  zanahoria: { nombre: 'Zanahoria', terminos: ['zanahoria'], unidad: 'g', ref: 0.13, excluir: [...SIN_PROCESADOS, 'pure', 'rallada'] },
  guisquil: { nombre: 'Güisquil', terminos: ['guisquil', 'chayote'], unidad: 'und', ref: 0.4, excluir: SIN_PROCESADOS },
  yuca: { nombre: 'Yuca', terminos: ['yuca'], unidad: 'g', ref: 0.15, excluir: [...SIN_PROCESADOS, 'frita', 'harina', 'diana', 'nicol', 'tipic', 'cashita', 'yummies', 'vinagre', 'con sal', 'crema'] },
  elote: { nombre: 'Elote', terminos: ['elote'], unidad: 'und', ref: 0.4, excluir: [...SIN_PROCESADOS, 'lata', 'crema', 'dulce', 'grano', 'pan', 'atol', 'tamal'] },
  repollo: { nombre: 'Repollo', terminos: ['repollo'], unidad: 'und', ref: 1.0, excluir: [...SIN_PROCESADOS, 'ensalada', 'morado'] },
  lechuga: { nombre: 'Lechuga', terminos: ['lechuga'], unidad: 'und', ref: 0.9, excluir: [...SIN_PROCESADOS, 'mezcla', 'ensalada'] },
  pepino: { nombre: 'Pepino', terminos: ['pepino'], unidad: 'und', ref: 0.3, excluir: [...SIN_PROCESADOS, 'encurtid', 'pepinillo', 'jabon', 'crema', 'facial'] },
  brocoli: { nombre: 'Brócoli', terminos: ['brocoli'], unidad: 'g', ref: 0.26, excluir: [...SIN_PROCESADOS, 'mezcla', 'pasta'] },
  limon: { nombre: 'Limón', terminos: ['limon persa', 'limon criollo', 'limon'], unidad: 'und', ref: 0.1, excluir: [...SIN_PROCESADOS, 'te', 'limonada', 'agua', 'cloro', 'lavaplatos', 'jabon', 'desinfectante', 'detergente', 'aroma', 'pie', 'pastel', 'sal', 'pimienta', 'suavizante', 'limpiador'] },
  cilantro: { nombre: 'Cilantro', terminos: ['cilantro'], unidad: 'und', ref: 0.25, excluir: [...SIN_PROCESADOS, 'polvo', 'seco', 'deshidratad'] },
  hierbabuena: { nombre: 'Hierbabuena', terminos: ['hierbabuena', 'hierba buena'], unidad: 'und', ref: 0.25, excluir: [...SIN_PROCESADOS, 'te', 'chicle', 'pasta', 'dental'] },
  rabano: { nombre: 'Rábano', terminos: ['rabano'], unidad: 'und', ref: 0.5, excluir: SIN_PROCESADOS },
  aguacate: { nombre: 'Aguacate', terminos: ['aguacate'], unidad: 'und', ref: 0.75, excluir: [...SIN_PROCESADOS, 'guacamole', 'salsa', 'aceite', 'crema', 'mascarilla'] },

  // ---------- panadería y tortillería ----------
  loroco: { nombre: 'Loroco', terminos: ['loroco'], unidad: 'g', ref: 1.1, excluir: [...SIN_PROCESADOS, 'pupusa', 'salsa', 'crema'] },
  tortillas: { nombre: 'Tortillas', terminos: ['tortilla maiz', 'tortilla'], unidad: 'und', ref: 0.1, excluir: [...SIN_PROCESADOS, 'harina', 'tostada', 'trigo', 'nacho', 'integral'] },
  pan_frances: { nombre: 'Pan francés', terminos: ['pan frances'], unidad: 'und', ref: 0.15, excluir: [] },
  pan_hamburguesa: { nombre: 'Pan de hamburguesa', terminos: ['pan hamburguesa'], unidad: 'und', ref: 0.3, excluir: [] },

  // ---------- desayunos y refacciones ----------
  cafe: { nombre: 'Café molido', terminos: ['cafe molido', 'cafe'], unidad: 'g', ref: 1.2, excluir: ['instantane', 'capsula', 'leche', 'dulce', 'galleta', 'crema', 'helado', 'bebida', 'lata', 'frio', 'cold', 'listo para', 'mocca', 'capuchino'] },
  avena: { nombre: 'Avena', terminos: ['avena'], unidad: 'g', ref: 0.35, excluir: [...SIN_PROCESADOS, 'barra', 'leche', 'jabon', 'shampoo', 'crema', 'mascarilla'] },
  cereal: { nombre: 'Cereal', terminos: ['cereal', 'corn flakes', 'hojuelas maiz'], unidad: 'g', ref: 0.9, excluir: ['barra', 'bebe', 'infantil'] },
  yogurt: { nombre: 'Yogurt', terminos: ['yogurt', 'yogur'], unidad: 'g', ref: 0.45, excluir: ['bebible', 'griego', 'congelado', 'helado', 'galleta', 'crema'] },
  granola: { nombre: 'Granola', terminos: ['granola'], unidad: 'g', ref: 0.9, excluir: ['barra'] },
  galletas: { nombre: 'Galletas', terminos: ['galleta'], unidad: 'g', ref: 0.6, excluir: ['perro', 'gato', 'mascota', 'bebe'] },
  pan_dulce: { nombre: 'Pan dulce', terminos: ['pan dulce', 'semita', 'pan de yema'], unidad: 'und', ref: 0.35, excluir: [] },
  pan_molde: { nombre: 'Pan de molde', terminos: ['pan blanco', 'pan sandwich', 'pan de molde', 'pan integral'], unidad: 'g', ref: 0.45, excluir: ['molido', 'hamburguesa', 'hot dog', 'dulce', 'frances', 'tostado', 'pita', 'arabe'] },
  harina_panqueque: { nombre: 'Harina para panqueques', terminos: ['harina panqueque', 'mezcla panqueque', 'pancake'], unidad: 'g', ref: 0.45, excluir: ['miel', 'jarabe', 'sirope'] },
  harina_arroz: { nombre: 'Harina de arroz', terminos: ['harina arroz'], unidad: 'g', ref: 0.35, excluir: [] },
  jamon: { nombre: 'Jamón', terminos: ['jamon'], unidad: 'g', ref: 0.9, excluir: ['serrano', 'iberico', 'sabor'] },
  queso_amarillo: { nombre: 'Queso amarillo (rodajas)', terminos: ['queso amarillo', 'queso americano', 'queso cheddar'], unidad: 'g', ref: 1.1, excluir: ['salsa', 'dip', 'snack', 'boquita', 'galleta', 'polvo', 'crema', 'pasta', 'sabor a'] },
  chicharron: { nombre: 'Chicharrón', terminos: ['chicharron'], unidad: 'g', ref: 0.9, excluir: [...SIN_PROCESADOS, 'harina', 'bolsa'] },
  fideos: { nombre: 'Fideos', terminos: ['fideo', 'cabello angel'], unidad: 'g', ref: 0.3, excluir: SIN_PROCESADOS },
  tostadas: { nombre: 'Tostadas de maíz', terminos: ['tostada maiz', 'tostada'], unidad: 'und', ref: 0.08, excluir: ['pan tostado', 'harina', 'trigo', 'integral', 'nacho'] },
  mani: { nombre: 'Maní', terminos: ['mani', 'cacahuate'], unidad: 'g', ref: 0.8, excluir: ['mantequilla', 'crema', 'dulce', 'chocolate', 'garapinado', 'confitado', 'aceite', 'galleta'] },
  palomitas: { nombre: 'Maíz para palomitas', terminos: ['palomitas', 'maiz palomero', 'poporopo'], unidad: 'g', ref: 0.6, excluir: [] },
  gelatina: { nombre: 'Gelatina', terminos: ['gelatina'], unidad: 'g', ref: 0.75, excluir: ['sin sabor', 'capsula', 'colageno', 'cabello'] },

  // ---------- frutas ----------
  platano: { nombre: 'Plátano', terminos: ['platano'], unidad: 'und', ref: 0.3, excluir: [...SIN_PROCESADOS, 'frito', 'harina', 'tajada', 'platanito'] },
  banano: { nombre: 'Banano', terminos: ['banano', 'guineo'], unidad: 'und', ref: 0.12, excluir: [...SIN_PROCESADOS, 'deshidratad', 'chips', 'pan', 'yogurt', 'leche', 'jabon', 'shampoo', 'crema'] },
  mango: { nombre: 'Mango', terminos: ['mango'], unidad: 'und', ref: 0.5, excluir: [...SIN_PROCESADOS, 'deshidratad', 'mermelada', 'yogurt', 'leche', 'jabon', 'crema', 'gelatina', 'salsa', 'nectar', 'pulpa'] },
  manzana: { nombre: 'Manzana', terminos: ['manzana'], unidad: 'und', ref: 0.45, excluir: [...SIN_PROCESADOS, 'deshidratad', 'mermelada', 'yogurt', 'compota', 'vinagre', 'jabon', 'shampoo', 'crema', 'gelatina', 'sidra', 'te', 'pie'] },
  naranja: { nombre: 'Naranja', terminos: ['naranja'], unidad: 'und', ref: 0.15, excluir: [...SIN_PROCESADOS, 'mermelada', 'yogurt', 'jabon', 'gelatina', 'nectar', 'te', 'aroma', 'pulpa'] },
  papaya: { nombre: 'Papaya', terminos: ['papaya'], unidad: 'g', ref: 0.12, excluir: [...SIN_PROCESADOS, 'deshidratad', 'mermelada', 'jabon', 'crema'] },

  // ---------- se asume que hay en casa ----------
  canela: { nombre: 'Canela', basico: true },
  maicena: { nombre: 'Maicena', basico: true },
  miel: { nombre: 'Miel o jarabe', basico: true },
  alguashte: { nombre: 'Alguashte', basico: true },
  vainilla: { nombre: 'Vainilla', basico: true },
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
  'harina_maiz', 'espagueti', 'coditos', 'lentejas', 'queso_duro', 'crema', 'leche', 'margarina', 'limon', 'mayonesa',
  'cafe', 'avena', 'pan_molde', 'galletas', 'fideos'];

/** Para "no me gusta": proteínas y algunas verduras que la gente suele evitar. */
export const EVITABLES = [
  ['res', 'Res'], ['cerdo', 'Cerdo'], ['pescado', 'Pescado'], ['pollo', 'Pollo'], ['embutido', 'Embutidos'],
  ['guisquil', 'Güisquil'], ['brocoli', 'Brócoli'], ['lentejas', 'Lentejas'], ['aguacate', 'Aguacate'],
  ['chile_verde', 'Chile verde'], ['repollo', 'Repollo'], ['picante', 'Picante'],
];
