// Precios de mercados: lee el "Informe semanal de precios en mercados y tiendas mayoristas"
// de la Defensoría del Consumidor (PDF) y lo guarda en la tabla precios_mercado.
//
// ⚠ VERIFICAR con un informe real (README, paso de mercado):
//     node scraper/mercado.mjs --seco                      (busca el último y muestra lo que entiende)
//     node scraper/mercado.mjs --pdf ruta\al\informe.pdf --seco
//
// Corre una vez por semana desde el workflow (no pasa nada si ya está guardado).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearSondeo, fechaDeArchivo, ingredienteDeMercado } from '../web/menu/mercado.js';
import { configurado } from './supabase.mjs';

const BASE = 'https://www.defensoria.gob.sv';
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; CanastaSV/1.0; uso personal)' };
const NOMBRE = 'Informe-comunicacional-sondeo-de-precios-en-mercados-y-tiendas-mayoristas';

/** Texto del PDF agrupado en líneas (de arriba hacia abajo, de izquierda a derecha) */
export async function lineasDePdf(datos) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(datos), useSystemFonts: true, isEvalSupported: false }).promise;
  const lineas = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    const { items } = await pagina.getTextContent();
    const filas = new Map();
    for (const it of items) {
      if (!it.str?.trim()) continue;
      const y = Math.round(it.transform[5] / 3) * 3; // tolera pequeñas diferencias de altura
      if (!filas.has(y)) filas.set(y, []);
      filas.get(y).push({ x: it.transform[4], s: it.str });
    }
    [...filas.entries()].sort((a, b) => b[0] - a[0])
      .forEach(([, partes]) => lineas.push(partes.sort((a, b) => a.x - b.x).map((p) => p.s.trim()).join(' ')));
  }
  return lineas;
}

/** Busca las URLs de los informes más recientes */
export async function buscarInformes({ semanas = 12, fetchImpl = fetch } = {}) {
  const urls = new Set();
  // 1) API de WordPress (si está abierta)
  try {
    const r = await fetchImpl(`${BASE}/wp-json/wp/v2/media?search=mercados-y-tiendas-mayoristas&per_page=20&orderby=date&order=desc&_fields=source_url`, { headers: UA });
    if (r.ok) for (const m of await r.json()) if (m.source_url?.includes(NOMBRE)) urls.add(m.source_url);
  } catch { /* sigue con el plan B */ }
  if (urls.size) return ordenar([...urls]);

  // 2) Adivinar: el sondeo cierra en domingo y el PDF se sube ese mes o meses después
  const hoy = new Date();
  const domingo = new Date(hoy);
  domingo.setDate(hoy.getDate() - hoy.getDay());
  for (let i = 0; i < semanas && !urls.size; i++) {
    const d = new Date(domingo);
    d.setDate(domingo.getDate() - 7 * i);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    for (let m = 0; m <= 4; m++) {
      const sub = new Date(yyyy, d.getMonth() + m, 1);
      if (sub > hoy) break;
      const url = `${BASE}/wp-content/uploads/${sub.getFullYear()}/${String(sub.getMonth() + 1).padStart(2, '0')}/${dd}.${mm}.${yyyy}_${NOMBRE}-${yyyy}.pdf`;
      try {
        const r = await fetchImpl(url, { method: 'HEAD', headers: UA });
        if (r.ok) { urls.add(url); break; }
      } catch { /* sigue */ }
      await new Promise((res) => setTimeout(res, 150));
    }
  }
  return ordenar([...urls]);
}
const ordenar = (urls) => urls.sort((a, b) => String(fechaDeArchivo(b)).localeCompare(String(fechaDeArchivo(a))));

async function yaGuardado(fecha) {
  const URL_BASE = process.env.SUPABASE_URL.replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  const h = { apikey: KEY, ...(KEY.startsWith('sb_') ? {} : { Authorization: `Bearer ${KEY}` }) };
  const r = await fetch(`${URL_BASE}/rest/v1/precios_mercado?fecha=eq.${fecha}&select=fecha&limit=1`, { headers: h });
  return r.ok && (await r.json()).length > 0;
}

async function guardar(filas) {
  const URL_BASE = process.env.SUPABASE_URL.replace(/\/$/, '');
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  const h = {
    apikey: KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
    ...(KEY.startsWith('sb_') ? {} : { Authorization: `Bearer ${KEY}` }),
  };
  // la clave primaria no admite unidad nula
  const limpias = filas.map((f) => ({ ...f, unidad: f.unidad || '' }));
  const r = await fetch(`${URL_BASE}/rest/v1/precios_mercado?on_conflict=fecha,producto,unidad`, {
    method: 'POST', headers: h, body: JSON.stringify(limpias),
  });
  if (!r.ok) throw new Error(`No se pudo guardar: ${r.status} ${await r.text()}`);
}

export async function correrMercado({ seco = false, pdf = null } = {}) {
  let datos;
  let fuente;
  let fecha;
  if (pdf) {
    datos = fs.readFileSync(pdf);
    fuente = path.basename(pdf);
    fecha = fechaDeArchivo(fuente) || new Date().toISOString().slice(0, 10);
  } else {
    const urls = await buscarInformes();
    if (!urls.length) { console.warn('⚠ No encontré informes recientes de la Defensoría.'); return { filas: 0 }; }
    fuente = urls[0];
    fecha = fechaDeArchivo(fuente);
    console.log(`Informe más reciente: ${fecha} → ${fuente}`);
    if (!seco && configurado() && await yaGuardado(fecha)) { console.log('Ya estaba guardado.'); return { filas: 0 }; }
    const r = await fetch(fuente, { headers: UA });
    if (!r.ok) throw new Error(`No se pudo bajar el PDF: ${r.status}`);
    datos = Buffer.from(await r.arrayBuffer());
  }
  const lineas = await lineasDePdf(datos);
  const filas = parsearSondeo(lineas, fecha).map((f) => ({ ...f, fuente }));
  const conIngrediente = filas.filter((f) => ingredienteDeMercado(f.producto));
  console.log(`Mercado ${fecha}: ${filas.length} productos leídos, ${conIngrediente.length} se usan en el menú.`);
  if (seco || !configurado()) {
    console.table(filas.slice(0, 40).map((f) => ({ cat: f.categoria, producto: f.producto, cant: f.cantidad, unidad: f.unidad, promedio: f.promedio, ingrediente: ingredienteDeMercado(f.producto)?.ing || '' })));
    if (!filas.length) console.log('Primeras líneas del PDF:', lineas.slice(0, 40));
    return { filas: filas.length };
  }
  if (filas.length) await guardar(filas);
  return { filas: filas.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--pdf');
  correrMercado({ seco: args.includes('--seco'), pdf: i >= 0 ? args[i + 1] : null }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
