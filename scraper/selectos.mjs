// Súper Selectos: su tienda en línea es una app Blazor con Cloudflare y NO tiene API pública.
// Este robot abre la página con un navegador real (Playwright), recorre las categorías
// y lee los precios del HTML.
//
// ⚠ ESTADO: VERIFICAR. Se escribió sin poder probarlo contra la página real
//   (el 2026-10-09 la página respondía "The service is unavailable" a pruebas automáticas).
//   Antes de activarlo, Claude Code debe correr:
//       node scraper/selectos.mjs --descubrir
//   revisar lo que guarda en scraper/selectos-debug/ y ajustar extraerTarjetas() si hace falta.
//
// Uso:
//   node scraper/selectos.mjs --descubrir   guarda HTML + captura + muestra, no escribe en la base
//   node scraper/selectos.mjs --seco        recorre todo e imprime, no escribe en la base
//   node scraper/selectos.mjs               recorre y guarda en Supabase (lo llama actualizar.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizar, parsearContenido } from '../supabase/functions/_shared/vtex.mjs';
import { configurado, registrarPrecios } from './supabase.mjs';

const BASE = 'https://www.superselectos.com';
const MAX_PAGINAS = Number(process.env.SELECTOS_MAX_PAGINAS || 80);
const PAUSA_MS = 2500; // cortesía: una página cada 2.5 s
const DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * Se ejecuta DENTRO de la página. Busca tarjetas de producto de forma genérica:
 * un enlace con ?productId= y, subiendo en el DOM, el contenedor que tiene un precio "$".
 */
export function extraerTarjetas() {
  const out = [];
  const vistos = new Set();
  const idDe = (href) => {
    try { return new URL(href, location.href).searchParams.get('productId'); } catch { return null; }
  };
  for (const a of document.querySelectorAll('a[href*="productId="]')) {
    const id = idDe(a.getAttribute('href'));
    if (!id || vistos.has(id)) continue;
    let card = a;
    for (let k = 0; k < 7 && card && !/\$\s?\d/.test(card.innerText || ''); k++) card = card.parentElement;
    if (!card) continue;
    const ids = new Set([...card.querySelectorAll('a[href*="productId="]')].map((x) => idDe(x.getAttribute('href'))));
    if (ids.size > 1) continue; // subimos demasiado: el contenedor tiene varios productos
    vistos.add(id);

    const texto = card.innerText || '';
    const promo = texto.match(/(\d+)\s*[xX]\s*\$\s?(\d+(?:[.,]\d{1,2})?)/);
    const montos = [...texto.matchAll(/\$\s?(\d+(?:[.,]\d{1,2})?)/g)]
      .filter((m) => !(promo && m.index >= promo.index && m.index <= promo.index + promo[0].length))
      .map((m) => parseFloat(m[1].replace(',', '.')))
      .filter((n) => n > 0);
    const tachado = card.querySelector('del, s, strike, [class*="tachad"], [class*="old"], [class*="antes"], [class*="before"]');
    const precioTachado = tachado ? parseFloat((tachado.innerText.match(/\d+(?:[.,]\d{1,2})?/) || [''])[0].replace(',', '.')) : null;

    const limpiar = (s) => s.replace(/\d+\s*[xX]\s*\$\s?\d+(?:[.,]\d+)?/g, '').replace(/\$\s?\d+(?:[.,]\d+)?/g, '').trim();
    const util = (s) => s.length > 3 && !/agregar|añadir|seleccione|oferta|ver m[aá]s|^\d+$|^[\d\s.,%-]+$/i.test(s);
    const textoEnlace = limpiar(a.innerText || '');
    const lineas = texto.split('\n').map(limpiar).filter(util);
    const nombre = (a.getAttribute('title') || '').trim()
      || (util(textoEnlace) ? textoEnlace : '')
      || lineas.sort((x, y) => y.length - x.length)[0] || '';
    const img = card.querySelector('img');
    out.push({
      id,
      nombre,
      montos,
      precioTachado,
      promo: promo ? `${promo[1]}x$${promo[2]}` : null,
      imagen: img ? (img.currentSrc || img.src) : null,
      url: new URL(a.getAttribute('href'), location.href).href,
    });
  }
  return out;
}

