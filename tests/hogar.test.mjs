import test from 'node:test';
import assert from 'node:assert/strict';
import { ARTICULOS_HOGAR, terminosHogar, usuariosDe, consumoInicial } from '../web/hogar/catalogo.js';
import {
  productoValidoHogar, stockEstimado, diasRestantes, recomendar, planHogar, registrarCompra, reportarStock,
  textoDias, textoConsumo, terminosConMarca, opcionesProducto,
} from '../web/hogar/necesidades.js';

const n = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let idp = 1;
const prod = (nombre, contenido, unidad, precio, extra = {}) => ({ id: idp++, tienda: 'maxi', nombre, busqueda: n(nombre), contenido, unidad, precio, precio_lista: precio, ...extra });
const HOY = new Date('2026-10-12T12:00:00');
const hace = (d) => new Date(HOY.getTime() - d * 86400000).toISOString();

test('catálogo: cada artículo tiene lo necesario', () => {
  for (const [k, a] of Object.entries(ARTICULOS_HOGAR)) {
    assert.ok(['personal', 'limpieza'].includes(a.categoria), k);
    assert.ok(['g', 'ml', 'und'].includes(a.unidad), k);
    assert.ok(a.terminos.length && a.paquete > 0 && a.ref > 0, k);
    assert.ok((a.consumo.hogar || 0) + (a.consumo.persona || 0) > 0, k);
  }
  assert.ok(terminosHogar().includes('pasta dental'));
  assert.equal(usuariosDe('desodorante', { adultos: 2, ninos: 2 }), 2);
  assert.equal(usuariosDe('pasta_dental', { adultos: 2, ninos: 2 }), 3);
  assert.equal(usuariosDe('panales', { adultos: 2 }), 1);
  assert.equal(consumoInicial('detergente_ropa', 3), 3100);
});

test('productos válidos: unidad, exclusiones y marca preferida', () => {
  const pasta = { catalogo: 'pasta_dental', unidad: 'ml' };
  assert.ok(productoValidoHogar(pasta, prod('Pasta Dental Colgate Triple Accion 3 Pack 75 ml', 225, 'ml', 3.5)));
  assert.ok(!productoValidoHogar(pasta, prod('Cepillo Dental Colgate con pasta dental de regalo 1 und', 1, 'und', 2)));
  assert.ok(!productoValidoHogar({ ...pasta, marca: 'Colgate' }, prod('Pasta Dental Crest 100 ml', 100, 'ml', 2)));
  assert.ok(productoValidoHogar({ ...pasta, marca: 'colgate' }, prod('Pasta Dental Colgate 100 ml', 100, 'ml', 2)));
  const jabon = { catalogo: 'jabon_bano', unidad: 'g' };
  assert.ok(productoValidoHogar(jabon, prod('Jabón de Tocador Protex 3 Pack 110 g', 330, 'g', 2.75)));
  assert.ok(!productoValidoHogar(jabon, prod('Jabón Xtra para lavar ropa 400 g', 400, 'g', 1.2)));
  assert.ok(!productoValidoHogar(jabon, prod('Jabón líquido para manos 250 ml', 250, 'ml', 2)));
  const deso = { catalogo: 'desodorante', unidad: 'ml' };
  assert.ok(productoValidoHogar(deso, prod('Desodorante Rexona barra 50 g', 50, 'g', 2.9)), 'acepta g');
  assert.ok(!productoValidoHogar({ catalogo: 'detergente_ropa', unidad: 'g' }, prod('Detergente lavaplatos Axion 900 g', 900, 'g', 2.5)));
  const piso = { catalogo: 'desinfectante_piso', unidad: 'ml' };
  assert.ok(productoValidoHogar(piso, prod('Fabuloso Lavanda 1 L', 1000, 'ml', 2.4)));
  assert.ok(!productoValidoHogar(piso, prod('Desinfectante en aerosol Lysol 350 ml', 350, 'ml', 5)));
  // propio (sin catálogo): por nombre
  assert.ok(productoValidoHogar({ catalogo: null, nombre: 'Talco', unidad: 'g' }, prod('Talco Johnson 200 g', 200, 'g', 3)));
});

test('stock estimado baja con el tiempo y dice cuántos días quedan', () => {
  const art = { catalogo: 'pasta_dental', consumo_mes: 150, stock: 200, stock_fecha: hace(10) };
  assert.equal(Math.round(stockEstimado(art, HOY)), 150);
  assert.equal(Math.round(diasRestantes(art, HOY)), 30);
  assert.equal(stockEstimado({ ...art, stock_fecha: hace(90) }, HOY), 0);
  assert.equal(textoDias(3.2), '~3 días');
  assert.equal(textoDias(20), '~3 semanas');
  assert.equal(textoDias(0.2), 'se acabó');
  assert.match(textoConsumo({ catalogo: 'shampoo', unidad: 'ml', consumo_mes: 400 }), /1 de 400 ml cada 1 mes/);
});

