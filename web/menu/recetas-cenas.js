// Cenas (cantidades para 4 porciones). Además, varios almuerzos y desayunos sirven de cena
// (ver `tiempos` en cada receta).

export const CENAS = [
  {
    id: 'enchiladas', nombre: 'Enchiladas salvadoreñas', minutos: 40, porciones: 4, tiempos: ['cena', 'refaccion'],
    aparatos: ['estufa'], etiquetas: ['tradicional'], proteina: 'res',
    ing: [['tostadas', 12], ['carne_molida', 300], ['papa', 200], ['repollo', 0.5], ['zanahoria', 100], ['huevo', 4],
      ['queso_duro', 80], ['tomate', 300], ['cebolla', 80], ['vinagre', 1]],
    pasos: [
      'Cocina la carne molida con papa en cubitos, cebolla y sal.',
      'Prepara curtido con repollo y zanahoria rallados, vinagre y sal; cuece los huevos y córtalos en rodajas.',
      'Haz una salsa de tomate licuado y cocido.',
      'Sobre cada tostada pon carne, curtido, salsa, huevo y queso duro rallado.',
    ],
  },
  {
    id: 'pastelitos', nombre: 'Pastelitos de carne', minutos: 60, porciones: 4, tiempos: ['cena', 'refaccion'],
    aparatos: ['estufa'], etiquetas: ['tradicional'], proteina: 'res',
    ing: [['harina_maiz', 500], ['carne_molida', 300], ['papa', 300], ['zanahoria', 100], ['repollo', 0.5], ['aceite', 300],
      ['achiote', 1], ['tomate', 200], ['vinagre', 1]],
    pasos: [
      'Haz la masa con harina de maíz, agua, sal y achiote para darle color.',
      'Cocina el relleno: carne molida con papa y zanahoria en cubitos pequeños.',
      'Aplana bolitas de masa, rellena, dobla en media luna y sella las orillas.',
      'Fríe en aceite caliente hasta dorar. Sirve con curtido y salsa de tomate.',
    ],
  },
  {
    id: 'sopa-de-pollo', nombre: 'Sopa de pollo con fideos', minutos: 60, porciones: 4, tiempos: ['cena', 'almuerzo'],
    aparatos: ['estufa'], etiquetas: ['tradicional'], proteina: 'pollo',
    ing: [['pollo_piezas', 900], ['fideos', 200], ['papa', 300], ['zanahoria', 200], ['guisquil', 1], ['cilantro', 1],
      ['cebolla', 100], ['tomate', 150], ['ajo', 2], ['limon', 2], ['tortillas', 8]],
    pasos: [
      'Hierve el pollo en 2.5 litros de agua con sal, cebolla, tomate y ajo 30 min.',
      'Agrega papa, zanahoria y güisquil en trozos; cocina 15 min.',
      'Suma los fideos y el cilantro; cocina 5 min más.',
      'Sirve con limón y tortillas.',
    ],
  },
  {
    id: 'sopa-de-fideos', nombre: 'Sopa de fideos con tomate', minutos: 20, porciones: 4, tiempos: ['cena'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico'], proteina: 'vegetal',
    ing: [['fideos', 250], ['tomate', 300], ['cebolla', 80], ['consome', 1], ['aceite', 20], ['queso_duro', 60], ['ajo', 1]],
    pasos: [
      'Dora los fideos en el aceite hasta que tomen color.',
      'Licúa tomate, cebolla y ajo; agrégalo a los fideos y sofríe 2 min.',
      'Añade 1.5 litros de agua con consomé y cocina 8 min.',
      'Sirve con queso duro rallado.',
    ],
  },
  {
    id: 'crema-de-verduras', nombre: 'Crema de verduras con pan', minutos: 35, porciones: 4, tiempos: ['cena'],
    aparatos: ['estufa', 'licuadora'], etiquetas: ['saludable', 'vegetariano'], proteina: 'vegetal',
    ing: [['papa', 400], ['zanahoria', 200], ['guisquil', 1], ['brocoli', 300], ['cebolla', 80], ['leche', 300],
      ['margarina', 30], ['pan_frances', 4]],
    pasos: [
      'Cuece papa, zanahoria, güisquil, brócoli y cebolla en 1 litro de agua con sal, 20 min.',
      'Licúa todo con la leche hasta que quede cremoso.',
      'Regresa a la olla con la margarina y calienta 5 min.',
      'Sirve con pan tostado.',
    ],
  },
  {
    id: 'ensalada-de-pollo', nombre: 'Ensalada de pollo', minutos: 25, porciones: 4, tiempos: ['cena', 'almuerzo'],
    aparatos: ['estufa'], etiquetas: ['saludable', 'rapido'], proteina: 'pollo',
    ing: [['pechuga', 500], ['lechuga', 1], ['tomate', 200], ['pepino', 1], ['aguacate', 1], ['limon', 2], ['tostadas', 8]],
    pasos: [
      'Cuece la pechuga con sal 20 min y desmenúzala.',
      'Pica lechuga, tomate, pepino y aguacate.',
      'Mezcla con el pollo, limón, sal y pimienta.',
      'Sirve con tostadas.',
    ],
  },
  {
    id: 'tostadas-de-frijol', nombre: 'Tostadas de frijol con curtido', minutos: 15, porciones: 4, tiempos: ['cena', 'refaccion'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico', 'tradicional', 'vegetariano'], proteina: 'vegetal',
    ing: [['tostadas', 12], ['frijol', 400], ['repollo', 0.5], ['queso_duro', 100], ['tomate', 200], ['crema', 100], ['vinagre', 1]],
    pasos: [
      'Fríe los frijoles molidos hasta que espesen.',
      'Prepara curtido con repollo picado, vinagre y sal; pica el tomate.',
      'Unta las tostadas con frijoles y pon curtido, tomate, crema y queso.',
    ],
  },
  {
    id: 'yuca-con-chicharron', nombre: 'Yuca frita con chicharrón', minutos: 50, porciones: 4, tiempos: ['cena', 'refaccion'],
    aparatos: ['estufa'], etiquetas: ['tradicional'], proteina: 'cerdo',
    ing: [['yuca', 900], ['chicharron', 300], ['repollo', 0.5], ['zanahoria', 100], ['tomate', 200], ['aceite', 300], ['vinagre', 1]],
    pasos: [
      'Cuece la yuca pelada en agua con sal hasta que esté suave; escúrrela.',
      'Fríela en trozos hasta dorar.',
      'Prepara curtido y una salsa de tomate.',
      'Sirve la yuca con chicharrón, curtido y salsa.',
    ],
  },
  {
    id: 'tortilla-de-papa', nombre: 'Tortilla de papa', minutos: 35, porciones: 4, tiempos: ['cena', 'almuerzo'],
    aparatos: ['estufa'], etiquetas: ['economico', 'vegetariano'], proteina: 'huevo',
    ing: [['papa', 600], ['huevo', 6], ['cebolla', 150], ['aceite', 150], ['pan_frances', 4]],
    pasos: [
      'Corta la papa en láminas finas y la cebolla en tiras; cocínalas en el aceite a fuego bajo 15 min.',
      'Escúrrelas y mézclalas con los huevos batidos y sal.',
      'Cuaja en un sartén a fuego bajo 5 min, voltea con un plato y cocina 3 min más.',
      'Sirve en porciones con pan.',
    ],
  },
  {
    id: 'chilaquilas', nombre: 'Chilaquilas', minutos: 40, porciones: 4, tiempos: ['cena', 'almuerzo'],
    aparatos: ['estufa'], etiquetas: ['tradicional', 'vegetariano'], proteina: 'huevo',
    ing: [['tortillas', 12], ['quesillo', 200], ['huevo', 4], ['tomate', 300], ['cebolla', 80], ['aceite', 150], ['harina_trigo', 1]],
    pasos: [
      'Pon quesillo entre dos tortillas como si fuera un sándwich.',
      'Pásalas por harina y luego por huevo batido a punto de nieve.',
      'Fríelas hasta dorar.',
      'Sirve en salsa de tomate y cebolla.',
    ],
  },
];
