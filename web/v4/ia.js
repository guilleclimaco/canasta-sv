// Ideas de recetas con IA (opcional, cuesta centavos al mes).
// La app manda a la función "ideas" de Supabase: lo que hay en casa, lo que vence, lo que está en
// oferta y tus gustos; la IA propone recetas usando SOLO ingredientes del catálogo, para poder cotizarlas.
import { $, $$, esc, dinero, estado, app, abrirHoja, cerrarHoja, aviso, errorAviso } from '../nucleo.js';
import { INGREDIENTES } from '../menu/ingredientes.js';
import { costoReceta, ingredienteEnReceta } from '../menu/planificador.js';
import { formularioReceta } from './recetas-ui.js';

const TIEMPOS = ['desayuno', 'refaccion', 'almuerzo', 'cena'];
const PROTEINAS = ['pollo', 'res', 'cerdo', 'pescado', 'huevo', 'embutido', 'vegetal'];

/** Revisa y limpia lo que devuelve la IA: ingredientes del catálogo, números razonables, pasos. */
export function validarRecetaIA(r, tiempo) {
  if (!r || typeof r !== 'object' || !r.nombre) return null;
  const ing = (Array.isArray(r.ing) ? r.ing : [])
    .filter((x) => Array.isArray(x) && INGREDIENTES[x[0]] && Number(x[1]) > 0)
    .map(([id, c]) => [id, Math.min(Number(c), INGREDIENTES[id].unidad === 'und' ? 60 : 5000)]);
  const pasos = (Array.isArray(r.pasos) ? r.pasos : []).map(String).map((s) => s.trim()).filter(Boolean).slice(0, 10);
  if (ing.filter(([id]) => !INGREDIENTES[id].basico).length < 1 || pasos.length < 2) return null;
  return {
    id: `ia-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    nombre: String(r.nombre).slice(0, 80),
    minutos: Math.min(240, Math.max(5, Number(r.minutos) || 30)),
    porciones: Math.min(12, Math.max(1, Number(r.porciones) || 4)),
    tiempos: [...new Set([...(Array.isArray(r.tiempos) ? r.tiempos : []), tiempo].filter((t) => TIEMPOS.includes(t)))],
    aparatos: ['estufa', ...((Array.isArray(r.aparatos) ? r.aparatos : []).filter((a) => ['horno', 'freidora', 'licuadora'].includes(a)))],
    etiquetas: (Array.isArray(r.etiquetas) ? r.etiquetas : []).filter((e) => typeof e === 'string').slice(0, 6),
    proteina: PROTEINAS.includes(r.proteina) ? r.proteina : 'vegetal',
    ing,
    pasos,
    motivo: r.motivo ? String(r.motivo).slice(0, 200) : '',
  };
}

/** Lo que se le manda a la IA (sin datos personales: solo comida y precios) */
export function pedidoIdeas({ tiempo, antojo, perfil, despensa, porVencer, precios }) {
  return {
    modo: 'ideas',
    tiempo,
    antojo: antojo || '',
    porciones: perfil ? Math.max(1, (perfil.adultos || 1) + 0.5 * (perfil.ninos || 0)) : 4,
    evitar: perfil?.evitar || [],
    estilos: perfil?.estilos || [],
    aparatos: ['estufa', ...(perfil?.aparatos || [])],
    enCasa: [...(despensa?.keys?.() || [])],
    porVencer: porVencer || [],
    enOferta: Object.entries(precios || {}).filter(([, p]) => p.oferta).map(([id]) => id),
    catalogo: Object.entries(INGREDIENTES).map(([id, i]) => [id, i.nombre, i.basico ? 'basico' : i.unidad]),
  };
}

/**
 * Hoja de ideas. `alUsar(receta)` se llama si se quiere poner la receta en una comida del menú.
 */
export function abrirIdeasIA({ tiempo = 'almuerzo', contexto, alUsar } = {}) {
  const h = abrirHoja(`
    <h3>Ideas con IA</h3>
    <p class="sub" style="margin:-6px 0 10px">Propone recetas con lo que tienes, lo que vence y lo que está en oferta. Cada consulta cuesta una fracción de centavo.</p>
    <form class="agregar" id="f-ia" style="margin-top:0">
      <input name="antojo" placeholder="¿Algo en especial? ej. con pollo, sin horno" aria-label="Antojo">
      <button class="btn-primario" style="padding:0 14px">Pedir</button>
    </form>
    <div class="cuerpo" id="ideas"></div>`);
  const pedir = async (antojo) => {
    const cont = $('#ideas', h);
    cont.innerHTML = '<div class="cargando" style="min-height:120px"><div class="giro"></div></div>';
    try {
      const r = await app.D.ideasIA(pedidoIdeas({ tiempo, antojo, ...contexto() }));
      const recetas = (r.recetas || []).map((x) => validarRecetaIA(x, tiempo)).filter(Boolean);
      if (!recetas.length) { cont.innerHTML = '<div class="vacio">La IA no devolvió recetas útiles. Prueba de nuevo.</div>'; return; }
      const { precios, despensa } = contexto();
      cont.innerHTML = `${r.demo ? '<p class="sub">Modo demo: idea de ejemplo, sin IA real.</p>' : ''}${recetas.map((x, i) => {
        const c = costoReceta(x, x.porciones, precios, despensa);
        return `<div class="tarjeta idea" data-i="${i}">
          <b>${esc(x.nombre)}</b>
          <div class="sub">${dinero(c.porPorcion)}/porción · ${x.minutos} min${x.motivo ? ` · ${esc(x.motivo)}` : ''}</div>
          <ul>${x.ing.map(([id, cant]) => `<li>${esc(ingredienteEnReceta(id, cant, x, x.porciones))}</li>`).join('')}</ul>
          <ol>${x.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
          <div style="display:flex;gap:8px">
            ${alUsar ? '<button class="btn-primario" data-accion="usar" style="flex:1">Usar en el menú</button>' : ''}
            <button class="btn-secundario" data-accion="guardar" style="flex:1">Guardar en mis recetas</button>
          </div></div>`;
      }).join('')}`;
      $$('.idea', cont).forEach((el) => {
        const x = recetas[Number(el.dataset.i)];
        $$('[data-accion]', el).forEach((b) => (b.onclick = async () => {
          if (b.dataset.accion === 'guardar') return formularioReceta({ ...x, id: null, propia: false });
          // usar: se guarda como receta propia (para que el menú la encuentre) y se pone en la comida
          try {
            const propia = { ...x, id: `propia-${x.id}`, propia: true };
            await app.D.guardarRecetaPropia(propia);
            estado.recetasPropias = await app.D.recetasPropias();
            cerrarHoja();
            await alUsar(propia);
            aviso('Listo: quedó en el menú y en tus recetas');
          } catch (e) { errorAviso(e); }
        }));
      });
    } catch (e) {
      cont.innerHTML = `<div class="vacio"><b>No se pudo consultar la IA</b>${esc(e.message || e)}<br>Revisa que la función "ideas" esté desplegada y tenga su llave (README → IA).</div>`;
    }
  };
  $('#f-ia', h).onsubmit = (ev) => { ev.preventDefault(); pedir(ev.target.antojo.value.trim()); };
  pedir('');
}
