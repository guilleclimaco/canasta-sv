// Recetario ampliado: platos de casa y de comedor salvadoreño armados por partes.
// Un plato de comedor es un PLATO FUERTE + dos ACOMPAÑAMIENTOS (+ tortillas): "Hígado encebollado con arroz y
// frijoles" y "Hígado encebollado con casamiento y ensalada" son platos distintos del menú, con el mismo plato fuerte.
// Por eso cada receta generada lleva `familia` = el plato fuerte: el planificador no repite la familia en la semana.
// Cantidades para 4 porciones. Mismo formato que recetas.js.

// ------------------------------------------------------------------ acompañamientos
// tipo: 'base' (arroz, frijoles, papa…) | 'comp' (ensalada, aguacate, plátano…)
export const LADOS = {
  arroz: { n: 'arroz', tipo: 'base', min: 25, ing: [['arroz', 300], ['aceite', 20], ['cebolla', 30]],
    paso: 'Arroz: sofríe el arroz con un poco de aceite y cebolla, agrega el doble de agua y sal y cocina tapado 20 min.' },
  arroz_verduras: { n: 'arroz primavera', tipo: 'base', min: 25, ing: [['arroz', 300], ['zanahoria', 80], ['guisantes', 60], ['aceite', 20], ['cebolla', 30]],
    paso: 'Arroz primavera: sofríe el arroz con cebolla, agrega zanahoria en cubitos, guisantes, el doble de agua y sal; tapa 20 min.' },
  casamiento: { n: 'casamiento', tipo: 'base', min: 25, ing: [['arroz', 250], ['frijol', 250], ['cebolla', 60], ['aceite', 20]],
    paso: 'Casamiento: cocina el arroz; sofríe cebolla, agrega los frijoles cocidos con un poco de caldo y el arroz, y revuelve hasta que se integren.' },
  frijoles: { n: 'frijoles volteados', tipo: 'base', min: 20, ing: [['frijol', 300], ['aceite', 30], ['cebolla', 40]],
    paso: 'Frijoles: licúa o machaca los frijoles cocidos y voltéalos en aceite con cebolla hasta que espesen.' },
  frijoles_olla: { n: 'frijoles de olla', tipo: 'base', min: 20, ing: [['frijol', 300], ['cebolla', 40]],
    paso: 'Frijoles de olla: calienta los frijoles cocidos con su caldo, cebolla y sal.' },
  papas_fritas: { n: 'papas fritas', tipo: 'base', min: 25, et: ['frito'], ing: [['papa', 600], ['aceite', 200]],
    paso: 'Papas: córtalas en bastones y fríelas en aceite caliente hasta dorar; escurre y sala.' },
  pure: { n: 'puré de papa', tipo: 'base', min: 30, ing: [['papa', 700], ['leche', 100], ['margarina', 30]],
    paso: 'Puré: cocina las papas peladas en agua con sal y májalas con leche caliente y margarina.' },
  yuca: { n: 'yuca salcochada', tipo: 'base', min: 35, ing: [['yuca', 700]],
    paso: 'Yuca: pélala, córtala en trozos y cocínala en agua con sal hasta que esté suave.' },
  ensalada_repollo: { n: 'ensalada de repollo', tipo: 'comp', min: 10, ing: [['repollo', 0.5], ['tomate', 150], ['limon', 2]],
    paso: 'Ensalada: repollo picado fino con tomate, limón y sal.' },
  ensalada_verde: { n: 'ensalada verde', tipo: 'comp', min: 10, ing: [['lechuga', 1], ['tomate', 150], ['pepino', 1], ['limon', 2]],
    paso: 'Ensalada: lechuga, tomate y pepino en rodajas con limón y sal.' },
  ensalada_pepino: { n: 'ensalada de pepino', tipo: 'comp', min: 10, ing: [['pepino', 2], ['rabano', 0.5], ['limon', 2]],
    paso: 'Pepino y rábano en rodajas con limón, sal y un poco de alguashte.' },
  curtido: { n: 'curtido', tipo: 'comp', min: 15, ing: [['repollo', 0.5], ['zanahoria', 80], ['cebolla', 40], ['vinagre', 1], ['oregano', 1]],
    paso: 'Curtido: repollo escaldado y picado con zanahoria rallada, cebolla, vinagre, orégano y sal.' },
  chirmol: { n: 'chirmol', tipo: 'comp', min: 10, ing: [['tomate', 250], ['cebolla', 80], ['cilantro', 1], ['limon', 2]],
    paso: 'Chirmol: tomate, cebolla y cilantro picados fino con limón y sal.' },
  aguacate: { n: 'aguacate', tipo: 'comp', min: 5, ing: [['aguacate', 2], ['limon', 1]],
    paso: 'Aguacate en tajadas con limón y sal.' },
  platano: { n: 'plátano frito', tipo: 'comp', min: 15, et: ['frito'], ing: [['platano', 2], ['aceite', 60]],
    paso: 'Plátano: fríe el plátano maduro en tajadas hasta dorar.' },
  vegetales: { n: 'vegetales salteados', tipo: 'comp', min: 15, ing: [['zanahoria', 150], ['brocoli', 200], ['ejote', 150], ['margarina', 20]],
    paso: 'Vegetales: corta zanahoria, brócoli y ejotes, cuécelos 5 min y saltéalos en margarina con sal y pimienta.' },
  ejotes: { n: 'ejotes al vapor', tipo: 'comp', min: 15, ing: [['ejote', 300], ['margarina', 15]],
    paso: 'Ejotes: cocínalos al vapor 8 min y sírvelos con margarina y sal.' },
};
// qué acompañamientos van con cada estilo de plato, en orden de preferencia
const COMBINA = {
  seco: { bases: ['arroz', 'casamiento', 'frijoles', 'arroz_verduras', 'papas_fritas', 'pure', 'yuca'],
    comps: ['ensalada_repollo', 'ensalada_verde', 'aguacate', 'chirmol', 'platano', 'ensalada_pepino', 'vegetales', 'curtido'] },
  salsa: { bases: ['arroz', 'arroz_verduras', 'casamiento', 'pure', 'frijoles_olla'],
    comps: ['ensalada_verde', 'aguacate', 'ensalada_repollo', 'platano', 'ensalada_pepino', 'vegetales', 'ejotes'] },
  pescado: { bases: ['arroz', 'papas_fritas', 'yuca', 'arroz_verduras', 'casamiento'],
    comps: ['ensalada_repollo', 'ensalada_verde', 'aguacate', 'ensalada_pepino', 'chirmol', 'platano'] },
};
const MAX_COMBOS = 28;

// ------------------------------------------------------------------ proteínas
// g: m | f | mp | fp (género y número, para "encebollado/a/os/as"); el: con artículo, para los pasos
const PROT = {
  pollo_piezas: { nom: 'Pollo', g: 'm', el: 'el pollo', cant: 1000, min: 35, prot: 'pollo', pop: 5 },
  pechuga: { nom: 'Pechuga', g: 'f', el: 'la pechuga en filetes', cant: 700, min: 15, prot: 'pollo', pop: 4 },
  res_posta: { nom: 'Bistec', g: 'm', el: 'los bistecs', cant: 700, min: 20, prot: 'res', pop: 5 },
  higado: { nom: 'Hígado', g: 'm', el: 'el hígado en bistecs', cant: 700, min: 12, prot: 'res', pop: 4, et: ['visceras'] },
  lengua: { nom: 'Lengua', g: 'f', el: 'la lengua cocida en rodajas', cant: 1000, min: 20, prot: 'res', pop: 4, et: ['visceras', 'finde'],
    pre: { min: 120, paso: 'Cocina la lengua en agua con sal, ajo y laurel unas 2 horas; pélala en caliente y córtala en rodajas.' } },
  carne_cerdo: { nom: 'Carne de cerdo', g: 'f', el: 'la carne de cerdo en trozos', cant: 800, min: 30, prot: 'cerdo', pop: 4 },
  chuleta_cerdo: { nom: 'Chuletas', g: 'fp', el: 'las chuletas', cant: 800, min: 15, prot: 'cerdo', pop: 4 },
  costilla_cerdo: { nom: 'Costillas de cerdo', g: 'fp', el: 'las costillas', cant: 1200, min: 60, prot: 'cerdo', pop: 4 },
  res_costilla: { nom: 'Costilla de res', g: 'f', el: 'la costilla', cant: 1200, min: 30, prot: 'res', pop: 4,
    pre: { min: 70, paso: 'Cocina la costilla en agua con sal, ajo y cebolla hasta que esté suave (60–70 min).' } },
  lomito: { nom: 'Lomito de res', g: 'm', el: 'el lomito en medallones', cant: 700, min: 12, prot: 'res', pop: 3, et: ['finde'] },
  pavo: { nom: 'Pavo', g: 'm', el: 'el pavo en piezas', cant: 1200, min: 70, prot: 'pollo', pop: 3, et: ['finde'] },
  tilapia: { nom: 'Filete de tilapia', g: 'm', el: 'los filetes', cant: 700, min: 10, prot: 'pescado', pop: 4 },
  pescado_entero: { nom: 'Pescado', g: 'm', el: 'el pescado limpio, con cortes a los lados', cant: 1200, min: 20, prot: 'pescado', pop: 4, et: ['finde'] },
  camaron: { nom: 'Camarones', g: 'mp', el: 'los camarones pelados', cant: 600, min: 6, prot: 'mariscos', pop: 4 },
  alitas: { nom: 'Alitas', g: 'fp', el: 'las alitas', cant: 1000, min: 30, prot: 'pollo', pop: 3 },
  salchicha: { nom: 'Salchichas', g: 'fp', el: 'las salchichas en rodajas', cant: 500, min: 8, prot: 'embutido', pop: 4, et: ['economico', 'ninos'] },
  chorizo: { nom: 'Chorizo', g: 'm', el: 'el chorizo en trozos', cant: 500, min: 12, prot: 'embutido', pop: 4, et: ['economico'] },
  mortadela: { nom: 'Mortadela', g: 'f', el: 'la mortadela en rodajas', cant: 500, min: 6, prot: 'embutido', pop: 4, et: ['economico'] },
  sardina: { nom: 'Sardinas', g: 'fp', el: 'las sardinas', cant: 600, min: 5, prot: 'pescado', pop: 4, et: ['economico'] },
  atun: { nom: 'Atún', g: 'm', el: 'el atún escurrido', cant: 420, min: 5, prot: 'pescado', pop: 3, et: ['economico', 'rapido'] },
};
const adj = (raiz, g) => raiz + ({ m: 'o', f: 'a', mp: 'os', fp: 'as' })[g];

