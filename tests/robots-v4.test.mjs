import test from 'node:test';
import assert from 'node:assert/strict';
import { parsearSondeo, preciosMercado, ingredienteDeMercado, fechaDeArchivo } from '../web/menu/mercado.js';
import { INGREDIENTES } from '../web/menu/ingredientes.js';
import { calcularAvisos, hoySV } from '../scraper/alertas.mjs';

// Líneas como las extrae pdfjs del informe de la Defensoría (formato verificado en el informe del 04.05.2025)
const LINEAS = [
  'INFORME SEMANAL DE PRECIOS EN MERCADOS Y TIENDAS MAYORISTAS',
  'Categoría Producto Cantidad Unidad Precio regional Precio Nacional',
  'Centro Occidente Oriente Mínimo Máximo Promedio',
  'Carnes Carne de cerdo, chuleta corriente',
  '(redonda) 1 Libra n.d. n.d. $3.50 $3.50 $3.50 $3.50',
  'Carne de res, posta negra $4.50 $4.36 $4.20 $3.50 $5.24 $4.42',
  'Pollo, entrepierna $1.51 $1.38 $1.30 $1.10 $1.75 $1.43',
  'Frutas Guineo de seda (indio) 1 Unidades $0.10 $0.10 $0.11 $0.05 $0.15 $0.10',
  'Limón Pérsico Unidades $0.16 $0.18 $0.25 $0.12 $0.25 $0.18',
  'Papaya, Tainung $1.70 $1.80 $1.85 $1.25 $2.50 $1.78',
  'Granos Arroz Blanco 1 Libra $0.60 $0.61 $0.62 $0.50 $0.75 $0.61',
  'Arroz Blanco 1 Quintal $52.00 $53.00 $52.50 $48.00 $56.00 $52.56',
  'Harinas Harina de trigo fortificada 50 Libra $20.00 $20.00 $20.00 $19.00 $21.00 $20.00',
  'Huevos Huevo extragrande 30 Unidades $4.80 $4.90 $4.88 $4.00 $5.50 $4.86',
  'Huevo grande $4.06 $4.44 $4.07 $3.50 $5.25 $4.22',
  'Verduras Papa 1 Libra $0.66 $0.70 $0.68 $0.50 $0.85 $0.68',
  'Tomate de cocina 1 Unidades $0.12 $0.13 $0.14 $0.08 $0.20 $0.13',
  'Fuente: elaboración propia en base a datos del sondeo de precios de la DC 2025.',
];

test('parser del sondeo de la Defensoría', () => {
  const f = parsearSondeo(LINEAS, '2025-05-04');
  const p = (n) => f.find((x) => x.producto === n);
  assert.equal(f.length, 13);
  assert.equal(p('Carne de cerdo, chuleta corriente (redonda)').promedio, 3.5, 'nombre partido en dos líneas');
  assert.equal(p('Carne de cerdo, chuleta corriente (redonda)').centro, null, 'n.d. = null');
  assert.equal(p('Carne de res, posta negra').unidad, 'Libra', 'unidad heredada de la fila anterior');
  assert.equal(p('Limón Pérsico').cantidad, 1);
  assert.equal(p('Huevo grande').cantidad, 30, 'cantidad heredada');
  assert.equal(p('Huevo grande').categoria, 'Huevos');
  assert.equal(f.filter((x) => x.producto === 'Arroz Blanco').length, 2);
  assert.equal(fechaDeArchivo('https://x/2025/09/04.05.2025_Informe-comunicacional-sondeo.pdf'), '2025-05-04');
});

test('precios del mercado por ingrediente (libra, unidad, cartón, quintal ignorado)', () => {
  const m = preciosMercado(parsearSondeo(LINEAS, '2025-05-04'), INGREDIENTES);
  assert.ok(Math.abs(m.get('arroz').precioUnit * 453.59 - 0.61) < 0.001, 'arroz por libra, no por quintal');
  assert.ok(Math.abs(m.get('huevo').precioUnit - 4.22 / 30) < 0.001, 'huevo: el más barato por unidad');
  assert.ok(Math.abs(m.get('tomate').precioUnit - 0.13 / 150) < 0.0001, 'tomate por unidad → gramos');
  assert.equal(m.get('banano').producto, 'Guineo de seda (indio)');
  assert.equal(ingredienteDeMercado('Papaya, Tainung').ing, 'papaya');
  assert.equal(ingredienteDeMercado('Papa, Lavada').ing, 'papa');
  assert.equal(ingredienteDeMercado('Harina de trigo fortificada'), null);
});

test('avisos: bajas, presupuesto, vencimientos, menú del sábado y sin repetir', () => {
  const datos = {
    lista: [{ nombre: 'Arroz', productos: [1, 2] }, { nombre: 'Leche', productos: [3] }],
    productos: [{ id: 1, tienda: 'maxi', tienda_nombre: 'Maxi Despensa' }, { id: 2, tienda: 'walmart' }, { id: 3, tienda: 'maxi' }],
    resumen: [
      { producto_id: 1, min60: 2.3, puntos: [['2026-09-01', 2.6], ['2026-10-09', 2.3]] },
      { producto_id: 3, min60: 1.3, puntos: [['2026-09-01', 1.35], ['2026-09-20', 1.3]] }, // bajó hace mucho
    ],
    presupuestos: [{ monto: 100 }], gastos: [{ monto: 60 }, { monto: 32 }],
    despensa: [{ nombre: 'Pollo', caduca: '2026-10-11', cantidad: 500 }, { nombre: 'Arroz', caduca: '2026-12-01' }],
    menuSiguiente: false,
    enviados: {},
  };
  const hoy = '2026-10-10'; // sábado
  const a = calcularAvisos(datos, hoy);
  const tipos = a.map((x) => x.tipo).sort();
  assert.deepEqual(tipos, ['bajas', 'menu', 'presupuesto', 'vence']);
  assert.match(a.find((x) => x.tipo === 'bajas').cuerpo, /Arroz: \$2\.30 en Maxi Despensa \(mínimo de 60 días\)/);
  assert.match(a.find((x) => x.tipo === 'presupuesto').titulo, /90 %/);
  assert.match(a.find((x) => x.tipo === 'vence').cuerpo, /Pollo \(vence mañana\)/);
  // ya enviados → no se repiten
  const enviados = Object.fromEntries(a.map((x) => [x.clave, hoy]));
  assert.equal(calcularAvisos({ ...datos, enviados }, hoy).length, 0);
  // un martes con menú armado y sin gastos no avisa nada
  assert.equal(calcularAvisos({ ...datos, resumen: [], gastos: [], despensa: [], menuSiguiente: true }, '2026-10-13').length, 0);
  assert.equal(hoySV(new Date('2026-10-10T03:00:00Z')), '2026-10-09');
});
