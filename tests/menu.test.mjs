import test from 'node:test';
import assert from 'node:assert/strict';
import { INGREDIENTES, terminosDeIngredientes } from '../web/menu/ingredientes.js';
import { RECETAS } from '../web/menu/recetas.js';
import {
  productoValido, preciosIngredientes, planificar, calcularCompras, costoReceta, cantidadTexto, PERFIL_INICIAL,
} from '../web/menu/planificador.js';

const prod = (over) => ({ id: Math.random(), tienda: 'maxi', precio_lista: null, ...over, busqueda: (over.nombre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') });

test('todas las recetas usan ingredientes del catálogo y tienen pasos', () => {
  for (const r of RECETAS) {
    for (const [id, cant] of r.ing) {
      assert.ok(INGREDIENTES[id], `${r.id}: ingrediente desconocido ${id}`);
      assert.ok(cant > 0, `${r.id}: cantidad inválida para ${id}`);
    }
    assert.ok(r.pasos.length >= 3, `${r.id}: faltan pasos`);
    assert.ok(r.minutos > 0 && r.porciones > 0);
  }
  assert.ok(RECETAS.length >= 25);
  assert.equal(new Set(RECETAS.map((r) => r.id)).size, RECETAS.length, 'ids repetidos');
});

test('cada ingrediente cotizable tiene términos, unidad y precio de referencia', () => {
  for (const [id, i] of Object.entries(INGREDIENTES)) {
    if (i.basico) continue;
    assert.ok(i.terminos?.length, id);
    assert.ok(['g', 'ml', 'und'].includes(i.unidad), id);
    assert.ok(i.ref > 0, id);
  }
  assert.ok(terminosDeIngredientes().includes('pechuga pollo'));
});

test('productoValido descarta productos que no son el ingrediente', () => {
  assert.ok(productoValido('pechuga', prod({ nombre: 'Pechuga de Pollo Deshuesada 1 lb', unidad: 'g', contenido: 453.59, precio: 2.7 })));
  assert.ok(!productoValido('pechuga', prod({ nombre: 'Pechuga de pollo empanizada 500 g', unidad: 'g', contenido: 500, precio: 4 })));
  assert.ok(!productoValido('pollo_piezas', prod({ nombre: 'Sopa Maggi sabor a pollo 60 g', unidad: 'g', contenido: 60, precio: 0.5 })));
  assert.ok(productoValido('pollo_piezas', prod({ nombre: 'Pierna con muslo de pollo 2 lb', unidad: 'g', contenido: 907, precio: 3.6 })));
  assert.ok(!productoValido('papa', prod({ nombre: 'Papaya Tainung por libra', unidad: 'g', contenido: 453.59, precio: 0.8 })));
  assert.ok(!productoValido('limon', prod({ nombre: 'Lavaplatos Axion Limon 1 und', unidad: 'und', contenido: 1, precio: 1.2 })));
  assert.ok(productoValido('limon', prod({ nombre: 'Limon Persa por unidad', unidad: 'und', contenido: 1, precio: 0.1 })));
  assert.ok(!productoValido('crema', prod({ nombre: 'Leche Semidescremada Dos Pinos 1 L', unidad: 'ml', contenido: 1000, precio: 1.9 })), 'semidescremada no es crema');
  assert.ok(productoValido('crema', prod({ nombre: 'Crema Salud 473 ml', unidad: 'ml', contenido: 473, precio: 2 })));
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
  const soloMaxi = preciosIngredientes(cands, ['maxi']);
  assert.match(soloMaxi.arroz.producto.nombre, /Omoa/);
});

test('planificar: un almuerzo por día, sin repetir, respetando gustos y aparatos', () => {
  const precios = preciosIngredientes([], []);
  const perfil = { ...PERFIL_INICIAL, dias: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'], evitar: ['res'], aparatos: ['estufa'], presupuesto: 0 };
  const plan = planificar({ perfil, precios, semilla: 7 });
  assert.equal(plan.dias.length, 7);
  const ids = plan.dias.map((d) => d.recetaId);
  assert.equal(new Set(ids).size, 7, 'repitió receta');
  const recetas = ids.map((id) => RECETAS.find((r) => r.id === id));
  assert.ok(recetas.every((r) => r.proteina !== 'res'), 'incluyó res');
  assert.ok(recetas.every((r) => !r.aparatos.includes('horno') && !r.aparatos.includes('freidora')), 'usó horno/freidora');
  for (let i = 1; i < recetas.length; i++) {
    // no siempre es posible, pero con 7 días y muchas recetas no debería repetir proteína 3 días seguidos
    if (i >= 2) assert.ok(!(recetas[i].proteina === recetas[i - 1].proteina && recetas[i].proteina === recetas[i - 2].proteina));
  }
  assert.ok(plan.total > 0 && plan.compras.length > 0);
});

test('planificar: el presupuesto baja el costo y la despensa también', () => {
  const precios = preciosIngredientes([], []);
  const base = { ...PERFIL_INICIAL, presupuesto: 0, estilos: [] };
  const libre = planificar({ perfil: base, precios, semilla: 3 });
  const apretado = planificar({ perfil: { ...base, presupuesto: 15 }, precios, semilla: 3 });
  assert.ok(apretado.total <= libre.total, `${apretado.total} > ${libre.total}`);
  const conDespensa = planificar({ perfil: base, precios, semilla: 3, despensa: new Set(['arroz', 'frijol', 'aceite', 'tomate', 'cebolla']) });
  assert.ok(conDespensa.total < libre.total);
  assert.ok(!conDespensa.compras.some((c) => c.ingId === 'arroz'));
});

test('planificar: días fijos y excluir', () => {
  const precios = preciosIngredientes([], []);
  const perfil = { ...PERFIL_INICIAL, presupuesto: 0 };
  const a = planificar({ perfil, precios, semilla: 1 });
  const fijos = Object.fromEntries(a.dias.filter((d) => d.dia !== 'mie').map((d) => [d.dia, d.recetaId]));
  const actual = a.dias.find((d) => d.dia === 'mie').recetaId;
  const b = planificar({ perfil, precios, semilla: 2, fijos, excluir: [actual] });
  for (const [d, id] of Object.entries(fijos)) assert.equal(b.dias.find((x) => x.dia === d).recetaId, id);
  assert.notEqual(b.dias.find((x) => x.dia === 'mie').recetaId, actual);
});

test('vegetariano solo trae recetas vegetarianas', () => {
  const plan = planificar({ perfil: { ...PERFIL_INICIAL, estilos: ['vegetariano'], presupuesto: 0 }, precios: preciosIngredientes([], []) });
  for (const d of plan.dias) assert.ok(RECETAS.find((r) => r.id === d.recetaId).etiquetas.includes('vegetariano'));
});

test('compras redondea a paquetes reales', () => {
  const arroz = { precioUnit: 2.6 / 1814, producto: { nombre: 'Arroz Omoa 1814 g', contenido: 1814, precio: 2.6 }, estimado: false };
  const r = { porciones: 4, ing: [['arroz', 1500]] };
  let c = calcularCompras([r], 4, { arroz });
  assert.equal(c[0].paquetes, 1);
  assert.equal(c[0].costo, 2.6);
  c = calcularCompras([r, r], 4, { arroz });
  assert.equal(c[0].paquetes, 2);
});

test('compras elige la presentación más barata en total, no por unidad', () => {
  const carton30 = { nombre: 'Huevos 30 und', contenido: 30, precio: 5.25, tienda: 'maxi' };
  const carton12 = { nombre: 'Huevos 12 und', contenido: 12, precio: 2.4, tienda: 'walmart' };
  const huevo = { precioUnit: 5.25 / 30, producto: carton30, alternativas: [carton30, carton12], estimado: false };
  const [c] = calcularCompras([{ porciones: 4, ing: [['huevo', 6]] }], 4, { huevo });
  assert.equal(c.producto.nombre, 'Huevos 12 und');
  assert.equal(c.costo, 2.4);
  const [c2] = calcularCompras([{ porciones: 4, ing: [['huevo', 28]] }], 4, { huevo });
  assert.equal(c2.producto.nombre, 'Huevos 30 und');
});

test('costo por porción y textos de cantidad', () => {
  const precios = preciosIngredientes([], []);
  const c = costoReceta(RECETAS.find((r) => r.id === 'huevos-picados'), 4, precios);
  assert.ok(c.porPorcion > 0.3 && c.porPorcion < 3, `costo raro ${c.porPorcion}`);
  assert.equal(cantidadTexto(453.59, 'g'), '450 g (1 lb)');
  assert.equal(cantidadTexto(1814, 'g'), '1.8 kg (4 lb)');
  assert.equal(cantidadTexto(250, 'ml'), '250 ml');
  assert.equal(cantidadTexto(1.5, 'und'), '1½');
});