// ------------------------------------------------------------------ formas de cocinar
// nombre(p) arma el nombre; ing: lo que va además de la proteína; lados: estilo de acompañamientos
const TECNICAS = {
  encebollado: { nombre: (p) => `${p.nom} ${adj('encebollad', p.g)}`, pop: 5, min: 10, lados: 'seco', et: ['tradicional', 'comedor'],
    prots: ['pechuga', 'higado', 'carne_cerdo', 'tilapia', 'lomito', 'res_costilla', 'chorizo', 'salchicha', 'mortadela'],
    ing: [['cebolla', 400], ['aceite', 30], ['salsa_inglesa', 1], ['ajo', 3]],
    pasos: (p) => [`Sazona ${p.el} con sal, pimienta, ajo y un chorrito de salsa inglesa.`,
      `Dora ${p.el.split(' ').slice(0, 2).join(' ')} en sartén caliente con un poco de aceite; retira.`,
      'En el mismo sartén cocina abundante cebolla en aros hasta que esté suave y transparente.',
      'Regresa la carne a la cebolla, tapa y deja 5 min a fuego bajo para que tome el sabor.'] },
  entomatado: { nombre: (p) => `${p.nom} ${adj('entomatad', p.g)}`, pop: 5, min: 20, lados: 'salsa', et: ['tradicional', 'comedor'],
    prots: ['pechuga', 'higado', 'carne_cerdo', 'camaron', 'tilapia', 'lomito', 'res_costilla', 'chuleta_cerdo', 'salchicha', 'sardina', 'atun', 'chorizo'],
    ing: [['tomate', 500], ['cebolla', 150], ['chile_verde', 1], ['aceite', 30], ['ajo', 3]],
    pasos: (p) => [`Sazona ${p.el} con sal, pimienta y ajo y dóralo en poco aceite.`,
      'Agrega tomate, cebolla y chile verde en tiras.',
      'Tapa y cocina a fuego bajo hasta que el tomate se deshaga y forme una salsa espesa.'] },
  guisado: { nombre: (p) => `${p.nom} ${adj('guisad', p.g)} con papas`, pop: 5, min: 35, lados: 'salsa', et: ['tradicional', 'comedor', 'lonchera'],
    prots: ['carne_cerdo', 'costilla_cerdo', 'lengua', 'higado', 'pavo', 'pechuga'],
    ing: [['tomate', 300], ['cebolla', 150], ['chile_verde', 1], ['papa', 400], ['zanahoria', 150], ['salsa_tomate', 106], ['aceite', 30], ['consome', 1], ['ajo', 3]],
    pasos: (p) => [`Dora ${p.el} sazonado con sal, ajo y pimienta.`,
      'Licúa tomate, cebolla, chile y salsa de tomate con media taza de agua.',
      'Agrega la salsa, la papa y la zanahoria en trozos y el consomé; tapa y cocina a fuego medio hasta que la papa esté suave.'] },
  en_salsa: { nombre: (p) => `${p.nom} en salsa`, pop: 4, min: 30, lados: 'salsa', et: ['tradicional', 'comedor'],
    prots: ['lengua', 'pavo', 'pollo_piezas', 'carne_cerdo', 'costilla_cerdo', 'camaron', 'res_costilla', 'salchicha', 'sardina', 'alitas', 'higado'],
    ing: [['tomate', 400], ['cebolla', 100], ['chile_verde', 1], ['salsa_tomate', 106], ['achiote', 1], ['laurel', 1], ['aceite', 30], ['ajo', 3]],
    pasos: (p) => [`Dora ${p.el} sazonado con sal y ajo.`,
      'Asa en comal tomate, cebolla y chile; licúalos con la salsa de tomate, achiote y un poco de agua.',
      'Vierte la salsa sobre la carne con una hoja de laurel y cocina a fuego bajo hasta que espese y la carne esté suave.'] },
  dorado: { nombre: (p) => `${p.nom} ${adj('dorad', p.g)}`, pop: 5, min: 15, lados: 'seco', et: ['comedor', 'frito'],
    prots: ['chuleta_cerdo', 'carne_cerdo', 'alitas', 'pescado_entero', 'mortadela', 'higado', 'pechuga', 'res_posta'],
    ing: [['aceite', 250], ['limon', 2], ['ajo', 3], ['consome', 1]],
    pasos: (p) => [`Sazona ${p.el} con ajo, limón, consomé, sal y pimienta; deja reposar 15 min.`,
      'Fríe en aceite caliente a fuego medio, volteando, hasta que esté bien dorado y cocido por dentro.',
      'Escurre sobre papel.'] },
  empanizado: { nombre: (p) => `${p.nom} ${adj('empanizad', p.g)}`, pop: 4, min: 15, lados: 'seco', et: ['comedor', 'frito', 'ninos'],
    prots: ['tilapia', 'res_posta', 'chuleta_cerdo', 'camaron', 'higado', 'mortadela'],
    ing: [['huevo', 2], ['pan_molido', 150], ['aceite', 250], ['limon', 2]],
    pasos: (p) => [`Sazona ${p.el} con sal y pimienta.`,
      'Pásalo por huevo batido y luego por pan molido, presionando para que se pegue.',
      'Fríe en aceite caliente hasta que esté dorado por ambos lados; escurre.'] },
  plancha: { nombre: (p) => `${p.nom} a la plancha`, pop: 4, min: 10, lados: 'seco', et: ['saludable', 'comedor'],
    prots: ['lomito', 'costilla_cerdo', 'camaron', 'tilapia', 'carne_cerdo', 'higado', 'pollo_piezas'],
    ing: [['limon', 3], ['aceite', 20], ['ajo', 3], ['oregano', 1]],
    pasos: (p) => [`Marina ${p.el} con limón, ajo, orégano, sal y pimienta (mínimo 20 min).`,
      'Calienta bien la plancha o sartén con unas gotas de aceite.',
      'Cocina sin mover mucho, volteando una vez, hasta que esté dorado y en su punto.'] },
  en_crema: { nombre: (p) => `${p.nom} en crema`, pop: 4, min: 15, lados: 'salsa', et: ['comedor', 'ninos'],
    prots: ['camaron', 'tilapia', 'carne_cerdo', 'pavo'],
    ing: [['crema', 250], ['cebolla', 100], ['margarina', 30], ['consome', 1], ['ajo', 2]],
    pasos: (p) => [`Sazona ${p.el} y dóralo en margarina con cebolla y ajo picados.`,
      'Agrega la crema y el consomé disuelto en un poco de agua.',
      'Cocina 8–10 min a fuego bajo hasta que la salsa espese.'] },
  con_loroco: { nombre: (p) => `${p.nom} con loroco en crema`, pop: 4, min: 15, lados: 'salsa', et: ['tradicional', 'comedor'],
    prots: ['camaron', 'tilapia', 'carne_cerdo'],
    ing: [['crema', 250], ['loroco', 100], ['cebolla', 80], ['margarina', 30], ['ajo', 2]],
    pasos: (p) => [`Dora ${p.el} en margarina con cebolla y ajo.`,
      'Agrega la crema y el loroco; cocina 8 min a fuego bajo.'] },
  ajillo: { nombre: (p) => `${p.nom} al ajillo`, pop: 4, min: 10, lados: 'seco', et: ['comedor'],
    prots: ['camaron', 'tilapia', 'pechuga', 'pescado_entero'],
    ing: [['ajo', 6], ['margarina', 60], ['limon', 2], ['perejil', 1]],
    pasos: (p) => [`Sazona ${p.el} con sal, pimienta y limón.`,
      'Derrite la margarina con bastante ajo picado sin que se queme.',
      'Cocina la proteína en la mantequilla de ajo hasta que esté lista y termina con perejil.'] },
  diabla: { nombre: (p) => `${p.nom} a la diabla`, pop: 3, min: 15, lados: 'salsa', et: ['picante'],
    prots: ['camaron', 'pechuga'],
    ing: [['tomate', 300], ['jalapeno', 60], ['cebolla', 80], ['salsa_tomate', 106], ['aceite', 30], ['ajo', 3]],
    pasos: (p) => [`Dora ${p.el} con ajo.`,
      'Licúa tomate, jalapeño, cebolla y salsa de tomate; cocina la salsa 10 min.',
      'Mezcla con la proteína y cocina 5 min más.'] },
  horno: { nombre: (p) => `${p.nom} al horno`, pop: 3, min: 50, lados: 'seco', et: ['finde'], aparatos: ['horno'],
    prots: ['costilla_cerdo', 'carne_cerdo', 'pescado_entero', 'pavo', 'pechuga', 'lomito'],
    ing: [['limon', 3], ['mostaza', 1], ['salsa_inglesa', 1], ['cebolla', 100], ['aceite', 30], ['ajo', 4]],
    pasos: (p) => [`Marina ${p.el} con limón, mostaza, salsa inglesa, ajo, sal y pimienta (mejor desde la noche).`,
      'Colócalo en una bandeja sobre cebolla en rodajas y tapa con papel aluminio.',
      'Hornea a 180 °C hasta que esté cocido; destapa los últimos 15 min para dorar.'] },
  adobado: { nombre: (p) => `${p.nom} ${adj('adobad', p.g)}`, pop: 4, min: 20, lados: 'seco', et: ['tradicional'],
    prots: ['carne_cerdo', 'chuleta_cerdo', 'pollo_piezas', 'costilla_cerdo', 'pechuga', 'res_posta'],
    ing: [['achiote', 1], ['naranja', 2], ['comino', 1], ['oregano', 1], ['cebolla', 100], ['aceite', 30], ['ajo', 4]],
    pasos: (p) => [`Marina ${p.el} con jugo de naranja, achiote, comino, orégano, ajo y sal (mínimo 1 hora).`,
      'Cocínalo en sartén con un poco de aceite y la cebolla, tapado al inicio y destapado al final para que se dore.'] },
  salteado: { nombre: (p) => `${p.nom} ${adj('saltead', p.g)} con verduras`, pop: 3, min: 15, lados: 'salsa', et: ['saludable', 'rapido'],
    prots: ['pechuga', 'res_posta', 'carne_cerdo', 'camaron'],
    ing: [['zanahoria', 150], ['brocoli', 200], ['cebolla', 100], ['chile_verde', 1], ['salsa_soya', 1], ['aceite', 30], ['ajo', 3]],
    pasos: (p) => [`Corta ${p.el} en tiras y saltéalo en aceite bien caliente; retira.`,
      'Saltea las verduras en tiras 4–5 min, que queden crujientes.',
      'Junta todo con salsa de soya y un poco de agua con maicena para que brille.'] },
  chirmol: { nombre: (p) => `${p.nom} en chirmol`, pop: 4, min: 15, lados: 'seco', et: ['tradicional', 'comedor'],
    prots: ['res_posta', 'carne_cerdo', 'chuleta_cerdo', 'pollo_piezas', 'higado', 'pechuga'],
    ing: [['tomate', 400], ['cebolla', 150], ['chile_verde', 1], ['cilantro', 1], ['limon', 2], ['aceite', 20], ['ajo', 3]],
    pasos: (p) => [`Asa ${p.el} sazonado con sal, ajo y limón en plancha o comal.`,
      'Asa también tomate, cebolla y chile; pícalos fino con cilantro, limón y sal.',
      'Sirve la carne bañada con el chirmol.'] },
  champinones: { nombre: (p) => `${p.nom} en salsa de champiñones`, pop: 3, min: 15, lados: 'salsa', et: [],
    prots: ['pechuga', 'carne_cerdo', 'chuleta_cerdo', 'res_posta'],
    ing: [['champinones', 250], ['crema', 200], ['cebolla', 80], ['margarina', 30], ['ajo', 2]],
    pasos: (p) => [`Sella ${p.el} sazonado en sartén caliente; retira.`, 'Saltea cebolla, ajo y champiñones en margarina.',
      'Agrega la crema, regresa la carne y cocina 5–8 min.'] },
  barbacoa: { nombre: (p) => `${p.nom} en salsa barbacoa`, pop: 3, min: 20, lados: 'seco', et: ['ninos'],
    prots: ['pollo_piezas', 'alitas', 'chuleta_cerdo', 'pechuga'],
    ing: [['salsa_tomate', 212], ['azucar', 1], ['mostaza', 1], ['salsa_inglesa', 1], ['cebolla', 80], ['aceite', 20], ['ajo', 3]],
    pasos: (p) => [`Dora ${p.el} sazonado con sal y ajo.`, 'Mezcla salsa de tomate, un poco de azúcar, mostaza y salsa inglesa con cebolla picada.',
      'Baña la carne con la salsa y cocina tapado hasta que esté suave y glaseada.'] },
  mostaza: { nombre: (p) => `${p.nom} a la mostaza`, pop: 3, min: 15, lados: 'salsa', et: [],
    prots: ['pechuga', 'chuleta_cerdo', 'carne_cerdo'],
    ing: [['mostaza', 1], ['crema', 150], ['miel', 1], ['cebolla', 60], ['margarina', 20]],
    pasos: (p) => [`Dora ${p.el} sazonado.`, 'Mezcla mostaza, crema y un toque de miel con la cebolla sofrita.', 'Cocina la carne en la salsa 8 min.'] },
  sudado: { nombre: (p) => `${p.nom} ${adj('sudad', p.g)}`, pop: 4, min: 15, lados: 'salsa', et: ['saludable', 'tradicional'],
    prots: ['tilapia', 'pescado_entero', 'pechuga', 'pollo_piezas'],
    ing: [['tomate', 400], ['cebolla', 150], ['chile_verde', 1], ['cilantro', 1], ['limon', 2], ['ajo', 3]],
    pasos: (p) => [`Sazona ${p.el} con sal, ajo y limón.`, 'Pon una cama de tomate, cebolla y chile en rodajas en una olla, la carne encima y otra capa de verduras.',
      'Tapa y cocina a fuego bajo en su propio jugo hasta que esté cocido; termina con cilantro.'] },
  tacos: { nombre: (p) => `Tacos de ${p.nom.toLowerCase()}`, pop: 4, min: 15, lados: 'seco', et: ['tradicional', 'comedor'],
    prots: ['res_posta', 'carne_cerdo', 'camaron', 'tilapia', 'chorizo', 'pechuga', 'higado'],
    ing: [['tortillas', 16], ['cebolla', 100], ['tomate', 200], ['repollo', 0.25], ['aceite', 120], ['limon', 2], ['ajo', 3]],
    pasos: (p) => [`Cocina ${p.el} sazonado con sal, ajo y cebolla; desmenúzalo o pícalo.`,
      'Rellena las tortillas, enróllalas y fríelas en poco aceite hasta que estén doraditas.',
      'Sírvelos con repollo picado, salsa de tomate y limón.'] },
  estofado: { nombre: (p) => `${p.nom} con verduras`, pop: 4, min: 30, lados: 'salsa', et: ['saludable', 'lonchera'],
    prots: ['pollo_piezas', 'res_posta', 'carne_cerdo', 'pechuga', 'res_costilla'],
    ing: [['papa', 300], ['zanahoria', 150], ['guisquil', 1], ['ejote', 150], ['tomate', 200], ['cebolla', 100], ['consome', 1], ['ajo', 3]],
    pasos: (p) => [`Dora ${p.el} con cebolla y ajo.`, 'Agrega tomate picado, agua y consomé.',
      'Agrega las verduras en trozos y cocina tapado hasta que todo esté suave.'] },
};

