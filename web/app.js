import { crearDatos, normalizar } from './datos.js';
import { optimizar, precioUnitario, round2 } from './optimizador.js';

// ---------------------------------------------------------------- utilidades
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const dinero = (n) => (n == null || Number.isNaN(n) ? '—' : `$${Number(n).toFixed(2)}`);
const CATEGORIAS = ['Súper', 'Mercado', 'Limpieza', 'Farmacia', 'Otros'];
const mesActual = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };
const nombreMes = (mes) => {
  const t = new Date(`${mes}T12:00:00`).toLocaleDateString('es-SV', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const moverMes = (mes, delta) => { const d = new Date(`${mes}T12:00:00`); d.setMonth(d.getMonth() + delta); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

let avisoT;
function aviso(texto) {
  const el = $('#aviso');
  el.textContent = texto;
  el.classList.add('ver');
  clearTimeout(avisoT);
  avisoT = setTimeout(() => el.classList.remove('ver'), 2600);
}
function errorAviso(e) {
  console.error(e);
  aviso(`Algo falló: ${e?.message || e}`);
}

const ICONOS = {
  lista: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/></svg>',
  comparar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
  ofertas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5" fill="currentColor"/></svg>',
  gastos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/></svg>',
  ajustes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
};
const PESTANAS = [
  ['lista', 'Lista'],
  ['comparar', 'Dónde comprar'],
  ['ofertas', 'Ofertas'],
  ['gastos', 'Gastos'],
];

// ---------------------------------------------------------------- estado
const estado = {
  tab: 'lista',
  tiendas: [],
  tiendaMap: {},
  ajustes: { umbral_segunda_tienda: 3, tiendas_cercanas: [] },
  lista: [],
  mes: mesActual(),
  filtroOferta: 'todas',
  soloMiLista: false,
  gastoMes: 0,
  presupuestoMes: 0,
};
let D;

const tiendaNombre = (id) => estado.tiendaMap[id]?.nombre || id;
const tiendaCorta = (id) => (tiendaNombre(id) || '').replace('La Despensa de ', '').replace('Súper ', '');
const chip = (id) => `<span class="chip" style="--c:${esc(estado.tiendaMap[id]?.color || '#94a3b8')}">${esc(tiendaCorta(id))}</span>`;
const tiendasActivas = () => {
  const t = estado.ajustes.tiendas_cercanas;
  return Array.isArray(t) && t.length ? t : estado.tiendas.map((x) => x.id);
};

// ---------------------------------------------------------------- arranque
async function iniciar() {
  try {
    D = await crearDatos();
    if (!D.demo) {
      const u = await D.usuario();
      if (!u) return pantallaLogin();
      if (!(await D.esMiembro())) return pantallaNoMiembro(u.email);
    }
    await cargarBase();
    montarShell();
    addEventListener('hashchange', () => irA(location.hash.slice(1)));
    irA(location.hash.slice(1) || 'lista');
    D.escucharLista(
      debounce(async () => {
        await cargarLista();
        if (estado.tab === 'lista' || estado.tab === 'comparar') render();
      }, 400),
    );
  } catch (e) {
    $('#app').innerHTML = `<div class="vacio"><b>No se pudo abrir la app</b>${esc(e.message || e)}<br><br><button class="btn-secundario" onclick="location.reload()">Reintentar</button></div>`;
    console.error(e);
  }
}

async function cargarBase() {
  const [tiendas, ajustes] = await Promise.all([D.tiendas(), D.ajustes()]);
  estado.tiendas = tiendas;
  estado.tiendaMap = Object.fromEntries(tiendas.map((t) => [t.id, t]));
  estado.ajustes = { ...estado.ajustes, ...ajustes };
  await Promise.all([cargarLista(), cargarResumenMes()]);
}
async function cargarLista() {
  estado.lista = await D.lista();
}
async function cargarResumenMes() {
  const m = mesActual();
  const [p, g] = await Promise.all([D.presupuestos(m), D.gastos(m)]);
  estado.presupuestoMes = p.reduce((s, x) => s + x.monto, 0);
  estado.gastoMes = g.reduce((s, x) => s + x.monto, 0);
}

// ---------------------------------------------------------------- login
function pantallaLogin() {
  $('#app').innerHTML = `
    <div class="login"><div class="caja-login">
      <h1>Canasta</h1>
      <p>Lista del súper, presupuesto y dónde sale más barato.</p>
      <form id="f-email">
        <label class="campo">Tu correo<input type="email" name="email" required autocomplete="email" inputmode="email" placeholder="tucorreo@gmail.com"></label>
        <button class="btn-primario">Mandarme un código</button>
      </form>
      <form id="f-codigo" hidden>
        <label class="campo">Código de 6 dígitos que te llegó al correo<input name="codigo" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" maxlength="8"></label>
        <button class="btn-primario">Entrar</button>
        <button type="button" class="btn-texto" id="otro-correo">Usar otro correo</button>
      </form>
      <div class="error" id="error"></div>
    </div></div>`;
  let email = '';
  $('#f-email').onsubmit = async (ev) => {
    ev.preventDefault();
    const btn = ev.submitter;
    btn.disabled = true;
    $('#error').textContent = '';
    try {
      email = new FormData(ev.target).get('email').trim().toLowerCase();
      await D.pedirCodigo(email);
      $('#f-email').hidden = true;
      $('#f-codigo').hidden = false;
      $('#f-codigo input').focus();
    } catch (e) {
      $('#error').textContent = e.message || 'No se pudo mandar el código.';
    } finally {
      btn.disabled = false;
    }
  };
  $('#f-codigo').onsubmit = async (ev) => {
    ev.preventDefault();
    const btn = ev.submitter;
    btn.disabled = true;
    try {
      await D.verificarCodigo(email, new FormData(ev.target).get('codigo').trim());
      location.reload();
    } catch (e) {
      $('#error').textContent = 'Código incorrecto o vencido. Intenta de nuevo.';
      btn.disabled = false;
    }
  };
  $('#otro-correo').onclick = () => pantallaLogin();
}

function pantallaNoMiembro(email) {
  $('#app').innerHTML = `
    <div class="login"><div class="caja-login">
      <h1>Casi…</h1>
      <p><b>${esc(email)}</b> todavía no está en la lista de miembros del hogar.
      Pídele a quien administra la app que lo agregue en la tabla <code>miembros</code> de Supabase.</p>
      <button class="btn-secundario" id="salir">Cerrar sesión</button>
    </div></div>`;
  $('#salir').onclick = async () => { await D.salir(); location.reload(); };
}

// ---------------------------------------------------------------- shell
function montarShell() {
  $('#app').innerHTML = `
    <header class="cabecera">
      <div class="marca">Canasta<small id="mini-presupuesto"></small></div>
      <div class="espacio"></div>
      <button class="icono-btn" id="btn-ajustes" aria-label="Ajustes">${ICONOS.ajustes}</button>
    </header>
    ${D.demo ? '<div class="demo-banda">Modo demo: los precios son inventados. Configura <code>config.js</code> para usar datos reales.</div>' : ''}
    <main id="vista"></main>
    <nav class="nav">${PESTANAS.map(([id, txt]) => `<a href="#${id}" data-tab="${id}">${ICONOS[id]}<span>${txt}</span></a>`).join('')}</nav>`;
  $('#btn-ajustes').onclick = hojaAjustes;
  pintarMiniPresupuesto();
}

function pintarMiniPresupuesto() {
  const el = $('#mini-presupuesto');
  if (!el) return;
  el.textContent = estado.presupuestoMes
    ? `${dinero(estado.gastoMes)} de ${dinero(estado.presupuestoMes)} este mes`
    : 'Compra lo mismo, gasta menos';
}

function irA(tab) {
  if (!PESTANAS.some(([id]) => id === tab)) tab = 'lista';
  estado.tab = tab;
  $$('.nav a').forEach((a) => (a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  render();
  scrollTo(0, 0);
}

function render() {
  const v = $('#vista');
  if (!v) return;
  ({ lista: vistaLista, comparar: vistaComparar, ofertas: vistaOfertas, gastos: vistaGastos })[estado.tab](v);
}

// ---------------------------------------------------------------- LISTA
function mejorOpcion(item) {
  const act = tiendasActivas();
  return (item.opciones || []).filter((o) => act.includes(o.tienda)).sort((a, b) => a.precio - b.precio)[0] || null;
}

function vistaLista(v) {
  const pendientes = estado.lista.filter((i) => !i.comprado);
  const r = optimizar(pendientes, tiendasActivas(), Number(estado.ajustes.umbral_segunda_tienda) || 3);
  const hayComprados = estado.lista.some((i) => i.comprado);
  v.innerHTML = `
    <form class="agregar" id="f-agregar" autocomplete="off">
      <input name="q" placeholder="Agregar… ej. arroz 2" enterkeyhint="done" aria-label="Agregar artículo">
      <button class="btn-primario" aria-label="Agregar">+</button>
    </form>
    ${estado.lista.length ? `
      <div class="items tarjeta">${estado.lista.map(filaItem).join('')}</div>
      <div class="resumen tarjeta">
        <div>
          <div class="etq">Estimado de lo pendiente${r.mejor ? ` · ${r.mejor.tiendas.map(tiendaCorta).join(' + ')}` : ''}</div>
          <div class="total precio">${r.mejor ? dinero(r.mejor.total) : '—'}</div>
        </div>
        <a class="btn-secundario" style="display:grid;place-items:center;text-decoration:none" href="#comparar">Dónde comprar →</a>
      </div>
      <div class="fila-acciones">
        <span class="sub">${pendientes.length} pendiente${pendientes.length === 1 ? '' : 's'}${r.sinPrecio.length ? ` · ${r.sinPrecio.length} sin precio` : ''}</span>
        ${hayComprados ? '<button class="btn-texto" id="limpiar">Quitar comprados</button>' : ''}
      </div>`
    : `<div class="vacio tarjeta"><b>Tu lista está vacía</b>Escribe lo que necesitas arriba. Luego eliges el producto y la app te dice dónde sale más barato.</div>`}
  `;

  $('#f-agregar').onsubmit = async (ev) => {
    ev.preventDefault();
    const input = ev.target.q;
    let texto = input.value.trim();
    if (!texto) return;
    let cantidad = 1;
    const m = texto.match(/^(.*?)[\s×x]+(\d+(?:[.,]\d+)?)$/i) || texto.match(/^(\d+(?:[.,]\d+)?)\s+(.*)$/);
    if (m) {
      const numero = /^\d/.test(m[1]) ? m[1] : m[2];
      const resto = /^\d/.test(m[1]) ? m[2] : m[1];
      cantidad = parseFloat(numero.replace(',', '.')) || 1;
      texto = resto.trim();
    }
    const nombre = texto.charAt(0).toUpperCase() + texto.slice(1);
    input.value = '';
    try {
      const fila = await D.agregarItem({ nombre, cantidad });
      await cargarLista();
      render();
      const item = estado.lista.find((i) => i.id === fila.id);
      if (item) hojaElegir(item);
    } catch (e) { errorAviso(e); }
  };
  $('#limpiar')?.addEventListener('click', async () => {
    await D.borrarComprados();
    await cargarLista();
    render();
  });
  $$('.item').forEach((el) => {
    const item = estado.lista.find((i) => String(i.id) === el.dataset.id);
    $('.check', el).onclick = async () => {
      item.comprado = !item.comprado;
      el.classList.toggle('hecho', item.comprado);
      try { await D.actualizarItem(item.id, { comprado: item.comprado }); } catch (e) { errorAviso(e); }
      await cargarLista();
      render();
    };
    $('.info', el).onclick = () => hojaElegir(item);
    $('.mas', el).onclick = () => hojaItem(item);
  });
}

function filaItem(i) {
  const m = mejorOpcion(i);
  const tiendasCon = new Set((i.opciones || []).map((o) => o.tienda)).size;
  const sub = m
    ? `<span class="precio"><b>${dinero(m.precio * i.cantidad)}</b></span> ${chip(m.tienda)}${tiendasCon > 1 ? `<span>· ${tiendasCon} tiendas</span>` : ''}`
    : (i.opciones || []).length ? 'No está en tus tiendas activas' : 'Toca para elegir el producto';
  return `
    <article class="item ${i.comprado ? 'hecho' : ''}" data-id="${i.id}">
      <button class="check" aria-label="${i.comprado ? 'Desmarcar' : 'Marcar comprado'}"></button>
      <button class="info">
        <div class="nombre">${esc(i.nombre)} ${i.cantidad !== 1 ? `<span class="cant">×${i.cantidad}</span>` : ''}</div>
        <div class="sub ${m ? '' : 'aviso'}">${sub}</div>
      </button>
      <button class="mas" aria-label="Opciones">⋯</button>
    </article>`;
}

function hojaItem(item) {
  let cant = item.cantidad;
  const h = abrirHoja(`
    <h3>${esc(item.nombre)}</h3>
    <div class="cuerpo">
      <label class="campo">Nombre<input id="h-nombre" value="${esc(item.nombre)}"></label>
      <div class="campo">Cantidad
        <div class="stepper"><button type="button" id="menos">−</button><b id="cant">${cant}</b><button type="button" id="mas">+</button></div>
      </div>
      <label class="campo">Categoría<select id="h-cat">${CATEGORIAS.map((c) => `<option ${c === item.categoria ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <button class="btn-texto" id="elegir">Cambiar producto elegido (${(item.opciones || []).length})</button>
    </div>
    <div class="pie">
      <button class="btn-secundario peligro" id="borrar">Eliminar</button>
      <button class="btn-primario" id="guardar">Guardar</button>
    </div>`);
  const pintar = () => ($('#cant', h).textContent = cant);
  $('#menos', h).onclick = () => { cant = Math.max(1, round2(cant - 1)); pintar(); };
  $('#mas', h).onclick = () => { cant = round2(cant + 1); pintar(); };
  $('#elegir', h).onclick = () => { cerrarHoja(); hojaElegir(item); };
  $('#borrar', h).onclick = async () => {
    await D.borrarItem(item.id);
    cerrarHoja();
    await cargarLista();
    render();
  };
  $('#guardar', h).onclick = async () => {
    try {
      await D.actualizarItem(item.id, { nombre: $('#h-nombre', h).value.trim() || item.nombre, cantidad: cant, categoria: $('#h-cat', h).value });
      cerrarHoja();
      await cargarLista();
      render();
    } catch (e) { errorAviso(e); }
  };
}

// Selector de productos: agrupa por código de barras (mismo producto en varias tiendas)
function hojaElegir(item) {
  const elegidos = new Set(item.productos || []);
  let resultados = [];
  const h = abrirHoja(`
    <h3>Elige: ${esc(item.nombre)}</h3>
    <form class="agregar" id="f-buscar" style="margin-top:0">
      <input name="q" value="${esc(item.nombre)}" enterkeyhint="search" aria-label="Buscar producto">
      <button class="btn-secundario" style="height:50px">Buscar</button>
    </form>
    <div class="cuerpo" id="resultados"><div class="cargando" style="min-height:120px"><div class="giro"></div></div></div>
    <div class="pie">
      <button class="btn-secundario" id="ahora">Buscar en tiendas</button>
      <button class="btn-primario" id="listo">Listo (<span id="n">${elegidos.size}</span>)</button>
    </div>`);

  const grupos = () => {
    // 1) mismo código de barras = mismo producto; 2) Selectos no publica código,
    //    así que se une al grupo cuyo nombre normalizado sea idéntico.
    const mapa = new Map();
    const porNombre = new Map();
    const clave = (p) => normalizar(p.nombre).replace(/\s*\(promo.*\)$/, '');
    for (const p of resultados.filter((x) => x.ean)) {
      const k = `ean:${p.ean}`;
      if (!mapa.has(k)) mapa.set(k, []);
      mapa.get(k).push(p);
      if (!porNombre.has(clave(p))) porNombre.set(clave(p), k);
    }
    for (const p of resultados.filter((x) => !x.ean)) {
      const k = porNombre.get(clave(p)) || `id:${p.id}`;
      if (!mapa.has(k)) mapa.set(k, []);
      if (!mapa.get(k).some((q) => q.tienda === p.tienda)) mapa.get(k).push(p);
      else mapa.set(`id:${p.id}`, [p]);
    }
    return [...mapa.values()]
      .map((g) => g.sort((a, b) => a.precio - b.precio))
      .sort((a, b) => {
        const sa = a.some((p) => elegidos.has(p.id)) ? 0 : 1;
        const sb = b.some((p) => elegidos.has(p.id)) ? 0 : 1;
        return sa - sb || a[0].precio - b[0].precio;
      });
  };

  const pintar = () => {
    const cont = $('#resultados', h);
    const gs = grupos();
    if (!gs.length) {
      cont.innerHTML = `<div class="vacio"><b>Sin resultados todavía</b>Prueba otra palabra (ej. "arroz omoa") o toca <i>Buscar en tiendas</i> para traer precios ahora mismo.</div>`;
      return;
    }
    cont.innerHTML = gs.map((g, gi) => {
      const sel = g.some((p) => elegidos.has(p.id));
      const pu = precioUnitario(g[0]);
      return `
        <div class="grupo-prod" aria-pressed="${sel}" data-g="${gi}">
          <button class="cab" type="button"><span class="caja"></span>
            <span><b style="font-weight:600">${esc(g[0].nombre)}</b>
            ${pu ? `<span class="unit"> · ${dinero(pu.valor)}/${pu.etiqueta}</span>` : ''}</span>
          </button>
          <div class="precios">${g.map((p, i) => `
            <span class="p">${chip(p.tienda)}<span class="precio ${i === 0 ? 'mejor-p' : ''}">${dinero(p.precio)}</span>${p.precio_lista > p.precio ? `<span class="antes">${dinero(p.precio_lista)}</span>` : ''}</span>`).join('')}
          </div>
        </div>`;
    }).join('');
    $$('.grupo-prod', cont).forEach((el) => {
      $('.cab', el).onclick = () => {
        const g = gs[Number(el.dataset.g)];
        const sel = g.some((p) => elegidos.has(p.id));
        g.forEach((p) => (sel ? elegidos.delete(p.id) : elegidos.add(p.id)));
        el.setAttribute('aria-pressed', String(!sel));
        $('#n', h).textContent = elegidos.size;
      };
    });
  };

  const buscar = async (q) => {
    try {
      resultados = await D.buscarProductos(q);
      // incluir siempre los ya elegidos aunque no coincidan con la búsqueda
      for (const o of item.opciones || []) if (!resultados.some((r) => r.id === o.id)) resultados.push(o);
      pintar();
    } catch (e) { errorAviso(e); }
  };

  $('#f-buscar', h).onsubmit = (ev) => { ev.preventDefault(); buscar(ev.target.q.value); };
  $('#ahora', h).onclick = async (ev) => {
    const btn = ev.currentTarget;
    const q = $('#f-buscar input', h).value.trim() || item.nombre;
    btn.disabled = true;
    btn.textContent = 'Buscando…';
    try {
      const r = await D.buscarAhora(q);
      aviso(D.demo ? 'En modo demo no se consultan tiendas reales.' : `Listo: ${r.productos} productos revisados.`);
      await buscar(q);
    } catch (e) { errorAviso(e); }
    btn.disabled = false;
    btn.textContent = 'Buscar en tiendas';
  };
  $('#listo', h).onclick = async () => {
    try {
      await D.actualizarItem(item.id, { productos: [...elegidos] });
      cerrarHoja();
      await cargarLista();
      render();
    } catch (e) { errorAviso(e); }
  };
  buscar(item.nombre);
}

// ---------------------------------------------------------------- COMPARAR
function vistaComparar(v) {
  const pendientes = estado.lista.filter((i) => !i.comprado);
  const act = tiendasActivas();
  const umbral = Number(estado.ajustes.umbral_segunda_tienda) || 3;
  const r = optimizar(pendientes, act, umbral);
  if (!r.mejor) {
    v.innerHTML = `<div class="vacio tarjeta" style="margin-top:8px"><b>Nada que comparar todavía</b>Agrega artículos a tu lista y elige el producto de cada uno.<br><br><a class="btn-secundario" style="display:inline-grid;place-items:center;text-decoration:none" href="#lista">Ir a la lista</a></div>`;
    return;
  }
  const m = r.mejor;
  const maxTotal = Math.max(...r.porTienda.map((p) => p.total), 1);
  const porTiendaPlan = {};
  for (const a of m.asignacion) (porTiendaPlan[a.tienda] ||= []).push(a);

  v.innerHTML = `
    <section class="tarjeta reco" style="margin-top:8px">
      <div class="eti">${m.tiendas.length > 1 ? 'Divide la compra' : 'Ve a'}</div>
      <div class="donde">${m.tiendas.map(tiendaNombre).map(esc).join(' + ')}</div>
      <div class="monto precio">${dinero(m.total)}</div>
      <div class="razon">${esc(r.razon)}</div>
      ${r.ahorroVsPeor > 0.009 ? `<span class="ahorro">Ahorras ${dinero(r.ahorroVsPeor)} vs. la más cara</span>` : ''}
    </section>

    ${m.faltan.length || r.sinPrecio.length ? `<p class="sub aviso" style="margin:10px 4px">
      ${[...m.faltan, ...r.sinPrecio].map((i) => esc(i.nombre)).join(', ')} no ${m.faltan.length + r.sinPrecio.length === 1 ? 'entra' : 'entran'} en el cálculo (sin producto elegido o no disponible).</p>` : ''}

    <h2 class="titulo">Qué comprar en cada lugar</h2>
    <div class="tarjeta reparto">${Object.entries(porTiendaPlan).map(([t, as]) => `
      <div class="grupo">
        <div class="cab">${chip(t)}<span class="precio">${dinero(as.reduce((s, a) => s + a.subtotal, 0))}</span></div>
        ${as.map((a) => `<div class="linea"><span class="n">${esc(a.item.nombre)}${a.item.cantidad !== 1 ? ` ×${a.item.cantidad}` : ''} · ${esc(a.opcion.nombre)}</span><span class="precio">${dinero(a.subtotal)}</span></div>`).join('')}
      </div>`).join('')}
    </div>

    <h2 class="titulo">Todo en una sola tienda</h2>
    <div class="tarjeta barras">${r.porTienda.map((p) => `
      <div class="barra-fila">
        <span>${chip(p.tienda)} ${p.faltan ? `<span class="falta">falta${p.faltan === 1 ? '' : 'n'} ${p.faltan}</span>` : ''}</span>
        <b class="precio">${p.total ? dinero(p.total) : '—'}</b>
        <div class="barra" style="--c:${esc(estado.tiendaMap[p.tienda]?.color || '#999')}"><i style="width:${(100 * p.total) / maxTotal}%"></i></div>
      </div>`).join('')}
    </div>
    ${r.todas.total < m.total - 0.009 ? `<p class="sub" style="margin:10px 4px">Si fueras a todas tus tiendas gastarías ${dinero(r.todas.total)} (${dinero(m.total - r.todas.total)} menos), pero no vale tantas vueltas.</p>` : ''}

    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="btn-primario" style="flex:1" id="registrar">Ya compré: registrar gasto</button>
    </div>`;

  $('#registrar').onclick = () => {
    hojaGasto({ monto: m.total, tienda: m.tiendas[0], categoria: 'Súper', nota: 'Compra de la lista' }, async () => {
      // marcar como comprados los artículos que entraron en el plan
      await Promise.all(m.asignacion.map((a) => D.actualizarItem(a.item.id, { comprado: true })));
      await cargarLista();
    });
  };
}

// ---------------------------------------------------------------- OFERTAS
async function vistaOfertas(v) {
  v.innerHTML = '<div class="cargando"><div class="giro"></div></div>';
  let ofertas = [];
  try { ofertas = await D.ofertas(); } catch (e) { errorAviso(e); }
  if (estado.tab !== 'ofertas') return;
  const palabras = estado.lista.map((i) => normalizar(i.nombre)).filter(Boolean);
  const pintar = () => {
    let o = ofertas.filter((x) => tiendasActivas().includes(x.tienda));
    if (estado.filtroOferta !== 'todas') o = o.filter((x) => x.tienda === estado.filtroOferta);
    if (estado.soloMiLista) o = o.filter((x) => palabras.some((w) => x.busqueda?.includes(w)));
    v.innerHTML = `
      <div class="filtros">
        <button class="filtro" data-f="mi" aria-pressed="${estado.soloMiLista}">De mi lista</button>
        <button class="filtro" data-f="todas" aria-pressed="${estado.filtroOferta === 'todas'}">Todas</button>
        ${tiendasActivas().map((t) => `<button class="filtro" data-f="${esc(t)}" aria-pressed="${estado.filtroOferta === t}">${esc(tiendaCorta(t))}</button>`).join('')}
      </div>
      ${o.length ? `<div class="tarjeta">${o.slice(0, 150).map((x, i) => `
        <div class="oferta">
          <span class="badge">−${x.descuento_pct}%</span>
          <div class="info">
            <div class="n">${esc(x.nombre)}</div>
            <div class="sub">${chip(x.tienda)} <span class="precio-grande precio">${dinero(x.precio)}</span> <span class="antes">${dinero(x.precio_ref ?? x.precio_lista)}</span></div>
          </div>
          <button class="agregar-mini" data-i="${i}" aria-label="Agregar a la lista">+</button>
        </div>`).join('')}</div>`
      : `<div class="vacio tarjeta"><b>No hay ofertas con ese filtro</b>El robot revisa precios cada mañana; las bajas aparecen aquí.</div>`}`;
    $$('.filtro', v).forEach((b) => (b.onclick = () => {
      if (b.dataset.f === 'mi') estado.soloMiLista = !estado.soloMiLista;
      else estado.filtroOferta = b.dataset.f;
      pintar();
    }));
    $$('.agregar-mini', v).forEach((b) => (b.onclick = async () => {
      const x = o[Number(b.dataset.i)];
      try {
        await D.agregarItem({ nombre: x.nombre, cantidad: 1, productos: [x.id] });
        await cargarLista();
        aviso('Agregado a la lista');
      } catch (e) { errorAviso(e); }
    }));
  };
  pintar();
}

// ---------------------------------------------------------------- GASTOS
async function vistaGastos(v) {
  v.innerHTML = '<div class="cargando"><div class="giro"></div></div>';
  const mes = estado.mes;
  let pres = [];
  let gastos = [];
  try { [pres, gastos] = await Promise.all([D.presupuestos(mes), D.gastos(mes)]); } catch (e) { errorAviso(e); }
  if (estado.tab !== 'gastos') return;
  const total = pres.reduce((s, p) => s + p.monto, 0);
  const gastado = gastos.reduce((s, g) => s + g.monto, 0);
  const pasado = total > 0 && gastado > total;
  const cats = [...new Set([...CATEGORIAS, ...pres.map((p) => p.categoria), ...gastos.map((g) => g.categoria)])];
  const porCat = cats.map((c) => ({
    c,
    pres: pres.find((p) => p.categoria === c)?.monto || 0,
    gas: gastos.filter((g) => g.categoria === c).reduce((s, g) => s + g.monto, 0),
  })).filter((x) => x.pres || x.gas || CATEGORIAS.slice(0, 3).includes(x.c));

  v.innerHTML = `
    <div class="mes-nav">
      <button class="icono-btn" id="mes-ant" aria-label="Mes anterior">‹</button>
      <b>${esc(nombreMes(mes))}</b>
      <button class="icono-btn" id="mes-sig" aria-label="Mes siguiente">›</button>
    </div>
    <section class="tarjeta medidor ${pasado ? 'pasado' : ''}">
      <div><span class="grande precio">${dinero(gastado)}</span> <span class="de">de ${total ? dinero(total) : 'sin presupuesto'}</span></div>
      ${total ? `<div class="barra"><i style="width:${Math.min(100, (100 * gastado) / total)}%"></i></div>
        <div class="nota">${pasado ? `Te pasaste por ${dinero(gastado - total)}` : `Te quedan ${dinero(total - gastado)}`}</div>`
      : `<div class="nota" style="margin-top:8px">Toca una categoría para ponerle presupuesto.</div>`}
    </section>
    ${!pres.length ? '<button class="btn-texto" id="copiar">Usar el presupuesto del mes pasado</button>' : ''}

    <h2 class="titulo">Por categoría</h2>
    <div class="tarjeta">${porCat.map((x) => `
      <button class="cat ${x.pres && x.gas > x.pres ? 'pasado' : ''}" data-c="${esc(x.c)}">
        <div class="fila"><span>${esc(x.c)}</span><span class="precio">${dinero(x.gas)} <span class="unit">/ ${x.pres ? dinero(x.pres) : 'poner'}</span></span></div>
        ${x.pres ? `<div class="barra"><i style="width:${Math.min(100, (100 * x.gas) / x.pres)}%"></i></div>` : ''}
      </button>`).join('')}
    </div>

    <h2 class="titulo">Gastos</h2>
    <button class="btn-primario" id="nuevo" style="width:100%;margin-bottom:10px">+ Registrar gasto</button>
    ${gastos.length ? `<div class="tarjeta">${gastos.map((g) => `
      <div class="gasto">
        <div class="info">
          <div><b class="precio">${dinero(g.monto)}</b> · ${estado.tiendaMap[g.tienda] ? chip(g.tienda) : esc(g.tienda || '')}</div>
          <div class="fecha">${esc(new Date(`${g.fecha}T12:00:00`).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' }))} · ${esc(g.categoria)}${g.nota ? ` · ${esc(g.nota)}` : ''}</div>
        </div>
        <button class="mas" data-id="${g.id}" aria-label="Borrar gasto">×</button>
      </div>`).join('')}</div>`
    : '<div class="vacio tarjeta">Sin gastos este mes.</div>'}`;

  $('#mes-ant').onclick = () => { estado.mes = moverMes(mes, -1); render(); };
  $('#mes-sig').onclick = () => { estado.mes = moverMes(mes, 1); render(); };
  $('#nuevo').onclick = () => hojaGasto({ categoria: 'Súper' });
  $('#copiar')?.addEventListener('click', async () => {
    const ant = await D.presupuestos(moverMes(mes, -1));
    if (!ant.length) return aviso('El mes pasado tampoco tenía presupuesto.');
    await Promise.all(ant.map((p) => D.guardarPresupuesto(mes, p.categoria, p.monto)));
    render();
  });
  $$('.cat', v).forEach((b) => (b.onclick = () => hojaPresupuesto(mes, b.dataset.c, pres.find((p) => p.categoria === b.dataset.c)?.monto)));
  $$('.gasto .mas', v).forEach((b) => (b.onclick = async () => {
    if (!confirm('¿Borrar este gasto?')) return;
    await D.borrarGasto(Number(b.dataset.id));
    await cargarResumenMes();
    pintarMiniPresupuesto();
    render();
  }));
}

function hojaPresupuesto(mes, categoria, actual) {
  const h = abrirHoja(`
    <h3>Presupuesto: ${esc(categoria)}</h3>
    <label class="campo">Monto para ${esc(nombreMes(mes))}<input id="monto" type="number" inputmode="decimal" step="0.01" min="0" value="${actual ?? ''}" placeholder="0.00"></label>
    <div class="pie"><button class="btn-secundario" id="cancelar">Cancelar</button><button class="btn-primario" id="guardar">Guardar</button></div>`);
  $('#monto', h).focus();
  $('#cancelar', h).onclick = cerrarHoja;
  $('#guardar', h).onclick = async () => {
    try {
      await D.guardarPresupuesto(mes, categoria, Number($('#monto', h).value) || 0);
      cerrarHoja();
      await cargarResumenMes();
      pintarMiniPresupuesto();
      render();
    } catch (e) { errorAviso(e); }
  };
}

function hojaGasto(pre = {}, despues) {
  const opcionesTienda = [...estado.tiendas.map((t) => [t.id, t.nombre]), ['Mercado', 'Mercado'], ['Tienda', 'Tienda del barrio'], ['Otro', 'Otro']];
  const h = abrirHoja(`
    <h3>Registrar gasto</h3>
    <div class="cuerpo">
      <label class="campo">Monto<input id="g-monto" type="number" inputmode="decimal" step="0.01" min="0" value="${pre.monto ? Number(pre.monto).toFixed(2) : ''}" placeholder="0.00"></label>
      <div class="dos">
        <label class="campo">Dónde<select id="g-tienda">${opcionesTienda.map(([id, n]) => `<option value="${esc(id)}" ${id === pre.tienda ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        <label class="campo">Categoría<select id="g-cat">${CATEGORIAS.map((c) => `<option ${c === pre.categoria ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      </div>
      <label class="campo">Fecha<input id="g-fecha" type="date" value="${new Date().toLocaleDateString('en-CA')}"></label>
      <label class="campo">Nota (opcional)<input id="g-nota" value="${esc(pre.nota || '')}"></label>
    </div>
    <div class="pie"><button class="btn-secundario" id="cancelar">Cancelar</button><button class="btn-primario" id="guardar">Guardar</button></div>`);
  $('#g-monto', h).focus();
  $('#cancelar', h).onclick = cerrarHoja;
  $('#guardar', h).onclick = async (ev) => {
    const monto = Number($('#g-monto', h).value);
    if (!monto) return aviso('Pon el monto.');
    ev.currentTarget.disabled = true;
    try {
      await D.agregarGasto({
        monto,
        tienda: $('#g-tienda', h).value,
        categoria: $('#g-cat', h).value,
        fecha: $('#g-fecha', h).value,
        nota: $('#g-nota', h).value.trim() || null,
      });
      if (despues) await despues();
      cerrarHoja();
      await cargarResumenMes();
      pintarMiniPresupuesto();
      aviso('Gasto guardado');
      render();
    } catch (e) {
      ev.currentTarget.disabled = false;
      errorAviso(e);
    }
  };
}

// ---------------------------------------------------------------- AJUSTES
async function hojaAjustes() {
  const act = new Set(tiendasActivas());
  const u = await D.usuario();
  const h = abrirHoja(`
    <h3>Ajustes</h3>
    <div class="cuerpo">
      <label class="campo">Ir a una 2ª tienda solo si ahorro al menos ($)
        <input id="umbral" type="number" inputmode="decimal" step="0.5" min="0" value="${Number(estado.ajustes.umbral_segunda_tienda) || 3}">
      </label>
      <div class="campo">Tiendas a las que sí vas
        ${estado.tiendas.map((t) => `<label style="display:flex;gap:10px;align-items:center;font-weight:500;color:var(--tinta);padding:6px 0">
          <input type="checkbox" value="${esc(t.id)}" ${act.has(t.id) ? 'checked' : ''} style="width:20px;height:20px"> ${chip(t.id)} ${esc(t.nombre)}</label>`).join('')}
      </div>
      <div class="campo">Instalar en el cel
        <span style="font-weight:400;color:var(--tinta)">iPhone: Safari → Compartir → <b>Agregar a inicio</b>.<br>Android: Chrome → menú ⋮ → <b>Instalar app</b>.</span>
      </div>
      <p class="sub">${esc(u?.email || '')}</p>
    </div>
    <div class="pie"><button class="btn-secundario" id="salir">Cerrar sesión</button><button class="btn-primario" id="guardar">Guardar</button></div>`);
  $('#salir', h).onclick = async () => { await D.salir(); location.reload(); };
  $('#guardar', h).onclick = async () => {
    const tiendas = $$('input[type=checkbox]:checked', h).map((c) => c.value);
    if (!tiendas.length) return aviso('Deja al menos una tienda.');
    const umbral = Number($('#umbral', h).value) || 0;
    try {
      await Promise.all([D.guardarAjuste('umbral_segunda_tienda', umbral), D.guardarAjuste('tiendas_cercanas', tiendas)]);
      estado.ajustes.umbral_segunda_tienda = umbral;
      estado.ajustes.tiendas_cercanas = tiendas;
      cerrarHoja();
      render();
    } catch (e) { errorAviso(e); }
  };
}

// ---------------------------------------------------------------- hoja inferior
function abrirHoja(html) {
  cerrarHoja();
  const fondo = document.createElement('div');
  fondo.className = 'fondo';
  fondo.onclick = cerrarHoja;
  const hoja = document.createElement('div');
  hoja.className = 'hoja';
  hoja.setAttribute('role', 'dialog');
  hoja.innerHTML = `<div class="asa"></div>${html}`;
  document.body.append(fondo, hoja);
  document.body.style.overflow = 'hidden';
  return hoja;
}
function cerrarHoja() {
  $$('.fondo, .hoja').forEach((e) => e.remove());
  document.body.style.overflow = '';
}
addEventListener('keydown', (e) => e.key === 'Escape' && cerrarHoja());

iniciar();
