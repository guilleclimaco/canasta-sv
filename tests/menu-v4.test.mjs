import test from 'node:test';
import assert from 'node:assert/strict';
import { RECETAS } from '../web/menu/recetas.js';
import { buscarIngrediente, pasilloDeArticulo, esVerduraOFruta } from '../web/menu/ingredientes.js';
import {
  planificar, preciosIngredientes, calcularCompras, normalizarDespensa, porVencer, enlacesSobras, slotsDe,
  normalizarPerfil, claveSlot, PERFIL_INICIAL, costoReceta,
} from '../web/menu/planificador.js';

const precios = preciosIngredientes([], []);
const receta = (id) => RECETAS.find((r) => r.id === id);
const LV = ['lun', 'mar', 'mie', 'jue', 'vie'];
const base = (comidas, extra = {}) => ({ ...PERFIL_INICIAL, presupuesto: 0, estilos: [], comidas, ...extra });

test('despensa con cantidades: compra solo lo que falta', () => {
  const r = { porciones: 4, ing: [['arroz', 1000], ['huevo', 10]] };
  const desp = normalizarDespensa([{ ingrediente: 'arroz', cantidad: 600 }, { ingrediente: 'huevo', cantidad: 12 }]);
  const c = calcularCompras([{ receta: r, porciones: 4 }], precios, desp);
  const arroz = c.find((x) => x.ingId === 'arroz');
  assert.equal(arroz.necesita, 400);
  assert.equal(arroz.enCasa, 600);
  assert.ok(!c.some((x) => x.ingId === 'huevo'), 'hay huevos suficientes');
  // "siempre hay" (Set) = no se compra nunca
  assert.equal(calcularCompras([{ receta: r, porciones: 4 }], precios, new Set(['arroz', 'huevo'])).length, 0);
  // costo a comprar baja con la despensa
  const sin = costoReceta(receta('arroz-frito'), 4, precios);
  const con = costoReceta(receta('arroz-frito'), 4, precios, desp);
  assert.ok(con.aComprar < sin.aComprar && con.total === sin.total);
});

test('lo que está por vencer se usa primero', () => {
  const hoy = new Date('2026-10-12T12:00:00');
  const desp = [{ ingrediente: 'guisquil', cantidad: 4, caduca: '2026-10-13' }];
  assert.deepEqual(porVencer(normalizarDespensa(desp), hoy), ['guisquil']);
  let usaGuisquil = 0;
  for (let s = 1; s <= 10; s++) {
    const plan = planificar({ perfil: base({ almuerzo: { dias: ['lun'] } }), precios, despensa: desp, semilla: s, hoy });
    if (receta(plan.slots[0].recetaId).ing.some(([id]) => id === 'guisquil')) usaGuisquil++;
  }
  let sinBono = 0;
  for (let s = 1; s <= 10; s++) {
    const plan = planificar({ perfil: base({ almuerzo: { dias: ['lun'] } }), precios, semilla: s, hoy });
    if (receta(plan.slots[0].recetaId).ing.some(([id]) => id === 'guisquil')) sinBono++;
  }
  assert.ok(usaGuisquil > sinBono, `con guisquil por vencer: ${usaGuisquil}/10, sin: ${sinBono}/10`);
});

test('sobras: lo del almuerzo es la cena (cocina doble, la cena cuesta 0)', () => {
  const perfil = base({ almuerzo: { dias: LV }, cena: { dias: LV } }, { sobras: 'almuerzo_a_cena', adultos: 2 });
  const plan = planificar({ perfil, precios, semilla: 4 });
  for (const d of LV) {
    const alm = plan.slots.find((s) => s.dia === d && s.comida === 'almuerzo');
    const cen = plan.slots.find((s) => s.dia === d && s.comida === 'cena');
    assert.equal(cen.sobraDe, claveSlot(d, 'almuerzo'));
    assert.equal(cen.recetaId, alm.recetaId);
    assert.equal(cen.costo.aComprar, 0);
    assert.equal(alm.porcionesCocinar, 4);
    assert.ok(receta(alm.recetaId).sobras, `${alm.recetaId} no sirve para sobras`);
  }
  // se cocina la mitad de veces y, con sobras o sin ellas, el menú queda dentro del rango de presupuesto
  // (con sobras la cena es el mismo plato fuerte del almuerzo, así que puede costar algo más que una cena ligera)
  const sinSobras = planificar({ perfil: { ...perfil, sobras: 'no' }, precios, semilla: 4 });
  assert.equal(plan.slots.filter((s) => !s.sobraDe).length, 5);
  assert.ok(plan.dentroPresupuesto, `${plan.total} fuera de ${plan.presupuesto.min}–${plan.presupuesto.max}`);
  assert.ok(sinSobras.dentroPresupuesto, `${sinSobras.total} fuera del rango`);
});

