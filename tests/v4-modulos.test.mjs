import test from 'node:test';
import assert from 'node:assert/strict';
import { parsearTicket } from '../web/v4/ticket.js';
import { codigoValido } from '../web/v4/escaner.js';
import { parsearLineaIngrediente, recetaDesdeFormulario } from '../web/v4/recetas-ui.js';
import { validarRecetaIA, pedidoIdeas } from '../web/v4/ia.js';
import { porMes } from '../web/v4/resumen.js';
import { preciosIngredientes, planificar, PERFIL_INICIAL } from '../web/menu/planificador.js';
import { RECETAS } from '../web/menu/recetas.js';

test('ticket: encuentra el total aunque haya subtotal, IVA, ahorro y cambio', () => {
  const t = `WALMART EL SALVADOR
  SAN SALVADOR 12/10/2026 10:41
  ARROZ OMOA 1814G        2.50
  LECHE SALUD 1L          1.35
  SUBTOTAL               43.10
  IVA 13%                 5.60
  TOTAL                  48.70
  USTED AHORRO            3.20
  EFECTIVO               50.00
  CAMBIO                  1.30`;
  assert.deepEqual(parsearTicket(t), { total: 48.7, fecha: '2026-10-12', tienda: 'walmart' });
});

test('ticket: total en la línea de abajo, coma decimal y miles', () => {
  assert.equal(parsearTicket('Super Selectos\nTOTAL A PAGAR\n$ 1,234.56').total, 1234.56);
  assert.equal(parsearTicket('Maxi Despensa\nTotal: 23,45').total, 23.45);
  assert.equal(parsearTicket('Maxi Despensa\nTotal: 23,45').tienda, 'maxi');
  const sinTotal = parsearTicket('La Despensa de Don Juan\nPAN 0.25\nHUEVOS 5.25\nCAMBIO 20.00');
  assert.equal(sinTotal.total, 5.25, 'sin "TOTAL": el monto mayor, sin contar el cambio');
  assert.equal(sinTotal.tienda, 'donjuan');
  assert.equal(parsearTicket('').total, null);
});

test('código de barras: dígito verificador', () => {
  assert.ok(codigoValido('4006381333931'));   // EAN-13
  assert.ok(codigoValido('036000291452'));    // UPC-A
  assert.ok(codigoValido('96385074'));        // EAN-8
  assert.ok(!codigoValido('4006381333932'));
  assert.ok(!codigoValido('123'));
});

test('recetas propias: ingredientes escritos a mano', () => {
  assert.deepEqual(parsearLineaIngrediente('pollo 2 lb'), { id: 'pollo_piezas', cantidad: 907.18 });
  assert.deepEqual(parsearLineaIngrediente('papa 3'), { id: 'papa', cantidad: 510 });
  assert.equal(parsearLineaIngrediente('papaya 1').id, 'papaya');
  assert.deepEqual(parsearLineaIngrediente('huevos 6'), { id: 'huevo', cantidad: 6 });
  assert.deepEqual(parsearLineaIngrediente('arroz 1 lb'), { id: 'arroz', cantidad: 453.59 });
  assert.deepEqual(parsearLineaIngrediente('sal'), { id: 'sal', cantidad: 1 });
  assert.equal(parsearLineaIngrediente('flor de izote 1 bolsita').nota, 'flor de izote 1 bolsita');
  assert.equal(parsearLineaIngrediente('   '), null);
});

test('recetas propias: formulario → receta válida para el planificador', () => {
  const { receta, errores, notas } = recetaDesdeFormulario({
    nombre: 'Sopa de gallina de la abuela', tiempos: ['almuerzo'], minutos: '90', porciones: '6', proteina: 'pollo',
    etiquetas: ['tradicional'], aparatos: [], ingredientes: 'pollo 3 lb\npapa 4\nguisquil 2\nflor de izote al gusto\nsal', pasos: 'Hervir la gallina.\nAgregar verduras.',
  });
  assert.deepEqual(errores, []);
  assert.equal(receta.id, 'propia-sopa-de-gallina-de-la-abuela');
  assert.equal(receta.porciones, 6);
  assert.deepEqual(notas, ['flor de izote al gusto']);
  assert.match(receta.pasos.at(-1), /izote/);
  const plan = planificar({ perfil: { ...PERFIL_INICIAL, presupuesto: 0, comidas: { almuerzo: { dias: ['lun'] } } }, precios: preciosIngredientes([], []),
    recetas: [...RECETAS, receta], fijos: { 'lun:almuerzo': receta.id } });
  assert.equal(plan.slots[0].recetaId, receta.id);
  assert.ok(recetaDesdeFormulario({ nombre: '', tiempos: [], ingredientes: '', pasos: '' }).errores.length >= 3);
});

test('IA: se descarta lo que no sirve y se limpian ingredientes inventados', () => {
  const ok = validarRecetaIA({
    nombre: 'Arroz con huevo', minutos: 20, porciones: 4, tiempos: ['cena', 'merienda'], proteina: 'huevo',
    ing: [['arroz', 300], ['huevo', 6], ['caviar', 50], ['tomate', -3]], pasos: ['Cocinar arroz.', 'Revolver huevos.'],
  }, 'almuerzo');
  assert.deepEqual(ok.ing, [['arroz', 300], ['huevo', 6]]);
  assert.deepEqual(ok.tiempos.sort(), ['almuerzo', 'cena']);
  assert.ok(ok.aparatos.includes('estufa'));
  assert.equal(validarRecetaIA({ nombre: 'X', ing: [['caviar', 1]], pasos: ['a', 'b'] }, 'almuerzo'), null);
  assert.equal(validarRecetaIA({ nombre: 'X', ing: [['arroz', 1]], pasos: ['solo uno'] }, 'almuerzo'), null);
  assert.equal(validarRecetaIA(null), null);
});

test('IA: el pedido no lleva datos personales, solo comida', () => {
  const precios = preciosIngredientes([], []);
  const p = pedidoIdeas({ tiempo: 'cena', antojo: 'con pollo', perfil: { adultos: 2, ninos: 2, evitar: ['res'] }, despensa: new Map([['arroz', 900]]), porVencer: ['tomate'], precios });
  assert.equal(p.porciones, 3);
  assert.deepEqual(p.enCasa, ['arroz']);
  assert.ok(p.catalogo.length > 50 && p.catalogo.every((c) => c.length === 3));
  assert.ok(!JSON.stringify(p).includes('@'));
});

test('resumen: ahorro por mes', () => {
  const g = [
    { fecha: '2026-10-03', monto: 48, ahorro: 4 }, { fecha: '2026-10-20', monto: 30, ahorro: 2.5 },
    { fecha: '2026-09-12', monto: 268, ahorro: 15 }, { fecha: '2026-03-01', monto: 99, ahorro: 9 },
  ];
  const m = porMes(g, '2026-10-01', 3);
  assert.deepEqual(m.map((x) => x.mes), ['2026-08-01', '2026-09-01', '2026-10-01']);
  assert.deepEqual(m.at(-1), { mes: '2026-10-01', gasto: 78, ahorro: 6.5 });
  assert.equal(m[0].ahorro, 0);
});
