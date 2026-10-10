// Capa de datos: Supabase real, o un modo demo en memoria (?demo en la URL,
// o automático si config.js todavía no está configurado).
import { CONFIG } from './config.js';

export const MODO_DEMO =
  new URLSearchParams(location.search).has('demo') ||
  !CONFIG.SUPABASE_URL ||
  CONFIG.SUPABASE_URL.includes('TU-PROYECTO');

export function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9.,%\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

const num = (p) => ({
  ...p,
  precio: p.precio == null ? null : Number(p.precio),
  precio_lista: p.precio_lista == null ? null : Number(p.precio_lista),
  contenido: p.contenido == null ? null : Number(p.contenido),
  ...(p.precio_ref != null ? { precio_ref: Number(p.precio_ref) } : {}),
});

export function finDeMes(mes) {
  const [a, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(a, m, 1)); // primer día del mes siguiente
  return d.toISOString().slice(0, 10);
}

export async function crearDatos() {
  return MODO_DEMO ? crearDemo() : crearReal();
}

// =====================================================================
// Supabase
// =====================================================================
async function crearReal() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.2/+esm');
  const sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  const ok = (r) => {
    if (r.error) throw r.error;
    return r.data;
  };

  return {
    demo: false,
    async usuario() {
      const { data } = await sb.auth.getSession();
      return data.session?.user ?? null;
    },
    async esMiembro() {
      return ok(await sb.rpc('es_miembro'));
    },
    async pedirCodigo(email) {
      ok(await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } }));
    },
    async verificarCodigo(email, token) {
      ok(await sb.auth.verifyOtp({ email, token, type: 'email' }));
    },
    async salir() {
      await sb.auth.signOut();
    },
    async tiendas() {
      return ok(await sb.from('tiendas').select('*').eq('activa', true).order('nombre'));
    },
    async ajustes() {
      const rows = ok(await sb.from('ajustes').select('*'));
      return Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
    },
    async guardarAjuste(clave, valor) {
      ok(await sb.from('ajustes').upsert({ clave, valor }));
    },
    async lista() {
      const items = ok(await sb.from('lista').select('*').order('comprado').order('creado'));
      const ids = [...new Set(items.flatMap((i) => i.productos || []))];
      const prods = ids.length ? ok(await sb.from('productos').select('*').in('id', ids)) : [];
      const mapa = new Map(prods.map((p) => [p.id, num(p)]));
      return items.map((i) => ({
        ...i,
        cantidad: Number(i.cantidad),
        opciones: (i.productos || []).map((id) => mapa.get(id)).filter(Boolean),
      }));
    },
    async agregarItem({ nombre, cantidad = 1, categoria = 'Súper', productos = [], ingrediente = null, articulo_casa = null }) {
      const fila = ok(await sb.from('lista').insert({ nombre, cantidad, categoria, productos, ingrediente, articulo_casa }).select().single());
      // que el robot diario también revise este artículo
      await sb.from('terminos').upsert({ termino: normalizar(nombre) }, { onConflict: 'termino', ignoreDuplicates: true });
      return fila;
    },
    async actualizarItem(id, cambios) {
      ok(await sb.from('lista').update(cambios).eq('id', id));
    },
    async borrarItem(id) {
      ok(await sb.from('lista').delete().eq('id', id));
    },
    async borrarComprados() {
      ok(await sb.from('lista').delete().eq('comprado', true));
    },
    async buscarProductos(q) {
      return ok(await sb.rpc('buscar_productos', { q: normalizar(q), lim: 80 })).map(num);
    },
    async buscarAhora(termino) {
      const { data, error } = await sb.functions.invoke('precios', { body: { terminos: [normalizar(termino)] } });
      if (error) throw error;
      return data;
    },
    async ofertas() {
      return ok(await sb.from('ofertas').select('*').order('descuento_pct', { ascending: false }).limit(300)).map(num);
    },
    async presupuestos(mes) {
      return ok(await sb.from('presupuestos').select('*').eq('mes', mes)).map((p) => ({ ...p, monto: Number(p.monto) }));
    },
    async guardarPresupuesto(mes, categoria, monto) {
      ok(await sb.from('presupuestos').upsert({ mes, categoria, monto }));
    },
    async gastos(mes) {
      return ok(
        await sb.from('gastos').select('*').gte('fecha', mes).lt('fecha', finDeMes(mes))
          .order('fecha', { ascending: false }).order('creado', { ascending: false }),
      ).map((g) => ({ ...g, monto: Number(g.monto), ahorro: Number(g.ahorro || 0) }));
    },
    async gastosRango(desde, hasta) {
      return ok(await sb.from('gastos').select('fecha,monto,ahorro,categoria').gte('fecha', desde).lt('fecha', hasta))
        .map((g) => ({ ...g, monto: Number(g.monto), ahorro: Number(g.ahorro || 0) }));
    },
    async agregarGasto(g) {
      ok(await sb.from('gastos').insert(g));
    },
    async borrarGasto(id) {
      ok(await sb.from('gastos').delete().eq('id', id));
    },
    escucharLista(cb) {
      const canal = sb
        .channel('lista-compartida')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lista' }, cb)
        .subscribe();
      return () => sb.removeChannel(canal);
    },
    // ---- menú semanal ----
    async candidatosIngredientes(terminos) {
      // Supabase devuelve como máximo 1000 filas por consulta; con ~127 términos × hasta 15 por
      // unidad de medida se pasaba y los últimos ingredientes quedaban sin precio. Se pide por lotes.
      const lotes = [];
      for (let i = 0; i < terminos.length; i += 15) lotes.push(terminos.slice(i, i + 15));
      const res = await Promise.all(lotes.map((t) => sb.rpc('candidatos_ingredientes', { terminos: t, por_termino: 15 })));
      return res.flatMap((r) => ok(r)).map(num);
    },
    async menu(semana) {
      return ok(await sb.from('menus').select('*').eq('semana', semana).maybeSingle())?.datos ?? null;
    },
    async guardarMenu(semana, datos) {
      ok(await sb.from('menus').upsert({ semana, datos, actualizado: new Date().toISOString() }));
    },
    escucharMenu(cb) {
      const canal = sb
        .channel('menu-compartido')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menus' }, cb)
        .subscribe();
      return () => sb.removeChannel(canal);
    },
    // ---- v4: despensa viva ----
    async despensa() {
      return ok(await sb.from('despensa').select('*').order('caduca', { nullsFirst: false }).order('nombre'))
        .map((d) => ({ ...d, cantidad: d.cantidad == null ? null : Number(d.cantidad) }));
    },
    async agregarDespensa(fila) {
      return ok(await sb.from('despensa').insert(fila).select().single());
    },
    async actualizarDespensa(id, cambios) {
      ok(await sb.from('despensa').update({ ...cambios, actualizado: new Date().toISOString() }).eq('id', id));
    },
    async borrarDespensa(id) {
      ok(await sb.from('despensa').delete().eq('id', id));
    },
    escucharDespensa(cb) {
      const canal = sb.channel('despensa-compartida')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'despensa' }, cb).subscribe();
      return () => sb.removeChannel(canal);
    },
    // ---- v4: precios, código de barras, mercado ----
    async resumenPrecios(ids) {
      if (!ids.length) return [];
      return ok(await sb.rpc('resumen_precios', { ids })).map((r) => ({
        ...r, min60: Number(r.min60), max60: Number(r.max60), prom60: Number(r.prom60),
      }));
    },
    async productosPorEan(codigo) {
      return ok(await sb.rpc('productos_por_ean', { codigo })).map(num);
    },
    async preciosMercado() {
      const ult = ok(await sb.from('precios_mercado').select('fecha').order('fecha', { ascending: false }).limit(1));
      if (!ult.length) return [];
      return ok(await sb.from('precios_mercado').select('*').eq('fecha', ult[0].fecha));
    },
    // ---- precios de los Agromercados del MAG (anotados a mano, compartidos entre hogares) ----
    async preciosAgromercado() {
      return ok(await sb.from('precios_agromercado').select('*').order('ingrediente').order('descripcion'));
    },
    async guardarPrecioAgromercado(fila) {
      const datos = { ingrediente: fila.ingrediente, descripcion: fila.descripcion, cantidad: fila.cantidad, unidad: fila.unidad,
        precio: fila.precio, gramos_unidad: fila.gramos_unidad || null, fecha: fila.fecha || new Date().toISOString().slice(0, 10), fuente: fila.fuente || 'Anotado en la app' };
      return ok(await sb.from('precios_agromercado').upsert(datos, { onConflict: 'ingrediente,descripcion' }).select().single());
    },
    async borrarPrecioAgromercado(id) {
      ok(await sb.from('precios_agromercado').delete().eq('id', id));
    },
    // ---- v4: avisos ----
    async guardarSuscripcion(sub, prefs) {
      ok(await sb.from('avisos_suscripciones').upsert({ endpoint: sub.endpoint, datos: sub, prefs }));
    },
    async borrarSuscripcion(endpoint) {
      ok(await sb.from('avisos_suscripciones').delete().eq('endpoint', endpoint));
    },
    async suscripcion(endpoint) {
      return ok(await sb.from('avisos_suscripciones').select('*').eq('endpoint', endpoint).maybeSingle());
    },
    // ---- v4: recetas de la familia ----
    async recetasPropias() {
      return ok(await sb.from('recetas_propias').select('*').order('creado')).map((r) => ({ ...r.datos, id: r.id, propia: true }));
    },
    async guardarRecetaPropia(receta) {
      const { id, ...datos } = receta;
      ok(await sb.from('recetas_propias').upsert({ id, datos: { ...datos, id } }));
    },
    async borrarRecetaPropia(id) {
      ok(await sb.from('recetas_propias').delete().eq('id', id));
    },
    // ---- v4: ideas con IA (opcional; la función "ideas" debe estar desplegada) ----
    // ---- v5: artículos de la casa (por necesidad) ----
    async hogarArticulos() {
      return ok(await sb.from('hogar_articulos').select('*').order('categoria').order('nombre')).map((a) => ({
        ...a, consumo_mes: Number(a.consumo_mes), stock: Number(a.stock), usuarios: a.usuarios == null ? null : Number(a.usuarios),
        ref_stock: a.ref_stock == null ? null : Number(a.ref_stock), compras_desde: Number(a.compras_desde || 0),
      }));
    },
    async crearHogarArticulos(filas) {
      return ok(await sb.from('hogar_articulos').insert(filas).select());
    },
    async actualizarHogarArticulo(id, cambios) {
      ok(await sb.from('hogar_articulos').update(cambios).eq('id', id));
    },
    async movimientoHogar(m) {
      return ok(await sb.from('hogar_movimientos').insert(m).select().single());
    },
    async movimientosHogar(articuloId, limite = 12) {
      return ok(await sb.from('hogar_movimientos').select('*').eq('articulo_id', articuloId).order('fecha', { ascending: false }).limit(limite));
    },
    async borrarMovimientoHogar(id) {
      ok(await sb.from('hogar_movimientos').delete().eq('id', id));
    },
    async ultimoMovimientoDeLista(listaId) {
      return ok(await sb.from('hogar_movimientos').select('*').eq('lista_id', listaId).order('fecha', { ascending: false }).limit(1).maybeSingle());
    },
    async candidatosHogar(terminos) {
      return ok(await sb.rpc('candidatos_ingredientes', { terminos, por_termino: 30 })).map(num);
    },
    async agregarTerminos(terminos) {
      if (terminos.length) await sb.from('terminos').upsert(terminos.map((termino) => ({ termino })), { onConflict: 'termino', ignoreDuplicates: true });
    },
    escucharHogar(cb) {
      const canal = sb.channel('hogar-compartido')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hogar_articulos' }, cb).subscribe();
      return () => sb.removeChannel(canal);
    },
    async ideasIA(pedido) {
      const { data, error } = await sb.functions.invoke('ideas', { body: pedido });
      if (error) throw error;
      return data;
    },
  };
}