// combinaciones que ya están en el recetario escrito a mano (no se repiten)
const YA_EXISTEN = new Set(['encebollado|pollo_piezas', 'encebollado|res_posta', 'encebollado|chuleta_cerdo', 'entomatado|pollo_piezas',
  'entomatado|res_posta', 'guisado|pollo_piezas', 'guisado|res_posta', 'dorado|pollo_piezas', 'dorado|tilapia', 'empanizado|pechuga',
  'plancha|pechuga', 'plancha|res_posta', 'plancha|chuleta_cerdo', 'en_crema|pechuga', 'con_loroco|pechuga', 'horno|pollo_piezas', 'en_salsa|res_costilla']);
// clásicos que suben de popularidad
const CLASICOS = { 'encebollado|higado': 5, 'en_salsa|lengua': 5, 'entomatado|higado': 5, 'en_salsa|pavo': 4, 'dorado|pescado_entero': 5,
  'empanizado|res_posta': 4, 'ajillo|camaron': 4, 'dorado|chuleta_cerdo': 5, 'encebollado|carne_cerdo': 4 };

function platoTecnica(tk, t, pk) {
  const p = PROT[pk];
  const pop = CLASICOS[`${tk}|${pk}`] ?? Math.max(2, Math.min(5, Math.round((p.pop + t.pop) / 2)));
  return {
    id: `${tk.replace('_', '-')}-${pk.replace('_', '-')}`, nombre: t.nombre(p), tecnica: tk, lados: t.lados === 'seco' && p.prot === 'pescado' ? 'pescado' : t.lados,
    min: t.min + p.min + (p.pre?.min || 0), proteina: p.prot, popularidad: pop, aparatos: t.aparatos || ['estufa'],
    etiquetas: [...new Set([...t.et, ...(p.et || [])])], tortillas: true,
    ing: [[pk, p.cant], ...t.ing], pasos: [...(p.pre ? [p.pre.paso] : []), ...t.pasos(p)],
  };
}

