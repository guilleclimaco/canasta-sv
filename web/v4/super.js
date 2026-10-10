// Modo "en el súper": la lista por pasillo, botones grandes y un total que va sumando.
import { $, $$, esc, dinero, estado, app, abrirHoja, cerrarHoja, chip, tiendasActivas, tiendaCorta, mejorOpcion, local, round2 } from '../nucleo.js';
import { PASILLOS, pasilloDeArticulo } from '../menu/ingredientes.js';
import { optimizar } from '../optimizador.js';

export function abrirModoSuper() {
  const pendientes = estado.lista.filter((i) => !i.comprado);
  const r = optimizar(pendientes, tiendasActivas(), Number(estado.ajustes.umbral_segunda_tienda) || 3);
  let tienda = local.leer('super.tienda') || r.mejor?.tiendas[0] || tiendasActivas()[0];
  const carrito = new Set(local.leer('super.carrito', []).filter((id) => pendientes.some((i) => i.id === id)));
  const h = abrirHoja('<div id="modo-super"></div>', { clase: 'pantalla' });

  const precioEn = (item, t) => {
    const o = mejorOpcion(item, t);
    return o ? round2(o.precio * (Number(item.cantidad) || 1)) : null;
  };
  const pintar = () => {
    const cont = $('#modo-super', h);
    const grupos = PASILLOS.map((p) => [p, pendientes.filter((i) => pasilloDeArticulo(i.nombre, i.ingrediente) === p)]).filter(([, l]) => l.length);
    const enCarrito = pendientes.filter((i) => carrito.has(i.id));
    const total = round2(enCarrito.reduce((s, i) => s + (precioEn(i, tienda) || 0), 0));
    const sinPrecio = enCarrito.filter((i) => precioEn(i, tienda) == null).length;
    const queda = estado.presupuestoMes ? estado.presupuestoMes - estado.gastoMes - total : null;
    cont.innerHTML = `
      <div class="super-cab">
        <button class="icono-btn" id="salir-super" aria-label="Salir">✕</button>
        <div><b>En el súper</b><div class="sub">${enCarrito.length} de ${pendientes.length} en el carrito</div></div>
      </div>
      <div class="filtros">${tiendasActivas().map((t) => `<button class="filtro" data-t="${esc(t)}" aria-pressed="${t === tienda}">${esc(tiendaCorta(t))}</button>`).join('')}</div>
      <div class="super-lista">
        ${grupos.map(([p, l]) => `<h2 class="titulo">${esc(p)}</h2>
          ${l.map((i) => {
            const pr = precioEn(i, tienda);
            return `<button class="super-item ${carrito.has(i.id) ? 'en' : ''}" data-id="${i.id}">
              <span class="caja-grande"></span>
              <span class="info"><span class="n">${esc(i.nombre)}${i.cantidad !== 1 ? ` ×${i.cantidad}` : ''}</span>
                <span class="sub">${pr != null ? dinero(pr) : 'sin precio aquí'}${!pr && mejorOpcion(i) ? ` · mejor en ${chip(mejorOpcion(i).tienda)}` : ''}</span></span>
            </button>`;
          }).join('')}`).join('') || '<div class="vacio">No hay nada pendiente en la lista.</div>'}
      </div>
      <div class="super-pie">
        <div><div class="sub">Carrito${sinPrecio ? ` (+${sinPrecio} sin precio)` : ''}</div><div class="total precio">${dinero(total)}</div>
          ${queda != null ? `<div class="sub ${queda < 0 ? 'mal' : ''}">${queda < 0 ? `Te pasas del mes por ${dinero(-queda)}` : `Te quedan ${dinero(queda)} del mes`}</div>` : ''}</div>
        <button class="btn-primario" id="terminar" ${enCarrito.length ? '' : 'disabled'}>Terminar compra</button>
      </div>`;
    $('#salir-super', cont).onclick = cerrarHoja;
    $$('[data-t]', cont).forEach((b) => (b.onclick = () => { tienda = b.dataset.t; local.guardar('super.tienda', tienda); pintar(); }));
    $$('.super-item', cont).forEach((b) => (b.onclick = () => {
      const id = Number(b.dataset.id);
      carrito.has(id) ? carrito.delete(id) : carrito.add(id);
      local.guardar('super.carrito', [...carrito]);
      if (navigator.vibrate) navigator.vibrate(15);
      pintar();
    }));
    $('#terminar', cont).onclick = () => {
      // ahorro: lo mismo en la tienda más cara que lo tenga todo
      const porTienda = tiendasActivas().map((t) => enCarrito.reduce((s, i) => s + (precioEn(i, t) ?? Infinity), 0)).filter(Number.isFinite);
      const ahorro = porTienda.length ? Math.max(0, round2(Math.max(...porTienda) - total)) : 0;
      app.hojaGasto({ monto: total, tienda, categoria: 'Súper', nota: `Compra en el súper (${enCarrito.length} artículos)`, ahorro }, async () => {
        const { agregarDesdeItem } = await import('./despensa.js');
        for (const i of enCarrito) {
          await app.D.actualizarItem(i.id, { comprado: true });
          await agregarDesdeItem(i).catch(() => {});
        }
        local.guardar('super.carrito', []);
        await app.cargarLista();
        const { cargarDespensa } = await import('./despensa.js');
        await cargarDespensa();
        estado.menuCargado = false;
      });
    };
  };
  pintar();
}