test('recomendar: cuánto llevar y la presentación con mejor precio por unidad', () => {
  // 3 personas, pasta 150 ml/mes, quedan ~20 ml → hay que comprar
  const art = { catalogo: 'pasta_dental', unidad: 'ml', consumo_mes: 150, stock: 20, stock_fecha: HOY.toISOString() };
  const c = [prod('Pasta Dental Colgate 75 ml', 75, 'ml', 1.6), prod('Pasta Dental Colgate 3 Pack 75 ml', 225, 'ml', 3.9), prod('Pasta Dental Colgate 100 ml', 100, 'ml', 2.5, { tienda: 'walmart' })];
  const r = recomendar(art, c, { hoy: HOY, horizonte: 15 });
  assert.equal(r.estado, 'urgente');
  assert.equal(r.motivo, 'comprar');
  assert.match(r.producto.nombre, /3 Pack/, 'el 3-pack sale más barato por ml');
  assert.equal(r.paquetes, 1); // necesita 150*22/30-20 = 90 ml → 1 tripack
  // sin la tienda del tripack: elige entre lo que queda
  const r2 = recomendar(art, c, { hoy: HOY, tiendas: ['walmart'] });
  assert.equal(r2.producto.tienda, 'walmart');
  // con stock de sobra no hay que comprar
  const lleno = recomendar({ ...art, stock: 400 }, c, { hoy: HOY });
  assert.equal(lleno.motivo, null);
  assert.equal(lleno.estado, 'ok');
});

test('recomendar: no compra presentaciones absurdas para el consumo', () => {
  const art = { catalogo: 'cloro', unidad: 'ml', consumo_mes: 1000, stock: 0, stock_fecha: HOY.toISOString() };
  const c = [prod('Cloro Magia Blanca 1 L', 1000, 'ml', 0.9), prod('Cloro industrial 20 L', 20000, 'ml', 9)];
  const r = recomendar(art, c, { hoy: HOY, mesesMax: 3 });
  assert.equal(r.producto.contenido, 1000);
  assert.equal(r.paquetes, 1); // 22 días ≈ 733 ml → 1 litro
});

test('ofertas: abastecerse cuando hay descuento y no sobra', () => {
  const art = { catalogo: 'detergente_ropa', unidad: 'g', consumo_mes: 3000, stock: 4000, stock_fecha: HOY.toISOString() };
  const c = [prod('Detergente Rinso 2 kg', 2000, 'g', 4.5, { precio_lista: 6.0 })]; // 25 % off
  const r = recomendar(art, c, { hoy: HOY, horizonte: 15, mesesMax: 3 });
  assert.equal(r.motivo, 'oferta');
  assert.equal(r.paquetes, 2); // capacidad 9000-4000 = 5000 → 2 bolsas de 2 kg
  assert.equal(r.oferta.pct, 25);
  assert.equal(r.oferta.ahorro, 3);
  assert.ok(r.oferta.meses >= 2.6);
  // sin "aprovechar" no sugiere nada
  assert.equal(recomendar(art, c, { hoy: HOY, aprovechar: false }).motivo, null);
  // descuento pequeño (5 %) no cuenta
  assert.equal(recomendar(art, [prod('Detergente Rinso 2 kg', 2000, 'g', 5.7, { precio_lista: 6.0 })], { hoy: HOY }).motivo, null);
  // si igual había que comprar y está en oferta, lleva más
  const urge = recomendar({ ...art, stock: 300 }, c, { hoy: HOY });
  assert.equal(urge.motivo, 'comprar');
  assert.ok(urge.paquetes >= 4 && urge.oferta);
});

test('aprender: el consumo real corrige el estimado', () => {
  // estimado 150 ml/mes; había 100, compró 225; 30 días después quedan 25 → gastó 300 ml/mes
  const art = { catalogo: 'pasta_dental', consumo_mes: 150, stock: 325, stock_fecha: hace(30), ref_stock: 100, ref_fecha: hace(30), compras_desde: 225 };
  const { patch, observado } = reportarStock(art, 25, HOY);
  assert.equal(observado, 300);
  assert.equal(patch.consumo_mes, 210); // 0.6*150 + 0.4*300
  assert.equal(patch.stock, 25);
  assert.equal(patch.compras_desde, 0);
  // muy pocos días: no aprende todavía
  assert.equal(reportarStock({ ...art, ref_fecha: hace(3) }, 25, HOY).patch.consumo_mes, undefined);
  // compra: suma sobre lo estimado
  const c = registrarCompra({ ...art, stock: 100, stock_fecha: hace(6) }, 225, HOY);
  assert.equal(c.stock, 295); // 100 - 30 + 225
  assert.equal(c.compras_desde, 450);
});