// =====================================================================
// Demo (precios INVENTADOS, solo para ver cómo funciona la app)
// =====================================================================
function crearDemo() {
  const tiendas = [
    { id: 'walmart', nombre: 'Walmart', color: '#0071ce' },
    { id: 'maxi', nombre: 'Maxi Despensa', color: '#e4002b' },
    { id: 'donjuan', nombre: 'La Despensa de Don Juan', color: '#f5a800' },
    { id: 'selectos', nombre: 'Súper Selectos', color: '#00843d' },
  ];
  // [nombre, contenido, unidad, {tienda: [precio, precio_lista]}]
  const catalogo = [
    ['Arroz Omoa Blanco 1814 g', 1814, 'g', { walmart: [2.65, 2.65], maxi: [2.6, 2.6], donjuan: [2.5, 2.8], selectos: [2.75, 2.75] }],
    ['Arroz San Francisco Blanco 1816 g', 1816, 'g', { walmart: [2.45, 2.45], maxi: [2.35, 2.35], donjuan: [2.4, 2.4] }],
    ['Frijol Rojo Seda 2 lb', 907.18, 'g', { walmart: [2.2, 2.2], maxi: [1.98, 2.15], donjuan: [2.05, 2.05], selectos: [2.25, 2.25] }],
    ['Aceite Orisol 1.5 L', 1500, 'ml', { walmart: [4.95, 4.95], maxi: [4.79, 4.79], donjuan: [4.85, 4.85], selectos: [4.25, 4.99] }],
    ['Leche Entera Salud 1 L', 1000, 'ml', { walmart: [1.4, 1.4], maxi: [1.35, 1.35], donjuan: [1.38, 1.38], selectos: [1.45, 1.45] }],
    ['Leche Semidescremada Dos Pinos 1 L', 1000, 'ml', { walmart: [1.95, 1.95], maxi: [1.89, 1.95], selectos: [1.99, 1.99] }],
    ['Huevos Blancos Grandes 30 und', 30, 'und', { walmart: [5.6, 5.6], maxi: [5.25, 5.25], donjuan: [5.4, 5.4], selectos: [5.95, 5.95] }],
    ['Café Listo Molido 400 g', 400, 'g', { walmart: [5.25, 5.25], maxi: [5.1, 5.1], donjuan: [4.95, 5.4], selectos: [4.6, 5.3] }],
    ['Azúcar Blanca del Cañal 5 lb', 2267.96, 'g', { walmart: [2.9, 2.9], maxi: [2.85, 2.85], donjuan: [2.8, 2.8], selectos: [2.95, 2.95] }],
    ['Harina de Maíz Maseca 2 lb', 907.18, 'g', { walmart: [1.6, 1.6], maxi: [1.55, 1.55], donjuan: [1.49, 1.6], selectos: [1.65, 1.65] }],
    ['Papel Higiénico Scott 12 rollos', 12, 'und', { walmart: [7.2, 7.2], maxi: [6.95, 6.95], donjuan: [7.1, 7.1], selectos: [5.99, 7.49] }],
    ['Detergente Rinso 2 kg', 2000, 'g', { walmart: [6.5, 6.5], maxi: [6.25, 6.25], donjuan: [6.4, 6.4], selectos: [6.75, 6.75] }],
    ['Pasta Dental Colgate 150 ml', 150, 'ml', { walmart: [2.3, 2.3], maxi: [2.25, 2.25], selectos: [1.85, 2.4] }],
    ['Queso Duro Blando 1 lb', 453.59, 'g', { walmart: [4.4, 4.4], selectos: [4.25, 4.25] }],
    ['Pechuga de Pollo 1 lb', 453.59, 'g', { walmart: [2.75, 2.75], maxi: [2.69, 2.69], selectos: [2.59, 2.99] }],
    ['Pan Bimbo Blanco Grande 680 g', 680, 'g', { walmart: [3.1, 3.1], maxi: [2.99, 2.99], donjuan: [3.05, 3.05], selectos: [3.15, 3.15] }],
    // artículos de la casa (v5)
    ['Pasta Dental Colgate Triple Acción 100 ml', 100, 'ml', { walmart: [2.5, 2.5], maxi: [2.35, 2.35], donjuan: [2.45, 2.45], selectos: [2.6, 2.6] }],
    ['Pasta Dental Colgate 3 Pack 75 ml', 225, 'ml', { walmart: [4.95, 5.5], maxi: [4.8, 4.8] }],
    ['Jabón de Tocador Protex 3 Pack 110 g', 330, 'g', { walmart: [2.85, 2.85], maxi: [2.75, 2.75], selectos: [2.25, 2.95] }],
    ['Shampoo Sedal 650 ml', 650, 'ml', { walmart: [5.25, 5.25], maxi: [4.95, 4.95], selectos: [5.4, 5.4] }],
    ['Shampoo Head & Shoulders 375 ml', 375, 'ml', { walmart: [5.9, 5.9], selectos: [4.75, 5.95] }],
    ['Desodorante Rexona Aerosol 150 ml', 150, 'ml', { walmart: [3.95, 3.95], maxi: [3.85, 3.85], donjuan: [3.9, 3.9] }],
    ['Suavizante Suavitel 1 L', 1000, 'ml', { walmart: [2.6, 2.6], maxi: [2.45, 2.45] }],
    ['Cloro Magia Blanca 1 L', 1000, 'ml', { walmart: [0.95, 0.95], maxi: [0.9, 0.9], donjuan: [0.89, 0.89], selectos: [0.99, 0.99] }],
    ['Fabuloso Lavanda 1 L', 1000, 'ml', { walmart: [2.4, 2.4], maxi: [1.85, 2.4], selectos: [2.35, 2.35] }],
    ['Lavaplatos Axion Limón 750 ml', 750, 'ml', { walmart: [2.75, 2.75], maxi: [2.6, 2.6] }],
    ['Esponja Scotch Brite 3 und', 3, 'und', { walmart: [1.25, 1.25], maxi: [1.2, 1.2] }],
    ['Bolsas para basura Glad 10 und', 10, 'und', { walmart: [1.5, 1.5], maxi: [1.35, 1.35] }],
    ['Cepillo Dental Colgate 2 und', 2, 'und', { walmart: [2.5, 2.5], maxi: [2.3, 2.9] }],
  ];
  let sig = 1;
  const productos = [];
  catalogo.forEach(([nombre, contenido, unidad, precios], i) => {
    for (const [tienda, [precio, precio_lista]] of Object.entries(precios)) {
      productos.push({
        id: sig++, tienda, sku: `${tienda}-${i}`, ean: tienda === 'selectos' ? null : `74100000${i}`,
        nombre, busqueda: normalizar(nombre), contenido, unidad, precio, precio_lista, disponible: true,
        url: null, imagen: null,
      });
    }
  });
  const porNombre = (q, tienda) =>
    productos.filter((p) => p.busqueda.includes(normalizar(q)) && (!tienda || p.tienda === tienda)).map((p) => p.id);

  const hoy = new Date();
  const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
  const dia = (d) => `${mes.slice(0, 8)}${String(Math.min(d, hoy.getDate())).padStart(2, '0')}`;
  let lista = [
    { id: 1, nombre: 'Arroz', cantidad: 1, categoria: 'Súper', productos: porNombre('arroz omoa'), comprado: false, ingrediente: 'arroz' },
    { id: 2, nombre: 'Frijol', cantidad: 2, categoria: 'Súper', productos: porNombre('frijol'), comprado: false, ingrediente: 'frijol' },
    { id: 3, nombre: 'Aceite', cantidad: 1, categoria: 'Súper', productos: porNombre('aceite'), comprado: false, ingrediente: 'aceite' },
    { id: 4, nombre: 'Leche', cantidad: 4, categoria: 'Súper', productos: porNombre('leche entera'), comprado: false, ingrediente: 'leche' },
    { id: 5, nombre: 'Huevos', cantidad: 1, categoria: 'Súper', productos: porNombre('huevos'), comprado: false, ingrediente: 'huevo' },
    { id: 6, nombre: 'Café', cantidad: 1, categoria: 'Súper', productos: porNombre('cafe'), comprado: false, ingrediente: 'cafe' },
    { id: 7, nombre: 'Papel higiénico', cantidad: 1, categoria: 'Limpieza', productos: porNombre('papel'), comprado: false, ingrediente: null },
    { id: 8, nombre: 'Tortillas', cantidad: 1, categoria: 'Mercado', productos: [], comprado: false, ingrediente: 'tortillas' },
  ];
  const isoHoy = hoy.toLocaleDateString('en-CA');
  const enDias = (n) => { const d = new Date(hoy); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-CA'); };
  let despensa = [
    { id: 1, ingrediente: 'arroz', nombre: 'Arroz', cantidad: 900, unidad: 'g', caduca: null },
    { id: 2, ingrediente: 'pollo_piezas', nombre: 'Pollo en piezas', cantidad: 900, unidad: 'g', caduca: enDias(1) },
    { id: 3, ingrediente: 'tomate', nombre: 'Tomate', cantidad: 400, unidad: 'g', caduca: enDias(3) },
    { id: 4, ingrediente: 'huevo', nombre: 'Huevos', cantidad: 6, unidad: 'und', caduca: enDias(15) },
    { id: 5, ingrediente: null, nombre: 'Salsa inglesa', cantidad: null, unidad: null, caduca: null },
  ];
  let idDesp = 100;
  let recetasPropias = [];
  // casa (v5): consumos de una familia de 3 (2 adultos y 2 niños)
  const haceDias = (n) => new Date(Date.now() - n * 86400000).toISOString();
  let hogar = [
    ['papel_higienico', 'Papel higiénico', 'personal', 'und', 21, 3, 5],
    ['pasta_dental', 'Pasta dental', 'personal', 'ml', 150, 90, 3],
    ['jabon_bano', 'Jabón de baño', 'personal', 'g', 450, 600, 2],
    ['shampoo', 'Shampoo', 'personal', 'ml', 450, 700, 4],
    ['desodorante', 'Desodorante', 'personal', 'ml', 160, 280, 6],
    ['cepillo_dientes', 'Cepillo de dientes', 'personal', 'und', 1, 3, 20],
    ['detergente_ropa', 'Detergente para ropa', 'limpieza', 'g', 3100, 3500, 3],
    ['suavizante', 'Suavizante de ropa', 'limpieza', 'ml', 900, 1500, 3],
    ['cloro', 'Cloro / lejía', 'limpieza', 'ml', 1450, 150, 2],
    ['desinfectante_piso', 'Desinfectante para piso (olor)', 'limpieza', 'ml', 1500, 2200, 4],
    ['lavaplatos', 'Lavaplatos', 'limpieza', 'ml', 750, 500, 5],
    ['esponjas', 'Esponjas de cocina', 'limpieza', 'und', 3, 2, 7],
    ['bolsas_basura', 'Bolsas para basura', 'limpieza', 'und', 30, 25, 3],
  ].map(([catalogo, nombre, categoria, unidad, consumo_mes, stock, dias], i) => ({
    id: i + 1, catalogo, nombre, categoria, unidad, consumo_mes, stock, stock_fecha: haceDias(dias), marca: null,
    usuarios: null, ref_stock: stock, ref_fecha: haceDias(dias + 25), compras_desde: 0, activo: true,
  }));
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('casa-vacia')) hogar = []; // para probar la configuración inicial
  let movHogar = [];
  let idHogar = 100;
  let idMov = 1;
  // historial inventado: lo que está en oferta "bajó" hace 2 días
  const resumenDemo = (p) => (p.precio < p.precio_lista
    ? { producto_id: p.id, min60: p.precio, max60: p.precio_lista, prom60: (p.precio + p.precio_lista) / 2, puntos: [[enDias(-40), p.precio_lista], [enDias(-15), p.precio_lista + 0.1], [enDias(-2), p.precio]] }
    : { producto_id: p.id, min60: p.precio - 0.15, max60: p.precio + 0.1, prom60: p.precio, puntos: [[enDias(-50), p.precio - 0.15], [enDias(-20), p.precio + 0.1], [enDias(-5), p.precio]] });
  let agroDemo = [
    { id: 1, ingrediente: 'tomate', descripcion: 'Tomate grande', cantidad: 20, unidad: 'und', precio: 1, gramos_unidad: 170, fecha: '2026-05-15', fuente: 'Lista del MAG' },
    { id: 2, ingrediente: 'cebolla', descripcion: 'Cebolla blanca', cantidad: 10, unidad: 'und', precio: 1, gramos_unidad: 200, fecha: '2026-05-15', fuente: 'Lista del MAG' },
    { id: 3, ingrediente: 'limon', descripcion: 'Limón', cantidad: 32, unidad: 'und', precio: 2, fecha: '2026-09-30', fuente: 'Video del MAG' },
    { id: 4, ingrediente: 'papa', descripcion: 'Papa', cantidad: 12, unidad: 'lb', precio: 4, fecha: '2026-09-30', fuente: 'Video del MAG' },
    { id: 5, ingrediente: 'frijol', descripcion: 'Frijol', cantidad: 1, unidad: 'lb', precio: 0.7, fecha: '2026-07-01', fuente: 'Lista del MAG' },
  ];
  const mercadoDemo = [
    ['Carnes', 'Pollo, pechuga con hueso y ala', 1, 'Libra', 1.84], ['Carnes', 'Carne de res, posta negra', 1, 'Libra', 4.42],
    ['Frutas', 'Guineo importado (banano)', 1, 'Unidades', 0.15], ['Frutas', 'Limón Pérsico', 1, 'Unidades', 0.18],
    ['Granos', 'Arroz Blanco', 1, 'Libra', 0.61], ['Granos', 'Frijol Rojo de Seda', 1, 'Libra', 0.95],
    ['Huevos', 'Huevo grande', 30, 'Unidades', 4.22], ['Verduras', 'Tomate de cocina', 1, 'Unidades', 0.13],
    ['Verduras', 'Papa', 1, 'Libra', 0.68], ['Verduras', 'Cebolla, Blanca', 1, 'Unidades', 0.23],
  ].map(([categoria, producto, cantidad, unidad, promedio]) => ({ fecha: enDias(-5), categoria, producto, cantidad, unidad, promedio }));
  let presupuestos = [
    { mes, categoria: 'Súper', monto: 220 },
    { mes, categoria: 'Mercado', monto: 60 },
    { mes, categoria: 'Limpieza', monto: 40 },
  ];
  let gastos = [
    { id: 1, fecha: dia(3), tienda: 'maxi', categoria: 'Súper', monto: 48.35, nota: 'Compra de la quincena', ahorro: 4.1 },
    { id: 2, fecha: dia(6), tienda: 'Mercado', categoria: 'Mercado', monto: 12.5, nota: 'Verduras', ahorro: 2.3 },
    { id: 3, fecha: dia(8), tienda: 'selectos', categoria: 'Limpieza', monto: 9.8, nota: '', ahorro: 0 },
  ];
  // meses anteriores (para la gráfica del resumen)
  [[-1, 268, 15], [-2, 291, 9], [-3, 305, 4], [-4, 279, 11], [-5, 312, 0]].forEach(([dm, monto, ahorro], i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + dm, 12);
    gastos.push({ id: 50 + i, fecha: d.toLocaleDateString('en-CA'), tienda: 'maxi', categoria: 'Súper', monto, nota: '', ahorro });
  });
  let ajustes = { umbral_segunda_tienda: 3, tiendas_cercanas: tiendas.map((t) => t.id) };
  const menus = {};
  let idItem = 100;
  let idGasto = 100;
  const espera = (ms = 120) => new Promise((r) => setTimeout(r, ms));
  const conOpciones = (i) => ({ ...i, opciones: i.productos.map((id) => productos.find((p) => p.id === id)).filter(Boolean) });

  return {
    demo: true,
    async usuario() { return { email: 'demo@canasta.sv' }; },
    async esMiembro() { return true; },
    async pedirCodigo() {},
    async verificarCodigo() {},
    async salir() { location.search = ''; },
    async tiendas() { return tiendas; },
    async ajustes() { return { ...ajustes }; },
    async guardarAjuste(clave, valor) { ajustes[clave] = valor; },
    async lista() {
      await espera();
      return [...lista].sort((a, b) => a.comprado - b.comprado || a.id - b.id).map(conOpciones);
    },
    async hogarArticulos() { return hogar.map((a) => ({ ...a })); },
    async crearHogarArticulos(filas) { const nuevas = filas.map((f) => ({ id: idHogar++, compras_desde: 0, activo: true, stock_fecha: new Date().toISOString(), ...f })); hogar.push(...nuevas); return nuevas; },
    async actualizarHogarArticulo(id, c) { hogar = hogar.map((a) => (a.id === id ? { ...a, ...c } : a)); },
    async movimientoHogar(m) { const fila = { id: idMov++, fecha: new Date().toISOString(), ...m }; movHogar.push(fila); return fila; },
    async movimientosHogar(id) { return movHogar.filter((m) => m.articulo_id === id).sort((a, b) => b.fecha.localeCompare(a.fecha)); },
    async borrarMovimientoHogar(id) { movHogar = movHogar.filter((m) => m.id !== id); },
    async ultimoMovimientoDeLista(listaId) { return movHogar.filter((m) => m.lista_id === listaId).at(-1) || null; },
    async candidatosHogar(terminos) {
      await espera();
      return terminos.flatMap((t) => productos.filter((p) => p.contenido && t.split(' ').every((w) => p.busqueda.includes(w))).map((p) => ({ ...p, termino: t })));
    },
    async agregarTerminos() {},
    escucharHogar() { return () => {}; },
    async agregarItem(it) {
      const fila = { id: idItem++, cantidad: 1, categoria: 'Súper', productos: [], comprado: false, ...it };
      lista.push(fila);
      return fila;
    },
    async actualizarItem(id, cambios) { lista = lista.map((i) => (i.id === id ? { ...i, ...cambios } : i)); },
    async borrarItem(id) { lista = lista.filter((i) => i.id !== id); },
    async borrarComprados() { lista = lista.filter((i) => !i.comprado); },
    async buscarProductos(q) {
      await espera();
      const palabras = normalizar(q).split(' ').filter(Boolean);
      return productos.filter((p) => palabras.every((w) => p.busqueda.includes(w))).sort((a, b) => a.precio - b.precio);
    },
    async buscarAhora() { await espera(900); return { productos: 0, cambios: 0, demo: true }; },
    async ofertas() {
      await espera();
      return productos
        .filter((p) => p.precio < p.precio_lista)
        .map((p) => ({ ...p, precio_ref: p.precio_lista, descuento_pct: Math.round(100 * (1 - p.precio / p.precio_lista)) }))
        .sort((a, b) => b.descuento_pct - a.descuento_pct);
    },
    async presupuestos(m) { return presupuestos.filter((p) => p.mes === m); },
    async guardarPresupuesto(m, categoria, monto) {
      presupuestos = presupuestos.filter((p) => !(p.mes === m && p.categoria === categoria));
      presupuestos.push({ mes: m, categoria, monto });
    },
    async gastos(m) {
      return gastos.filter((g) => g.fecha >= m && g.fecha < finDeMes(m)).sort((a, b) => b.fecha.localeCompare(a.fecha));
    },
    async gastosRango(desde, hasta) { return gastos.filter((g) => g.fecha >= desde && g.fecha < hasta); },
    async agregarGasto(g) { gastos.push({ id: idGasto++, fecha: isoHoy, ahorro: 0, ...g }); },
    async borrarGasto(id) { gastos = gastos.filter((g) => g.id !== id); },
    escucharLista() { return () => {}; },
    async candidatosIngredientes(terminos) {
      await espera();
      return terminos.flatMap((t) => {
        const ws = t.split(' ');
        return productos
          .filter((p) => p.contenido && ws.every((w) => p.busqueda.includes(w)))
          .map((p) => ({ ...p, termino: t }));
      });
    },
    async menu(semana) { return menus[semana] ?? null; },
    async guardarMenu(semana, datos) { menus[semana] = datos; },
    escucharMenu() { return () => {}; },
    // ---- v4 ----
    async despensa() { return despensa.map((d) => ({ ...d })); },
    async agregarDespensa(f) { const fila = { id: idDesp++, ...f }; despensa.push(fila); return fila; },
    async actualizarDespensa(id, c) { despensa = despensa.map((d) => (d.id === id ? { ...d, ...c } : d)); },
    async borrarDespensa(id) { despensa = despensa.filter((d) => d.id !== id); },
    escucharDespensa() { return () => {}; },
    async resumenPrecios(ids) { return productos.filter((p) => ids.includes(p.id)).map(resumenDemo); },
    async productosPorEan(codigo) {
      const c = String(codigo).replace(/^0+/, '');
      return productos.filter((p) => p.ean && p.ean.replace(/^0+/, '') === c).sort((a, b) => a.precio - b.precio);
    },
    async preciosMercado() { return mercadoDemo; },
    async preciosAgromercado() { return agroDemo.map((f) => ({ ...f })); },
    async guardarPrecioAgromercado(fila) {
      const i = agroDemo.findIndex((f) => f.ingrediente === fila.ingrediente && f.descripcion === fila.descripcion);
      const nueva = { id: i >= 0 ? agroDemo[i].id : Date.now(), fecha: new Date().toISOString().slice(0, 10), fuente: 'Anotado en la app', ...fila };
      if (i >= 0) agroDemo[i] = nueva; else agroDemo.push(nueva);
      return nueva;
    },
    async borrarPrecioAgromercado(id) { agroDemo = agroDemo.filter((f) => f.id !== id); },
    async guardarSuscripcion() {},
    async borrarSuscripcion() {},
    async suscripcion() { return null; },
    async recetasPropias() { return recetasPropias.map((r) => ({ ...r })); },
    async guardarRecetaPropia(r) { recetasPropias = [...recetasPropias.filter((x) => x.id !== r.id), { ...r, propia: true }]; },
    async borrarRecetaPropia(id) { recetasPropias = recetasPropias.filter((x) => x.id !== id); },
    async ideasIA({ tiempo = 'almuerzo' } = {}) {
      await espera(800);
      return {
        demo: true,
        recetas: [{
          id: `ia-${Date.now()}`, nombre: 'Arroz con huevo, tomate y chile (idea de ejemplo)', minutos: 25, porciones: 4,
          tiempos: [tiempo], aparatos: ['estufa'], etiquetas: ['rapido', 'economico'], proteina: 'huevo',
          ing: [['arroz', 300], ['huevo', 6], ['tomate', 300], ['chile_verde', 1], ['cebolla', 80], ['aceite', 20]],
          pasos: ['Cocina el arroz.', 'Sofríe tomate, chile y cebolla.', 'Agrega los huevos revueltos y mezcla con el arroz.'],
          motivo: 'Usa el tomate que vence pronto y el arroz que ya tienes.',
        }],
      };
    },
  };
}
