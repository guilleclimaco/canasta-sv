// Robot diario: actualiza precios de todos los términos guardados.
//   node scraper/actualizar.mjs                 Walmart + Maxi + Don Juan + Selectos
//   node scraper/actualizar.mjs --sin-selectos  solo las 3 tiendas VTEX
//   node scraper/actualizar.mjs --solo-selectos solo Selectos (p. ej. desde la compu de casa)
// Variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY, (opcional) SELECTOS=0
import { buscarTodo } from '../supabase/functions/_shared/vtex.mjs';
import { configurado, leerTerminos, registrarPrecios } from './supabase.mjs';

if (!configurado()) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY (ver README).');
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const conSelectos = !args.has('--sin-selectos') && process.env.SELECTOS !== '0';
const soloSelectos = args.has('--solo-selectos');
let huboError = false;

if (!soloSelectos) {
  const terminos = await leerTerminos();
  console.log(`VTEX: ${terminos.length} términos × 3 tiendas...`);
  const { filas, errores } = await buscarTodo(terminos, { max: 40 });
  const cambios = await registrarPrecios(filas);
  console.log(`VTEX: ${filas.length} productos, ${cambios} precios nuevos o cambiados.`);
  if (errores.length) {
    console.warn(`VTEX: ${errores.length} errores. Primeros:`, errores.slice(0, 5));
    // Si fallaron TODAS las consultas, algo cambió en las tiendas: marcar el run como fallido
    if (!filas.length) huboError = true;
  }
}

if (conSelectos || soloSelectos) {
  try {
    const { correrSelectos } = await import('./selectos.mjs');
    await correrSelectos();
  } catch (e) {
    console.warn('Selectos falló (no detiene lo demás):', e.message);
  }
}

process.exit(huboError ? 1 : 0);
