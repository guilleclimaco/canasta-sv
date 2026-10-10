import test from 'node:test';
import assert from 'node:assert/strict';
import { INGREDIENTES, terminosDeIngredientes } from '../web/menu/ingredientes.js';
import { RECETAS } from '../web/menu/recetas.js';
import {
  productoValido, preciosIngredientes, planificar, calcularCompras, costoReceta, cantidadTexto, PERFIL_INICIAL,
  normalizarPerfil, slotsDe, presupuestoSugerido, recetasPosibles, claveSlot, PRESETS, adaptarReceta, costoCaja, porPeso,
} from '../web/menu/planificador.js';

const prod = (over) => ({ id: Math.random(), tienda: 'maxi', precio_lista: null, ...over, busqueda: (over.nombre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') });
const precios = preciosIngredientes([], []);
const receta = (id) => RECETAS.find((r) => r.id === id);
const LV = ['lun', 'mar', 'mie', 'jue', 'vie'];
const SEMANA = [...LV, 'sab', 'dom'];
const TODO = { desayuno: { dias: SEMANA }, refaccion_am: { dias: LV }, almuerzo: { dias: SEMANA }, refaccion_pm: { dias: LV }, cena: { dias: SEMANA } };

test('recetario: ingredientes existentes, pasos, tiempos válidos e ids únicos', () => {
  const tiempos = new Set(['desayuno', 'refaccion', 'almuerzo', 'cena']);
  for (const r of RECETAS) {
    for (const [id, cant] of r.ing) {
      assert.ok(INGREDIENTES[id], `${r.id}: ingrediente desconocido ${id}`);
      assert.ok(cant > 0, `${r.id}: cantidad inválida para ${id}`);
    }
    assert.ok(r.pasos.length >= 2, `${r.id}: faltan pasos`);
    assert.ok(r.minutos > 0 && r.porciones > 0);
    assert.ok(r.tiempos?.length && r.tiempos.every((t) => tiempos.has(t)), `${r.id}: tiempos inválidos`);
  }
  assert.equal(new Set(RECETAS.map((r) => r.id)).size, RECETAS.length, 'ids repetidos');
  const cuenta = (t) => RECETAS.filter((r) => r.tiempos.includes(t)).length;
  assert.ok(cuenta('desayuno') >= 15 && cuenta('almuerzo') >= 25 && cuenta('cena') >= 20 && cuenta('refaccion') >= 15);
});

test('cada ingrediente cotizable tiene términos, unidad y precio de referencia', () => {
  for (const [id, i] of Object.entries(INGREDIENTES)) {
    if (i.basico) continue;
    assert.ok(i.terminos?.length, id);
    assert.ok(['g', 'ml', 'und'].includes(i.unidad), id);
    assert.ok(i.ref > 0, id);
  }
  assert.ok(terminosDeIngredientes().includes('pechuga pollo'));
  assert.ok(terminosDeIngredientes().includes('avena'));
});

test('productoValido: nombres reales que se colaban (oct 2026)', () => {
  const no = (ing, nombre, unidad = 'g') => assert.ok(!productoValido(ing, prod({ nombre, unidad, contenido: 300, precio: 2 })), `${ing} ✗ ${nombre}`);
  const si = (ing, nombre, unidad = 'g') => assert.ok(productoValido(ing, prod({ nombre, unidad, contenido: 300, precio: 2 })), `${ing} ✓ ${nombre}`);
  // no son comida
  no('cafe', 'Palmolive Jabon Cafe Y Almendr 3pk 300gr');
  no('avena', 'Lavaplatos Klinpiax avena - 1 kg');
  no('limon', 'Exprimidor Mainstays de Limón Color Amarillo - Unidad', 'und');
  no('crema', 'Crema Pert Olivo y Aguacate 300 ml', 'ml');
  no('naranja', 'Papel Higiénico Rosal Naranja Doble Hoja - 40 Rollos', 'und');
  no('mango', 'Rasuradoras Desechables Equate 2 Hojas Mango Reforzado', 'und');
  no('pollo_piezas', 'Alimento Gatito Alimiau Pollo 1000g');
  no('pepino', 'Toallitas Húmedas Parent´s Choice Pepino y Vitamina E 3 pack - 300 Uds', 'und');
  no('zanahoria', 'Batlle Zanahoria Chantenay Sobre 10.0 g');
  // palabra completa, no pedazo
  no('pan_dulce', 'Dulce De Panela Granulado - 1 Unidad', 'und');
  no('papa', 'Arroz Precocido Papadan 454 Gr');
  // empieza con otro alimento
  no('chorizo', 'Frijoles Campofresco con chorizo - 340 g');
  no('pechuga', 'Salchicha De Pechuga De Pollo Sello De Oro 454 g');
  no('papaya', 'Yogurt Líquido Yes Vitalite Papaya 212 g');
  no('brocoli', 'Crema Maggi De Brocoli Sobre - 65 g');
  // y lo que sí es
  si('avena', 'Avena Great Value En Hojuelas - 300 g');
  si('cafe', 'Café Coex Tostado Molido Bolsa 400 g');
  si('limon', 'Limón Pérsico Hortifruti - 10 unidades', 'und');
  si('espagueti', 'Pasta Larga Ina Espagueti 3 Pack 600g');
  si('harina_panqueque', 'Mezcla Great Value Para Pancakes Original - 907 g');
  si('fideos', 'Pasta Ina cabello de ángel - 150 g');
  si('chorizo', 'Chorizo Criollo Precocido 340 g');
  si('papa', 'Papa Americana - 2 a 4 Unidades Aproximadamente, precio Indicado Por Libra (454 g)');
  si('leche', 'Leche Entera Sula Uht Elecster - 946 ml', 'ml');
  // empieza con otro alimento del catálogo (aunque traiga un número o "pack" adelante)
  no('margarina', 'Palomitas Great Value De Maíz Extra Mantequilla - 85 g');
  no('crema', '6 Pack Kikitos Pan Sinai Sabor Crema Dulce 324 g');
  si('margarina', 'Mantequilla Dos Pinos Sin Sal 454 g');
  si('pechuga', 'Filete De Pechuga Pollo Indio Deshuesada - Precio Indicado Por Libra (454 g)');
  // la crema se vende en gramos aunque la receta la mida en ml
  si('crema', 'Crema Pasteurizada Salud 25 grasa - 750 g');
});

test('productoValido descarta productos que no son el ingrediente', () => {
  assert.ok(productoValido('pechuga', prod({ nombre: 'Pechuga de Pollo Deshuesada 1 lb', unidad: 'g', contenido: 453.59, precio: 2.7 })));
  assert.ok(!productoValido('pechuga', prod({ nombre: 'Pechuga de pollo empanizada 500 g', unidad: 'g', contenido: 500, precio: 4 })));
  assert.ok(!productoValido('pollo_piezas', prod({ nombre: 'Sopa Maggi sabor a pollo 60 g', unidad: 'g', contenido: 60, precio: 0.5 })));
  assert.ok(productoValido('pollo_piezas', prod({ nombre: 'Pierna con muslo de pollo 2 lb', unidad: 'g', contenido: 907, precio: 3.6 })));
  assert.ok(!productoValido('papa', prod({ nombre: 'Papaya Tainung por libra', unidad: 'g', contenido: 453.59, precio: 0.8 })));
  assert.ok(productoValido('papaya', prod({ nombre: 'Papaya Tainung por libra', unidad: 'g', contenido: 453.59, precio: 0.8 })));
  assert.ok(!productoValido('limon', prod({ nombre: 'Lavaplatos Axion Limon 1 und', unidad: 'und', contenido: 1, precio: 1.2 })));
  assert.ok(productoValido('limon', prod({ nombre: 'Limon Persa por unidad', unidad: 'und', contenido: 1, precio: 0.1 })));
  assert.ok(!productoValido('crema', prod({ nombre: 'Leche Semidescremada Dos Pinos 1 L', unidad: 'ml', contenido: 1000, precio: 1.9 })), 'semidescremada no es crema');
  assert.ok(productoValido('crema', prod({ nombre: 'Crema Salud 473 ml', unidad: 'ml', contenido: 473, precio: 2 })));
  assert.ok(!productoValido('avena', prod({ nombre: 'Jabon de avena 120 g', unidad: 'g', contenido: 120, precio: 1 })));
  assert.ok(!productoValido('cafe', prod({ nombre: 'Cafe instantaneo Nescafe 200 g', unidad: 'g', contenido: 200, precio: 6 })));
  assert.ok(productoValido('cafe', prod({ nombre: 'Cafe molido Listo 400 g', unidad: 'g', contenido: 400, precio: 5 })));
  assert.ok(!productoValido('arroz', prod({ nombre: 'Arroz Omoa 1814 g', unidad: 'ml', contenido: 1814, precio: 2.5 })), 'unidad distinta');
});

test('preciosIngredientes usa el más barato por gramo y cae a la referencia', () => {
  const cands = [
    prod({ termino: 'arroz', nombre: 'Arroz Omoa Blanco 1814 g', unidad: 'g', contenido: 1814, precio: 2.6 }),
    prod({ termino: 'arroz', nombre: 'Arroz San Francisco Blanco 907 g', unidad: 'g', contenido: 907, precio: 1.2, tienda: 'walmart' }),
    prod({ termino: 'arroz', nombre: 'Arroz con leche 200 g', unidad: 'g', contenido: 200, precio: 0.9 }),
  ];
  const p = preciosIngredientes(cands, ['maxi', 'walmart']);
  assert.equal(p.arroz.estimado, false);
  assert.match(p.arroz.producto.nombre, /San Francisco/);
  assert.equal(p.tilapia.estimado, true);
  assert.match(preciosIngredientes(cands, ['maxi']).arroz.producto.nombre, /Omoa/);
});

test('perfil viejo (solo almuerzos con dias) se convierte', () => {
  const p = normalizarPerfil({ adultos: 3, dias: ['lun', 'mie'] });
  assert.deepEqual(Object.keys(p.comidas), ['almuerzo']);
  assert.deepEqual(p.comidas.almuerzo.dias, ['lun', 'mie']);
  assert.equal(slotsDe(p).length, 2);
});

test('slots: cualquier combinación de comidas y días, con personas por comida', () => {
  const perfil = { adultos: 2, comidas: { desayuno: { dias: ['sab', 'dom'] }, almuerzo: { dias: LV, porciones: 1 }, refaccion_pm: { dias: ['lun'] } } };
  const s = slotsDe(perfil);
  assert.equal(s.length, 8);
  assert.deepEqual(s.slice(0, 2).map((x) => x.comida), ['almuerzo', 'refaccion_pm']); // lunes en orden del día
  assert.equal(s.find((x) => x.comida === 'almuerzo').porciones, 1);
  assert.equal(s.find((x) => x.comida === 'desayuno').porciones, 2);
  assert.equal(s.at(-1).dia, 'dom');
  const sug = presupuestoSugerido(perfil);
  assert.ok(sug.min > 0 && sug.max > sug.min);
  for (const [, , comidas] of PRESETS) assert.ok(slotsDe({ adultos: 1, comidas: Object.fromEntries(Object.entries(comidas).map(([k, d]) => [k, { dias: d }])) }).length > 0);
});

test('menú de día completo: cada receta en su comida, sin repetir almuerzos/cenas', () => {
  const perfil = { ...PERFIL_INICIAL, comidas: TODO, presupuesto: 0, estilos: [] };
  const plan = planificar({ perfil, precios, semilla: 11 });
  assert.equal(plan.slots.length, 7 + 5 + 7 + 5 + 7);
  const tiempoDe = { desayuno: 'desayuno', refaccion_am: 'refaccion', almuerzo: 'almuerzo', refaccion_pm: 'refaccion', cena: 'cena' };
  for (const s of plan.slots) assert.ok(receta(s.recetaId).tiempos.includes(tiempoDe[s.comida]), `${s.recetaId} no es de ${s.comida}`);
  const principales = plan.slots.filter((s) => s.comida === 'almuerzo' || s.comida === 'cena').map((s) => s.recetaId);
  assert.equal(new Set(principales).size, principales.length, 'repitió almuerzo/cena');
  const desayunos = plan.slots.filter((s) => s.comida === 'desayuno').map((s) => s.recetaId);
  for (const id of new Set(desayunos)) assert.ok(desayunos.filter((x) => x === id).length <= 2, `desayuno ${id} más de 2 veces`);
  for (const d of SEMANA) {
    const alm = receta(plan.slots.find((s) => s.dia === d && s.comida === 'almuerzo').recetaId);
    const cen = receta(plan.slots.find((s) => s.dia === d && s.comida === 'cena').recetaId);
    assert.notEqual(alm.id, cen.id);
  }
  assert.ok(plan.total > 0 && plan.porComida.desayuno > 0 && plan.porComida.refaccion_am > 0);
});

test('respeta "no me gusta", aparatos y vegetariano en todas las comidas', () => {
  const perfil = { ...PERFIL_INICIAL, comidas: TODO, evitar: ['res', 'embutido'], aparatos: ['estufa'], presupuesto: 0 };
  const plan = planificar({ perfil, precios, semilla: 5 });
  for (const s of plan.slots) {
    const r = receta(s.recetaId);
    assert.ok(!['res', 'embutido'].includes(r.proteina), `${r.id}`);
    assert.ok(!r.aparatos.includes('horno') && !r.aparatos.includes('freidora'), `${r.id}`);
  }
  const veg = planificar({ perfil: { ...perfil, evitar: [], estilos: ['vegetariano'] }, precios, semilla: 2 });
  assert.ok(!veg.error, veg.error);
  for (const s of veg.slots) {
    const r = receta(s.recetaId);
    assert.ok(r.etiquetas.includes('vegetariano') || r.proteina === 'vegetal', r.id);
  }
});

test('el presupuesto baja el costo y la despensa también', () => {
  const base = { ...PERFIL_INICIAL, comidas: { desayuno: { dias: LV }, almuerzo: { dias: LV } }, presupuesto: 0, estilos: [] };
  const libre = planificar({ perfil: base, precios, semilla: 3 });
  const apretado = planificar({ perfil: { ...base, presupuesto: 15 }, precios, semilla: 3 });
  assert.ok(apretado.total <= libre.total, `${apretado.total} > ${libre.total}`);
  const conDespensa = planificar({ perfil: base, precios, semilla: 3, despensa: new Set(['arroz', 'frijol', 'aceite', 'tomate', 'cebolla', 'huevo']) });
  assert.ok(conDespensa.total < libre.total);
  assert.ok(!conDespensa.compras.some((c) => c.ingId === 'arroz'));
});

test('fijos y excluir por comida', () => {
  const perfil = { ...PERFIL_INICIAL, comidas: { desayuno: { dias: LV }, almuerzo: { dias: LV } }, presupuesto: 0 };
  const a = planificar({ perfil, precios, semilla: 1 });
  const cambiar = claveSlot('mie', 'almuerzo');
  const fijos = Object.fromEntries(a.slots.map((s) => [claveSlot(s.dia, s.comida), s.recetaId]).filter(([k]) => k !== cambiar));
  const actual = a.slots.find((s) => claveSlot(s.dia, s.comida) === cambiar).recetaId;
  const b = planificar({ perfil, precios, semilla: 2, fijos, excluir: [actual] });
  for (const [k, id] of Object.entries(fijos)) assert.equal(b.slots.find((s) => claveSlot(s.dia, s.comida) === k).recetaId, id);
  assert.notEqual(b.slots.find((s) => claveSlot(s.dia, s.comida) === cambiar).recetaId, actual);
});

test('sin comidas elegidas da un error claro', () => {
  const plan = planificar({ perfil: { ...PERFIL_INICIAL, comidas: {} }, precios });
  assert.match(plan.error, /al menos una comida/);
});

test('recetasPosibles filtra por tiempo de comida', () => {
  const ref = recetasPosibles(PERFIL_INICIAL, 'refaccion');
  assert.ok(ref.length >= 10 && ref.every((r) => r.tiempos.includes('refaccion')));
});

test('compras redondea a paquetes reales', () => {
  const arroz = { precioUnit: 2.6 / 1814, producto: { nombre: 'Arroz Omoa 1814 g', contenido: 1814, precio: 2.6 }, estimado: false };
  const r = { porciones: 4, ing: [['arroz', 1500]] };
  let c = calcularCompras([{ receta: r, porciones: 4 }], { arroz });
  assert.equal(c[0].paquetes, 1);
  assert.equal(c[0].costo, 2.6);
  c = calcularCompras([{ receta: r, porciones: 4 }, { receta: r, porciones: 4 }], { arroz });
  assert.equal(c[0].paquetes, 2);
});

test('compras elige la presentación más barata en total, no por unidad', () => {
  const carton30 = { nombre: 'Huevos 30 und', contenido: 30, precio: 5.25, tienda: 'maxi' };
  const carton12 = { nombre: 'Huevos 12 und', contenido: 12, precio: 2.4, tienda: 'walmart' };
  const huevo = { precioUnit: 5.25 / 30, producto: carton30, alternativas: [carton30, carton12], estimado: false };
  const [c] = calcularCompras([{ receta: { porciones: 4, ing: [['huevo', 6]] }, porciones: 4 }], { huevo });
  assert.equal(c.producto.nombre, 'Huevos 12 und');
  assert.equal(c.costo, 2.4);
  const [c2] = calcularCompras([{ receta: { porciones: 4, ing: [['huevo', 28]] }, porciones: 4 }], { huevo });
  assert.equal(c2.producto.nombre, 'Huevos 30 und');
});

test('costo por porción razonable en cada tipo de comida', () => {
  for (const r of RECETAS) {
    const c = costoReceta(r, 4, precios);
    // hay platos caros a propósito (lomito, camarón, mariscos); arriba de $8 por porción sería un error de cantidades
    assert.ok(c.porPorcion > 0.05 && c.porPorcion < 8, `${r.id}: $${c.porPorcion}/porción`);
  }
  assert.equal(cantidadTexto(453.59, 'g'), '450 g (1 lb)');
  assert.equal(cantidadTexto(1814, 'g'), '1.8 kg (4 lb)');
  assert.equal(cantidadTexto(250, 'ml'), '250 ml');
  assert.equal(cantidadTexto(1.5, 'und'), '1½');
});

test('presupuesto como rango: más presupuesto no da un menú más barato, y respeta el máximo', () => {
  const comidas = { almuerzo: { dias: LV } };
  const sug = presupuestoSugerido({ adultos: 2, comidas });
  const bajo = planificar({ perfil: { adultos: 2, comidas, presupuestoMin: sug.min, presupuestoMax: sug.max }, precios, semilla: 4 });
  const alto = planificar({ perfil: { adultos: 2, comidas, presupuestoMin: sug.max, presupuestoMax: sug.max * 2 }, precios, semilla: 4 });
  assert.ok(alto.total >= bajo.total, `${alto.total} < ${bajo.total}`);
  assert.ok(bajo.total <= sug.max + 0.01, `se pasó del máximo: ${bajo.total} > ${sug.max}`);
  assert.deepEqual([alto.presupuesto.min, alto.presupuesto.max], [sug.max, sug.max * 2]);
});

test('prefiere platos conocidos: casi sin platos raros con presupuesto normal', () => {
  const plan = planificar({ perfil: { adultos: 2, comidas: TODO }, precios, semilla: 9 });
  const raras = plan.slots.filter((s) => receta(s.recetaId).popularidad <= 2);
  assert.ok(raras.length <= 2, `platos raros: ${raras.map((s) => s.recetaId).join(', ')}`);
  const almuerzos = plan.slots.filter((s) => s.comida === 'almuerzo').map((s) => receta(s.recetaId).proteina);
  const maxMisma = Math.max(...Object.values(almuerzos.reduce((m, p) => ({ ...m, [p]: (m[p] || 0) + 1 }), {})));
  assert.ok(maxMisma <= 3, `misma proteína ${maxMisma} veces en 7 almuerzos`);
});

test('filtros: sin frituras, solo conocidos, tiempo máximo entre semana y proteínas evitadas', () => {
  const base = { adultos: 2, comidas: TODO };
  const plan = planificar({ perfil: { ...base, sinFritos: true, soloConocidos: true, tiempoMax: 45, evitar: ['cerdo'] }, precios, semilla: 5 });
  assert.ok(!plan.error, plan.error);
  for (const s of plan.slots) {
    const r = receta(s.recetaId);
    assert.ok(!r.etiquetas.includes('frito'), `${r.id} es frito`);
    assert.ok(r.popularidad >= 4, `${r.id} no es conocido`);
    assert.notEqual(r.proteina, 'cerdo', `${r.id} lleva cerdo`);
    if (!['sab', 'dom'].includes(s.dia)) assert.ok(r.minutos <= 45, `${r.id} tarda ${r.minutos} min entre semana`);
  }
  assert.ok(recetasPosibles({ ...base, tiempoMax: 30 }, 'almuerzo', undefined, 'sab').some((r) => r.minutos > 30), 'el fin de semana no aplica el tiempo máximo');
});

test('perfil viejo con un solo presupuesto: pasa a rango y quita "Económico" que venía por defecto', () => {
  const p = normalizarPerfil({ presupuesto: 40, estilos: ['economico', 'tradicional'] });
  assert.deepEqual([p.presupuestoMin, p.presupuestoMax], [30, 40]);
  assert.deepEqual(p.estilos, ['tradicional']);
  assert.equal(p.presupuesto, undefined);
});

test('recetario de comedor: platos típicos con popularidad y etiquetas', () => {
  for (const id of ['pollo-dorado', 'bistec-encebollado', 'carne-asada', 'pupusas-revueltas', 'sopa-de-gallina', 'tamales-pollo']) {
    assert.ok(receta(id), id);
    assert.ok(receta(id).popularidad >= 4, id);
  }
  for (const r of RECETAS) assert.ok(r.popularidad >= 1 && r.popularidad <= 5, `${r.id}: popularidad`);
  assert.ok(receta('pollo-dorado').etiquetas.includes('frito'));
  assert.ok(receta('tilapia-frita').etiquetas.includes('frito'));
});

test('recetario ampliado: ~3000 recetas en tres niveles de precio, con platos de casa', () => {
  assert.ok(RECETAS.length >= 2800, `solo ${RECETAS.length} recetas`);
  for (const n of ['barato', 'intermedio', 'caro']) assert.ok(RECETAS.filter((r) => r.nivel === n).length >= 900, n);
  const nombres = RECETAS.map((r) => r.nombre);
  for (const n of ['Hígado encebollado con arroz y ensalada de repollo', 'Hígado encebollado con casamiento y ensalada verde', 'Pan con aguacate', 'Lengua en salsa con arroz y ensalada verde', 'Sopa de pata con tortillas y limón'])
    assert.ok(nombres.includes(n), n);
  assert.ok(!nombres.some((n) => / con .* con .* con /.test(n)), 'nombres con "con … con … con"');
  for (const r of RECETAS) assert.ok(['barato', 'intermedio', 'caro'].includes(r.nivel) && r.costoRef > 0, r.id);
});

test('la semana no repite el plato fuerte aunque cambien los acompañamientos', () => {
  const plan = planificar({ perfil: { adultos: 2, comidas: TODO }, precios, semilla: 21 });
  const fuertes = plan.slots.filter((s) => ['almuerzo', 'cena'].includes(s.comida) && !s.sobraDe).map((s) => receta(s.recetaId).familia || s.recetaId);
  assert.equal(new Set(fuertes).size, fuertes.length, `repetidos: ${fuertes.filter((f, i) => fuertes.indexOf(f) !== i).join(', ')}`);
});

test('no me gusta: mariscos y vísceras', () => {
  const plan = planificar({ perfil: { adultos: 2, comidas: TODO, evitar: ['mariscos', 'visceras'] }, precios, semilla: 8 });
  for (const s of plan.slots) {
    const r = receta(s.recetaId);
    assert.notEqual(r.proteina, 'mariscos', r.id);
    assert.ok(!r.etiquetas.includes('visceras') && !r.ing.some(([i]) => ['higado', 'lengua', 'mondongo'].includes(i)), r.id);
  }
});

test('rango obligatorio: con perfiles al azar el plan queda en el rango o avisa que es imposible', () => {
  let a = 777;
  const rnd = () => ((a = (a * 1103515245 + 12345) % 2147483648) / 2147483648);
  const COM = ['desayuno', 'refaccion_am', 'almuerzo', 'refaccion_pm', 'cena'];
  for (let i = 0; i < 40; i++) {
    const comidas = {};
    for (const c of COM) if (rnd() < 0.6) comidas[c] = { dias: SEMANA.filter(() => rnd() < 0.7) };
    comidas.almuerzo = { dias: LV };
    const adultos = 1 + Math.floor(rnd() * 4);
    const sug = presupuestoSugerido({ adultos, comidas });
    const min = Math.round(sug.min * (0.5 + rnd() * 1.5));
    const max = Math.round(min * (1.15 + rnd() * 0.5));
    const plan = planificar({ perfil: { adultos, comidas, presupuestoMin: min, presupuestoMax: max }, precios, semilla: i });
    if (plan.imposible) assert.ok(plan.total > max || plan.total < min, `#${i}: dice imposible pero $${plan.total} está en $${min}–$${max}`);
    else assert.ok(plan.total <= max + 0.01 && plan.total >= min - 0.01, `#${i}: $${plan.total} fuera de $${min}–$${max}`);
  }
});

test('el total del plan es lo que se paga en la caja (paquetes enteros)', () => {
  const plan = planificar({ perfil: { adultos: 2, comidas: { almuerzo: { dias: LV } } }, precios, semilla: 2 });
  const caja = plan.compras.reduce((s, c) => s + c.costo, 0);
  assert.ok(Math.abs(plan.total - caja) < 0.02, `${plan.total} vs ${caja}`);
});

test('repetir para ahorrar: repite proteína y no gasta más que el modo normal', () => {
  const base = { adultos: 3, comidas: { desayuno: { dias: SEMANA }, almuerzo: { dias: SEMANA }, cena: { dias: SEMANA } }, presupuestoMin: 60, presupuestoMax: 120 };
  const normal = planificar({ perfil: base, precios, semilla: 4 });
  const ahorro = planificar({ perfil: { ...base, repetirParaAhorrar: true }, precios, semilla: 4 });
  assert.ok(ahorro.total <= normal.total * 1.03 + 0.01, `${ahorro.total} > ${normal.total}`); // apunta más abajo; el voraz no es exacto
  const prot = (pl) => Math.max(...Object.values(pl.slots.filter((s) => s.comida !== 'desayuno').reduce((m, s) => ({ ...m, [receta(s.recetaId).proteina]: (m[receta(s.recetaId).proteina] || 0) + 1 }), {})));
  assert.ok(prot(ahorro) >= prot(normal), 'con "repetir para ahorrar" la proteína más usada no debería salir menos veces');
});

test('almuerzo sin frijoles de acompañamiento (casamiento sí; platos de frijol como tal, sí)', () => {
  const platosDeFrijol = /^(frijoles-con-chorizo|sopa-de-frijoles|pupusas|tamales-pisque)/;
  for (const r of RECETAS.filter((x) => x.tiempos.includes('almuerzo') && x.ing.some(([i]) => i === 'frijol'))) {
    assert.ok(/casamiento/i.test(r.nombre) || platosDeFrijol.test(r.id) || platosDeFrijol.test(r.familia || ''), `${r.id}: ${r.nombre}`);
  }
  assert.ok(RECETAS.some((x) => x.nombre === 'Salchichas entomatadas con arroz y frijoles de olla' && x.tiempos.join() === 'cena'), 'con frijoles: cena liviana');
  assert.ok(!RECETAS.some((x) => x.nombre === 'Hígado encebollado con arroz y frijoles volteados'), 'hígado con arroz es almuerzo: sin frijoles');
});

test('estructura salvadoreña: el almuerzo es el plato fuerte y la cena es liviana', () => {
  const plan = planificar({ perfil: { adultos: 3, comidas: { desayuno: { dias: SEMANA }, almuerzo: { dias: SEMANA }, cena: { dias: SEMANA } } }, precios, semilla: 13 });
  for (const s of plan.slots.filter((x) => x.comida === 'cena')) {
    const r = receta(s.recetaId);
    // ningún plato de comedor de carne con arroz en la cena
    assert.ok(!(r.id.includes('--') && ['pollo', 'res', 'cerdo', 'pescado', 'mariscos'].includes(r.proteina)), `cena pesada: ${r.nombre}`);
  }
  const pupusasSabado = RECETAS.filter((r) => r.familia === 'pupusas' && r.tiempos.includes('cena')).length;
  assert.ok(pupusasSabado >= 10);
  assert.ok(receta('des-estrellados-tipico').tiempos.includes('cena'), 'el desayuno típico también es cena');
});

test('pupusas sin repollo: el curtido es opcional, la ensalada de repollo no', () => {
  const perfil = { adultos: 2, evitar: ['repollo'], comidas: { cena: { dias: SEMANA } } };
  const cenas = recetasPosibles(perfil, 'cena');
  assert.ok(cenas.some((r) => r.familia === 'pupusas'), 'las pupusas siguen saliendo');
  const p = adaptarReceta(receta('pupusas-chicharron'), perfil);
  assert.equal(p.nombre, 'Pupusas de chicharrón');
  assert.ok(!p.ing.some(([i]) => i === 'repollo'), 'sin repollo en las compras');
  assert.ok(!p.pasos.some((x) => /curtido/i.test(x)), p.pasos.join(' | '));
  assert.equal(adaptarReceta(receta('pupusas-chicharron'), { evitar: [] }).nombre, 'Pupusas de chicharrón con curtido');
  // en el almuerzo, una ensalada de repollo sigue fuera
  assert.ok(!recetasPosibles(perfil, 'almuerzo').some((r) => /ensalada de repollo/.test(r.nombre)));
  const plan = planificar({ perfil: { ...perfil, comidas: { cena: { dias: SEMANA } } }, precios, semilla: 3 });
  assert.ok(!plan.compras.some((c) => c.ingId === 'repollo'), 'no se compra repollo');
});

test('pupusas, tamales, panes y rapiditas no son almuerzo; hay rapiditas y hígado con arroz', () => {
  const antojitos = RECETAS.filter((r) => /^(pupusas|tamales|panes-con|rapiditas)/.test(r.id));
  assert.ok(antojitos.length > 20);
  assert.deepEqual(antojitos.filter((r) => r.tiempos.includes('almuerzo')).map((r) => r.id), []);
  const rap = receta('rapiditas-frijol-queso');
  assert.ok(rap && rap.tiempos.includes('cena') && rap.tiempos.includes('desayuno'));
  const hig = receta('higado-encebollado-arroz');
  assert.deepEqual(hig.tiempos, ['almuerzo']);
  assert.equal(hig.nivel, 'barato');
});

test('al peso: la carne "precio indicado por libra" se paga por lo que se pide, no por libra entera', () => {
  const higado = { nombre: 'Hígado Especial De Res - Precio Indicado por lb (454g)', contenido: 453.59, precio: 2, tienda: 'maxi' };
  const bolsa = { nombre: 'Cebolla Blanca Red 2 Libras - precio Indicado Por Libra (454 g)', contenido: 907.18, precio: 2.5, tienda: 'maxi' };
  assert.ok(porPeso(higado));
  assert.ok(!porPeso(bolsa), 'una bolsa de 2 libras es paquete');
  const pr = { higado: { precioUnit: 2 / 453.59, producto: higado, alternativas: [] } };
  assert.equal(costoCaja('higado', 560, pr), 2.5); // 1¼ lb, no 2 libras
  assert.equal(costoCaja('higado', 100, pr), 1); // mínimo media libra
});