// ------------------------------------------------------------------ platos fuertes escritos uno por uno
// (sopas, típicos, pastas, arroces y verduras). lados: estilo de acompañamientos o null (se sirve solo)
const P = (id, nombre, min, proteina, pop, et, ing, pasos, extra = {}) => ({ id, nombre, min, proteina, popularidad: pop, etiquetas: et, ing, pasos, aparatos: ['estufa'], ...extra });
const PLATOS = [
  // --- tortas (tortitas) envueltas en huevo, muy de casa
  P('tortas-ejote', 'Tortitas de ejote envueltas en huevo', 40, 'huevo', 4, ['tradicional', 'economico', 'frito'],
    [['ejote', 400], ['huevo', 4], ['harina_trigo', 1], ['aceite', 120], ['tomate', 300], ['cebolla', 80]],
    ['Cocina los ejotes en agua con sal 8 min y escúrrelos.', 'Bate las claras a punto de nieve y agrega las yemas y una cucharada de harina.',
      'Toma manojitos de ejote, pásalos por el huevo y fríelos hasta dorar.', 'Sírvelos en una salsa de tomate y cebolla licuados y cocidos.'], { lados: 'salsa', tortillas: true }),
  P('tortas-coliflor', 'Tortitas de coliflor en salsa', 40, 'huevo', 3, ['tradicional', 'economico', 'frito'],
    [['coliflor', 600], ['huevo', 4], ['harina_trigo', 1], ['aceite', 120], ['tomate', 300], ['cebolla', 80], ['queso_duro', 60]],
    ['Cuece los ramitos de coliflor 6 min en agua con sal.', 'Bate los huevos a punto de nieve con la harina.',
      'Envuelve la coliflor con un poco de queso en el huevo y fríe.', 'Sirve en salsa de tomate.'], { lados: 'salsa', tortillas: true }),
  P('tortas-ayote', 'Tortitas de ayote con queso', 35, 'huevo', 3, ['tradicional', 'economico', 'frito'],
    [['ayote', 600], ['huevo', 4], ['queso_duro', 80], ['harina_trigo', 1], ['aceite', 120], ['tomate', 300]],
    ['Corta el ayote en rodajas gruesas y cuécelo 4 min.', 'Pon queso entre dos rodajas, pásalas por huevo batido a punto de nieve y fríe.', 'Sirve con salsa de tomate.'], { lados: 'salsa', tortillas: true }),
  P('tortas-espinaca', 'Tortitas de espinaca y queso', 30, 'huevo', 3, ['saludable', 'frito'],
    [['espinaca', 400], ['huevo', 4], ['queso_fresco', 150], ['harina_trigo', 1], ['aceite', 100], ['cebolla', 60]],
    ['Pica la espinaca y la cebolla y mézclalas con queso desmoronado.', 'Agrega los huevos batidos y la harina; sazona.', 'Fríe cucharadas de la mezcla por ambos lados.'], { lados: 'seco', tortillas: true }),
  P('tortas-sardina', 'Tortitas de sardina', 30, 'pescado', 3, ['economico', 'frito'],
    [['sardina', 300], ['papa', 300], ['huevo', 2], ['cebolla', 60], ['pan_molido', 60], ['aceite', 120]],
    ['Cocina y maja la papa.', 'Desmenuza la sardina sin espinas y mézclala con papa, huevo, cebolla picada y pan molido.', 'Forma tortitas y fríelas hasta dorar.'], { lados: 'seco', tortillas: true }),
  P('tortas-pescado', 'Tortitas de pescado', 35, 'pescado', 3, ['frito'],
    [['tilapia', 500], ['papa', 300], ['huevo', 2], ['cebolla', 60], ['pan_molido', 80], ['aceite', 120]],
    ['Cocina el pescado y desmenúzalo.', 'Mézclalo con papa majada, huevo, cebolla y pan molido.', 'Forma tortitas y fríelas.'], { lados: 'seco', tortillas: true }),
  P('guisquiles-rellenos', 'Güisquiles rellenos de queso', 50, 'huevo', 4, ['tradicional', 'frito'],
    [['guisquil', 3], ['queso_duro', 150], ['huevo', 4], ['harina_trigo', 1], ['aceite', 120], ['tomate', 300], ['cebolla', 80]],
    ['Cuece los güisquiles partidos a la mitad hasta que estén suaves.', 'Saca un poco de pulpa, rellena con queso y cierra.', 'Pásalos por huevo batido y fríelos.', 'Sirve con salsa de tomate.'], { lados: 'salsa', tortillas: true }),
  P('chiles-rellenos-pollo', 'Chiles rellenos de pollo', 75, 'pollo', 4, ['tradicional', 'frito'],
    [['chile_verde', 6], ['pechuga', 500], ['papa', 200], ['zanahoria', 100], ['huevo', 4], ['aceite', 150], ['tomate', 400], ['cebolla', 100]],
    ['Asa los chiles, pélalos y sácales las semillas.', 'Cocina y desmenuza la pechuga; sofríela con papa y zanahoria en cubitos.', 'Rellena los chiles, envuélvelos en huevo batido a punto de nieve y fríe.', 'Sírvelos en salsa de tomate.'], { lados: 'salsa', tortillas: true }),
  P('chiles-rellenos-queso', 'Chiles rellenos de queso', 50, 'huevo', 4, ['tradicional', 'frito'],
    [['chile_verde', 6], ['queso_fresco', 300], ['huevo', 4], ['aceite', 150], ['tomate', 400], ['cebolla', 100]],
    ['Asa y pela los chiles.', 'Rellénalos de queso, envuélvelos en huevo a punto de nieve y fríe.', 'Sírvelos en salsa de tomate.'], { lados: 'salsa', tortillas: true }),
  // --- carnes de casa
  P('picado-verduras', 'Picado de verduras con carne', 45, 'res', 4, ['tradicional', 'economico', 'lonchera'],
    [['carne_molida', 300], ['papa', 300], ['guisquil', 1], ['zanahoria', 150], ['ejote', 150], ['cebolla', 80], ['tomate', 200], ['aceite', 20], ['consome', 1]],
    ['Pica todas las verduras en cubitos pequeños.', 'Sofríe la carne con cebolla y tomate.', 'Agrega las verduras, consomé y un poco de agua; tapa hasta que estén suaves.'], { lados: 'salsa', tortillas: true }),
  P('carne-deshilada-verduras', 'Ropa vieja salvadoreña', 100, 'res', 4, ['tradicional', 'lonchera'],
    [['res_posta', 700], ['tomate', 300], ['cebolla', 150], ['chile_verde', 2], ['aceite', 30], ['ajo', 3]],
    ['Cocina la carne en agua con sal y ajo hasta que esté suave; deshílala.', 'Sofríe cebolla, chile y tomate en tiras.', 'Agrega la carne deshilada con un poco de caldo y cocina 10 min.'], { lados: 'salsa', tortillas: true }),
  P('albondigas-salsa', 'Albóndigas en salsa de tomate', 50, 'res', 4, ['tradicional', 'ninos', 'lonchera'],
    [['carne_molida', 600], ['huevo', 1], ['pan_molido', 60], ['hierbabuena', 1], ['tomate', 500], ['cebolla', 100], ['aceite', 20]],
    ['Mezcla carne, huevo, pan molido, hierbabuena picada, sal y pimienta; forma bolitas.', 'Licúa tomate y cebolla y cocina la salsa 10 min.', 'Agrega las albóndigas y cocina tapado 20 min.'], { lados: 'salsa', tortillas: true }),
  P('hamburguesa-plato', 'Torta de carne a la plancha', 25, 'res', 4, ['ninos', 'rapido'],
    [['carne_molida', 600], ['cebolla', 80], ['huevo', 1], ['pan_molido', 40], ['aceite', 15]],
    ['Mezcla la carne con cebolla picada, huevo, pan molido, sal y pimienta.', 'Forma tortas planas y cocínalas a la plancha 4 min por lado.'], { lados: 'seco', tortillas: true }),
  P('mondongo-guisado', 'Mondongo guisado', 150, 'res', 4, ['tradicional', 'visceras', 'finde'],
    [['mondongo', 1000], ['papa', 400], ['tomate', 300], ['cebolla', 150], ['chile_verde', 1], ['achiote', 1], ['ajo', 4], ['limon', 3]],
    ['Lava bien el mondongo con limón y cocínalo en agua con sal y ajo hasta que esté suave (unas 2 horas).', 'Córtalo en trocitos y sofríe con cebolla, tomate y chile.', 'Agrega papa, achiote y caldo y cocina hasta que espese.'], { lados: 'salsa', tortillas: true }),
  P('pollo-con-papas-al-curry', 'Pollo en salsa de achiote con papas', 50, 'pollo', 4, ['tradicional', 'lonchera'],
    [['pollo_piezas', 1000], ['papa', 400], ['achiote', 1], ['tomate', 300], ['cebolla', 100], ['aceite', 30], ['ajo', 3]],
    ['Sazona el pollo con sal, ajo y achiote y dóralo.', 'Agrega tomate y cebolla licuados y la papa en trozos.', 'Cocina tapado 30 min hasta que el pollo esté suave.'], { lados: 'salsa', tortillas: true }),
  P('costillas-bbq', 'Costillas de cerdo en salsa barbacoa', 90, 'cerdo', 3, ['finde'],
    [['costilla_cerdo', 1500], ['salsa_tomate', 212], ['azucar', 1], ['mostaza', 1], ['salsa_inglesa', 1], ['cebolla', 100], ['ajo', 4]],
    ['Cocina las costillas en agua con sal, ajo y cebolla 45 min.', 'Mezcla salsa de tomate, azúcar, mostaza y salsa inglesa.', 'Baña las costillas y dóralas en sartén u horno 20 min, volteando.'], { lados: 'seco', tortillas: false }),
  P('pollo-a-la-naranja', 'Pollo a la naranja', 50, 'pollo', 3, [],
    [['pollo_piezas', 1000], ['naranja', 4], ['cebolla', 100], ['azucar', 1], ['maicena', 1], ['aceite', 30], ['ajo', 3]],
    ['Dora el pollo sazonado.', 'Agrega el jugo de naranja con cebolla, un poco de azúcar y sal.', 'Cocina tapado 25 min y espesa la salsa con maicena.'], { lados: 'salsa', tortillas: false }),
  P('lomito-champinones', 'Lomito en salsa de champiñones', 30, 'res', 3, ['finde'],
    [['lomito', 800], ['champinones', 250], ['crema', 200], ['cebolla', 80], ['margarina', 30], ['ajo', 2]],
    ['Sella los medallones de lomito sazonados en sartén muy caliente; retira.', 'Saltea cebolla y champiñones en margarina.', 'Agrega la crema, regresa el lomito y cocina 5 min.'], { lados: 'salsa', tortillas: false }),
  P('pavo-relleno', 'Chumpe en salsa (estilo panes con chumpe)', 180, 'pollo', 4, ['tradicional', 'finde'],
    [['pavo', 2000], ['tomate', 600], ['chile_verde', 2], ['cebolla', 200], ['achiote', 1], ['salsa_inglesa', 1], ['mostaza', 1], ['ajo', 6], ['laurel', 1]],
    ['Marina el pavo desde la noche anterior con mostaza, salsa inglesa, ajo y sal.', 'Hornea o cocina tapado a fuego bajo con su jugo unas 2 horas.', 'Licúa tomate, chile, cebolla y achiote con el jugo del pavo y cocina hasta espesar.', 'Sirve el pavo en trozos bañado con la salsa.'], { lados: 'salsa', tortillas: false }),
  P('mariscada', 'Mariscada', 50, 'mariscos', 4, ['finde'],
    [['mariscos', 600], ['camaron', 300], ['pescado_entero', 600], ['tomate', 300], ['cebolla', 100], ['chile_verde', 1], ['crema', 250], ['cilantro', 1], ['ajo', 4]],
    ['Prepara un caldo con la cabeza del pescado, tomate, cebolla, chile y ajo.', 'Cuélalo, agrega el pescado en trozos y cocina 8 min.', 'Agrega mariscos y camarón 5 min, termina con crema y cilantro.'], { lados: null, sirve: 'arroz', tortillas: true }),
  P('ceviche-pescado', 'Ceviche de pescado', 40, 'pescado', 4, ['finde', 'saludable'],
    [['tilapia', 600], ['limon', 15], ['tomate', 200], ['cebolla', 100], ['cilantro', 1], ['pepino', 1], ['salsa_inglesa', 1]],
    ['Corta el pescado en cubitos y cúbrelo con jugo de limón 30 min en la refri.', 'Agrega tomate, cebolla, pepino y cilantro picados.', 'Sazona con sal, pimienta y unas gotas de salsa inglesa.'], { lados: null, sirve: 'galletas o tostadas', tortillas: false, extraIng: [['galletas', 200]] }),
  P('ceviche-camaron', 'Ceviche de camarón', 40, 'mariscos', 4, ['finde', 'saludable'],
    [['camaron', 600], ['limon', 15], ['tomate', 200], ['cebolla', 100], ['cilantro', 1], ['pepino', 1], ['salsa_tomate', 106]],
    ['Cuece los camarones 2 min y córtalos.', 'Mézclalos con limón, tomate, cebolla, pepino, cilantro y un poco de salsa de tomate.', 'Deja reposar 20 min en la refri.'], { lados: null, sirve: 'galletas o tostadas', tortillas: false, extraIng: [['galletas', 200]] }),
  P('coctel-camaron', 'Cóctel de camarón', 30, 'mariscos', 3, ['finde'],
    [['camaron', 500], ['salsa_tomate', 212], ['limon', 6], ['cebolla', 80], ['aguacate', 1], ['cilantro', 1]],
    ['Cuece los camarones 2 min.', 'Mezcla salsa de tomate, jugo de limón, cebolla y cilantro.', 'Agrega camarones y aguacate en cubos.'], { lados: null, sirve: 'galletas', tortillas: false, extraIng: [['galletas', 200]] }),
  // --- arroces y pastas (se sirven solos o con ensalada)
  P('arroz-camaron', 'Arroz con camarón', 40, 'mariscos', 4, ['finde'],
    [['arroz', 350], ['camaron', 500], ['tomate', 200], ['cebolla', 100], ['chile_verde', 1], ['guisantes', 100], ['aceite', 30], ['achiote', 1], ['ajo', 3]],
    ['Sofríe cebolla, chile y tomate con achiote.', 'Agrega el arroz, el doble de caldo y cocina 15 min.', 'Agrega camarones y guisantes y tapa 5 min más.'], { lados: 'arroz', tortillas: false }),
  P('arroz-mariscos', 'Arroz con mariscos', 45, 'mariscos', 4, ['finde'],
    [['arroz', 350], ['mariscos', 500], ['tomate', 200], ['cebolla', 100], ['chile_verde', 1], ['guisantes', 100], ['aceite', 30], ['achiote', 1], ['ajo', 3]],
    ['Sofríe cebolla, chile, tomate y achiote.', 'Agrega arroz y caldo y cocina 15 min.', 'Agrega los mariscos y tapa 6 min.'], { lados: 'arroz', tortillas: false }),
  P('arroz-salchicha', 'Arroz con salchicha y verduras', 30, 'embutido', 3, ['economico', 'ninos', 'rapido'],
    [['arroz', 350], ['salchicha', 300], ['zanahoria', 100], ['guisantes', 80], ['cebolla', 80], ['aceite', 30]],
    ['Sofríe la salchicha en rodajas con cebolla.', 'Agrega arroz, verduras y el doble de agua con sal.', 'Tapa y cocina 20 min.'], { lados: 'arroz', tortillas: false }),
  P('arroz-pavo', 'Arroz con pavo', 50, 'pollo', 3, [],
    [['arroz', 350], ['pavo', 600], ['zanahoria', 100], ['guisantes', 80], ['tomate', 200], ['cebolla', 80], ['aceite', 30], ['achiote', 1]],
    ['Dora el pavo en trozos.', 'Agrega tomate, cebolla, achiote, arroz y agua.', 'Agrega verduras y cocina tapado 25 min.'], { lados: 'arroz', tortillas: false }),
  P('espagueti-camaron', 'Espagueti con camarón al ajillo', 25, 'mariscos', 3, ['rapido'],
    [['espagueti', 400], ['camaron', 400], ['margarina', 60], ['ajo', 6], ['perejil', 1], ['queso_duro', 60]],
    ['Cocina el espagueti.', 'Saltea los camarones en margarina con bastante ajo.', 'Mezcla con la pasta y sirve con queso rallado.'], { lados: 'pasta', tortillas: false }),
  P('espagueti-atun', 'Espagueti con atún en salsa roja', 25, 'pescado', 3, ['economico', 'rapido'],
    [['espagueti', 400], ['atun', 280], ['tomate', 300], ['cebolla', 80], ['salsa_tomate', 106], ['aceite', 20]],
    ['Cocina el espagueti.', 'Sofríe cebolla, tomate y salsa de tomate; agrega el atún.', 'Mezcla con la pasta.'], { lados: 'pasta', tortillas: false }),
  P('espagueti-pollo-tomate', 'Espagueti con pollo en salsa roja', 30, 'pollo', 4, ['ninos'],
    [['espagueti', 400], ['pechuga', 500], ['tomate', 400], ['cebolla', 80], ['salsa_tomate', 106], ['queso_duro', 60], ['aceite', 20]],
    ['Cocina el espagueti.', 'Dora la pechuga en cubos y agrega tomate y cebolla licuados con salsa de tomate.', 'Mezcla con la pasta y sirve con queso.'], { lados: 'pasta', tortillas: false }),
  P('coditos-pollo', 'Coditos con pollo y verduras', 30, 'pollo', 3, ['ninos', 'lonchera'],
    [['coditos', 400], ['pechuga', 400], ['zanahoria', 100], ['guisantes', 80], ['crema', 150], ['cebolla', 60]],
    ['Cocina los coditos.', 'Dora la pechuga en cubos con cebolla, agrega zanahoria y guisantes.', 'Mezcla con la pasta y la crema.'], { lados: 'pasta', tortillas: false }),
  P('lasana', 'Lasaña de carne', 80, 'res', 3, ['finde', 'ninos'], [['espagueti', 400], ['carne_molida', 500], ['tomate', 400], ['salsa_tomate', 212], ['quesillo', 300], ['crema', 200], ['cebolla', 80]],
    ['Prepara una salsa boloñesa con carne, tomate, cebolla y salsa de tomate.', 'En un molde alterna capas de pasta cocida, salsa, crema y quesillo.', 'Hornea a 180 °C 30 min hasta que gratine.'], { lados: 'pasta', tortillas: false, aparatos: ['horno'] }),
  P('macarrones-queso', 'Macarrones con queso', 25, 'vegetal', 4, ['ninos', 'rapido', 'vegetariano'],
    [['coditos', 450], ['leche', 300], ['queso_amarillo', 200], ['margarina', 30], ['harina_trigo', 1]],
    ['Cocina los coditos.', 'Prepara una salsa con margarina, harina y leche; derrite el queso.', 'Mezcla con la pasta.'], { lados: 'pasta', tortillas: false }),
  P('coditos-atun', 'Coditos con atún y verduras', 25, 'pescado', 3, ['economico', 'rapido', 'lonchera'],
    [['coditos', 400], ['atun', 280], ['zanahoria', 100], ['guisantes', 80], ['mayonesa', 80], ['cebolla', 40]],
    ['Cocina los coditos y las verduras.', 'Mezcla con el atún, la cebolla picada y la mayonesa.', 'Sirve frío o tibio.'], { lados: 'pasta', tortillas: false }),
  P('espagueti-salchicha', 'Espagueti con salchicha en salsa', 25, 'embutido', 3, ['economico', 'ninos', 'rapido'],
    [['espagueti', 400], ['salchicha', 300], ['tomate', 300], ['salsa_tomate', 106], ['cebolla', 60], ['queso_duro', 50]],
    ['Cocina el espagueti.', 'Sofríe la salchicha en rodajas con cebolla y agrega tomate y salsa de tomate.', 'Mezcla y sirve con queso.'], { lados: 'pasta', tortillas: false }),
  P('fideos-pollo', 'Fideos con pollo', 35, 'pollo', 3, ['economico', 'ninos'],
    [['fideos', 300], ['pechuga', 400], ['tomate', 300], ['cebolla', 80], ['aceite', 20]],
    ['Dora los fideos en aceite.', 'Agrega tomate y cebolla licuados, la pechuga en cubos y agua.', 'Cocina tapado hasta que los fideos absorban el líquido.'], { lados: 'pasta', tortillas: false }),
  P('arroz-chorizo', 'Arroz con chorizo', 30, 'embutido', 3, ['economico'],
    [['arroz', 350], ['chorizo', 300], ['tomate', 150], ['cebolla', 80], ['chile_verde', 1], ['aceite', 20]],
    ['Dora el chorizo desmenuzado con cebolla, chile y tomate.', 'Agrega el arroz, el doble de agua y sal.', 'Tapa y cocina 20 min.'], { lados: 'arroz', tortillas: false }),
  P('arroz-huevo', 'Arroz con huevo y verduras', 25, 'huevo', 3, ['economico', 'rapido', 'vegetariano'],
    [['arroz', 350], ['huevo', 4], ['zanahoria', 100], ['guisantes', 80], ['cebolla', 60], ['salsa_soya', 1], ['aceite', 30]],
    ['Cocina el arroz y déjalo enfriar.', 'Saltea las verduras, agrega el arroz y los huevos revueltos.', 'Termina con salsa de soya.'], { lados: 'arroz', tortillas: false }),
  P('arroz-valenciana', 'Arroz a la valenciana', 60, 'mariscos', 3, ['finde'],
    [['arroz', 350], ['pollo_piezas', 500], ['camaron', 250], ['chorizo', 150], ['guisantes', 100], ['chile_verde', 1], ['tomate', 200], ['achiote', 1], ['aceite', 40]],
    ['Dora pollo y chorizo; agrega tomate, chile y achiote.', 'Agrega el arroz y el caldo y cocina 15 min.', 'Agrega camarones y guisantes y tapa 6 min.'], { lados: 'arroz', tortillas: false }),
  P('chop-suey', 'Chop suey de pollo', 30, 'pollo', 3, ['saludable'],
    [['pechuga', 500], ['repollo', 0.5], ['zanahoria', 150], ['cebolla', 100], ['chile_verde', 1], ['salsa_soya', 1], ['aceite', 30], ['arroz', 300]],
    ['Corta pollo y verduras en tiras.', 'Saltea el pollo y luego las verduras a fuego alto.', 'Agrega salsa de soya y sirve con arroz blanco.'], { lados: null, tortillas: false }),
  // --- sopas (se sirven con tortillas, arroz aparte o pan)
  P('sopa-pata', 'Sopa de pata', 180, 'res', 4, ['tradicional', 'finde', 'visceras'],
    [['pata_res', 1500], ['mondongo', 500], ['yuca', 300], ['elote', 2], ['guisquil', 1], ['repollo', 0.25], ['platano', 1], ['tomate', 200], ['cebolla', 100], ['chile_verde', 1], ['cilantro', 1], ['hierbabuena', 1], ['limon', 3], ['ajo', 4]],
    ['Cocina la pata y el mondongo en agua con ajo y sal hasta que estén muy suaves (2–3 horas).', 'Agrega yuca, elote, güisquil, plátano, tomate, cebolla y chile.', 'Al final agrega repollo, cilantro y hierbabuena.'], { lados: 'sopa' }),
  P('sopa-mondongo', 'Sopa de mondongo', 150, 'res', 4, ['tradicional', 'finde', 'visceras'],
    [['mondongo', 1200], ['yuca', 300], ['elote', 2], ['guisquil', 1], ['repollo', 0.25], ['tomate', 200], ['cebolla', 100], ['achiote', 1], ['hierbabuena', 1], ['limon', 3], ['ajo', 4]],
    ['Lava el mondongo con limón y cocínalo con ajo y sal hasta que esté suave.', 'Agrega las verduras y el achiote.', 'Termina con repollo y hierbabuena.'], { lados: 'sopa' }),
  P('sopa-mariscos', 'Sopa de mariscos', 50, 'mariscos', 4, ['finde'],
    [['mariscos', 500], ['camaron', 300], ['tomate', 300], ['cebolla', 100], ['chile_verde', 1], ['crema', 200], ['cilantro', 1], ['ajo', 4]],
    ['Prepara un caldo con tomate, cebolla, chile y ajo licuados.', 'Agrega los mariscos y cocina 8 min.', 'Termina con crema y cilantro.'], { lados: 'sopa' }),
  P('sopa-pescado', 'Sopa de pescado', 50, 'pescado', 4, ['tradicional'],
    [['pescado_entero', 1200], ['papa', 300], ['tomate', 300], ['cebolla', 100], ['chile_verde', 1], ['cilantro', 1], ['limon', 3], ['ajo', 4]],
    ['Prepara caldo con tomate, cebolla, chile y ajo.', 'Agrega la papa y cocina 10 min.', 'Agrega el pescado en trozos 10 min y termina con cilantro.'], { lados: 'sopa' }),
  P('sopa-camaron', 'Sopa de camarón', 40, 'mariscos', 4, [],
    [['camaron', 600], ['papa', 300], ['zanahoria', 100], ['tomate', 300], ['cebolla', 100], ['crema', 150], ['cilantro', 1], ['ajo', 3]],
    ['Cocina papa y zanahoria en un caldo de tomate, cebolla y ajo.', 'Agrega los camarones 5 min.', 'Termina con crema y cilantro.'], { lados: 'sopa' }),
  P('sopa-gallina-india', 'Sopa de gallina con tortillas tostadas', 120, 'pollo', 5, ['tradicional', 'finde'],
    [['pollo_piezas', 1500], ['papa', 300], ['guisquil', 1], ['zanahoria', 150], ['elote', 2], ['cebolla', 100], ['tomate', 200], ['hierbabuena', 1], ['cilantro', 1], ['ajo', 4]],
    ['Cocina el pollo (mejor gallina) a fuego lento con ajo, cebolla y tomate 1 hora.', 'Agrega las verduras en trozos y cocina 25 min.', 'Termina con hierbabuena y cilantro.'], { lados: 'sopa' }),
  P('sopa-verduras', 'Sopa de verduras', 40, 'vegetal', 3, ['saludable', 'economico', 'vegetariano'],
    [['papa', 300], ['zanahoria', 150], ['guisquil', 1], ['ayote', 200], ['ejote', 150], ['repollo', 0.25], ['tomate', 200], ['cebolla', 100], ['cilantro', 1], ['consome', 1]],
    ['Sofríe tomate y cebolla y agrega agua con consomé.', 'Agrega las verduras de más dura a más suave.', 'Cocina hasta que estén suaves y termina con cilantro.'], { lados: 'sopa' }),
  P('sopa-garbanzo', 'Sopa de garbanzo con chorizo', 60, 'embutido', 3, [],
    [['garbanzo', 400], ['chorizo', 200], ['papa', 200], ['tomate', 200], ['cebolla', 100], ['ajo', 3]],
    ['Remoja los garbanzos desde la noche y cocínalos hasta que estén suaves.', 'Sofríe chorizo, tomate y cebolla.', 'Agrega a los garbanzos con la papa y cocina 20 min.'], { lados: 'sopa' }),
  P('sopa-tortilla', 'Sopa de tortilla', 35, 'pollo', 3, [],
    [['pechuga', 400], ['tortillas', 10], ['tomate', 400], ['cebolla', 100], ['aguacate', 1], ['crema', 120], ['queso_fresco', 100], ['aceite', 100]],
    ['Cocina la pechuga y desmenúzala; guarda el caldo.', 'Licúa tomate y cebolla y cocínalos en el caldo.', 'Sirve con tiras de tortilla frita, pollo, aguacate, crema y queso.'], { lados: null, tortillas: false }),
  P('sopa-queso', 'Sopa de queso con ayote', 35, 'vegetal', 3, ['vegetariano', 'economico'],
    [['ayote', 400], ['papa', 300], ['queso_fresco', 200], ['leche', 300], ['cebolla', 80], ['margarina', 20]],
    ['Sofríe cebolla en margarina, agrega papa y ayote y cubre con agua.', 'Cocina 15 min, agrega la leche.', 'Al servir agrega el queso en cubos.'], { lados: 'sopa' }),
  P('sopa-costilla', 'Sopa de costilla de res', 120, 'res', 4, ['tradicional', 'finde'],
    [['res_costilla', 1200], ['papa', 300], ['yuca', 300], ['elote', 2], ['guisquil', 1], ['zanahoria', 150], ['repollo', 0.25], ['tomate', 200], ['cebolla', 100], ['cilantro', 1], ['ajo', 4]],
    ['Cocina la costilla a fuego lento con ajo, cebolla y sal hasta que esté suave.', 'Agrega las verduras de más dura a más suave.', 'Termina con repollo y cilantro.'], { lados: 'sopa' }),
  P('caldo-res', 'Caldo de res con verduras', 100, 'res', 4, ['tradicional'],
    [['res_posta', 700], ['papa', 300], ['zanahoria', 150], ['guisquil', 1], ['elote', 2], ['tomate', 200], ['cebolla', 100], ['cilantro', 1], ['ajo', 3]],
    ['Cocina la carne en trozos con ajo y cebolla hasta que esté suave.', 'Agrega las verduras y cocina 25 min.', 'Termina con cilantro.'], { lados: 'sopa' }),
  P('crema-ayote', 'Crema de ayote', 35, 'vegetal', 3, ['vegetariano', 'saludable', 'economico'],
    [['ayote', 700], ['papa', 200], ['cebolla', 80], ['leche', 300], ['margarina', 20], ['consome', 1]],
    ['Sofríe cebolla, agrega ayote y papa en trozos y cubre con agua y consomé.', 'Cocina 15 min, licúa con la leche.', 'Calienta y sazona.'], { lados: 'sopa' }),
  P('crema-pollo', 'Crema de pollo con elote', 40, 'pollo', 3, ['ninos'],
    [['pechuga', 400], ['maiz_dulce', 300], ['leche', 400], ['papa', 200], ['cebolla', 80], ['margarina', 20], ['maicena', 1]],
    ['Cocina la pechuga y desmenúzala; guarda el caldo.', 'Licúa la mitad del elote con leche y papa cocida.', 'Junta todo con el caldo, el pollo y el resto del elote; espesa con maicena.'], { lados: 'sopa' }),
  P('sopa-fideo-res', 'Sopa de fideo con carne', 45, 'res', 3, ['economico', 'ninos'],
    [['fideos', 200], ['res_posta', 300], ['tomate', 300], ['cebolla', 80], ['papa', 200], ['aceite', 20]],
    ['Dora los fideos en aceite.', 'Agrega tomate y cebolla licuados, agua, la carne en cubos y la papa.', 'Cocina hasta que todo esté suave.'], { lados: 'sopa' }),
  P('sopa-lentejas-res', 'Sopa de lentejas con carne', 60, 'res', 3, ['economico'],
    [['lentejas', 350], ['res_posta', 300], ['papa', 200], ['zanahoria', 100], ['tomate', 200], ['cebolla', 100], ['ajo', 3]],
    ['Dora la carne en cubos con cebolla y tomate.', 'Agrega lentejas, agua, papa y zanahoria.', 'Cocina 40 min hasta que las lentejas estén suaves.'], { lados: 'sopa' }),
  // --- verduras como plato fuerte
  P('pipian-guisado', 'Pipián guisado con queso', 30, 'vegetal', 3, ['vegetariano', 'economico', 'tradicional'],
    [['pipian', 600], ['queso_fresco', 150], ['tomate', 200], ['cebolla', 80], ['crema', 100], ['aceite', 20]],
    ['Corta el pipián en cubos.', 'Sofríe tomate y cebolla, agrega el pipián y un poco de agua; tapa 10 min.', 'Termina con queso desmoronado y crema.'], { lados: 'salsa', tortillas: true }),
  P('ejotes-con-huevo', 'Ejotes con huevo', 20, 'huevo', 4, ['economico', 'rapido', 'tradicional'],
    [['ejote', 400], ['huevo', 6], ['tomate', 150], ['cebolla', 60], ['aceite', 20]],
    ['Cocina los ejotes picados 6 min.', 'Sofríe tomate y cebolla, agrega los ejotes.', 'Agrega los huevos batidos y revuelve hasta que cuajen.'], { lados: 'seco', tortillas: true }),
  P('guisquil-con-huevo', 'Güisquil picado con huevo', 25, 'huevo', 3, ['economico', 'rapido'],
    [['guisquil', 2], ['huevo', 6], ['tomate', 150], ['cebolla', 60], ['aceite', 20]],
    ['Pela y pica el güisquil en cubitos; cuécelo 8 min.', 'Sofríe con tomate y cebolla y agrega los huevos batidos.'], { lados: 'seco', tortillas: true }),
  P('loroco-con-huevo', 'Loroco con huevo', 15, 'huevo', 4, ['tradicional', 'rapido'],
    [['loroco', 150], ['huevo', 8], ['tomate', 150], ['cebolla', 60], ['aceite', 20]],
    ['Sofríe tomate, cebolla y loroco.', 'Agrega los huevos batidos y revuelve.'], { lados: 'seco', tortillas: true }),
  P('papas-con-chorizo', 'Papas con chorizo', 30, 'embutido', 4, ['economico', 'tradicional'],
    [['papa', 700], ['chorizo', 300], ['cebolla', 80], ['tomate', 150], ['aceite', 20]],
    ['Cuece la papa en cubos 8 min.', 'Dora el chorizo desmenuzado con cebolla y tomate.', 'Agrega la papa y dora todo junto.'], { lados: 'seco', tortillas: true }),
];

