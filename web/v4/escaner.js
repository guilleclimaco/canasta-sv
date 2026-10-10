// Escáner de código de barras: en el súper, ver cuánto cuesta lo mismo en las otras tiendas.
// Usa el lector del propio navegador (Chrome/Android) y, si no hay (iPhone), la librería ZXing.
import { $, $$, esc, dinero, estado, app, abrirHoja, cerrarHoja, alCerrarHoja, chip, aviso, errorAviso, cargarScript } from '../nucleo.js';
import { buscarIngrediente } from '../menu/ingredientes.js';

const ZXING = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';

/** Valida el dígito verificador de EAN-13 / UPC-A / EAN-8 (evita lecturas falsas) */
export function codigoValido(codigo) {
  const c = String(codigo || '').replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(c.length)) return false;
  const d = c.split('').map(Number);
  const control = d.pop();
  const suma = d.reverse().reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (suma % 10)) % 10 === control;
}

export function abrirEscaner() {
  const h = abrirHoja(`
    <h3>Escanear producto</h3>
    <div class="camara"><video id="video" playsinline muted></video><div class="mira"></div></div>
    <p class="sub" id="estado-cam">Apunta al código de barras…</p>
    <form class="agregar" id="f-codigo" style="margin:8px 0 0">
      <input name="codigo" inputmode="numeric" placeholder="O escribe el código" aria-label="Código de barras">
      <button class="btn-secundario" style="height:50px">Buscar</button>
    </form>
    <div class="cuerpo" id="resultado"></div>`);
  let parar = () => {};
  let listo = false;
  alCerrarHoja(() => parar());

  const encontrado = async (codigo) => {
    if (listo || !codigoValido(codigo)) return;
    listo = true;
    parar();
    if (navigator.vibrate) navigator.vibrate(60);
    $('#estado-cam', h).textContent = `Código ${codigo}`;
    await mostrar(codigo);
  };

  const mostrar = async (codigo) => {
    const cont = $('#resultado', h);
    cont.innerHTML = '<div class="cargando" style="min-height:80px"><div class="giro"></div></div>';
    try {
      const prods = await app.D.productosPorEan(codigo);
      if (!prods.length) {
        cont.innerHTML = `<div class="vacio"><b>No lo tenemos todavía</b>Ese código no está en los precios guardados (Selectos no publica códigos de barras).
          Prueba buscándolo por nombre en la lista.</div>`;
        return;
      }
      const barato = prods[0];
      cont.innerHTML = `
        <div class="tarjeta" style="padding:14px">
          <b>${esc(barato.nombre)}</b>
          ${prods.map((p, i) => `<div class="linea"><span>${chip(p.tienda)}</span><span class="precio ${i === 0 ? 'mejor-p' : ''}">${dinero(p.precio)}</span></div>`).join('')}
          ${prods.length > 1 ? `<p class="sub">La diferencia entre la más barata y la más cara es ${dinero(prods.at(-1).precio - barato.precio)}.</p>` : ''}
        </div>
        <button class="btn-primario" id="a-lista" style="width:100%;margin-top:10px">Agregar a la lista</button>`;
      $('#a-lista', cont).onclick = async () => {
        try {
          await app.D.agregarItem({ nombre: barato.nombre, cantidad: 1, productos: prods.map((p) => p.id), ingrediente: buscarIngrediente(barato.nombre) });
          await app.cargarLista();
          aviso('Agregado a la lista');
          cerrarHoja();
          app.render();
        } catch (e) { errorAviso(e); }
      };
    } catch (e) { errorAviso(e); }
  };

  $('#f-codigo', h).onsubmit = (ev) => {
    ev.preventDefault();
    const c = ev.target.codigo.value.replace(/\D/g, '');
    if (c) { listo = true; parar(); mostrar(c); }
  };

  (async () => {
    const video = $('#video', h);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      video.srcObject = stream;
      await video.play();
      let corriendo = true;
      parar = () => { corriendo = false; stream.getTracks().forEach((t) => t.stop()); };
      if ('BarcodeDetector' in window) {
        const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        const ciclo = async () => {
          if (!corriendo) return;
          try {
            const r = await det.detect(video);
            if (r[0]) return encontrado(r[0].rawValue);
          } catch { /* cuadro sin código */ }
          setTimeout(ciclo, 250);
        };
        ciclo();
      } else {
        await cargarScript(ZXING);
        const lector = new window.ZXing.BrowserMultiFormatReader();
        lector.decodeFromStream(stream, video, (res) => { if (res) encontrado(res.getText()); });
        const pararStream = parar;
        parar = () => { try { lector.reset(); } catch { /* nada */ } pararStream(); };
      }
    } catch (e) {
      $('#estado-cam', h).textContent = 'No se pudo abrir la cámara. Escribe el código a mano.';
      console.warn(e);
    }
  })();
}