/** Convierte lo extraído en filas para registrar_precios */
export function aFila(t) {
  if (!t.nombre || !t.montos.length) return null;
  const precio = Math.min(...t.montos);
  const lista = Math.max(precio, t.precioTachado || 0, ...t.montos);
  const nombre = t.promo ? `${t.nombre} (promo ${t.promo})` : t.nombre;
  const { contenido, unidad } = parsearContenido(t.nombre);
  return {
    tienda: 'selectos',
    sku: String(t.id),
    ean: null,
    nombre,
    busqueda: normalizar(t.nombre),
    marca: null,
    url: t.url,
    imagen: t.imagen,
    contenido,
    unidad,
    precio: Math.round(precio * 100) / 100,
    precio_lista: Math.round(lista * 100) / 100,
    disponible: true,
  };
}

async function bloqueado(page) {
  const txt = (await page.textContent('body').catch(() => '')) || '';
  return /service is unavailable|just a moment|attention required|verify you are human/i.test(txt);
}

async function cargarTodo(page) {
  // desplazarse para cargar imágenes/productos perezosos y apretar "Ver más" si existe
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(400);
    const boton = page.getByRole('button', { name: /ver m[aá]s|cargar m[aá]s|mostrar m[aá]s|siguiente/i }).first();
    if (await boton.isVisible().catch(() => false)) {
      await boton.click().catch(() => {});
      await page.waitForTimeout(1200);
    }
  }
}

export async function correrSelectos({ modo = 'normal' } = {}) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    locale: 'es-SV',
    viewport: { width: 1366, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  const productos = new Map();
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
    if (await bloqueado(page)) {
      console.warn('⚠ Selectos bloqueó o no está disponible. Se omite hoy.');
      return { filas: 0, bloqueado: true };
    }
    const enlaces = await page.$$eval('a[href]', (as) =>
      [...new Set(as.map((a) => a.href).filter((h) => /\/products\?category=|\/products-landing\/|\/special-deals/.test(h)))]);
    const paginas = [BASE, ...enlaces].slice(0, MAX_PAGINAS);
    console.log(`Selectos: ${enlaces.length} páginas de categorías/ofertas encontradas, recorro ${paginas.length}.`);

    if (modo === 'descubrir') {
      const dir = path.join(DIR, 'selectos-debug');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'home.html'), await page.content());
      await page.screenshot({ path: path.join(dir, 'home.png'), fullPage: false });
      if (enlaces[0]) {
        await page.goto(enlaces[0], { waitUntil: 'networkidle', timeout: 60000 });
        await cargarTodo(page);
        fs.writeFileSync(path.join(dir, 'categoria.html'), await page.content());
        await page.screenshot({ path: path.join(dir, 'categoria.png'), fullPage: true });
      }
      const muestra = await page.evaluate(extraerTarjetas);
      fs.writeFileSync(path.join(dir, 'muestra.json'), JSON.stringify(muestra.slice(0, 30), null, 2));
      fs.writeFileSync(path.join(dir, 'enlaces.json'), JSON.stringify(enlaces, null, 2));
      console.log(`Muestra: ${muestra.length} tarjetas. Revisa scraper/selectos-debug/ (muestra.json, *.html, *.png).`);
      console.log(muestra.slice(0, 5));
      return { filas: 0 };
    }

    for (const [i, url] of paginas.entries()) {
      try {
        if (i > 0) await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        if (await bloqueado(page)) {
          console.warn(`⚠ Bloqueado en ${url}; me detengo para no insistir.`);
          break;
        }
        await cargarTodo(page);
        const tarjetas = await page.evaluate(extraerTarjetas);
        for (const t of tarjetas) {
          const f = aFila(t);
          if (f) productos.set(f.sku, f);
        }
        console.log(`  [${i + 1}/${paginas.length}] ${tarjetas.length} tarjetas — total ${productos.size}`);
      } catch (e) {
        console.warn(`  Falló ${url}: ${e.message}`);
      }
      await page.waitForTimeout(PAUSA_MS);
    }
  } finally {
    await browser.close();
  }

  const filas = [...productos.values()];
  if (modo === 'seco' || !configurado()) {
    console.log(filas.slice(0, 20));
    console.log(`(modo seco) ${filas.length} productos de Selectos; no se guardó nada.`);
    return { filas: filas.length };
  }
  const cambios = await registrarPrecios(filas);
  console.log(`Selectos: ${filas.length} productos, ${cambios} precios nuevos o cambiados.`);
  return { filas: filas.length, cambios };
}

// Ejecutado directamente
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const modo = process.argv.includes('--descubrir') ? 'descubrir' : process.argv.includes('--seco') ? 'seco' : 'normal';
  correrSelectos({ modo }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