// ------------------------------------------------------------------ cenas y típicos (se sirven solos)
const T = (id, nombre, min, proteina, pop, et, ing, pasos, tiempos = ['cena', 'almuerzo']) =>
  ({ id, nombre, minutos: min, porciones: 4, tiempos, aparatos: ['estufa'], etiquetas: et, proteina, popularidad: pop, ing, pasos, familia: id.split('-')[0] });
const MASA = [['harina_maiz', 700], ['aceite', 30]];
const CURTIDO = [['repollo', 0.5], ['zanahoria', 100], ['cebolla', 40], ['vinagre', 1], ['oregano', 1], ['tomate', 300]];
const pupusa = (id, nombre, relleno, prot, pop, et = []) => T(`pupusas-${id}`, `Pupusas de ${nombre}${nombre.includes(" con ") ? "," : ""} con curtido`, 60, prot, pop, ['tradicional', ...et],
  [...MASA, ...relleno, ...CURTIDO],
  ['Curtido: repollo escaldado y picado, zanahoria rallada, cebolla, vinagre, orégano y sal (mejor desde antes).', `Prepara el relleno: ${nombre}.`,
    'Haz la masa con harina, agua y sal; forma bolitas, rellena, cierra y aplana.', 'Cocina en comal caliente 4 min por lado. Sirve con curtido y salsa de tomate.'], ['cena', 'almuerzo', 'desayuno']);
