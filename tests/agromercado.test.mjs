import test from 'node:test';
import assert from 'node:assert/strict';
import { INGREDIENTES } from '../web/menu/ingredientes.js';
import { precioUnitarioAgro, preciosAgromercado, combinarMercados, textoAgro } from '../web/menu/mercado.js';

test('agromercado: "20 tomates grandes por $1" y "12 lb de papa por $4" pasan a precio por gramo', () => {
  const tom = precioUnitarioAgro({ ingrediente: 'tomate', cantidad: 20, unidad: 'und', precio: 1, gramos_unidad: 170 }, INGREDIENTES);
  assert.equal(tom.unidades, 3400);
  assert.ok(Math.abs(tom.precioUnit - 1 / 3400) < 1e-9);
  const papa = precioUnitarioAgro({ ingrediente: 'papa', cantidad: 12, unidad: 'lb', precio: 4 }, INGREDIENTES);
  assert.ok(Math.abs(papa.unidades - 12 * 453.59) < 0.01);
  // limón: la receta lo cuenta por unidad
  assert.equal(precioUnitarioAgro({ ingrediente: 'limon', cantidad: 32, unidad: 'und', precio: 2 }, INGREDIENTES).precioUnit, 2 / 32);
  // por unidad sin peso conocido: no se puede comparar
  assert.equal(precioUnitarioAgro({ ingrediente: 'arroz', cantidad: 1, unidad: 'und', precio: 1 }, INGREDIENTES), null);
  assert.equal(textoAgro({ cantidad: 12, unidad: 'lb', precio: 4 }), '12 lb por $4.00');
});

test('agromercado: se queda con la opción más barata y se combina con la Defensoría', () => {
  const agro = preciosAgromercado([
    { ingrediente: 'tomate', descripcion: 'Tomate grande', cantidad: 20, unidad: 'und', precio: 1, gramos_unidad: 170, fecha: '2026-10-01' },
    { ingrediente: 'tomate', descripcion: 'Tomate pequeño', cantidad: 35, unidad: 'und', precio: 1, gramos_unidad: 90, fecha: '2026-10-01' },
  ], INGREDIENTES);
  assert.match(agro.get('tomate').producto, /grande/); // 3400 g por $1 vale más que 3150 g por $1
  const defensoria = new Map([['tomate', { precioUnit: 0.002, producto: 'Tomate de cocina', origen: 'defensoria' }], ['papa', { precioUnit: 0.001, producto: 'Papa' }]]);
  const todo = combinarMercados(defensoria, agro);
  assert.equal(todo.get('tomate').origen, 'agromercado');
  assert.equal(todo.get('papa').origen, 'defensoria');
});