test('sobras: la cena va de almuerzo al día siguiente; manual y quitar una', () => {
  const perfil = normalizarPerfil(base({ almuerzo: { dias: LV }, cena: { dias: LV } }, { sobras: 'cena_a_almuerzo' }));
  const slots = slotsDe(perfil);
  const e = enlacesSobras(slots, perfil);
  assert.equal(e['mar:almuerzo'], 'lun:cena');
  assert.equal(e['lun:almuerzo'], undefined);
  const e2 = enlacesSobras(slots, perfil, { 'mie:cena': 'mie:almuerzo' }, ['mar:almuerzo']);
  assert.equal(e2['mar:almuerzo'], undefined, 'quitada a mano');
  assert.equal(e2['mie:cena'], undefined, 'mie:almuerzo ya es sobra: no se encadena');
  const e3 = enlacesSobras(slots, normalizarPerfil({ ...perfil, sobras: 'no' }), { 'jue:cena': 'mar:almuerzo', 'lun:cena': 'mar:almuerzo' });
  assert.equal(e3['jue:cena'], 'mar:almuerzo');
  assert.equal(e3['lun:cena'], undefined, 'la sobra no puede ir antes del original');
});

test('calificaciones: 👎 no vuelve a salir, 👍 sale más', () => {
  const perfil = base({ almuerzo: { dias: LV } });
  const plan = planificar({ perfil, precios, semilla: 9 });
  const odiadas = Object.fromEntries(plan.slots.map((s) => [s.recetaId, -1]));
  const otro = planificar({ perfil, precios, semilla: 9, calificaciones: odiadas });
  for (const s of otro.slots) assert.ok(!odiadas[s.recetaId], `salió ${s.recetaId} con 👎`);
  let conLike = 0;
  for (let s = 1; s <= 8; s++) {
    const p = planificar({ perfil, precios, semilla: s, calificaciones: { 'pollo-guisado': 1 } });
    if (p.slots.some((x) => x.recetaId === 'pollo-guisado')) conLike++;
  }
  let sinLike = 0;
  for (let s = 1; s <= 8; s++) if (planificar({ perfil, precios, semilla: s }).slots.some((x) => x.recetaId === 'pollo-guisado')) sinLike++;
  assert.ok(conLike >= sinLike);
});

test('lonchera: esa comida solo usa recetas que aguantan ir en tupper', () => {
  const plan = planificar({ perfil: base({ refaccion_am: { dias: LV, lonchera: true }, almuerzo: { dias: LV, lonchera: true } }), precios, semilla: 3 });
  for (const s of plan.slots) assert.ok(receta(s.recetaId).etiquetas.includes('lonchera'), `${s.recetaId} no es de lonchera`);
});

test('recetas de la familia entran al menú', () => {
  const propia = {
    id: 'propia-sopa-abuela', nombre: 'Sopa de la abuela', minutos: 40, porciones: 4, tiempos: ['almuerzo'],
    aparatos: ['estufa'], etiquetas: ['tradicional'], proteina: 'pollo', propia: true,
    ing: [['pollo_piezas', 300], ['papa', 200]], pasos: ['Hervir.', 'Servir.'],
  };
  const plan = planificar({ perfil: base({ almuerzo: { dias: ['lun'] } }), precios, recetas: [...RECETAS, propia], fijos: { 'lun:almuerzo': propia.id } });
  assert.equal(plan.slots[0].recetaId, propia.id);
  assert.ok(plan.compras.some((c) => c.ingId === 'pollo_piezas'));
});

test('balance: casi todos los días con verdura o fruta', () => {
  const plan = planificar({ perfil: base({ desayuno: { dias: LV }, almuerzo: { dias: LV }, cena: { dias: LV } }), precios, semilla: 2 });
  assert.equal(plan.balance.dias, 5);
  assert.ok(plan.balance.diasSinVerdura.length <= 1, `días sin verdura: ${plan.balance.diasSinVerdura}`);
  assert.ok(esVerduraOFruta('tomate') && !esVerduraOFruta('limon') && !esVerduraOFruta('arroz'));
});

test('reconocer ingredientes y pasillos por nombre', () => {
  assert.equal(buscarIngrediente('Frijoles rojos'), 'frijol');
  assert.equal(buscarIngrediente('Pechuga de pollo'), 'pechuga');
  assert.equal(buscarIngrediente('Papel higiénico'), null);
  assert.equal(pasilloDeArticulo('Detergente'), 'Limpieza e higiene');
  assert.equal(pasilloDeArticulo('Leche'), 'Lácteos y huevos');
  assert.equal(pasilloDeArticulo('Coca cola'), 'Otros');
});
