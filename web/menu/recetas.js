// Recetario (cantidades para 4 porciones salvo que diga otra cosa; el planificador escala).
// Este archivo tiene los ALMUERZOS; desayunos, cenas y refacciones están en recetas-*.js
// y todo se junta abajo en RECETAS.
// tiempos: desayuno | refaccion | almuerzo | cena  (en qué comidas puede aparecer)
// ing: [idIngrediente, cantidad en la unidad del ingrediente (g, ml o und)]
// aparatos: estufa | horno | freidora (de aire) | licuadora
// etiquetas: rapido (≤30 min) | economico | tradicional | saludable | ninos | vegetariano | dulce
// proteina: pollo | res | cerdo | pescado | huevo | embutido | vegetal

import { DESAYUNOS } from './recetas-desayunos.js';
import { CENAS } from './recetas-cenas.js';
import { REFACCIONES } from './recetas-refacciones.js';

const ALMUERZOS = [
  {
    id: 'pollo-guisado', nombre: 'Pollo guisado con arroz', minutos: 60, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['tradicional'], proteina: 'pollo',
    ing: [['pollo_piezas', 1000], ['tomate', 300], ['cebolla', 150], ['chile_verde', 1], ['ajo', 3], ['papa', 400],
      ['zanahoria', 150], ['salsa_tomate', 106], ['arroz', 300], ['aceite', 30], ['consome', 1]],
    pasos: [
      'Sazona el pollo con sal, pimienta y ajo picado. Dóralo en una olla con la mitad del aceite.',
      'Licúa tomate, cebolla, chile verde y la salsa de tomate con media taza de agua.',
      'Agrega la salsa al pollo con la papa y la zanahoria en trozos. Tapa y cocina a fuego medio 35 min.',
      'Mientras, sofríe el arroz con el resto del aceite, agrega el doble de agua y sal, y cocina tapado 20 min.',
      'Sirve el pollo con su salsa sobre el arroz.',
    ],
  },
  {
    id: 'arroz-con-pollo', nombre: 'Arroz con pollo', minutos: 45, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['tradicional', 'ninos'], proteina: 'pollo',
    ing: [['pechuga', 500], ['arroz', 400], ['vegetales_mixtos', 300], ['tomate', 200], ['cebolla', 100],
      ['chile_verde', 1], ['ajo', 2], ['aceite', 30], ['consome', 1], ['achiote', 1]],
    pasos: [
      'Cuece la pechuga en agua con sal y consomé 20 min. Guarda el caldo y desmenuza el pollo.',
      'Sofríe cebolla, chile, tomate y ajo picados en el aceite; agrega el arroz y dóralo 3 min con una pizca de achiote.',
      'Añade el caldo (el doble de la medida del arroz), los vegetales y el pollo.',
      'Tapa y cocina a fuego bajo 20 min, hasta que el arroz esté suave.',
    ],
  },
  {
    id: 'sopa-de-res', nombre: 'Sopa de res', minutos: 120, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['tradicional'], proteina: 'res',
    ing: [['res_costilla', 1000], ['yuca', 400], ['guisquil', 2], ['elote', 2], ['zanahoria', 200], ['repollo', 0.5],
      ['papa', 300], ['cilantro', 1], ['tomate', 150], ['cebolla', 100], ['ajo', 3], ['limon', 3], ['arroz', 200], ['tortillas', 8]],
    pasos: [
      'Hierve la costilla en 3 litros de agua con sal, ajo, cebolla y tomate durante 1 hora, quitando la espuma.',
      'Agrega yuca y elote en trozos; a los 15 min, papa, zanahoria y güisquil.',
      'Al final suma el repollo en gajos y el cilantro; cocina 10 min más.',
      'Sirve con arroz aparte, limón y tortillas.',
    ],
  },
  {
    id: 'carne-guisada', nombre: 'Carne guisada con papas', minutos: 75, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['tradicional'], proteina: 'res',
    ing: [['res_posta', 700], ['papa', 500], ['zanahoria', 200], ['tomate', 300], ['cebolla', 150], ['chile_verde', 1],
      ['ajo', 3], ['salsa_inglesa', 1], ['arroz', 300], ['aceite', 30]],
    pasos: [
      'Corta la carne en cubos, sazona con sal, pimienta, ajo y salsa inglesa; dórala en aceite.',
      'Agrega tomate, cebolla y chile picados; sofríe 5 min.',
      'Cubre con agua, tapa y cocina 40 min a fuego bajo.',
      'Suma papa y zanahoria en cubos y cocina 20 min más. Sirve con arroz.',
    ],
  },
  {
    id: 'huevos-picados', nombre: 'Huevos picados con frijoles', minutos: 20, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico', 'tradicional', 'vegetariano'], proteina: 'huevo',
    ing: [['huevo', 8], ['tomate', 200], ['cebolla', 80], ['chile_verde', 1], ['frijol', 300], ['tortillas', 12],
      ['queso_duro', 100], ['crema', 120], ['aceite', 20]],
    pasos: [
      'Pica tomate, cebolla y chile; sofríelos en aceite 3 min.',
      'Agrega los huevos batidos con sal y revuelve hasta que cuajen.',
      'Calienta los frijoles ya cocidos (o fríelos molidos).',
      'Sirve con queso duro rallado, crema y tortillas calientes.',
    ],
  },
  {
    id: 'frijoles-con-chorizo', nombre: 'Frijoles con chorizo y arroz', minutos: 30, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico'], proteina: 'embutido',
    ing: [['frijol', 400], ['chorizo', 250], ['cebolla', 80], ['arroz', 300], ['tortillas', 12], ['crema', 120], ['aceite', 15]],
    pasos: [
      'Dora el chorizo desmenuzado con la cebolla picada.',
      'Agrega los frijoles cocidos con un poco de su caldo y deja espesar 10 min.',
      'Prepara el arroz: sofríe, agrega el doble de agua con sal y cocina tapado 20 min.',
      'Sirve con crema y tortillas.',
    ],
  },
  {
    id: 'tortas-de-papa', nombre: 'Tortitas de papa con queso', minutos: 45, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['economico', 'ninos', 'vegetariano'], proteina: 'huevo',
    ing: [['papa', 900], ['queso_duro', 150], ['huevo', 4], ['harina_trigo', 1], ['aceite', 150], ['tomate', 300],
      ['cebolla', 80], ['arroz', 300]],
    pasos: [
      'Cuece las papas peladas y hazlas puré con sal; mezcla con el queso duro rallado.',
      'Forma tortitas, pásalas por harina y luego por huevo batido.',
      'Fríelas en aceite caliente hasta dorar por ambos lados.',
      'Sirve con salsa de tomate y cebolla cocidos y arroz.',
    ],
  },
  {
    id: 'tortas-de-guisquil', nombre: 'Güisquiles envueltos en huevo', minutos: 45, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['tradicional', 'vegetariano'], proteina: 'huevo',
    ing: [['guisquil', 4], ['quesillo', 200], ['huevo', 4], ['harina_trigo', 1], ['aceite', 150], ['tomate', 300],
      ['cebolla', 80], ['chile_verde', 1], ['arroz', 300]],
    pasos: [
      'Cuece los güisquiles en mitades 15 min; córtalos en rodajas gruesas.',
      'Pon quesillo entre dos rodajas, pásalas por harina y huevo batido a punto de nieve.',
      'Fríe hasta dorar y escurre.',
      'Sirve en salsa de tomate, cebolla y chile, con arroz.',
    ],
  },
  {
    id: 'pollo-encebollado', nombre: 'Pollo encebollado', minutos: 35, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['saludable'], proteina: 'pollo',
    ing: [['pechuga', 700], ['cebolla', 400], ['ajo', 3], ['aceite', 30], ['limon', 2], ['arroz', 300], ['tomate', 200], ['pepino', 1]],
    pasos: [
      'Corta la pechuga en filetes y marina con limón, ajo, sal y pimienta 10 min.',
      'Dórala en aceite 5 min por lado y resérvala.',
      'En la misma sartén cocina la cebolla en aros hasta que esté suave; regresa el pollo y tapa 5 min.',
      'Sirve con arroz y una ensalada de tomate y pepino.',
    ],
  },
  {
    id: 'espagueti-bolonesa', nombre: 'Espagueti con carne molida', minutos: 30, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['rapido', 'ninos'], proteina: 'res',
    ing: [['espagueti', 450], ['carne_molida', 450], ['salsa_tomate', 212], ['tomate', 200], ['cebolla', 100], ['ajo', 2],
      ['queso_duro', 60], ['aceite', 15], ['oregano', 1]],
    pasos: [
      'Cuece el espagueti en agua con sal según el paquete; escúrrelo.',
      'Dora la carne molida con cebolla y ajo picados.',
      'Agrega tomate picado, salsa de tomate, orégano y sal; cocina 10 min.',
      'Mezcla con la pasta y sirve con queso duro rallado.',
    ],
  },
  {
    id: 'chiles-rellenos', nombre: 'Chiles rellenos', minutos: 75, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['tradicional'], proteina: 'res',
    ing: [['chile_verde', 6], ['carne_molida', 450], ['papa', 300], ['zanahoria', 100], ['huevo', 4], ['harina_trigo', 1],
      ['aceite', 150], ['tomate', 300], ['cebolla', 100], ['arroz', 300]],
    pasos: [
      'Asa los chiles en el comal, ponlos en una bolsa 10 min y pélalos; ábrelos y quita las semillas.',
      'Cocina la carne con papa y zanahoria en cubitos pequeños, cebolla y sal (picadillo).',
      'Rellena los chiles, pásalos por harina y huevo batido a punto de nieve, y fríelos.',
      'Sirve en salsa de tomate con arroz.',
    ],
  },
  {
    id: 'salpicon', nombre: 'Salpicón de res', minutos: 60, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['tradicional', 'saludable'], proteina: 'res',
    ing: [['res_posta', 600], ['cebolla', 150], ['rabano', 1], ['hierbabuena', 1], ['limon', 4], ['arroz', 300],
      ['frijol', 300], ['tortillas', 12]],
    pasos: [
      'Cuece la carne con sal y media cebolla 40 min; déjala enfriar y pícala muy fina (o en procesador).',
      'Pica finito cebolla, rábano y hierbabuena; mézclalos con la carne.',
      'Sazona con jugo de limón y sal.',
      'Sirve frío o a temperatura ambiente con arroz, frijoles y tortillas.',
    ],
  },
  {
    id: 'tilapia-frita', nombre: 'Tilapia frita con ensalada', minutos: 30, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['rapido'], proteina: 'pescado',
    ing: [['tilapia', 900], ['limon', 3], ['ajo', 2], ['aceite', 200], ['arroz', 300], ['tomate', 200], ['lechuga', 1],
      ['aguacate', 2], ['tortillas', 8]],
    pasos: [
      'Haz cortes al pescado, sazónalo con limón, ajo, sal y pimienta.',
      'Fríelo en aceite bien caliente 5–6 min por lado.',
      'Prepara ensalada de lechuga, tomate y aguacate.',
      'Sirve con arroz, la ensalada y tortillas.',
    ],
  },
  {
    id: 'pollo-en-crema', nombre: 'Pollo en crema', minutos: 35, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['ninos'], proteina: 'pollo',
    ing: [['pechuga', 700], ['crema', 240], ['cebolla', 150], ['chile_verde', 1], ['ajo', 2], ['aceite', 20], ['arroz', 300],
      ['vegetales_mixtos', 250]],
    pasos: [
      'Corta la pechuga en tiras y dórala con sal y ajo.',
      'Agrega cebolla y chile en tiras; cocina 3 min.',
      'Baja el fuego, añade la crema y los vegetales; cocina 8 min sin hervir fuerte.',
      'Sirve con arroz.',
    ],
  },
  {
    id: 'arroz-frito', nombre: 'Arroz frito con huevo y salchicha', minutos: 25, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico', 'ninos'], proteina: 'huevo',
    ing: [['arroz', 400], ['huevo', 4], ['vegetales_mixtos', 300], ['salchicha', 250], ['cebolla', 100], ['ajo', 2], ['aceite', 30]],
    pasos: [
      'Cocina el arroz (mejor si es del día anterior y está frío).',
      'Revuelve los huevos en un sartén y resérvalos.',
      'Sofríe cebolla, ajo, salchicha en rodajas y vegetales 5 min.',
      'Agrega el arroz y el huevo, saltea a fuego alto y ajusta de sal.',
    ],
  },
  {
    id: 'tacos-de-pollo', nombre: 'Tacos de pollo', minutos: 35, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['ninos'], proteina: 'pollo',
    ing: [['pechuga', 500], ['tortillas', 16], ['repollo', 0.5], ['tomate', 200], ['cebolla', 100], ['limon', 2],
      ['aguacate', 2], ['aceite', 100]],
    pasos: [
      'Cuece la pechuga con sal y desmenúzala.',
      'Rellena las tortillas, enróllalas y fríelas hasta que estén doradas.',
      'Prepara repollo picado con tomate, cebolla y limón.',
      'Sirve los tacos con el repollo encima y aguacate.',
    ],
  },
  {
    id: 'sopa-de-frijoles', nombre: 'Sopa de frijoles con huevo', minutos: 40, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['economico', 'tradicional', 'vegetariano'], proteina: 'huevo',
    ing: [['frijol', 450], ['huevo', 4], ['queso_duro', 100], ['cebolla', 80], ['ajo', 2], ['cilantro', 1], ['tortillas', 12],
      ['crema', 120]],
    pasos: [
      'Calienta los frijoles cocidos con bastante caldo, cebolla y ajo picados.',
      'Cuando hierva, rompe los huevos dentro de la sopa uno a uno y deja que se cuezan 5 min.',
      'Agrega cilantro picado y ajusta de sal.',
      'Sirve con queso duro, crema y tortillas tostadas.',
    ],
  },
  {
    id: 'lentejas-guisadas', nombre: 'Lentejas guisadas', minutos: 50, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['economico', 'saludable', 'vegetariano'], proteina: 'vegetal',
    ing: [['lentejas', 450], ['papa', 300], ['zanahoria', 150], ['tomate', 200], ['cebolla', 100], ['ajo', 2],
      ['chile_verde', 1], ['arroz', 300], ['aceite', 20], ['comino', 1]],
    pasos: [
      'Lava las lentejas y cuécelas en agua 20 min.',
      'Sofríe tomate, cebolla, chile y ajo picados con una pizca de comino.',
      'Agrega el sofrito, la papa y la zanahoria en cubos a las lentejas; cocina 20 min.',
      'Sirve con arroz.',
    ],
  },
  {
    id: 'pechuga-plancha', nombre: 'Pechuga a la plancha con vegetales', minutos: 30, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['rapido', 'saludable'], proteina: 'pollo',
    ing: [['pechuga', 700], ['brocoli', 400], ['zanahoria', 200], ['limon', 2], ['ajo', 2], ['aceite', 20], ['arroz', 300]],
    pasos: [
      'Abre las pechugas en filetes delgados y marínalas con limón, ajo, sal y pimienta.',
      'Cocínalas en sartén caliente con poco aceite, 4 min por lado.',
      'Cuece brócoli y zanahoria al vapor 6 min.',
      'Sirve con arroz.',
    ],
  },
  {
    id: 'picadillo', nombre: 'Picadillo de carne con papa', minutos: 45, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['tradicional', 'economico'], proteina: 'res',
    ing: [['carne_molida', 450], ['papa', 500], ['zanahoria', 150], ['guisquil', 1], ['tomate', 200], ['cebolla', 100],
      ['chile_verde', 1], ['ajo', 2], ['aceite', 20], ['arroz', 300], ['tortillas', 12]],
    pasos: [
      'Dora la carne molida con cebolla, chile y ajo picados.',
      'Agrega tomate picado y cocina 5 min.',
      'Suma papa, zanahoria y güisquil en cubitos con media taza de agua; tapa 20 min.',
      'Sirve con arroz y tortillas.',
    ],
  },
  {
    id: 'tortitas-de-atun', nombre: 'Tortitas de atún', minutos: 40, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['economico'], proteina: 'pescado',
    ing: [['atun', 280], ['papa', 600], ['huevo', 2], ['cebolla', 80], ['pan_molido', 60], ['aceite', 150], ['arroz', 300],
      ['tomate', 200], ['lechuga', 1]],
    pasos: [
      'Cuece las papas y hazlas puré.',
      'Mezcla con el atún escurrido, cebolla picada, huevo y sal.',
      'Forma tortitas, pásalas por pan molido y fríelas hasta dorar.',
      'Sirve con arroz y ensalada de lechuga y tomate.',
    ],
  },
  {
    id: 'pupusas', nombre: 'Pupusas de queso y frijol con curtido', minutos: 60, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['tradicional', 'economico', 'vegetariano'], proteina: 'vegetal',
    ing: [['harina_maiz', 900], ['quesillo', 300], ['frijol', 300], ['repollo', 0.5], ['zanahoria', 100], ['tomate', 300],
      ['cebolla', 80], ['aceite', 30], ['vinagre', 1], ['oregano', 1]],
    pasos: [
      'Curtido: repollo y zanahoria rallados escaldados, con cebolla, vinagre, orégano y sal. Mejor si reposa desde antes.',
      'Salsa: licúa tomate con un poco de cebolla y cocina 10 min con sal.',
      'Haz la masa con harina, agua y sal; rellena bolitas con frijoles molidos y quesillo, y aplánalas.',
      'Cocina en comal engrasado 4 min por lado. Sirve con curtido y salsa.',
    ],
  },
  {
    id: 'panes-con-pollo', nombre: 'Panes con pollo', minutos: 75, porciones: 4,
    aparatos: ['estufa', 'licuadora'], etiquetas: ['tradicional'], proteina: 'pollo',
    ing: [['pollo_piezas', 1000], ['pan_frances', 8], ['tomate', 400], ['cebolla', 150], ['chile_verde', 1], ['ajo', 3],
      ['lechuga', 1], ['pepino', 1], ['rabano', 1], ['mayonesa', 60], ['salsa_tomate', 106]],
    pasos: [
      'Sazona el pollo y cocínalo en una olla con tomate, cebolla y chile en trozos, tapado, 40 min.',
      'Saca el pollo, licúa las verduras con la salsa de tomate y regresa todo a la olla 10 min.',
      'Abre los panes, úntales mayonesa y salsa.',
      'Rellena con pollo, lechuga, pepino y rábano; baña con más salsa.',
    ],
  },
  {
    id: 'coditos-salchicha', nombre: 'Coditos con queso y salchicha', minutos: 25, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico', 'ninos'], proteina: 'embutido',
    ing: [['coditos', 450], ['salchicha', 300], ['leche', 250], ['queso_duro', 120], ['margarina', 40], ['vegetales_mixtos', 200]],
    pasos: [
      'Cuece los coditos en agua con sal; escúrrelos.',
      'En la misma olla derrite la margarina, dora la salchicha en rodajas y los vegetales.',
      'Agrega la leche y el queso; mueve hasta que se forme una salsa.',
      'Mezcla con los coditos y sirve.',
    ],
  },
  {
    id: 'pollo-horno-papas', nombre: 'Pollo al horno con papas', minutos: 70, porciones: 4,
    aparatos: ['horno'], etiquetas: ['ninos'], proteina: 'pollo',
    ing: [['pollo_piezas', 1100], ['papa', 700], ['cebolla', 100], ['ajo', 4], ['limon', 2], ['aceite', 40], ['lechuga', 1], ['tomate', 200]],
    pasos: [
      'Marina el pollo con limón, ajo, sal, pimienta y un poco de aceite (mínimo 20 min).',
      'Pon en una bandeja con las papas en gajos y la cebolla en aros.',
      'Hornea a 200 °C por 50 min, volteando a la mitad.',
      'Sirve con ensalada de lechuga y tomate.',
    ],
  },
  {
    id: 'alitas-freidora', nombre: 'Alitas en freidora de aire con papas', minutos: 40, porciones: 4,
    aparatos: ['freidora'], etiquetas: ['ninos'], proteina: 'pollo',
    ing: [['alitas', 1000], ['papa', 700], ['ajo', 3], ['limon', 2], ['aceite', 15], ['zanahoria', 200], ['pepino', 1]],
    pasos: [
      'Sazona las alitas con ajo, limón, sal y pimienta.',
      'Cocínalas en la freidora a 200 °C por 22–25 min, volteándolas a la mitad.',
      'Corta las papas en bastones, mézclalas con el aceite y sal; 18 min a 200 °C.',
      'Sirve con bastones de zanahoria y pepino.',
    ],
  },
  {
    id: 'chuletas-cerdo', nombre: 'Chuletas de cerdo encebolladas', minutos: 30, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['rapido'], proteina: 'cerdo',
    ing: [['chuleta_cerdo', 700], ['cebolla', 150], ['ajo', 3], ['limon', 2], ['aceite', 20], ['arroz', 300], ['frijol', 300], ['aguacate', 1]],
    pasos: [
      'Sazona las chuletas con limón, ajo, sal y pimienta.',
      'Cocínalas en sartén con aceite 5–6 min por lado.',
      'En el mismo sartén cocina la cebolla en aros hasta dorar y ponla encima.',
      'Sirve con arroz, frijoles y aguacate.',
    ],
  },
  {
    id: 'hamburguesas', nombre: 'Hamburguesas caseras con papas', minutos: 40, porciones: 4,
    aparatos: ['estufa'], etiquetas: ['ninos'], proteina: 'res',
    ing: [['carne_molida', 600], ['pan_hamburguesa', 4], ['tomate', 150], ['lechuga', 1], ['cebolla', 80], ['huevo', 1],
      ['papa', 600], ['aceite', 150], ['mayonesa', 40]],
    pasos: [
      'Mezcla la carne con huevo, cebolla picadita, sal y pimienta; forma 4 tortas.',
      'Cocínalas en sartén 4 min por lado.',
      'Fríe las papas en bastones (o hazlas en freidora de aire).',
      'Arma con pan, mayonesa, lechuga, tomate y cebolla.',
    ],
  },
];

// Almuerzos que también sirven de cena (más livianos o típicos de noche) o de desayuno
const TAMBIEN = {
  'huevos-picados': ['desayuno', 'cena'],
  'tortas-de-papa': ['cena'],
  'tortas-de-guisquil': ['cena'],
  'arroz-frito': ['cena'],
  'tacos-de-pollo': ['cena'],
  'sopa-de-frijoles': ['cena'],
  'pupusas': ['cena', 'desayuno'],
  'panes-con-pollo': ['cena'],
  'coditos-salchicha': ['cena'],
  'hamburguesas': ['cena'],
  'pechuga-plancha': ['cena'],
  'tortitas-de-atun': ['cena'],
  'espagueti-bolonesa': ['cena'],
  'frijoles-con-chorizo': ['cena', 'desayuno'],
};
for (const r of ALMUERZOS) r.tiempos = ['almuerzo', ...(TAMBIEN[r.id] || [])];

export const RECETAS = [...ALMUERZOS, ...DESAYUNOS, ...CENAS, ...REFACCIONES];