const TIPICOS = [
  pupusa('frijol-queso', 'frijol con queso', [['frijol', 250], ['quesillo', 250]], 'vegetal', 5, ['vegetariano']),
  pupusa('chicharron', 'chicharrón', [['chicharron', 400]], 'cerdo', 5),
  pupusa('queso', 'queso', [['quesillo', 450]], 'vegetal', 5, ['vegetariano']),
  pupusa('ayote', 'ayote con queso', [['ayote', 300], ['quesillo', 300]], 'vegetal', 4, ['vegetariano']),
  pupusa('ajo', 'queso con ajo', [['quesillo', 400], ['ajo', 6]], 'vegetal', 4, ['vegetariano']),
  pupusa('jalapeno', 'queso con jalapeño', [['quesillo', 400], ['jalapeno', 80]], 'vegetal', 4, ['vegetariano', 'picante']),
  pupusa('camaron', 'camarón con queso', [['camaron', 300], ['quesillo', 300]], 'mariscos', 4),
  pupusa('pollo', 'pollo con queso', [['pechuga', 300], ['quesillo', 300]], 'pollo', 4),
  pupusa('espinaca', 'espinaca con queso', [['espinaca', 200], ['quesillo', 300]], 'vegetal', 3, ['vegetariano']),
  pupusa('chorizo', 'chorizo con queso', [['chorizo', 250], ['quesillo', 300]], 'embutido', 4),
  pupusa('frijol', 'frijol', [['frijol', 400]], 'vegetal', 4, ['vegetariano', 'economico']),
  pupusa('ayote-loroco', 'loroco, ayote y queso', [['loroco', 80], ['ayote', 200], ['quesillo', 300]], 'vegetal', 3, ['vegetariano']),
  pupusa('arroz', 'masa de arroz revueltas', [['harina_arroz', 300], ['chicharron', 200], ['quesillo', 200], ['frijol', 150]], 'cerdo', 4),
  ...[['aguacate', 'aguacate', [['aguacate', 3], ['queso_duro', 80], ['tomate', 150]], 'vegetal', 5, ['vegetariano', 'rapido', 'economico'],
    'Abre el pan, unta aguacate machacado con sal y limón, y agrega tomate en rodajas y queso duro rallado.'],
  ['frijoles', 'frijoles y queso', [['frijol', 300], ['queso_duro', 80], ['aceite', 20]], 'vegetal', 4, ['vegetariano', 'rapido', 'economico'],
    'Voltea los frijoles en aceite y rellena el pan con frijoles y queso duro rallado.'],
  ['huevo', 'huevo picado', [['huevo', 6], ['tomate', 150], ['cebolla', 60], ['aceite', 20]], 'huevo', 4, ['rapido', 'economico'],
    'Pica huevos con tomate y cebolla y rellena el pan.'],
  ['chorizo', 'chorizo y frijoles', [['chorizo', 250], ['frijol', 200], ['aceite', 20]], 'embutido', 4, ['rapido'],
    'Dora el chorizo y rellena el pan con frijoles volteados y chorizo.'],
  ['gallina', 'gallina', [['pollo_piezas', 800], ['tomate', 400], ['cebolla', 100], ['chile_verde', 1], ['lechuga', 0.5], ['pepino', 1], ['rabano', 0.5], ['achiote', 1]], 'pollo', 5, ['tradicional'],
    'Cocina la gallina en salsa de tomate, cebolla, chile y achiote; desmenúzala y rellena el pan con salsa, lechuga, pepino y rábano.'],
  ['chumpe', 'chumpe', [['pavo', 900], ['tomate', 400], ['cebolla', 100], ['chile_verde', 1], ['lechuga', 0.5], ['pepino', 1], ['rabano', 0.5], ['mostaza', 1]], 'pollo', 4, ['tradicional', 'finde'],
    'Hornea o cocina el chumpe marinado; desmenúzalo en su salsa de tomate y rellena el pan con lechuga, pepino y rábano.'],
  ['mortadela', 'mortadela y queso', [['mortadela', 250], ['queso_amarillo', 150], ['tomate', 150], ['lechuga', 0.5]], 'embutido', 3, ['rapido', 'ninos'],
    'Rellena el pan con mortadela, queso, tomate y lechuga; tuéstalo en comal si gustas.'],
  ['jamon-huevo', 'jamón y huevo', [['jamon', 200], ['huevo', 4], ['aceite', 15]], 'huevo', 4, ['rapido', 'ninos'],
    'Fríe los huevos con el jamón en trocitos y rellena el pan.']].map(([id, n, ing, prot, pop, et, paso]) =>
    T(`panes-${id}`, `Pan con ${n}`, et.includes('rapido') ? 10 : 70, prot, pop, et, [['pan_frances', 4], ...ing], [paso, 'Sirve caliente.'], ['cena', 'desayuno', 'refaccion'])),
  T('tamales-pollo-papa', 'Tamales de pollo con papa', 150, 'pollo', 5, ['tradicional', 'finde'],
    [['harina_maiz', 700], ['pollo_piezas', 800], ['papa', 300], ['tomate', 300], ['chile_verde', 1], ['aceite', 120], ['achiote', 1], ['hoja_platano', 1]],
    ['Cocina el pollo y guarda el caldo.', 'Cocina la masa con caldo, aceite y sal hasta que espese.', 'Rellena con pollo, papa y recaudo de tomate; envuelve en hoja y cocina al vapor 1 hora.']),
  T('tamales-cerdo', 'Tamales de cerdo', 160, 'cerdo', 4, ['tradicional', 'finde'],
    [['harina_maiz', 700], ['carne_cerdo', 700], ['papa', 300], ['tomate', 300], ['chile_verde', 1], ['aceite', 120], ['achiote', 1], ['hoja_platano', 1]],
    ['Cocina la carne de cerdo en trozos.', 'Prepara la masa con el caldo.', 'Rellena con cerdo, papa y recaudo; envuelve y cuece al vapor 1 hora.']),
  T('tamales-pisque', 'Tamales pisques (de frijol)', 120, 'vegetal', 4, ['tradicional', 'vegetariano', 'economico'],
    [['harina_maiz', 700], ['frijol', 400], ['aceite', 100], ['hoja_platano', 1]],
    ['Prepara la masa con agua, aceite y sal.', 'Extiéndela, cubre con frijoles molidos y enróllala.', 'Envuelve en hoja y cuece al vapor 1 hora.'], ['cena', 'desayuno']),
  T('tamales-elote', 'Tamales de elote con crema', 90, 'vegetal', 4, ['tradicional', 'dulce'],
    [['elote', 10], ['leche', 200], ['azucar', 1], ['margarina', 60], ['crema', 200]],
    ['Desgrana y muele los elotes con leche, azúcar y margarina.', 'Envuelve la masa en las hojas del elote.', 'Cuece al vapor 1 hora y sirve con crema.'], ['cena', 'desayuno', 'refaccion']),
  T('riguas', 'Riguas de elote con crema', 40, 'vegetal', 3, ['tradicional', 'dulce'],
    [['elote', 8], ['azucar', 1], ['queso_duro', 80], ['crema', 150]],
    ['Muele el elote tierno con azúcar y una pizca de sal.', 'Envuelve porciones en hoja de elote y ásalas en comal.', 'Sirve con crema y queso.'], ['cena', 'refaccion']),
  T('yuca-frita-chicharron', 'Yuca frita con chicharrón y curtido', 50, 'cerdo', 5, ['tradicional', 'frito'],
    [['yuca', 1000], ['chicharron', 300], ['aceite', 250], ...CURTIDO],
    ['Cocina la yuca en agua con sal hasta que esté suave.', 'Fríela en trozos hasta dorar.', 'Sirve con chicharrón, curtido y salsa de tomate.'], ['cena', 'refaccion']),
  T('empanadas-leche', 'Empanadas de plátano con leche', 50, 'vegetal', 4, ['tradicional', 'dulce', 'frito'],
    [['platano', 4], ['leche', 400], ['azucar', 1], ['maicena', 1], ['canela', 1], ['aceite', 200]],
    ['Cocina el plátano maduro y hazlo puré.', 'Prepara un poleadito con leche, azúcar, maicena y canela.', 'Rellena discos de plátano, ciérralos y fríe.'], ['refaccion', 'cena']),
  T('quesadillas-tortilla-loroco', 'Tortillas con quesillo y loroco', 15, 'vegetal', 4, ['rapido', 'vegetariano'],
    [['tortillas', 12], ['quesillo', 300], ['loroco', 60], ['frijol', 200]],
    ['Calienta las tortillas en comal.', 'Rellénalas de quesillo y loroco y dóblalas hasta que el queso se derrita.', 'Sirve con frijoles.'], ['cena', 'desayuno', 'refaccion']),
  T('nachos', 'Nachos con frijoles y queso', 20, 'vegetal', 3, ['rapido', 'ninos'],
    [['tostadas', 20], ['frijol', 300], ['queso_amarillo', 200], ['tomate', 150], ['aguacate', 1], ['jalapeno', 40]],
    ['Unta los totopos o tostadas con frijoles.', 'Cubre con queso y caliéntalos hasta que se derrita.', 'Termina con tomate, aguacate y jalapeño.'], ['cena', 'refaccion']),
];

