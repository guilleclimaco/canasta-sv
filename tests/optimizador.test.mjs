import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizar, precioUnitario } from '../web/optimizador.js';

const op = (id, tienda, precio) => ({ id, tienda, precio, nombre: `p${id}` });
const T = ['walmart', 'maxi', 'donjuan', 'selectos'];

test('una sola tienda cuando el ahorro de ir a dos es pequeño', () => {
  const items = [
    { id: 1, nombre: 'arroz', cantidad: 1, opciones: [op(1, 'maxi', 2.6), op(2, 'donjuan', 2.5)] },
    { id: 2, nombre: 'leche', cantidad: 2, opciones: [op(3, 'maxi', 1.9), op(4, 'donjuan', 2.0)] },
  ];
  const r = optimizar(items, T, 3);
  assert.equal(r.mejor.tiendas.length, 1);
  assert.equal(r.mejor.tiendas[0], 'maxi'); // 2.6 + 3.8 = 6.4 vs donjuan 2.5 + 4.0 = 6.5
  assert.equal(r.mejor.total, 6.4);
  assert.match(r.razon, /no vale la vuelta/);
});

test('dos tiendas cuando el ahorro supera el umbral', () => {
  const items = [
    { id: 1, nombre: 'aceite', cantidad: 1, opciones: [op(1, 'maxi', 9), op(2, 'selectos', 5)] },
    { id: 2, nombre: 'cafe', cantidad: 1, opciones: [op(3, 'maxi', 4), op(4, 'selectos', 8)] },
  ];
  const r = optimizar(items, T, 3);
  assert.deepEqual(r.mejor.tiendas.sort(), ['maxi', 'selectos']);
  assert.equal(r.mejor.total, 9);
  assert.match(r.razon, /ahorra \$4\.00/);
});

test('dos tiendas si ninguna sola tiene todo', () => {
  const items = [
    { id: 1, nombre: 'a', cantidad: 1, opciones: [op(1, 'walmart', 1)] },
    { id: 2, nombre: 'b', cantidad: 1, opciones: [op(2, 'selectos', 1)] },
  ];
  const r = optimizar(items, T, 3);
  assert.equal(r.mejor.faltan.length, 0);
  assert.equal(r.mejor.tiendas.length, 2);
});

test('respeta tiendas excluidas y artículos sin precio', () => {
  const items = [
    { id: 1, nombre: 'a', cantidad: 1, opciones: [op(1, 'selectos', 1), op(2, 'maxi', 5)] },
    { id: 2, nombre: 'sin', cantidad: 1, opciones: [] },
  ];
  const r = optimizar(items, ['maxi', 'walmart'], 3);
  assert.equal(r.mejor.total, 5);
  assert.equal(r.sinPrecio.length, 1);
});

test('lista vacía no truena', () => {
  const r = optimizar([], T, 3);
  assert.equal(r.mejor, null);
});

test('precio unitario', () => {
  assert.equal(precioUnitario({ precio: 2.5, contenido: 1000, unidad: 'g' }).valor, 0.25);
  assert.equal(precioUnitario({ precio: 3, contenido: 6, unidad: 'und' }).valor, 0.5);
  assert.equal(precioUnitario({ precio: 3 }), null);
});