test('plan del hogar: agrupa, ordena y suma', () => {
  const arts = [
    { id: 1, catalogo: 'papel_higienico', unidad: 'und', consumo_mes: 21, stock: 1, stock_fecha: HOY.toISOString() },
    { id: 2, catalogo: 'shampoo', unidad: 'ml', consumo_mes: 450, stock: 2000, stock_fecha: HOY.toISOString() },
    { id: 3, catalogo: 'cloro', unidad: 'ml', consumo_mes: 1450, stock: 600, stock_fecha: HOY.toISOString() },
    { id: 4, catalogo: 'suavizante', unidad: 'ml', consumo_mes: 900, stock: 0, stock_fecha: HOY.toISOString(), activo: false },
  ];
  const c = [prod('Papel Higienico Scott 12 Rollos', 12, 'und', 6.5), prod('Shampoo Sedal 400 ml', 400, 'ml', 3.9), prod('Cloro 1 L', 1000, 'ml', 0.95)];
  const p = planHogar(arts, c, { hoy: HOY, horizonte: 15 });
  assert.equal(p.recs.length, 3, 'el inactivo no cuenta');
  assert.equal(p.comprarYa[0].art.catalogo, 'papel_higienico');
  assert.ok(p.pronto.some((r) => r.art.catalogo === 'cloro'));
  assert.ok(p.bien.some((r) => r.art.catalogo === 'shampoo'));
  assert.ok(p.totalCompra > 0 && p.gastoMensual > 0);
  assert.deepEqual(terminosConMarca([{ catalogo: 'shampoo', marca: 'Head & Shoulders' }]), ['shampoo head & shoulders']);
  assert.equal(opcionesProducto({ catalogo: 'shampoo', unidad: 'ml', consumo_mes: 450 }, c).length, 1);
});

test('avisos de la casa: se acaba en ≤ 3 días y ofertas, una sola vez', async () => {
  const { calcularAvisos } = await import('../scraper/alertas.mjs');
  const hoy = '2026-10-12';
  const f = `${hoy}T12:00:00.000Z`;
  const datos = {
    hogar: [
      { id: 1, nombre: 'Papel higiénico', catalogo: 'papel_higienico', unidad: 'und', consumo_mes: 21, stock: 1, stock_fecha: f },
      { id: 2, nombre: 'Detergente para ropa', catalogo: 'detergente_ropa', unidad: 'g', consumo_mes: 3000, stock: 4000, stock_fecha: f },
      { id: 3, nombre: 'Shampoo', catalogo: 'shampoo', unidad: 'ml', consumo_mes: 450, stock: 2000, stock_fecha: f },
    ],
    hogarCands: [
      prod('Papel Higienico Scott 12 Rollos', 12, 'und', 6.5),
      prod('Detergente Rinso 2 kg', 2000, 'g', 4.5, { precio_lista: 6.0, tienda: 'walmart' }),
    ],
    nombresTienda: { walmart: 'Walmart' },
    menuSiguiente: true,
  };
  const a = calcularAvisos(datos, hoy).filter((x) => x.tipo === 'hogar');
  assert.equal(a.length, 2);
  assert.match(a[0].titulo, /Papel higiénico/);
  assert.match(a[1].cuerpo, /Detergente.*−25% en Walmart/);
  const enviados = Object.fromEntries(a.flatMap((x) => x.claves).map((c) => [c, hoy]));
  assert.equal(calcularAvisos({ ...datos, enviados }, hoy).filter((x) => x.tipo === 'hogar').length, 0);
  // si compra papel (cambia stock_fecha) y se vuelve a acabar, avisa otra vez
  const despues = { ...datos, enviados, hogar: datos.hogar.map((x) => (x.id === 1 ? { ...x, stock_fecha: '2026-10-20T12:00:00.000Z', stock: 1 } : x)) };
  assert.equal(calcularAvisos(despues, '2026-10-20').filter((x) => x.tipo === 'hogar' && /Papel/.test(x.titulo)).length, 1);
});

test('casa: productos reales que se colaban (oct 2026)', async () => {
  const { productoValidoHogar } = await import('../web/hogar/necesidades.js');
  const { ARTICULOS_HOGAR } = await import('../web/hogar/catalogo.js');
  const art = (id) => ({ catalogo: id, unidad: ARTICULOS_HOGAR[id].unidad, nombre: ARTICULOS_HOGAR[id].nombre });
  const p = (nombre, unidad, contenido = 3) => ({ nombre, busqueda: nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), unidad, contenido, precio: 1 });
  assert.ok(!productoValidoHogar(art('cepillo_dientes'), p('Cobertor Equate protector Para Cepillo Dental- 3 pzas', 'und')));
  assert.ok(productoValidoHogar(art('cepillo_dientes'), p('Cepillo de Dientes Colgate Triple Acción - 4 Pack', 'und', 4)));
  assert.ok(!productoValidoHogar(art('jabon_bano'), p('4 Pack Jabón Surf Paraíso Tropical 1400 g', 'g', 1400)));
  assert.ok(productoValidoHogar(art('jabon_bano'), p('Jabón de Tocador Equate Barra Antibacterial Ultra Fresh 4 Pack - 440 g', 'g', 440)));
  assert.ok(!productoValidoHogar(art('desinfectante_piso'), p('Blanqueador desinfectante Maxisol aroma limón - 200 ml', 'ml', 200)));
  assert.ok(!productoValidoHogar(art('esponjas'), p('Pinceles de Esponja Pen Gear -15 uds', 'und', 15)));
  assert.ok(!productoValidoHogar(art('servilletas'), p('Dispensador de Servilletas Blanca Suli - 100 unidades', 'und', 100)));
});
