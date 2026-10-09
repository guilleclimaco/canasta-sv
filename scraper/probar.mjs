// Prueba rápida SIN base de datos: compara un producto en las 3 tiendas VTEX.
//   node scraper/probar.mjs "arroz omoa"
import { buscarTodo, TIENDAS_VTEX } from '../supabase/functions/_shared/vtex.mjs';

const termino = process.argv.slice(2).join(' ') || 'arroz';
console.log(`Buscando "${termino}" en ${Object.values(TIENDAS_VTEX).map((t) => t.nombre).join(', ')}...\n`);
const { filas, errores } = await buscarTodo([termino], { max: 15 });

// Agrupar por código de barras para ver el mismo producto en distintas tiendas
const grupos = new Map();
for (const f of filas) {
  const k = f.ean || `${f.tienda}:${f.sku}`;
  if (!grupos.has(k)) grupos.set(k, []);
  grupos.get(k).push(f);
}
const comparables = [...grupos.values()].filter((g) => new Set(g.map((f) => f.tienda)).size > 1);

for (const g of comparables.slice(0, 15)) {
  g.sort((a, b) => a.precio - b.precio);
  console.log(`• ${g[0].nombre}`);
  for (const f of g) {
    const oferta = f.precio_lista > f.precio ? `  (antes $${f.precio_lista.toFixed(2)})` : '';
    console.log(`    ${f.tienda.padEnd(8)} $${f.precio.toFixed(2)}${oferta}`);
  }
}
console.log(`\n${filas.length} productos encontrados, ${comparables.length} están en más de una tienda.`);
if (errores.length) console.log('Errores:', errores);
