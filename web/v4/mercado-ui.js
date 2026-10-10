// Precios del mercado (Defensoría) en la app: comparar con el súper.
import { estado, app, esc, dinero, mejorOpcion } from '../nucleo.js';
import { INGREDIENTES, buscarIngrediente } from '../menu/ingredientes.js';
import { preciosMercado } from '../menu/mercado.js';

export async function cargarMercado() {
  if (estado.mercado) return estado.mercado;
  try {
    estado.mercado = preciosMercado(await app.D.preciosMercado(), INGREDIENTES);
  } catch (e) {
    console.warn('Sin precios de mercado', e);
    estado.mercado = new Map();
  }
  return estado.mercado;
}

export const fechaMercado = () => [...(estado.mercado?.values() || [])][0]?.fecha || null;

/** Cuánto costaría en el mercado la misma cantidad que un producto del súper */
export function costoEnMercado(ingrediente, cantidadBase) {
  const m = estado.mercado?.get(ingrediente);
  return m ? m.precioUnit * cantidadBase : null;
}

/**
 * Artículos de la lista que salen bastante más baratos en el mercado (≥ 15 %).
 * @returns {Array<{item, super, mercado, ahorro, fuente}>}
 */
export function masBaratoEnMercado(items) {
  const out = [];
  for (const item of items) {
    if (item.comprado) continue;
    const ing = item.ingrediente || buscarIngrediente(item.nombre);
    const op = mejorOpcion(item);
    if (!ing || !op?.contenido || op.unidad !== INGREDIENTES[ing]?.unidad) continue;
    const base = op.contenido * (Number(item.cantidad) || 1);
    const enMercado = costoEnMercado(ing, base);
    const enSuper = op.precio * (Number(item.cantidad) || 1);
    if (enMercado != null && enMercado < enSuper * 0.85) {
      out.push({ item, super: enSuper, mercado: enMercado, ahorro: enSuper - enMercado, fuente: estado.mercado.get(ing).producto });
    }
  }
  return out.sort((a, b) => b.ahorro - a.ahorro);
}

/** Etiqueta para las compras del menú */
export function chipMercado(compra) {
  if (!compra.producto || !estado.mercado?.has(compra.ingId)) return '';
  const enMercado = costoEnMercado(compra.ingId, compra.paquetes * compra.producto.contenido);
  if (enMercado == null || enMercado >= compra.costo * 0.85) return '';
  return `<span class="chip-mercado" title="Precio promedio del sondeo de la Defensoría">🧺 Mercado ~${esc(dinero(enMercado))}</span>`;
}
