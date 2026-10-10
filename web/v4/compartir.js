// Compartir la lista por WhatsApp (o lo que tenga el celular), ordenada por tienda.
import { estado, tiendasActivas, tiendaNombre, aviso } from '../nucleo.js';
import { optimizar } from '../optimizador.js';

export function textoLista() {
  const pendientes = estado.lista.filter((i) => !i.comprado);
  const r = optimizar(pendientes, tiendasActivas(), Number(estado.ajustes.umbral_segunda_tienda) || 3);
  const lineas = ['🛒 *Lista del súper*', ''];
  const asignados = new Set();
  if (r.mejor) {
    const porTienda = {};
    for (const a of r.mejor.asignacion) (porTienda[a.tienda] ||= []).push(a);
    for (const [t, as] of Object.entries(porTienda)) {
      lineas.push(`*${tiendaNombre(t)}*`);
      for (const a of as) {
        asignados.add(a.item.id);
        lineas.push(`• ${a.item.nombre}${a.item.cantidad !== 1 ? ` ×${a.item.cantidad}` : ''} — ${a.opcion.nombre} ($${a.subtotal.toFixed(2)})`);
      }
      lineas.push('');
    }
  }
  const otros = pendientes.filter((i) => !asignados.has(i.id));
  if (otros.length) {
    lineas.push(r.mejor ? '*Otros*' : '');
    otros.forEach((i) => lineas.push(`• ${i.nombre}${i.cantidad !== 1 ? ` ×${i.cantidad}` : ''}`));
    lineas.push('');
  }
  if (r.mejor) lineas.push(`Total aprox.: $${r.mejor.total.toFixed(2)}`);
  return lineas.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export async function compartirLista() {
  const texto = textoLista();
  try {
    if (navigator.share) { await navigator.share({ text: texto }); return; }
  } catch (e) {
    if (e?.name === 'AbortError') return;
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  aviso('Abriendo WhatsApp…');
}
