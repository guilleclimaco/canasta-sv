// Ticket con foto: lee el total, la fecha y la tienda para registrar el gasto.
// Por defecto se lee DENTRO del celular con Tesseract.js ($0, no sale de tu teléfono).
// Si la IA está activada (Ajustes), se puede leer con IA, que se equivoca menos con fotos malas.
import { cargarScript, estado, app } from '../nucleo.js';

const TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';

const TIENDAS_TICKET = [
  ['walmart', /wal\s*-?\s*mart/i],
  ['maxi', /maxi\s*despensa|maxi/i],
  ['donjuan', /despensa\s*de\s*don\s*juan|don\s*juan/i],
  ['selectos', /selectos|calleja/i],
  ['Mercado', /mercado|tiendona/i],
];

const MONTO = /(\d{1,4}(?:[.,]\d{3})*[.,]\d{2})(?!\d)/g;
const aNumero = (s) => {
  const t = s.replace(/\s/g, '');
  // "1,234.56" o "1.234,56" o "12.50" o "12,50"
  const dec = t.match(/[.,](\d{2})$/);
  const entero = t.slice(0, dec ? -3 : undefined).replace(/[.,]/g, '');
  return Number(`${entero}.${dec ? dec[1] : '00'}`);
};

/**
 * Busca el total en el texto del ticket.
 * Prioridad: línea con "TOTAL" (sin "SUB", "IVA", "AHORRO", "CAMBIO", "EFECTIVO"), luego "A PAGAR"/"VENTA",
 * y si no hay, el monto más grande razonable.
 */
export function parsearTicket(texto) {
  const lineas = String(texto || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const montosDe = (l) => [...l.matchAll(MONTO)].map((m) => aNumero(m[1])).filter((n) => n > 0 && n < 5000);
  const malas = /sub\s*-?\s*total|iva|impuesto|ahorr|descuento|cambio|efectivo|recibido|vuelto|propina|puntos|tarjeta\s*\*/i;
  let total = null;
  for (const re of [/\btotal\b/i, /a\s*pagar|total\s*venta|venta\s*total|monto\s*total/i]) {
    for (let i = 0; i < lineas.length && total == null; i++) {
      const l = lineas[i];
      if (!re.test(l) || malas.test(l)) continue;
      const m = montosDe(l);
      if (m.length) total = m.at(-1);
      else if (lineas[i + 1] && montosDe(lineas[i + 1]).length) total = montosDe(lineas[i + 1]).at(-1); // el monto quedó en la línea de abajo
    }
    if (total != null) break;
  }
  if (total == null) {
    const todos = lineas.filter((l) => !malas.test(l)).flatMap(montosDe);
    if (todos.length) total = Math.max(...todos);
  }
  let fecha = null;
  const f = String(texto).match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (f) {
    const [d, m, a] = [Number(f[1]), Number(f[2]), Number(f[3].length === 2 ? `20${f[3]}` : f[3])];
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && a >= 2020 && a <= 2100) fecha = `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const tienda = TIENDAS_TICKET.find(([, re]) => re.test(texto))?.[0] || null;
  return { total, fecha, tienda };
}

/** Reduce la foto (los celulares toman fotos enormes) y la devuelve como canvas */
async function prepararImagen(archivo, maxLado = 1600) {
  const bmp = await createImageBitmap(archivo);
  const f = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * f);
  c.height = Math.round(bmp.height * f);
  const ctx = c.getContext('2d');
  ctx.filter = 'grayscale(1) contrast(1.4)';
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}

/** Lee el ticket en el celular (sin internet más allá de bajar el lector la primera vez) */
export async function leerTicketLocal(archivo, alProgreso = () => {}) {
  await cargarScript(TESSERACT);
  const imagen = await prepararImagen(archivo);
  const worker = await window.Tesseract.createWorker('spa', 1, {
    logger: (m) => m.status === 'recognizing text' && alProgreso(Math.round(m.progress * 100)),
  });
  try {
    const { data } = await worker.recognize(imagen);
    return { ...parsearTicket(data.text), texto: data.text, metodo: 'celular' };
  } finally {
    await worker.terminate();
  }
}

/** Lee el ticket con IA (cuesta una fracción de centavo por foto) */
export async function leerTicketIA(archivo) {
  const c = await prepararImagen(archivo, 1400);
  const base64 = c.toDataURL('image/jpeg', 0.8).split(',')[1];
  const r = await app.D.ideasIA({ modo: 'ticket', imagen: base64 });
  return { total: r.total ?? null, fecha: r.fecha ?? null, tienda: r.tienda ?? null, metodo: 'ia' };
}

export const iaActiva = () => !!estado.ajustes.ia?.activa;
