// Estado y utilidades compartidas por app.js y los módulos de web/v4/.

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const dinero = (n) => (n == null || Number.isNaN(n) ? '—' : `$${Number(n).toFixed(2)}`);
export const CATEGORIAS = ['Súper', 'Mercado', 'Limpieza', 'Farmacia', 'Otros'];
export const hoyISO = () => new Date().toLocaleDateString('en-CA');
export const sumarDias = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-CA');
};
export const mesActual = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };
export const nombreMes = (mes) => {
  const t = new Date(`${mes}T12:00:00`).toLocaleDateString('es-SV', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const moverMes = (mes, delta) => { const d = new Date(`${mes}T12:00:00`); d.setMonth(d.getMonth() + delta); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };
export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export const round2 = (n) => Math.round(n * 100) / 100;

let avisoT;
export function aviso(texto) {
  const el = $('#aviso');
  if (!el) return;
  el.textContent = texto;
  el.classList.add('ver');
  clearTimeout(avisoT);
  avisoT = setTimeout(() => el.classList.remove('ver'), 2800);
}
export function errorAviso(e) {
  console.error(e);
  aviso(`Algo falló: ${e?.message || e}`);
}

/** Estado de la app (compartido) */
export const estado = {
  tab: 'lista',
  vistaLista: 'comprar', // 'comprar' | 'casa'
  tiendas: [],
  tiendaMap: {},
  ajustes: { umbral_segunda_tienda: 3, tiendas_cercanas: [] },
  lista: [],
  despensa: [],
  recetasPropias: [],
  resumenPrecios: new Map(),
  mercado: null,
  mes: mesActual(),
  filtroOferta: 'todas',
  soloMiLista: false,
  gastoMes: 0,
  presupuestoMes: 0,
};

/** Datos y funciones que app.js registra para que los módulos las usen */
export const app = {
  D: null,
  render: () => {},
  irA: () => {},
  hojaGasto: () => {},
  pintarMiniPresupuesto: () => {},
  async cargarLista() { estado.lista = await app.D.lista(); },
  async cargarResumenMes() {
    const m = mesActual();
    const [p, g] = await Promise.all([app.D.presupuestos(m), app.D.gastos(m)]);
    estado.presupuestoMes = p.reduce((s, x) => s + x.monto, 0);
    estado.gastoMes = g.reduce((s, x) => s + x.monto, 0);
  },
};

export const tiendaNombre = (id) => estado.tiendaMap[id]?.nombre || id;
export const tiendaCorta = (id) => (tiendaNombre(id) || '').replace('La Despensa de ', '').replace('Súper ', '');
export const chip = (id) => `<span class="chip" style="--c:${esc(estado.tiendaMap[id]?.color || '#448fa3')}">${esc(tiendaCorta(id))}</span>`;
export const tiendasActivas = () => {
  const t = estado.ajustes.tiendas_cercanas;
  return Array.isArray(t) && t.length ? t : estado.tiendas.map((x) => x.id);
};

/** Mejor producto elegido de un artículo de la lista, entre las tiendas activas (o una tienda dada) */
export function mejorOpcion(item, tienda = null) {
  const act = tienda ? [tienda] : tiendasActivas();
  return (item.opciones || []).filter((o) => act.includes(o.tienda)).sort((a, b) => a.precio - b.precio)[0] || null;
}

// ---------------------------------------------------------------- hoja inferior
export function abrirHoja(html, { clase = '' } = {}) {
  cerrarHoja();
  const fondo = document.createElement('div');
  fondo.className = 'fondo';
  fondo.onclick = cerrarHoja;
  const hoja = document.createElement('div');
  hoja.className = `hoja ${clase}`.trim();
  hoja.setAttribute('role', 'dialog');
  hoja.innerHTML = `<div class="asa"></div>${html}`;
  document.body.append(fondo, hoja);
  document.body.style.overflow = 'hidden';
  return hoja;
}
const alCerrar = new Set();
/** Para liberar recursos (ej. la cámara) cuando se cierra la hoja */
export function alCerrarHoja(fn) { alCerrar.add(fn); }
export function cerrarHoja() {
  alCerrar.forEach((fn) => { try { fn(); } catch { /* nada */ } });
  alCerrar.clear();
  $$('.fondo, .hoja').forEach((e) => e.remove());
  document.body.style.overflow = '';
}

/** Carga un script UMD de un CDN una sola vez (librerías pesadas solo cuando se usan) */
const cargados = new Map();
export function cargarScript(src) {
  if (!cargados.has(src)) {
    cargados.set(src, new Promise((ok, mal) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = () => { cargados.delete(src); mal(new Error(`No se pudo cargar ${src}`)); };
      document.head.append(s);
    }));
  }
  return cargados.get(src);
}

/** Lee/escribe en localStorage sin romper si no está disponible */
export const local = {
  leer(k, def = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
};