// ------------------------------------------------------------------ desayunos: huevos × acompañamientos
const HUEVOS = {
  estrellados: { n: 'Huevos estrellados', ing: [['huevo', 8], ['aceite', 30]], paso: 'Fríe los huevos estrellados en poco aceite, con la yema suave.', min: 10, pop: 5 },
  revueltos: { n: 'Huevos revueltos', ing: [['huevo', 8], ['margarina', 20]], paso: 'Bate los huevos con sal y revuélvelos en margarina a fuego bajo.', min: 10, pop: 4 },
  picados: { n: 'Huevos picados con tomate y cebolla', ing: [['huevo', 8], ['tomate', 150], ['cebolla', 60], ['aceite', 20]], paso: 'Sofríe tomate y cebolla picados y agrega los huevos batidos.', min: 15, pop: 5 },
  rancheros: { n: 'Huevos rancheros', ing: [['huevo', 8], ['tomate', 300], ['cebolla', 60], ['chile_verde', 1], ['aceite', 30]], paso: 'Fríe los huevos y báñalos con salsa de tomate, cebolla y chile cocida.', min: 20, pop: 4 },
  entomatados: { n: 'Huevos entomatados', ing: [['huevo', 8], ['tomate', 300], ['cebolla', 60], ['aceite', 20]], paso: 'Cocina tomate y cebolla hasta que se deshagan y agrega los huevos batidos.', min: 15, pop: 4 },
  chorizo: { n: 'Huevos con chorizo', ing: [['huevo', 8], ['chorizo', 200]], paso: 'Dora el chorizo desmenuzado y agrega los huevos batidos.', min: 15, pop: 4, prot: 'embutido' },
  salchicha: { n: 'Huevos con salchicha', ing: [['huevo', 8], ['salchicha', 200], ['aceite', 15]], paso: 'Dora la salchicha en rodajas y agrega los huevos batidos.', min: 12, pop: 3, prot: 'embutido' },
  jamon: { n: 'Huevos con jamón', ing: [['huevo', 8], ['jamon', 150], ['aceite', 15]], paso: 'Dora el jamón picado y agrega los huevos batidos.', min: 12, pop: 4 },
  loroco: { n: 'Huevos con loroco', ing: [['huevo', 8], ['loroco', 80], ['aceite', 15]], paso: 'Sofríe el loroco y agrega los huevos batidos.', min: 12, pop: 4 },
  ejote: { n: 'Huevos con ejote', ing: [['huevo', 8], ['ejote', 200], ['aceite', 15]], paso: 'Cuece el ejote picado, sofríelo y agrega los huevos.', min: 15, pop: 3 },
  omelette: { n: 'Omelette de queso', ing: [['huevo', 8], ['queso_amarillo', 120], ['margarina', 20]], paso: 'Cuaja el huevo batido en sartén, rellena con queso y dobla.', min: 12, pop: 3 },
  espinaca: { n: 'Huevos revueltos con espinaca', ing: [['huevo', 8], ['espinaca', 150], ['margarina', 20]], paso: 'Saltea la espinaca y agrega los huevos batidos.', min: 12, pop: 3 },
  tocino: { n: 'Huevos con tocino', ing: [['huevo', 8], ['tocino', 200]], paso: 'Dora el tocino en tiras y fríe los huevos en la misma grasa.', min: 15, pop: 4, prot: 'cerdo' },
  mortadela: { n: 'Huevos con mortadela frita', ing: [['huevo', 8], ['mortadela', 200], ['aceite', 20]], paso: 'Fríe la mortadela en rodajas y luego los huevos.', min: 12, pop: 4, prot: 'embutido' },
  ahogados: { n: 'Huevos ahogados en salsa', ing: [['huevo', 8], ['tomate', 400], ['cebolla', 80], ['chile_verde', 1], ['cilantro', 1]], paso: 'Cocina una salsa de tomate, cebolla y chile y quiebra los huevos dentro; tapa hasta que cuajen.', min: 20, pop: 4 },
  tomate_queso: { n: 'Huevos revueltos con tomate y queso', ing: [['huevo', 8], ['tomate', 150], ['queso_fresco', 120], ['aceite', 15]], paso: 'Sofríe el tomate, agrega los huevos y al final el queso desmoronado.', min: 12, pop: 4 },
  papa: { n: 'Huevos con papa', ing: [['huevo', 8], ['papa', 300], ['cebolla', 60], ['aceite', 30]], paso: 'Dora la papa en cubitos con cebolla y agrega los huevos batidos.', min: 20, pop: 4 },
  hongos: { n: 'Omelette de champiñones', ing: [['huevo', 8], ['champinones', 150], ['queso_amarillo', 80], ['margarina', 20]], paso: 'Saltea los champiñones, cuaja el huevo encima, agrega queso y dobla.', min: 15, pop: 3 },
};
const ACOMP_DESAYUNO = [
  ['tipico', 'frijoles, plátano, crema y queso', [['frijol', 300], ['platano', 2], ['crema', 120], ['queso_duro', 80], ['tortillas', 12], ['aceite', 60]], 'Sirve con frijoles volteados, plátano frito, crema, queso duro y tortillas.', 10],
  ['frijoles', 'frijoles y tortillas', [['frijol', 300], ['tortillas', 12], ['aceite', 20]], 'Sirve con frijoles volteados y tortillas calientes.', 5],
  ['casamiento', 'casamiento', [['arroz', 200], ['frijol', 200], ['cebolla', 40], ['tortillas', 8], ['aceite', 20]], 'Sirve con casamiento y tortillas.', 10],
  ['pan', 'pan francés y frijoles', [['pan_frances', 4], ['frijol', 250], ['aceite', 20]], 'Sirve con pan francés y frijoles.', 5],
  ['aguacate', 'aguacate y tortillas', [['aguacate', 2], ['tortillas', 12]], 'Sirve con aguacate en tajadas y tortillas.', 5],
  ['platano', 'plátano y crema', [['platano', 2], ['crema', 120], ['aceite', 60], ['tortillas', 8]], 'Sirve con plátano frito, crema y tortillas.', 10],
  ['quesillo', 'frijoles y quesillo', [['frijol', 250], ['quesillo', 150], ['tortillas', 12], ['aceite', 20]], 'Sirve con frijoles, quesillo y tortillas.', 5],
  ['tostado', 'pan tostado', [['pan_molde', 300], ['margarina', 30]], 'Sirve con pan tostado con margarina.', 5],
  ['queso-fresco', 'frijoles y queso fresco', [['frijol', 250], ['queso_fresco', 150], ['tortillas', 12], ['aceite', 20]], 'Sirve con frijoles volteados, queso fresco y tortillas.', 5],
  ['frijoles-crema', 'frijoles, crema y aguacate', [['frijol', 250], ['crema', 120], ['aguacate', 1], ['tortillas', 12], ['aceite', 20]], 'Sirve con frijoles, crema, aguacate y tortillas.', 5],
  ['pan-aguacate', 'pan francés y aguacate', [['pan_frances', 4], ['aguacate', 2]], 'Sirve con pan francés y aguacate machacado con sal y limón.', 5],
];
const OTROS_DESAYUNOS = [
  ...[['avena', 'Mosh de avena con canela', [['avena', 150], ['leche', 800], ['canela', 1], ['azucar', 1]], 4],
    ['atol-avena-banano', 'Atol de avena con banano', [['avena', 120], ['leche', 700], ['banano', 2], ['azucar', 1]], 3],
    ['avena-fresas', 'Avena con fresas', [['avena', 150], ['leche', 700], ['fresa', 200], ['miel', 1]], 3],
    ['cereal-fresas', 'Cereal con leche y fresas', [['cereal', 200], ['leche', 800], ['fresa', 200]], 3],
    ['yogurt-fruta', 'Yogurt con granola y papaya', [['yogurt', 600], ['granola', 150], ['papaya', 400]], 3],
    ['licuado-fresa', 'Licuado de fresa con leche', [['fresa', 300], ['leche', 800], ['azucar', 1]], 3],
    ['licuado-papaya', 'Licuado de papaya con avena', [['papaya', 400], ['leche', 800], ['avena', 60]], 3],
    ['chocolate-pan', 'Chocolate caliente con pan dulce', [['chocolate', 120], ['leche', 800], ['pan_dulce', 4], ['canela', 1]], 4],
    ['cafe-pan-frijol', 'Café con pan francés y frijoles', [['cafe', 40], ['pan_frances', 4], ['frijol', 250], ['aceite', 20]], 4],
    ['panqueques-fresas', 'Panqueques con fresas', [['harina_panqueque', 300], ['leche', 300], ['huevo', 2], ['fresa', 200], ['miel', 1]], 3],
    ['pan-frances-dulce', 'Pan francés en huevo (torrejas rápidas)', [['pan_molde', 300], ['huevo', 3], ['leche', 200], ['canela', 1], ['azucar', 1], ['margarina', 30]], 3],
    ['sandwich-pollo', 'Sándwich de pollo', [['pan_molde', 400], ['pechuga', 300], ['mayonesa', 60], ['lechuga', 0.5], ['tomate', 150]], 3],
    ['sandwich-huevo', 'Sándwich de huevo', [['pan_molde', 400], ['huevo', 6], ['mayonesa', 50], ['tomate', 150]], 3],
    ['tortilla-queso-fresco', 'Tortillas con queso fresco y frijoles', [['tortillas', 12], ['queso_fresco', 200], ['frijol', 250], ['aceite', 20]], 4]]
    .map(([id, n, ing, pop]) => ({ id: `des-${id}`, nombre: n, minutos: 15, porciones: 4, tiempos: ['desayuno'], aparatos: ['estufa'],
      etiquetas: ['rapido'], proteina: ing.some(([i]) => ['huevo'].includes(i)) ? 'huevo' : ing.some(([i]) => i === 'pechuga') ? 'pollo' : 'vegetal',
      popularidad: pop, ing, pasos: ['Prepara los ingredientes.', `Sirve: ${n.toLowerCase()}.`], familia: `des-${id}` })),
];

// ------------------------------------------------------------------ refacciones
const FRUTAS = [['mango', 'Mango', [['mango', 2]]], ['pina', 'Piña', [['pina', 1]]], ['sandia', 'Sandía', [['sandia', 1200]]], ['melon', 'Melón', [['melon', 1]]],
  ['papaya', 'Papaya', [['papaya', 800]]], ['naranja', 'Naranja', [['naranja', 4]]], ['fresa', 'Fresas', [['fresa', 400]]], ['uva', 'Uvas', [['uva', 400]]],
  ['manzana', 'Manzana', [['manzana', 4]]], ['banano', 'Banano', [['banano', 4]]], ['pepino', 'Pepino', [['pepino', 2]]]];
const REFACCIONES = [
  ...FRUTAS.flatMap(([id, n, ing]) => [
    { id: `ref-${id}-limon`, nombre: `${n} con limón, sal y alguashte`, ing: [...ing, ['limon', 2], ['alguashte', 1]], pop: ['mango', 'pepino', 'pina', 'sandia'].includes(id) ? 5 : 3 },
    { id: `ref-${id}-picada`, nombre: `${n} picada`, ing, pop: 3 },
  ]),
  { id: 'ref-coctel-frutas', nombre: 'Coctel de frutas', ing: [['papaya', 400], ['pina', 0.5], ['banano', 2], ['sandia', 500]], pop: 4 },
  { id: 'ref-ensalada-frutas-crema', nombre: 'Ensalada de frutas con crema', ing: [['papaya', 300], ['banano', 2], ['manzana', 2], ['crema', 150], ['leche_condensada', 100]], pop: 4 },
  { id: 'ref-semita-cafe', nombre: 'Semita con café', ing: [['pan_dulce', 4], ['cafe', 30]], pop: 5 },
  { id: 'ref-quesadilla-cafe', nombre: 'Quesadilla (pan) con café', ing: [['pan_dulce', 4], ['cafe', 30]], pop: 5 },
  { id: 'ref-pan-dulce-chocolate', nombre: 'Pan dulce con chocolate', ing: [['pan_dulce', 4], ['chocolate', 80], ['leche', 600]], pop: 4 },
  { id: 'ref-atol-chocolate', nombre: 'Atol de chocolate', ing: [['chocolate', 100], ['leche', 800], ['maicena', 1], ['azucar', 1]], pop: 4 },
  { id: 'ref-atol-pina', nombre: 'Atol de piña', ing: [['pina', 1], ['harina_maiz', 100], ['azucar', 1], ['canela', 1]], pop: 3 },
  { id: 'ref-atol-arroz', nombre: 'Atol de arroz con leche', ing: [['harina_arroz', 120], ['leche', 800], ['azucar', 1], ['canela', 1]], pop: 4 },
  { id: 'ref-elote-loco', nombre: 'Elote loco', ing: [['elote', 4], ['mayonesa', 80], ['salsa_tomate', 60], ['queso_duro', 80], ['mostaza', 1]], pop: 5 },
  { id: 'ref-elote-asado', nombre: 'Elote asado con limón y sal', ing: [['elote', 4], ['limon', 2]], pop: 4 },
  { id: 'ref-maní-limon', nombre: 'Maní con limón y alguashte', ing: [['mani', 200], ['limon', 2], ['alguashte', 1]], pop: 3 },
  { id: 'ref-yuca-salcochada', nombre: 'Yuca salcochada con limón y chile', ing: [['yuca', 600], ['limon', 2], ['jalapeno', 30]], pop: 3 },
  { id: 'ref-platano-asado', nombre: 'Plátano asado con crema', ing: [['platano', 4], ['crema', 120]], pop: 4 },
  { id: 'ref-pan-frijol', nombre: 'Pan con frijoles', ing: [['pan_frances', 4], ['frijol', 200], ['queso_duro', 40]], pop: 4 },
  { id: 'ref-galletas-leche', nombre: 'Galletas con leche', ing: [['galletas', 200], ['leche', 800]], pop: 3 },
  { id: 'ref-yogurt-granola', nombre: 'Yogurt con granola', ing: [['yogurt', 600], ['granola', 120]], pop: 3 },
  { id: 'ref-gelatina-crema', nombre: 'Gelatina con crema', ing: [['gelatina', 170], ['crema', 120]], pop: 2 },
  { id: 'ref-chocobanano', nombre: 'Chocobananos', ing: [['banano', 4], ['chocolate', 100], ['mani', 60]], pop: 4 },
  { id: 'ref-sorbete-frutas', nombre: 'Paletas caseras de fruta', ing: [['fresa', 300], ['mango', 2], ['azucar', 1]], pop: 3 },
].map((r) => ({ id: r.id, nombre: r.nombre, minutos: 10, porciones: 4, tiempos: ['refaccion'], aparatos: ['estufa'],
  etiquetas: ['rapido', ...(/frut|mango|pina|sandia|melon|papaya|naranja|fresa|uva|manzana|banano|pepino/.test(r.id) ? ['saludable'] : [])],
  proteina: 'vegetal', popularidad: r.pop, ing: r.ing, pasos: ['Lava y prepara los ingredientes.', `Sirve: ${r.nombre.toLowerCase()}.`], familia: r.id }));

// pan dulce salvadoreño × bebida, licuados y frescos de fruta, sándwiches y postres de casa
const PANES_DULCES = [['semita', 'Semita', 5], ['quesadilla', 'Quesadilla salvadoreña', 5], ['salpores', 'Salpores de arroz', 4], ['marquesote', 'Marquesote', 4],
  ['torta-yema', 'Torta de yema', 4], ['peperechas', 'Peperechas', 3], ['cachitos', 'Cachitos', 3], ['conchas', 'Conchas', 4], ['pan-yema', 'Pan de yema', 4]];
const BEBIDAS = [['cafe', 'café', [['cafe', 30]], 'Prepara el café.'], ['chocolate', 'chocolate', [['chocolate', 100], ['leche', 700]], 'Disuelve el chocolate en leche caliente.'],
  ['leche', 'leche', [['leche', 800]], 'Calienta la leche (o sírvela fría).']];
const LICUABLES = [['mango', 'mango', [['mango', 2]]], ['pina', 'piña', [['pina', 0.5]]], ['fresa', 'fresa', [['fresa', 300]]], ['papaya', 'papaya', [['papaya', 500]]],
  ['banano', 'banano', [['banano', 3]]], ['melon', 'melón', [['melon', 0.5]]], ['sandia', 'sandía', [['sandia', 800]]], ['naranja', 'naranja', [['naranja', 8]]]];
const SANDWICHES = [['jamon', 'jamón y queso', [['jamon', 200], ['queso_amarillo', 150]], 'embutido'], ['pollo', 'pollo', [['pechuga', 300], ['mayonesa', 60], ['lechuga', 0.5]], 'pollo'],
  ['atun', 'atún', [['atun', 280], ['mayonesa', 60], ['cebolla', 40]], 'pescado'], ['huevo', 'huevo', [['huevo', 6], ['mayonesa', 40]], 'huevo'],
  ['mortadela', 'mortadela', [['mortadela', 200], ['queso_amarillo', 120]], 'embutido'], ['frijol-queso', 'frijol y queso', [['frijol', 250], ['queso_fresco', 120]], 'vegetal']];
