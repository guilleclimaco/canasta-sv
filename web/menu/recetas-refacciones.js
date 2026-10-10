// Refacciones / boquitas para los breaks (cantidades para 4 porciones).
// Etiqueta 'dulce' o (sin ella) salado: el planificador alterna para no repetir el mismo antojo.

export const REFACCIONES = [
  {
    id: 'fruta-con-limon', nombre: 'Mango y pepino con limón y alguashte', minutos: 5, porciones: 4, tiempos: ['refaccion'],
    aparatos: [], etiquetas: ['rapido', 'saludable', 'economico', 'tradicional', 'vegetariano'], proteina: 'vegetal',
    ing: [['mango', 2], ['pepino', 1], ['limon', 2], ['alguashte', 1], ['sal', 1]],
    pasos: ['Pela y corta el mango y el pepino en tiras.', 'Agrega limón, sal y alguashte al gusto.'],
  },
  {
    id: 'banano-refaccion', nombre: 'Banano', minutos: 1, porciones: 4, tiempos: ['refaccion'],
    aparatos: [], etiquetas: ['rapido', 'saludable', 'economico', 'dulce', 'ninos', 'vegetariano'], proteina: 'vegetal',
    ing: [['banano', 4]],
    pasos: ['Uno por persona. Fácil de llevar en la mochila o la lonchera.', 'Si están muy maduros, úsalos en licuado.'],
  },
  {
    id: 'manzana-refaccion', nombre: 'Manzana', minutos: 1, porciones: 4, tiempos: ['refaccion'],
    aparatos: [], etiquetas: ['rapido', 'saludable', 'dulce', 'ninos', 'vegetariano'], proteina: 'vegetal',
    ing: [['manzana', 4]],
    pasos: ['Lávalas bien.', 'Una por persona; se puede cortar en gajos con un poco de limón para que no se oscurezca.'],
  },
  {
    id: 'naranjas', nombre: 'Naranjas peladas', minutos: 5, porciones: 4, tiempos: ['refaccion'],
    aparatos: [], etiquetas: ['rapido', 'saludable', 'economico', 'dulce', 'vegetariano'], proteina: 'vegetal',
    ing: [['naranja', 6], ['sal', 1]],
    pasos: ['Pela las naranjas y pártelas a la mitad.', 'Al gusto con una pizca de sal o alguashte.'],
  },
  {
    id: 'papaya-picada', nombre: 'Papaya picada con limón', minutos: 5, porciones: 4, tiempos: ['refaccion'],
    aparatos: [], etiquetas: ['rapido', 'saludable', 'economico', 'dulce', 'vegetariano'], proteina: 'vegetal',
    ing: [['papaya', 800], ['limon', 1]],
    pasos: ['Pela y corta la papaya en cubos.', 'Exprime limón encima y sirve frío.'],
  },
  {
    id: 'galletas-con-cafe', nombre: 'Galletas con café', minutos: 5, porciones: 4, tiempos: ['refaccion'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'dulce', 'vegetariano'], proteina: 'vegetal',
    ing: [['galletas', 200], ['cafe', 30], ['leche', 200], ['azucar', 1]],
    pasos: ['Prepara el café a tu gusto.', 'Sirve con las galletas.'],
  },
  {
    id: 'pan-dulce-cafe', nombre: 'Pan dulce con café', minutos: 5, porciones: 4, tiempos: ['refaccion', 'desayuno'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'tradicional', 'dulce', 'vegetariano'], proteina: 'vegetal',
    ing: [['pan_dulce', 4], ['cafe', 30], ['leche', 200], ['azucar', 1]],
    pasos: ['Prepara el café.', 'Sirve con una semita o pan dulce por persona.'],
  },
  {
    id: 'mani', nombre: 'Maní salado', minutos: 1, porciones: 4, tiempos: ['refaccion'],
    aparatos: [], etiquetas: ['rapido', 'saludable', 'vegetariano'], proteina: 'vegetal',
    ing: [['mani', 200]],
    pasos: ['Reparte en bolsitas de 50 g para llevar.', 'Mejor sin cobertura para que sea más sano.'],
  },
  {
    id: 'palomitas', nombre: 'Palomitas caseras', minutos: 10, porciones: 4, tiempos: ['refaccion'],
    aparatos: ['estufa'], etiquetas: ['rapido', 'economico', 'ninos', 'vegetariano'], proteina: 'vegetal',
    ing: [['palomitas', 150], ['aceite', 20], ['margarina', 20]],
    pasos: ['Calienta el aceite en una olla tapada con 3 granos; cuando revienten agrega el resto.',
      'Mueve la olla hasta que dejen de reventar.', 'Agrega margarina derretida y sal.'],
  },
  {
    id: 'elote-cocido', nombre: 'Elote cocido con limón', minutos: 30, porciones: 4, tiempos: ['refaccion'],
    aparatos: ['estufa'], etiquetas: ['tradicional', 'economico', 'vegetariano'], proteina: 'vegetal',
    ing: [['elote', 4], ['limon', 2], ['margarina', 30], ['sal', 1]],
    pasos: ['Cuece los elotes en agua con sal 25 min.', 'Sirve con margarina, limón y sal.'],
  },
  {
    id: 'platanitos', nombre: 'Platanitos fritos', minutos: 20, porciones: 4, tiempos: ['refaccion'],
    aparatos: ['estufa'], etiquetas: ['tradicional', 'economico', 'vegetariano'], proteina: 'vegetal',
    ing: [['platano', 3], ['aceite', 200], ['limon', 1], ['sal', 1]],
    pasos: ['Pela el plátano verde y córtalo en rodajas muy finas.', 'Fríe en tandas hasta que estén crujientes.',
      'Escurre y agrega sal y limón.'],
  },
  {
    id: 'atol-de-elote', nombre: 'Atol de elote', minutos: 35, porciones: 4, tiempos: ['refaccion', 'cena'],
    aparatos: ['estufa', 'licuadora'], etiquetas: ['tradicional', 'dulce', 'vegetariano'], proteina: 'vegetal',
    ing: [['elote', 6], ['leche', 500], ['azucar', 1], ['canela', 1]],
    pasos: ['Desgrana los elotes y licúa los granos con 2 tazas de agua.', 'Cuela y cocina con la leche, azúcar y canela moviendo sin parar.',
      'Cuando espese (20 min) está listo.'],
  },
  {
    id: 'empanadas-platano', nombre: 'Empanadas de plátano', minutos: 50, porciones: 4, tiempos: ['refaccion'],
    aparatos: ['estufa'], etiquetas: ['tradicional', 'dulce', 'vegetariano'], proteina: 'vegetal',
    ing: [['platano', 4], ['leche', 400], ['maicena', 1], ['azucar', 1], ['canela', 1], ['aceite', 200]],
    pasos: ['Cuece los plátanos maduros y hazlos puré.', 'Prepara un poleado: leche con maicena, azúcar y canela hasta espesar.',
      'Forma tortitas de plátano, rellena con poleado, cierra y fríe hasta dorar. Espolvorea azúcar.'],
  },
  {
    id: 'quesadilla-salvadorena', nombre: 'Quesadilla salvadoreña', minutos: 60, porciones: 8, tiempos: ['refaccion', 'desayuno'],
    aparatos: ['horno'], etiquetas: ['tradicional', 'dulce', 'vegetariano'], proteina: 'vegetal',
    ing: [['harina_arroz', 450], ['queso_duro', 200], ['crema', 240], ['huevo', 3], ['margarina', 115], ['azucar', 1]],
    pasos: ['Bate la margarina con el azúcar; agrega los huevos uno a uno.', 'Suma el queso rallado y la crema, luego la harina de arroz con 1 cdta de polvo de hornear.',
      'Hornea en molde engrasado a 180 °C por 40 min. Rinde 8 porciones.'],
  },
  {
    id: 'gelatina', nombre: 'Gelatina', minutos: 10, porciones: 4, tiempos: ['refaccion'],
    aparatos: ['estufa'], etiquetas: ['economico', 'dulce', 'ninos'], proteina: 'vegetal',
    ing: [['gelatina', 85]],
    pasos: ['Disuelve la gelatina en 1 taza de agua hirviendo.', 'Agrega 1 taza de agua fría, sirve en vasitos y refrigera 3 horas.'],
  },
];
