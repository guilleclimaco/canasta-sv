// Desayunos (cantidades para 4 porciones). Mismo formato que recetas.js.
// tiempos: en qué comidas puede aparecer la receta.

export const DESAYUNOS = [
  {
    id: 'desayuno-tipico', nombre: 'Desayuno típico', minutos: 25, porciones: 4, tiempos: ['desayuno'],
    aparatos: ['estufa'], etiquetas: ['tradicional'], proteina: 'huevo',
    ing: [['huevo', 8], ['frijol', 300], ['platano', 2], ['crema', 120], ['queso_duro', 100], ['tortillas', 8], ['aceite', 40], ['cafe', 40]],
    pasos: [
      'Corta el plátano maduro en tajadas y fríelo hasta dorar.',
      'Calienta o fríe los frijoles molidos.',
      'Prepara los huevos como les gusten (estrellados o revueltos).',
      'Sirve con crema, queso duro, tortillas calientes y café.',
    ],
  },
  {
    id: 'huevos-rancheros', nombre: 'Huevos rancheros', minutos: 20, porciones: 4, tiempos: ['desayuno', 'cena'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'tradicional'], proteina: 'huevo',
    ing: [['huevo', 8], ['tortillas', 8], ['tomate', 300], ['cebolla', 80], ['chile_verde', 1], ['frijol', 200], ['aceite', 30]],
    pasos: [
      'Sofríe tomate, cebolla y chile picados con sal hasta formar una salsa.',
      'Pasa las tortillas por aceite caliente unos segundos.',
      'Fríe los huevos estrellados y ponlos sobre las tortillas.',
      'Baña con la salsa y acompaña con frijoles.',
    ],
  },
  {
    id: 'casamiento-con-huevo', nombre: 'Casamiento con huevo', minutos: 20, porciones: 4, tiempos: ['desayuno', 'cena'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico', 'tradicional', 'vegetariano'], proteina: 'huevo',
    ing: [['arroz', 250], ['frijol', 300], ['cebolla', 80], ['huevo', 4], ['crema', 120], ['aceite', 20]],
    pasos: [
      'Sofríe la cebolla picada, agrega arroz cocido y frijoles enteros cocidos.',
      'Mezcla y deja que se dore un poco, ajustando la sal.',
      'Fríe un huevo por persona.',
      'Sirve el casamiento con el huevo encima y crema.',
    ],
  },
  {
    id: 'omelette-vegetales', nombre: 'Omelette de vegetales con pan', minutos: 15, porciones: 4, tiempos: ['desayuno', 'cena'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'saludable', 'vegetariano'], proteina: 'huevo',
    ing: [['huevo', 8], ['tomate', 150], ['cebolla', 80], ['chile_verde', 1], ['queso_duro', 60], ['pan_molde', 240], ['aceite', 15]],
    pasos: [
      'Pica tomate, cebolla y chile; sofríelos 2 min.',
      'Bate los huevos con sal, viértelos sobre las verduras y cocina a fuego bajo.',
      'Agrega queso rallado, dobla y cocina 1 min más.',
      'Sirve con pan tostado.',
    ],
  },
  {
    id: 'panqueques', nombre: 'Panqueques con banano', minutos: 25, porciones: 4, tiempos: ['desayuno'],
    aparatos: ['estufa'], etiquetas: ['ninos', 'dulce', 'vegetariano'], proteina: 'huevo',
    ing: [['harina_panqueque', 400], ['leche', 500], ['huevo', 2], ['margarina', 40], ['miel', 1], ['banano', 2]],
    pasos: [
      'Mezcla la harina con la leche y los huevos hasta que no queden grumos.',
      'Calienta un sartén con un poco de margarina y vierte un cucharón de mezcla.',
      'Voltea cuando salgan burbujas; cocina 1 min más.',
      'Sirve con miel y banano en rodajas.',
    ],
  },
  {
    id: 'avena-con-leche', nombre: 'Avena con leche y canela', minutos: 15, porciones: 4, tiempos: ['desayuno'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico', 'saludable', 'dulce', 'vegetariano'], proteina: 'vegetal',
    ing: [['avena', 200], ['leche', 1000], ['canela', 1], ['azucar', 1], ['banano', 2]],
    pasos: [
      'Calienta la leche con una raja de canela.',
      'Agrega la avena y cocina 5–7 min moviendo, hasta que espese.',
      'Endulza al gusto.',
      'Sirve con banano en rodajas.',
    ],
  },
  {
    id: 'cereal-con-leche', nombre: 'Cereal con leche y banano', minutos: 5, porciones: 4, tiempos: ['desayuno'],
    aparatos: [], etiquetas: ['rapido', 'ninos', 'dulce', 'vegetariano'], proteina: 'vegetal',
    ing: [['cereal', 200], ['leche', 800], ['banano', 2]],
    pasos: [
      'Sirve el cereal en tazones.',
      'Agrega la leche fría y el banano en rodajas.',
    ],
  },
  {
    id: 'yogurt-granola', nombre: 'Yogurt con granola y fruta', minutos: 5, porciones: 4, tiempos: ['desayuno', 'refaccion'],
    aparatos: [], etiquetas: ['rapido', 'saludable', 'dulce', 'vegetariano'], proteina: 'vegetal',
    ing: [['yogurt', 600], ['granola', 160], ['banano', 2], ['papaya', 300]],
    pasos: [
      'Pica la fruta en cubos.',
      'Sirve el yogurt con la granola y la fruta encima.',
    ],
  },
  {
    id: 'pan-con-frijoles', nombre: 'Pan francés con frijoles y queso', minutos: 10, porciones: 4, tiempos: ['desayuno', 'cena', 'refaccion'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico', 'tradicional', 'vegetariano'], proteina: 'vegetal',
    ing: [['pan_frances', 8], ['frijol', 300], ['queso_duro', 120], ['crema', 100], ['aceite', 15]],
    pasos: [
      'Fríe los frijoles molidos hasta que espesen.',
      'Abre los panes y tuéstalos en el comal.',
      'Unta frijoles, agrega queso rallado y un poco de crema.',
    ],
  },
  {
    id: 'sandwich-jamon-queso', nombre: 'Sándwich de jamón y queso', minutos: 10, porciones: 4, tiempos: ['desayuno', 'cena', 'refaccion'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'ninos'], proteina: 'embutido',
    ing: [['pan_molde', 320], ['jamon', 200], ['queso_amarillo', 150], ['margarina', 30], ['tomate', 100], ['lechuga', 0.5]],
    pasos: [
      'Unta margarina por fuera de las rebanadas de pan.',
      'Arma con jamón, queso, tomate y lechuga.',
      'Tuesta en sartén 2 min por lado hasta que el queso se derrita.',
    ],
  },
  {
    id: 'huevos-con-chorizo', nombre: 'Huevos con chorizo y frijoles', minutos: 15, porciones: 4, tiempos: ['desayuno'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'tradicional'], proteina: 'embutido',
    ing: [['huevo', 8], ['chorizo', 200], ['tortillas', 12], ['frijol', 250], ['aceite', 10]],
    pasos: [
      'Dora el chorizo desmenuzado en un sartén.',
      'Agrega los huevos batidos y revuelve hasta que cuajen.',
      'Calienta los frijoles y las tortillas.',
    ],
  },
  {
    id: 'huevos-con-jamon', nombre: 'Huevos revueltos con jamón y pan tostado', minutos: 12, porciones: 4, tiempos: ['desayuno'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'ninos'], proteina: 'huevo',
    ing: [['huevo', 8], ['jamon', 150], ['pan_molde', 240], ['margarina', 30]],
    pasos: [
      'Pica el jamón y dóralo con un poco de margarina.',
      'Agrega los huevos batidos con sal y revuelve a fuego bajo.',
      'Sirve con pan tostado untado con margarina.',
    ],
  },
  {
    id: 'licuado-banano', nombre: 'Licuado de banano con avena', minutos: 5, porciones: 4, tiempos: ['desayuno', 'refaccion'],
    aparatos: ['licuadora'], etiquetas: ['rapido', 'economico', 'dulce', 'ninos', 'vegetariano'], proteina: 'vegetal',
    ing: [['banano', 4], ['leche', 1000], ['avena', 60], ['azucar', 1], ['canela', 1]],
    pasos: [
      'Licúa banano, leche, avena, un poco de azúcar y canela.',
      'Sirve frío.',
    ],
  },
  {
    id: 'platano-con-crema', nombre: 'Plátano frito con frijoles y crema', minutos: 20, porciones: 4, tiempos: ['desayuno', 'cena'],
    aparatos: ['estufa'], etiquetas: ['tradicional', 'economico', 'vegetariano'], proteina: 'vegetal',
    ing: [['platano', 4], ['frijol', 300], ['crema', 150], ['queso_duro', 80], ['aceite', 60]],
    pasos: [
      'Corta los plátanos maduros en tajadas a lo largo y fríelos hasta dorar.',
      'Fríe los frijoles molidos.',
      'Sirve con crema y queso duro rallado.',
    ],
  },
  {
    id: 'quesadillas-tortilla', nombre: 'Tortillas con quesillo y frijoles', minutos: 15, porciones: 4, tiempos: ['desayuno', 'cena', 'refaccion'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico', 'ninos', 'vegetariano'], proteina: 'vegetal',
    ing: [['tortillas', 12], ['quesillo', 250], ['frijol', 200]],
    pasos: [
      'Pon quesillo en media tortilla y dóblala.',
      'Calienta en el comal hasta que el queso se derrita.',
      'Sirve con frijoles.',
    ],
  },
];
