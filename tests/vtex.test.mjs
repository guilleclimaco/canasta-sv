// node --test tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { parsearContenido, parsearProducto, normalizar, buscarTodo } from '../supabase/functions/_shared/vtex.mjs';

// Estructura real de la API de catálogo VTEX (campos verificados en maxidespensa.com.sv, oct 2026)
const productoVTEX = {
  productId: '123', productName: 'Arroz Omoa Blanco 1814 g', brand: 'Omoa', linkText: 'arroz-omoa-blanco-1814-g',
  link: 'https://www.maxidespensa.com.sv/arroz-omoa-blanco-1814-g/p',
  items: [{
    itemId: '51682', name: 'Arroz Omoa Blanco 1814 g', nameComplete: 'Arroz Omoa Blanco 1814 g',
    ean: '7421000812345', measurementUnit: 'un', images: [{ imageUrl: 'https://x/img.jpg' }],
    sellers: [{ sellerId: '1', sellerDefault: true, commertialOffer: { Price: 2.5, ListPrice: 2.6, PriceWithoutDiscount: 2.6, AvailableQuantity: 99, IsAvailable: true } }],
  }],
};

test('normalizar quita tildes y mayúsculas', () => {
  assert.equal(normalizar('  Azúcar  BLANCA Ñ '), 'azucar blanca n');
});

test('contenido: gramos, libras, litros y packs', () => {
  assert.deepEqual(parsearContenido('Arroz Blanco San Francisco 1816gr'), { contenido: 1816, unidad: 'g' });
  assert.deepEqual(parsearContenido('Leche Semidescremada Dos Pinos -1 L'), { contenido: 1000, unidad: 'ml' });
  assert.deepEqual(parsearContenido('Frijol rojo 2 lb'), { contenido: 907.18, unidad: 'g' });
  assert.deepEqual(parsearContenido('Leche de soya Incaparina 6 Pack - 1200 ml'), { contenido: 1200, unidad: 'ml' }); // 6 × 200 ml
  assert.deepEqual(parsearContenido('Coca Cola 6 x 355 ml'), { contenido: 2130, unidad: 'ml' });
  assert.deepEqual(parsearContenido('Aceite Orisol 1,5 lt'), { contenido: 1500, unidad: 'ml' });
  assert.deepEqual(parsearContenido('Pirujito De Leche - Precio Por Unidad'), { contenido: 1, unidad: 'und' });
  assert.deepEqual(parsearContenido('Huevos Blancos Grandes 30 Huevos'), { contenido: 30, unidad: 'und' });
  assert.deepEqual(parsearContenido('Tomate Cosecha por libra'), { contenido: 453.59, unidad: 'g' });
  assert.deepEqual(parsearContenido('Papa Blanca Lb'), { contenido: 453.59, unidad: 'g' });
  assert.deepEqual(parsearContenido('Cilantro manojo'), { contenido: 1, unidad: 'und' });
  assert.deepEqual(parsearContenido('Papel Higienico Scott 12 Rollos'), { contenido: 12, unidad: 'und' });
  assert.deepEqual(parsearContenido('Salsa de tomate'), { contenido: null, unidad: null });
});

test('contenido: nombres reales de productos a granel (oct 2026)', () => {
  const lb = { contenido: 453.59, unidad: 'g' };
  assert.deepEqual(parsearContenido('Tomate de Cocina - 2 a 4 Unidades, precio Indicado Por Libra (454 g)'), lb);
  assert.deepEqual(parsearContenido('Aguacate Hortifruti Hass - 2 Unidades, precio Indicado Por Libra (454 g)'), lb);
  assert.deepEqual(parsearContenido('Pechuga Pollo Indio congelada, de 10 libras aproximadamente - Precio indicado por libra'), lb);
  assert.deepEqual(parsearContenido('Filete De Tilapia Sin Piel De 5 A 7 onz - Precio Indicado Por Libra (454 g)'), lb);
  assert.deepEqual(parsearContenido('Filete De Tilapia Sin Piel -Precio Por Lb'), lb);
  assert.deepEqual(parsearContenido('Papaya Tainung Hortifruti - Peso Aproximado 2 a 6 libras, precio Indicado Por Libra (454 g)'), lb);
  assert.deepEqual(parsearContenido('Papa Americana Red 5 Libras - 15 a 20 Unidades Aproximadamente, precio Indicado Por Libra (454 g)'), { contenido: 2267.95, unidad: 'g' });
  assert.deepEqual(parsearContenido('Papa Súper en Red 3 Libras - 6 a 9 Unidades Aproximadamente (1 Lb= 454 g)'), { contenido: 1360.78, unidad: 'g' });
  assert.deepEqual(parsearContenido('Huevo Mediano Catalana 15U 735 g A 825 g'), { contenido: 15, unidad: 'und' });
  assert.deepEqual(parsearContenido('Yuca Red - 5 Unidades Aproximadamente'), { contenido: 5, unidad: 'und' });
  assert.deepEqual(parsearContenido('Arroz 5 Estrellas Blanco 2 Pack - 4540 g'), { contenido: 4540, unidad: 'g' });
  assert.deepEqual(parsearContenido('Arroz Preco San Francisco 2pack 3632gr'), { contenido: 3632, unidad: 'g' });
  assert.deepEqual(parsearContenido('Huevo Santa Fe extra grande 30 uds -1900 g'), { contenido: 1900, unidad: 'g' });
});

test('parsearProducto produce la fila esperada', () => {
  const [f] = parsearProducto('maxi', 'https://www.maxidespensa.com.sv', productoVTEX);
  assert.equal(f.tienda, 'maxi');
  assert.equal(f.sku, '51682');
  assert.equal(f.ean, '7421000812345');
  assert.equal(f.precio, 2.5);
  assert.equal(f.precio_lista, 2.6);
  assert.equal(f.contenido, 1814);
  assert.equal(f.disponible, true);
  assert.match(f.busqueda, /arroz omoa blanco/);
});

test('a granel usa measurementUnit/unitMultiplier si el nombre no trae tamaño', () => {
  const granel = structuredClone(productoVTEX);
  granel.items[0].nameComplete = 'Tomate Cosecha';
  granel.items[0].measurementUnit = 'kg';
  granel.items[0].unitMultiplier = 0.5;
  const [f] = parsearProducto('walmart', '', granel);
  assert.equal(f.contenido, 500);
  assert.equal(f.unidad, 'g');
});

test('parsearProducto ignora productos sin precio (agotados)', () => {
  const agotado = structuredClone(productoVTEX);
  agotado.items[0].sellers[0].commertialOffer.Price = 0;
  assert.equal(parsearProducto('maxi', '', agotado).length, 0);
});

test('buscarTodo consulta las 3 tiendas y quita duplicados', async () => {
  const llamadas = [];
  const fetchFalso = async (url) => {
    llamadas.push(url);
    return { ok: true, status: 200, json: async () => [productoVTEX, productoVTEX] };
  };
  const { filas, errores } = await buscarTodo(['arroz'], { fetchImpl: fetchFalso });
  assert.equal(llamadas.length, 3);
  assert.ok(llamadas.every((u) => u.includes('/api/catalog_system/pub/products/search?ft=arroz')));
  assert.equal(filas.length, 3); // una por tienda
  assert.equal(errores.length, 0);
});

test('buscarTodo reporta errores sin caerse', async () => {
  const fetchFalso = async () => ({ ok: false, status: 503, json: async () => null });
  const { filas, errores } = await buscarTodo(['arroz'], { fetchImpl: fetchFalso });
  assert.equal(filas.length, 0);
  assert.equal(errores.length, 3);
});