const POSTRES = [
  ['budin-pan', 'Budín de pan', [['pan_frances', 6], ['leche', 700], ['huevo', 3], ['azucar', 1], ['canela', 1], ['margarina', 30]], 4, 60,
    ['Remoja el pan en la leche con huevo, azúcar y canela.', 'Viértelo en un molde engrasado y hornea a 180 °C 40 min.'], ['horno']],
  ['torrejas', 'Torrejas en miel', [['pan_frances', 6], ['huevo', 4], ['aceite', 200], ['miel', 1], ['canela', 1]], 4, 40,
    ['Corta el pan en rodajas, pásalas por huevo batido y fríelas.', 'Báñalas con miel de panela con canela.'], ['estufa']],
  ['nuegados', 'Nuégados de yuca en miel', [['yuca', 800], ['huevo', 2], ['aceite', 250], ['miel', 1]], 4, 60,
    ['Cocina y maja la yuca con huevo.', 'Forma bolitas y fríelas.', 'Sírvelas bañadas en miel de panela.'], ['estufa']],
  ['platano-mole', 'Plátanos en mole', [['platano', 4], ['chocolate', 80], ['tomate', 150], ['ajonjoli', 1], ['aceite', 100], ['azucar', 1]], 3, 45,
    ['Fríe el plátano maduro en tajadas.', 'Prepara el mole con tomate, chocolate y azúcar licuados y cocidos.', 'Baña los plátanos con el mole.'], ['estufa']],
  ['bunuelos', 'Buñuelos de yuca en miel', [['yuca', 700], ['queso_duro', 80], ['huevo', 2], ['aceite', 250], ['miel', 1]], 4, 50,
    ['Muele la yuca cocida con queso y huevo.', 'Fríe cucharadas de la masa.', 'Sirve con miel.'], ['estufa']],
  ['arroz-leche-pasas', 'Arroz en leche con canela', [['arroz', 150], ['leche', 1000], ['leche_condensada', 150], ['canela', 1]], 4, 40,
    ['Cocina el arroz con canela en agua.', 'Agrega la leche y la leche condensada y cocina moviendo hasta espesar.'], ['estufa']],
  ['flan', 'Flan de leche', [['leche', 500], ['leche_condensada', 395], ['huevo', 4], ['azucar', 1], ['vainilla', 1]], 3, 70,
    ['Haz caramelo con el azúcar en el molde.', 'Licúa leche, leche condensada, huevos y vainilla y vierte.', 'Cocina a baño maría 50 min y enfría.'], ['estufa']],
];
const MAS_REFACCIONES = [
  ...PANES_DULCES.flatMap(([pid, pn, pop]) => BEBIDAS.map(([bid, bn, bing, bpaso]) => ({ id: `ref-${pid}-${bid}`, nombre: `${pn} con ${bn}`,
    ing: [['pan_dulce', 4], ...bing], pop: bid === 'cafe' ? pop : Math.max(2, pop - 1), pasos: [bpaso, `Sirve con ${pn.toLowerCase()}.`], fam: `ref-${pid}` }))),
  ...LICUABLES.flatMap(([fid, fn, fing]) => [
    { id: `ref-licuado-${fid}`, nombre: `Licuado de ${fn} con leche`, ing: [...fing, ['leche', 800], ['azucar', 1]], pop: 4, pasos: [`Licúa ${fn} con leche fría y azúcar al gusto.`, 'Sirve de inmediato.'], fam: `ref-licuado-${fid}` },
    { id: `ref-fresco-${fid}`, nombre: `Fresco de ${fn}`, ing: [...fing, ['azucar', 1], ['limon', 1]], pop: 4, pasos: [`Licúa ${fn} con agua fría, azúcar y unas gotas de limón.`, 'Cuela si quieres y sirve con hielo.'], fam: `ref-fresco-${fid}` },
  ]),
  { id: 'ref-fresco-ensalada', nombre: 'Fresco de ensalada', ing: [['pina', 0.5], ['manzana', 2], ['naranja', 4], ['mango', 1], ['azucar', 1]], pop: 5,
    pasos: ['Pica muy fino piña, manzana y mango.', 'Mezcla con jugo de naranja, agua, azúcar y hielo.'], fam: 'ref-fresco-ensalada' },
  ...SANDWICHES.map(([sid, sn, sing, prot]) => ({ id: `ref-sandwich-${sid}`, nombre: `Sándwich de ${sn}`, ing: [['pan_molde', 400], ...sing, ['tomate', 120]], pop: 3,
    pasos: ['Arma los sándwiches con pan de caja.', 'Tuéstalos en comal o sartén si gustas.'], fam: `ref-sandwich-${sid}`, prot, tiempos: ['refaccion', 'desayuno', 'cena'] })),
  ...POSTRES.map(([id, n, ing, pop, min, pasos, aparatos]) => ({ id: `ref-${id}`, nombre: n, ing, pop, min, pasos, aparatos, fam: `ref-${id}`, dulce: true })),
].map((r) => ({ id: r.id, nombre: r.nombre, minutos: r.min || 10, porciones: 4, tiempos: r.tiempos || ['refaccion'], aparatos: r.aparatos || ['estufa'],
  etiquetas: [...(r.min > 30 ? [] : ['rapido']), ...(r.dulce || /licuado|fresco|pan|semita|quesadilla|salpores|marquesote|torta|peperechas|cachitos|conchas/.test(r.id) ? ['dulce'] : []), 'tradicional'],
  proteina: r.prot || 'vegetal', popularidad: r.pop, ing: r.ing, pasos: r.pasos, familia: r.fam }));

// ------------------------------------------------------------------ armado
const LADOS_SOPA = [['', 'con tortillas y limón', [['tortillas', 12], ['limon', 3]]], ['-arroz', 'con arroz aparte y tortillas', [['arroz', 250], ['tortillas', 8], ['limon', 2]]],
  ['-aguacate', 'con aguacate y tortillas', [['aguacate', 2], ['tortillas', 12]]]];
const LADOS_PASTA = [['', '', []], ['-ensalada', 'y ensalada verde', LADOS.ensalada_verde.ing], ['-pan', 'y pan con ajo', [['pan_frances', 4], ['margarina', 40], ['ajo', 3]]]];
const LADOS_ARROZ = [['', '', []], ['-ensalada', 'con ensalada verde', LADOS.ensalada_verde.ing], ['-aguacate', 'con aguacate', LADOS.aguacate.ing], ['-platano', 'con plátano frito', LADOS.platano.ing]];

/** Junta ingredientes repetidos sumando cantidades */
function juntar(...listas) {
  const m = new Map();
  for (const l of listas) for (const [id, c] of l) m.set(id, (m.get(id) || 0) + c);
  return [...m];
}

function conLados(plato) {
  const base = { porciones: 4, aparatos: plato.aparatos || ['estufa'], proteina: plato.proteina, familia: plato.id, tecnica: plato.tecnica,
    tiempos: plato.tiempos || ['almuerzo', 'cena'] };
  const etiquetas = (extra = []) => [...new Set([...plato.etiquetas, ...extra])];
  const tortillas = plato.tortillas === false ? [] : [['tortillas', 12]];
  const out = [];
  if (plato.lados === 'sopa') {
    for (const [suf, txt, ing] of LADOS_SOPA) out.push({ ...base, id: `${plato.id}${suf}`, nombre: `${plato.nombre} ${txt}`, minutos: plato.min,
      etiquetas: etiquetas(), popularidad: plato.popularidad, ing: juntar(plato.ing, ing), pasos: [...plato.pasos, `Sirve ${txt}.`] });
    return out;
  }
  if (plato.lados === 'pasta' || plato.lados === 'arroz') {
    for (const [suf, txt, ing] of plato.lados === 'pasta' ? LADOS_PASTA : LADOS_ARROZ) out.push({ ...base, id: `${plato.id}${suf}`,
      nombre: txt ? `${plato.nombre} ${txt}` : plato.nombre, minutos: plato.min + (txt ? 5 : 0), etiquetas: etiquetas(), popularidad: plato.popularidad,
      ing: juntar(plato.ing, ing), pasos: txt ? [...plato.pasos, `Acompaña ${txt.replace(/^(con|y) /, 'con ')}.`] : plato.pasos });
    return out;
  }
  if (!plato.lados) {
    const extra = plato.extraIng || [];
    out.push({ ...base, id: plato.id, nombre: plato.sirve ? `${plato.nombre} con ${plato.sirve}` : plato.nombre, minutos: plato.min, etiquetas: etiquetas(),
      popularidad: plato.popularidad, ing: juntar(plato.ing, extra, plato.sirve === 'arroz' ? LADOS.arroz.ing : [], plato.tortillas ? tortillas : []),
      pasos: [...plato.pasos, ...(plato.sirve === 'arroz' ? [LADOS.arroz.paso] : [])] });
    return out;
  }
  // plato de comedor: base × complemento, intercalados para variar, hasta MAX_COMBOS
  const c = COMBINA[plato.lados];
  const tienePapa = plato.ing.some(([i]) => i === 'papa' || i === 'yuca');
  const bases = c.bases.filter((b) => !(tienePapa && ['papas_fritas', 'pure', 'yuca'].includes(b)));
  // "arroz y frijoles" es el par más clásico del comedor aunque los dos sean base
  const pares = plato.lados === 'salsa' ? [['arroz', 'frijoles_olla']] : bases.includes('frijoles') ? [['arroz', 'frijoles']] : [];
  for (let k = 0; pares.length < MAX_COMBOS && k < bases.length * c.comps.length; k++) {
    const b = bases[k % bases.length];
    const cp = c.comps[(k + Math.floor(k / bases.length)) % c.comps.length];
    if (!pares.some(([x, y]) => x === b && y === cp)) pares.push([b, cp]);
  }
  for (const [b, cp] of pares) {
    const lb = LADOS[b];
    const lc = LADOS[cp];
    // freír el plato y también su acompañamiento es demasiado: se evita doble fritura con papas fritas
    if (plato.etiquetas.includes('frito') && b === 'papas_fritas' && cp === 'platano') continue;
    if (b === 'arroz_verduras' && ['vegetales', 'ejotes'].includes(cp)) continue;
    out.push({ ...base, id: `${plato.id}--${b}-${cp}`.replace(/_/g, '-'), nombre: plato.nombre.includes(' con ') ? `${plato.nombre}, ${lb.n} y ${lc.n}` : `${plato.nombre} con ${lb.n} y ${lc.n}`,
      minutos: Math.max(plato.min, lb.min) + 5, etiquetas: etiquetas([...(lb.et || []), ...(lc.et || []), 'lonchera'].filter((e) => e !== 'lonchera' || plato.etiquetas.includes('lonchera'))),
      popularidad: Math.max(1, plato.popularidad - (['pure', 'yuca', 'ejotes'].includes(b) || cp === 'ejotes' ? 1 : 0)),
      ing: juntar(plato.ing, lb.ing, lc.ing, tortillas),
      pasos: [...plato.pasos, `Mientras, ${lb.paso.charAt(0).toLowerCase()}${lb.paso.slice(1)}`, lc.paso, tortillas.length ? 'Sirve con tortillas calientes.' : 'Sirve caliente.'] });
  }
  return out;
}

function desayunosDeHuevo() {
  const out = [];
  for (const [hk, h] of Object.entries(HUEVOS)) {
    for (const [ak, an, aing, apaso, amin] of ACOMP_DESAYUNO) {
      out.push({ id: `des-${hk}-${ak}`, nombre: h.n.includes(' con ') ? `${h.n}, ${an}` : `${h.n} con ${an}`, minutos: h.min + amin, porciones: 4, tiempos: ['desayuno', ...(ak === 'tipico' ? ['cena'] : [])],
        aparatos: ['estufa'], etiquetas: ['tradicional', ...(h.min + amin <= 25 ? ['rapido'] : [])], proteina: h.prot || 'huevo',
        popularidad: Math.max(2, h.pop - (['tostado', 'aguacate'].includes(ak) ? 1 : 0)), familia: `des-${hk}`,
        ing: juntar(h.ing, aing), pasos: [h.paso, apaso] });
    }
  }
  return out;
}

const platosTecnica = Object.entries(TECNICAS).flatMap(([tk, t]) => t.prots.filter((pk) => !YA_EXISTEN.has(`${tk}|${pk}`)).map((pk) => platoTecnica(tk, t, pk)));

/** Todas las recetas generadas (sin ids repetidos) */
export const RECETAS_GENERADAS = (() => {
  const todas = [...platosTecnica, ...PLATOS].flatMap(conLados).concat(TIPICOS, desayunosDeHuevo(), OTROS_DESAYUNOS, REFACCIONES, MAS_REFACCIONES);
  const vistos = new Set();
  return todas.filter((r) => !vistos.has(r.id) && vistos.add(r.id));
})();
export const PLATOS_FUERTES = platosTecnica.length + PLATOS.length + TIPICOS.length;
