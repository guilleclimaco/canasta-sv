import test from 'node:test';
import assert from 'node:assert/strict';
import { INGREDIENTES, terminosDeIngredientes } from '../web/menu/ingredientes.js';
import { RECETAS } from '../web/menu/recetas.js';
import {
  productoValido, preciosIngredientes, planificar, calcularCompras, costoReceta, cantidadTexto, PERFIL_INICIAL,
  normalizarPerfil, slotsDe, presupuestoSugerido, recetasPosibles, claveSlot, PRESETS,
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
  assert.ok(presupuestoSugerido(perfil) > 0);
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
    assert.ok(c.porPorcion > 0.05 && c.porPorcion < 4, `${r.id}: $${c.porPorcion}/porción`);
  }
  assert.equal(cantidadTexto(453.59, 'g'), '450 g (1 lb)');
  assert.equal(cantidadTexto(1814, 'g'), '1.8 kg (4 lb)');
  assert.equal(cantidadTexto(250, 'ml'), '250 ml');
  assert.equal(cantidadTexto(1.5, 'und'), '1½');
});
