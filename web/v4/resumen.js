// Resumen de ahorro: cuánto ahorraste cada mes (por comprar donde sale más barato,
// usar lo de la despensa, etc.) y el avance hacia una meta (ej. el carro).
import { $, esc, dinero, estado, app, abrirHoja, cerrarHoja, aviso, errorAviso, moverMes, round2 } from '../nucleo.js';

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Agrupa gastos por mes: [{mes, gasto, ahorro}] de los últimos n meses (el actual al final) */
export function porMes(gastos, mesActual, n = 6) {
  const meses = Array.from({ length: n }, (_, i) => moverMes(mesActual, i - n + 1));
  return meses.map((m) => {
    const del = gastos.filter((g) => g.fecha >= m && g.fecha < moverMes(m, 1));
    return { mes: m, gasto: round2(del.reduce((s, g) => s + g.monto, 0)), ahorro: round2(del.reduce((s, g) => s + (g.ahorro || 0), 0)) };
  });
}

/** Barras SVG del ahorro por mes. Una sola serie: el título la nombra, sin leyenda. */
function barras(datos) {
  const W = 320, H = 110, base = 92, alto = 72;
  const max = Math.max(1, ...datos.map((d) => d.ahorro));
  const ancho = (W - 8) / datos.length;
  const barra = Math.min(34, ancho - 10);
  return `<svg class="barras-ahorro" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Ahorro por mes">
    <line x1="0" x2="${W}" y1="${base}" y2="${base}" class="eje"/>
    ${datos.map((d, i) => {
      const h = Math.max(d.ahorro > 0 ? 3 : 0, (d.ahorro / max) * alto);
      const x = 4 + i * ancho + (ancho - barra) / 2;
      const r = Math.min(4, h / 2, barra / 2);
      const actual = i === datos.length - 1;
      const etq = MESES_CORTOS[Number(d.mes.slice(5, 7)) - 1];
      // rectángulo con las esquinas de arriba redondeadas, anclado a la línea base
      const path = h > 0
        ? `M${x},${base} V${base - h + r} Q${x},${base - h} ${x + r},${base - h} H${x + barra - r} Q${x + barra},${base - h} ${x + barra},${base - h + r} V${base} Z`
        : '';
      return `<g class="${actual ? 'actual' : ''}">
        <title>${etq}: ahorraste ${dinero(d.ahorro)} de ${dinero(d.gasto)} gastados</title>
        <rect x="${x - 4}" y="${base - alto - 14}" width="${barra + 8}" height="${alto + 30}" fill="transparent"/>
        ${path ? `<path d="${path}"/>` : ''}
        ${actual && d.ahorro > 0 ? `<text x="${x + barra / 2}" y="${base - h - 5}" text-anchor="middle" class="valor">${dinero(d.ahorro)}</text>` : ''}
        <text x="${x + barra / 2}" y="${H - 4}" text-anchor="middle" class="mes">${etq}</text>
      </g>`;
    }).join('')}
  </svg>`;
}

export async function pintarResumen(cont, mes) {
  const desde = moverMes(mes, -5);
  const meta = estado.ajustes.meta_ahorro || null;
  let gastos = [];
  try {
    gastos = await app.D.gastosRango(meta?.desde && meta.desde < desde ? meta.desde : desde, moverMes(mes, 1));
  } catch (e) { console.warn(e); }
  const datos = porMes(gastos, mes);
  const esteMes = datos.at(-1);
  const acumulado = meta ? round2(gastos.filter((g) => g.fecha >= (meta.desde || '2000-01-01')).reduce((s, g) => s + (g.ahorro || 0), 0)) : 0;
  const avance = meta?.monto ? Math.min(100, (100 * acumulado) / meta.monto) : 0;
  const tabla = datos.map((d) => `<tr><td>${MESES_CORTOS[Number(d.mes.slice(5, 7)) - 1]}</td><td class="precio">${dinero(d.gasto)}</td><td class="precio">${dinero(d.ahorro)}</td></tr>`).join('');

  cont.innerHTML = `
    <section class="tarjeta resumen-ahorro">
      <div class="sub">Ahorro de este mes</div>
      <div class="grande precio">${dinero(esteMes.ahorro)}</div>
      <div class="sub">vs. comprar lo mismo en la tienda más cara. Se suma al registrar cada compra.</div>
      <h4 class="titulo-graf">Ahorro por mes</h4>
      ${barras(datos)}
      <details class="tabla-datos"><summary>Ver en tabla</summary>
        <table><thead><tr><th>Mes</th><th>Gastado</th><th>Ahorrado</th></tr></thead><tbody>${tabla}</tbody></table></details>
      ${meta?.monto ? `
        <div class="meta">
          <div class="fila"><span>🎯 ${esc(meta.nombre || 'Meta de ahorro')}</span><b class="precio">${dinero(acumulado)} de ${dinero(meta.monto)}</b></div>
          <div class="barra"><i style="width:${avance}%"></i></div>
          <div class="sub">Lo que ahorras en el súper, apártalo para tu meta.</div>
        </div>` : ''}
      <button class="btn-texto" id="editar-meta">${meta?.monto ? 'Editar meta' : '🎯 Ponerle una meta al ahorro'}</button>
    </section>`;
  $('#editar-meta', cont).onclick = () => hojaMeta(meta, () => pintarResumen(cont, mes));
}

function hojaMeta(meta, despues) {
  const h = abrirHoja(`
    <h3>Meta de ahorro</h3>
    <label class="campo">¿Para qué ahorras?<input id="meta-nombre" value="${esc(meta?.nombre || '')}" placeholder="ej. Prima del carro"></label>
    <label class="campo">Monto ($)<input id="meta-monto" type="number" inputmode="decimal" min="0" step="10" value="${meta?.monto || ''}"></label>
    <p class="sub">Cuenta el ahorro registrado desde ${meta?.desde ? `el ${esc(meta.desde)}` : 'el 1 de este mes'}.</p>
    <div class="pie">${meta ? '<button class="btn-secundario peligro" id="quitar">Quitar meta</button>' : '<button class="btn-secundario" id="cancelar">Cancelar</button>'}
      <button class="btn-primario" id="guardar">Guardar</button></div>`);
  $('#cancelar', h)?.addEventListener('click', cerrarHoja);
  $('#quitar', h)?.addEventListener('click', async () => {
    await app.D.guardarAjuste('meta_ahorro', null);
    estado.ajustes.meta_ahorro = null;
    cerrarHoja();
    despues();
  });
  $('#guardar', h).onclick = async () => {
    const monto = Number($('#meta-monto', h).value);
    if (!monto) return aviso('Pon el monto de la meta.');
    const nueva = { nombre: $('#meta-nombre', h).value.trim() || 'Meta de ahorro', monto, desde: meta?.desde || `${new Date().toLocaleDateString('en-CA').slice(0, 8)}01` };
    try {
      await app.D.guardarAjuste('meta_ahorro', nueva);
      estado.ajustes.meta_ahorro = nueva;
      cerrarHoja();
      despues();
    } catch (e) { errorAviso(e); }
  };
}
