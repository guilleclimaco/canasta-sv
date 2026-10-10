# 🧺 Canasta SV

App para el celular (iPhone y Android) que junta la **lista del súper**, el **menú de la semana (desayunos, refacciones, almuerzos y cenas)**, lo que se usa en la **casa** (cuidado personal y limpieza), el **presupuesto del mes** y un **comparador de precios** de supermercados de El Salvador. Te arma qué cocinar con lo más barato de la semana, te pasa los ingredientes a la lista, te avisa qué jabón, detergente o papel se te está acabando y te dice si conviene comprar todo en un solo lugar o dividir la compra entre dos tiendas, y solo te manda a la segunda si el ahorro vale la vuelta.

**Costo mensual: $0.** Todo corre en planes gratuitos.

![Capturas de la app en modo demo](docs/capturas.png)

> **Para Claude Code:** este README es tu guía de instalación. Sigue la sección
> [🤖 Instalación paso a paso](#-instalación-paso-a-paso-para-claude-code) en orden y
> marca cada casilla de la [lista de verificación](#-lista-de-verificación-final). Lee también `CLAUDE.md`.

---

## Qué hace

| Pantalla | Para qué |
|---|---|
| **Menú** | Estilo NeatEat. Eliges qué comidas planear (desayuno, refacción de la mañana, almuerzo, refacción de la tarde, cena) en una cuadrícula de día × comida, con plantillas rápidas ("Solo almuerzos", "Desayuno + almuerzo", "Todo el día"…), y cuántas porciones lleva cada comida. Con tu presupuesto, gustos, aparatos y lo que ya tienes en casa, arma la semana con un recetario de 68 platos salvadoreños y cotidianos, usando los precios reales de hoy. Puedes cambiar cualquier comida al azar o elegirla del recetario, ver la receta con cantidades y pasos, y mandar los ingredientes a la lista con un toque. Sin IA de pago: $0. |
| **Casa** | Cuidado personal (pasta dental, jabón, shampoo, desodorante, papel higiénico…) y limpieza (detergente, suavizante, cloro, desinfectante para piso, lavaplatos…). No va por presupuesto sino por **necesidad**: estima cuánto queda de cada cosa, te dice qué llevar en la próxima compra, cuánto, de qué tienda y cuándo conviene comprar de más porque está en oferta. Aprende lo que gasta tu casa. |
| **Lista** | Escribes "arroz 2", eliges el producto exacto y ves en qué tienda sale más barato. La lista se comparte en vivo entre los dos celulares. |
| **Dónde comprar** | Arma el plan más barato: una sola tienda, o dos si te ahorras más de lo que tú definas (por defecto $3). Te dice qué comprar en cada lugar. |
| **Ofertas** | Productos con precio por debajo de su precio normal o de su máximo de los últimos 60 días. Filtro "De mi lista". |
| **Gastos** | Presupuesto por categoría (Súper, Mercado, Limpieza…), gastos registrados, cuánto te queda en el mes, **resumen de ahorro** por mes y una **meta** (ej. el carro). El gasto se puede registrar con **foto del ticket**. |

### Novedades de la v5: la casa

Los artículos de cuidado personal y limpieza no se compran por presupuesto ni por menú: se compran **cuando se van a acabar**.
La pestaña **Casa** lleva la cuenta:

| Qué | Cómo |
|---|---|
| **Configurar en 1 minuto** | Cuántos son (adultos y niños), cada cuánto haces la compra grande (semana, quincena o mes), qué usan y cuánto queda más o menos de cada cosa ("Nada", "Poquito", "La mitad", "Lleno"). |
| **Cuánto te queda** | Cada artículo tiene un consumo al mes (estimado por persona; los niños cuentan media). El stock baja solo con los días: "Te queda para ~2 semanas". 🔴 se acabó o ≤ 7 días · 🟡 se acaba antes de tu próxima compra · 🟢 bien. |
| **Qué llevar y cuánto** | Lo que alcance hasta la próxima compra + una semana de colchón, en la **presentación más barata por ml, g o unidad** (ej. el 3-pack de pasta dental si sale mejor), sin tamaños absurdos para tu consumo. |
| **De qué tienda** | Compara Walmart, Maxi, Don Juan y Selectos. "Agregar a la lista" lo pasa a la Lista con sus equivalentes en otras tiendas, y **Comprar** arma la ruta de siempre (una tienda o dos si vale la vuelta), junto con la comida. |
| **Con descuentos** | Si algo que usas está ≥ 15 % más barato, te sugiere **abastecerte** (hasta 3 meses, sin que se te acumule de más), aunque todavía no se te acabe, y te dice cuánto ahorras. En Ofertas hay un filtro **🏠 De la casa**. |
| **Aprende** | Al marcar como comprado en la Lista (o "Ya lo compré" en el artículo) el stock sube. Cuando le dices cuánto queda de verdad, compara con lo que había + lo que compraste y **ajusta el consumo real** de tu casa. |
| **Marca preferida** | Por artículo (ej. Colgate, Head & Shoulders). Vacío = la más barata. |
| **Avisos** | Nuevo tipo de aviso: "Se está acabando el papel higiénico (quedan ~2 días)" y "Oferta para abastecerte: detergente −25 % en Walmart". Una vez por vez, sin repetir todos los días. |

### Novedades de la v4

| Mejora | Qué hace | Dónde |
|---|---|---|
| **Despensa viva** | Lo que marcas como comprado entra a "En casa" con cantidad y fecha en que vence. Al marcar una comida como hecha se descuentan sus ingredientes. El menú usa primero lo que vence y no te hace comprar lo que ya tienes. | Lista → En casa |
| **Cocinar una vez, comer dos veces** | El almuerzo se cocina doble y es la cena, o la cena va de almuerzo al día siguiente (lonchera). Las sobras no cuestan nada extra. | Menú → Preferencias |
| **Precios del mercado** | El robot lee cada lunes el sondeo de la Defensoría del Consumidor (La Tiendona y otros mercados) y te avisa qué sale más barato en el mercado que en el súper. | Lista y Compras del menú |
| **Avisos al celular** | Cuando algo de tu lista baja a su precio más bajo, el sábado para armar el menú, al llegar al 90 % del presupuesto y cuando algo en casa está por vencer. | Ajustes |
| **Resumen de ahorro y meta** | Cuánto ahorraste cada mes vs. la tienda más cara y el avance a una meta. | Gastos |
| **Modo "en el súper"** | La lista por pasillo, botones grandes, carrito y total que va sumando en la tienda donde estás. Al terminar registra el gasto y pasa todo a "En casa". | Lista → 🛒 |
| **Escáner de código de barras** | En la tienda escaneas un producto y ves cuánto cuesta en las otras. | Lista → 📷 |
| **Ticket con foto** | Lee total, fecha y tienda del ticket. En el celular y gratis (o con IA si la activas). | Registrar gasto |
| **¿Es buen precio?** | Marca si un producto está en su precio más bajo o más alto de 60 días, con gráfica del historial. | Lista |
| **Compartir por WhatsApp** | La lista ordenada por tienda, con precios. | Lista |
| **👍 / 👎 recetas** | Lo que no les gustó no vuelve a salir; lo que sí, sale más. | Receta |
| **Recetas de la familia** | Las agregas escribiendo ingredientes como "pollo 2 lb" y entran al menú y a la cotización. | Menú → 📖 |
| **Balance** | Avisa si algún día de la semana queda sin verdura ni fruta. | Menú |
| **Lonchera** | Marca qué comidas van en tupper y solo usa recetas que aguantan. | Menú → Preferencias |
| **Ideas con IA (opcional)** | Recetas nuevas con lo que tienes, lo que vence y lo que está en oferta. Cuesta centavos al mes. | Menú (si la activas) |

Tiendas:

| Tienda | Cómo se leen los precios | Estado |
|---|---|---|
| Walmart | API pública VTEX (`/api/catalog_system/pub/products/search`) | ✅ Verificado el 2026-10-09 |
| Maxi Despensa | API pública VTEX | ✅ Verificado el 2026-10-09 |
| La Despensa de Don Juan | API pública VTEX | ✅ Verificado el 2026-10-09 |
| Súper Selectos | Navegador automático (Playwright) que lee el HTML | ⚠️ **Por verificar** (ver paso 7) |

El mismo producto se empareja entre Walmart, Maxi y Don Juan por **código de barras (EAN)**. Selectos no publica código de barras, así que se empareja por nombre o lo marcas tú en el selector.

## Cómo está armado

```
 Celular (iPhone / Android)                         GitHub (gratis)
 ┌──────────────────────────┐                 ┌───────────────────────────────┐
 │ App web instalable (PWA) │◄── GitHub Pages │ Actions, todos los días 6 a.m.│
 │ web/                     │                 │ scraper/actualizar.mjs        │
 └───────────┬──────────────┘                 │  ├─ Walmart / Maxi / Don Juan │
             │ lista, gastos, precios         │  └─ Selectos (Playwright)     │
             ▼                                └──────────────┬────────────────┘
 ┌───────────────────────────────────────┐                   │ guarda precios
 │ Supabase (gratis)                     │◄──────────────────┘
 │ Postgres + login por código al correo │
 │ Edge Function "precios" (buscar ahora)│
 └───────────────────────────────────────┘
        ▲  plan B: si Selectos bloquea a GitHub, la compu de la casa
        └─ corre scraper/tarea-windows.ps1 una vez al día.
```

## Costos

| Servicio | Plan | Costo | Notas |
|---|---|---|---|
| GitHub (repo público + Actions + Pages) | Free | $0 | Actions es ilimitado en repos públicos. La app queda en `https://USUARIO.github.io/canasta-sv/`. |
| Supabase | Free | $0 | 500 MB de base de datos, login por correo y Edge Functions. El proyecto se pausa si pasa 7 días sin uso; el robot diario lo mantiene activo. |
| Dominio | — | $0 | No hace falta. |
| Compu de la casa | — | luz | Solo si se usa el plan B de Selectos. |
| Avisos al celular (Web Push) | — | $0 | Los manda el robot diario de GitHub; no hace falta ningún servicio extra. |
| IA (opcional) | pago por uso | centavos/mes | Solo si activas "Ideas con IA" o la lectura de tickets con IA. Ver [IA opcional](#ia-opcional-centavos-al-mes). |

Verifica los límites actuales en supabase.com/pricing y docs.github.com. Para que la base no crezca, el historial de precios **solo guarda una fila cuando un precio cambia**.

> **¿Por qué repo público?** GitHub Pages gratis requiere repo público. El código queda visible, pero **los datos no**: la lista, los gastos y los precios están protegidos con reglas de seguridad (RLS) y solo los correos de la tabla `miembros` pueden verlos. Las llaves secretas van en *GitHub Secrets*, nunca en el código. Si prefieres repo privado, usa Cloudflare Pages (también gratis) para publicar `web/`.

## Estructura

```
canasta-sv/
├─ web/                         App (HTML/CSS/JS sin compilación)
│  ├─ index.html, estilos.css, app.js
│  ├─ datos.js                  Supabase real + modo demo
│  ├─ optimizador.js            Decide dónde comprar (lógica pura, con pruebas)
│  ├─ menu/recetas.js           Almuerzos + junta todo el recetario (RECETAS)
│  ├─ menu/recetas-desayunos.js Desayunos
│  ├─ menu/recetas-cenas.js     Cenas
│  ├─ menu/recetas-refacciones.js Refacciones para los breaks
│  ├─ menu/ingredientes.js      Ingredientes: cómo buscarlos en tiendas + precio de referencia
│  ├─ menu/planificador.js      Arma la semana por día y comida: costo, variedad, presupuesto, despensa, sobras
│  ├─ menu/mercado.js           Lee el sondeo de precios de mercados de la Defensoría
│  ├─ nucleo.js                 Estado y utilidades compartidas
│  ├─ v4/despensa.js            Despensa viva ("En casa")
│  ├─ v4/super.js · escaner.js · compartir.js   Modo súper, código de barras, WhatsApp
│  ├─ v4/historial.js · mercado-ui.js           ¿Es buen precio? y precios del mercado
│  ├─ v4/ticket.js · resumen.js                 Ticket con foto, resumen de ahorro y meta
│  ├─ v4/avisos.js              Avisos al celular (Web Push)
│  ├─ v4/recetas-ui.js · ia.js  Recetas de la familia e ideas con IA
│  ├─ hogar/catalogo.js         Artículos de la casa: consumo estimado, cómo buscarlos en tiendas
│  ├─ hogar/necesidades.js      Cuánto queda, qué llevar, ofertas para abastecerse, aprender el consumo
│  ├─ v5/hogar-ui.js            Pestaña "Casa"
│  ├─ config.js                 URL + llave PÚBLICA de Supabase  ← se edita en el paso 5
│  └─ manifest.webmanifest, sw.js, icons/
├─ supabase/
│  ├─ migrations/…_canasta.sql  Tablas, seguridad (RLS), funciones y vista de ofertas
│  ├─ migrations/…_menu.sql     Menú semanal compartido + precios por ingrediente
│  ├─ migrations/…_menu_completo.sql  Términos de ingredientes de desayunos, cenas y refacciones
│  ├─ migrations/…_v4.sql       Despensa, mercados, avisos, recetas propias, ahorro, historial
│  ├─ migrations/…_v5_hogar.sql Artículos de la casa, sus compras/reportes y términos para el robot
│  ├─ functions/ideas/          Edge Function OPCIONAL de IA (Claude Haiku o Gemini)
│  ├─ functions/precios/        Edge Function "Buscar ahora" (Deno)
│  ├─ functions/_shared/vtex.mjs  Lector de precios VTEX (lo comparten la función y el robot)
│  └─ config.toml
├─ scraper/
│  ├─ actualizar.mjs            Robot diario
│  ├─ selectos.mjs              Lector de Súper Selectos (Playwright)
│  ├─ probar.mjs                Prueba rápida sin base de datos
│  ├─ agregar-miembro.mjs       Agrega o quita correos del hogar
│  ├─ tarea-windows.ps1         Plan B: tarea programada de Windows para Selectos
│  ├─ mercado.mjs               Lee el PDF semanal de la Defensoría (los lunes)
│  ├─ alertas.mjs               Decide y manda los avisos al celular
│  └─ .env.example
├─ tests/                       node --test tests/*.test.mjs
└─ .github/workflows/           precios.yml (diario) y pages.yml (publicar app)
```

## Ver la app ya (modo demo, sin cuentas)

```bash
npx serve web          # o: python -m http.server 8080 --directory web
```
Abre `http://localhost:3000/?demo` (o el puerto que diga). Los precios del demo son **inventados**.

---

## 🤖 Instalación paso a paso (para Claude Code)

La compu es **Windows**. Usa PowerShell. Pide al usuario solo lo que no puedas hacer tú (crear cuentas, iniciar sesión en el navegador, pegar llaves). **Nunca pongas la llave secreta en `web/`, en commits ni en el chat**: va en `scraper/.env` y en GitHub Secrets.

### Paso 0 · Herramientas

```powershell
node --version    # necesita v22 o más nuevo (usa process.loadEnvFile)
git --version
gh --version      # si falta: winget install --id GitHub.cli
```
Si falta Node 22: `winget install OpenJS.NodeJS.LTS`. Luego:
```powershell
npm install --prefix scraper
node --test tests/*.test.mjs          # deben pasar todas
```

### Paso 1 · Comprobar que las tiendas responden desde esta compu

```powershell
node scraper/probar.mjs "arroz omoa"
node scraper/probar.mjs leche
```
Debe listar productos con precio en Walmart, Maxi y Don Juan. Revisa también productos a granel, que usa el menú:
```powershell
node scraper/probar.mjs tomate
node scraper/probar.mjs "pechuga pollo"
```
Para que el costo del menú salga bien, cada producto debe traer su tamaño (`contenido` en g, ml o und). Si los productos por libra salen sin tamaño o con un precio raro, revisa qué traen `measurementUnit` y `unitMultiplier` en la respuesta JSON y ajusta `contenidoPorMedida()` en `vtex.mjs`. Si una tienda da error 403/404, revisa en el navegador que `https://<tienda>/api/catalog_system/pub/products/search?ft=arroz` siga respondiendo JSON y ajusta `TIENDAS_VTEX` en `supabase/functions/_shared/vtex.mjs`.

### Paso 2 · Crear el proyecto de Supabase

1. El usuario crea una cuenta gratis en supabase.com (puede entrar con GitHub).
2. Inicia sesión en la CLI: `npx supabase login` (abre el navegador).
3. Crea el proyecto (o pide al usuario que lo cree en el panel: **New project → nombre `canasta-sv`, región East US, plan Free**):
   ```powershell
   npx supabase orgs list
   npx supabase projects create canasta-sv --org-id <ORG_ID> --region us-east-1 --db-password "<genera una fuerte y guárdala>"
   npx supabase projects list            # anota el REFERENCE ID
   npx supabase projects api-keys --project-ref <REF>
   ```
4. Copia `scraper/.env.example` a `scraper/.env` y llena `SUPABASE_URL=https://<REF>.supabase.co` y `SUPABASE_SERVICE_KEY` con la llave **secret/service_role**. Si las llaves salen en el panel, pide al usuario que las pegue él mismo en `scraper/.env`.

### Paso 3 · Crear la base de datos

```powershell
npx supabase link --project-ref <REF>
npx supabase db push
```
(Alternativa: pegar cada archivo de `supabase/migrations/`, en orden de nombre, en **SQL Editor → Run**. Son idempotentes.)

Agrega a los miembros del hogar. Los correos **no** se guardan en el repo:
```powershell
node scraper/agregar-miembro.mjs <correo-de-guille> Guille
node scraper/agregar-miembro.mjs <correo-de-la-tia> Tía
node scraper/agregar-miembro.mjs --ver
```

Primera carga de precios:
```powershell
node scraper/actualizar.mjs --sin-selectos
```
Debe decir algo como `VTEX: 900 productos, 900 precios nuevos o cambiados.`

### Paso 4 · Login con código al correo

El login usa un **código de 6 dígitos**, no un link, porque en iPhone el link abriría Safari y no la app instalada. En el panel de Supabase:

1. **Authentication → Sign In / Providers → Email**: activado. "Confirm email" puede quedar activado.
2. **Authentication → Emails → Templates → Magic Link**: cambia el cuerpo para que muestre el código:
   ```html
   <h2>Tu código para Canasta</h2>
   <p style="font-size:28px;letter-spacing:4px"><b>{{ .Token }}</b></p>
   <p>Vence en una hora.</p>
   ```
   Haz lo mismo en **Confirm signup**, porque la primera vez de cada correo Supabase manda ese.
3. **Authentication → URL Configuration → Site URL**: `https://<usuario-github>.github.io/canasta-sv/`.

El correo gratis de Supabase tiene un límite bajo de envíos por hora. Para dos personas sobra, y la sesión queda abierta en el cel.

### Paso 5 · Edge Function "Buscar ahora"

```powershell
npx supabase functions deploy precios --project-ref <REF> --no-verify-jwt
```
Si pide Docker, agrega `--use-api`. La función revisa ella misma que quien llama sea miembro del hogar. Opcional: `npx supabase secrets set CRON_SECRET=<algo-largo> --project-ref <REF>` permite llamarla desde fuera con ese secreto.

Edita `web/config.js` con `SUPABASE_URL` y la llave **publishable/anon**, que es pública por diseño.

### Paso 6 · GitHub: repo, robot diario y publicación

```powershell
gh auth login
git init -b main
git add .
git commit -m "Canasta SV"
gh repo create canasta-sv --public --source . --push
gh secret set SUPABASE_URL --body "https://<REF>.supabase.co"
gh secret set SUPABASE_SERVICE_KEY          # pega la llave secreta cuando la pida
gh api -X POST "repos/{owner}/canasta-sv/pages" -f build_type=workflow
gh workflow run pages.yml
gh workflow run precios.yml
gh run watch
```
La app queda en `https://<usuario>.github.io/canasta-sv/`. Ábrela y entra con el correo.

Antes de hacer push, revisa con `git status` que `scraper/.env` **no** aparezca.

### Paso 7 · Súper Selectos (verificar y ajustar)

Selectos es una app Blazor detrás de Cloudflare, sin API. El 2026-10-09 su buscador respondió **"The service is unavailable"** a pruebas automáticas, así que `scraper/selectos.mjs` se escribió con selectores genéricos y **hay que verificarlo**:

```powershell
npx --prefix scraper playwright install chromium
node scraper/selectos.mjs --descubrir
```
Revisa `scraper/selectos-debug/` (`muestra.json`, `categoria.html`, `*.png`):
- Si `muestra.json` trae nombres y precios correctos, sigue con `node scraper/selectos.mjs --seco`.
- Si viene vacío o raro, abre `categoria.html` y ajusta `extraerTarjetas()` a la estructura real de las tarjetas. Si las categorías paginan, ajusta `cargarTodo()`. Respeta las pausas: es uso personal, una vez al día.
- Con `--seco` bien, corre `node scraper/selectos.mjs` para guardar.

Después mira el log de la corrida de GitHub (`gh run view --log`):
- Si Selectos funcionó desde GitHub, no hay que hacer más.
- Si dice `⚠ Selectos bloqueó`, apágalo en GitHub y actívalo en la compu:
  ```powershell
  gh variable set SELECTOS --body 0
  powershell -ExecutionPolicy Bypass -File scraper\tarea-windows.ps1
  ```
  La tarea corre a las 6:30 a.m. y, si la compu estaba apagada, en cuanto se encienda.

### Paso 7b · Precios del mercado y avisos al celular (v4)

**Mercado**: el workflow diario corre `scraper/mercado.mjs` los lunes (o a mano con "Run workflow"). Pruébalo antes:
```powershell
node scraper/mercado.mjs --seco
```
Debe listar productos del sondeo de la Defensoría (arroz, frijol, tomate, pollo…). Si no encuentra el PDF, revisa en defensoria.gob.sv cómo se llama el informe semanal "mercados y tiendas mayoristas" y ajusta `buscarInformes()`. Con un PDF bajado a mano: `node scraper/mercado.mjs --seco --pdf ruta\al\informe.pdf`.

**Avisos**:
```powershell
npx web-push generate-vapid-keys
```
- La **pública** va en `web/config.js` → `VAPID_PUBLIC_KEY`.
- En GitHub:
  ```powershell
  gh secret set VAPID_PUBLIC_KEY --body "<pública>"
  gh secret set VAPID_PRIVATE_KEY      # pega la privada
  gh secret set VAPID_SUBJECT --body "mailto:<correo de Guille>"
  ```
- Prueba sin mandar nada: `node scraper/alertas.mjs --seco`.
- Cada quien activa los avisos en su cel: **Ajustes → Avisos al celular**. En iPhone primero hay que instalar la app en la pantalla de inicio.
- Para apagarlos para todos: `gh variable set AVISOS --body 0`.

### Paso 8 · Instalar en los celulares

- **iPhone**: abrir el link en **Safari** → Compartir → **Agregar a inicio**.
- **Android**: abrir en **Chrome** → menú ⋮ → **Instalar app**.

Cada quien entra con su correo, que debe estar en `miembros`, y escribe el código que le llega.

---

## ✅ Lista de verificación final

- [ ] `node --test tests/*.test.mjs` pasa.
- [ ] `node scraper/probar.mjs arroz` muestra precios de las 3 tiendas VTEX.
- [ ] La tabla `productos` tiene filas de `walmart`, `maxi` y `donjuan`.
- [ ] El workflow **Precios diarios** terminó en verde.
- [ ] La app abre en `github.io`, llega el código al correo y entra.
- [ ] Agregar "leche" → elegir producto → aparece el precio en varias tiendas.
- [ ] "Buscar en tiendas" dentro del selector trae productos nuevos (Edge Function).
- [ ] "Dónde comprar" muestra una recomendación.
- [ ] **Menú**: elegir una plantilla (ej. "Todo el día") y ajustar la cuadrícula → "Armar mi semana" → aparece cada día con sus comidas y costos; los filtros por comida funcionan; ↻ cambia una comida; "Elegir otra" abre el recetario; "Agregar a mi lista" pasa los ingredientes.
- [ ] Después de la corrida diaria, en Menú desaparece "Algunos precios son estimados" para la mayoría de ingredientes (o se reduce).
- [ ] Registrar un gasto actualiza la barra del mes.
- [ ] En el segundo celular la lista cambia sola al marcar algo en el primero (tiempo real).
- [ ] Selectos: verificado y corriendo en GitHub **o** en la tarea de Windows.
- [ ] **v4 · En casa**: marcar algo como comprado lo pasa a "En casa"; marcar una comida como hecha descuenta sus ingredientes.
- [ ] **v4 · Sobras**: con "El almuerzo se cocina doble…" las cenas salen como *sobras* y el costo no se duplica.
- [ ] **v4 · Mercado**: `precios_mercado` tiene el último sondeo y en la Lista aparece la banda "En el mercado sale más barato" cuando aplica.
- [ ] **v4 · Avisos**: activados en un cel; `node scraper/alertas.mjs --seco` muestra lo que avisaría.
- [ ] **v4 · Modo súper, escáner, compartir, ticket con foto, 👍/👎, recetas de la familia y resumen de ahorro** funcionan en el cel.
- [ ] **v5 · Casa**: configurar la casa → aparecen 🔴/🟡/🟢 con "Lleva … en <tienda>"; "Agregar a la lista" las pasa a la Lista (con la etiqueta *casa*); marcarlas compradas sube el stock en Casa; desmarcar lo devuelve.
- [ ] **v5 · Precios de la casa**: después de la corrida diaria, `node scraper/probar.mjs "pasta dental"` y `"detergente"` traen productos con tamaño (ml/g/und) y en Casa casi nada dice "precio estimado".
- [ ] **v5 · Avisos de la casa**: `node scraper/alertas.mjs --seco` lista lo que se acaba en ≤ 3 días y ofertas para abastecerse.
- [ ] `scraper/.env` no está en el repo y `web/config.js` no tiene la llave secreta.

## Mantenimiento

- **Otro hogar** (alguien que vive aparte y quiere su propia lista, gastos y menú, con los mismos precios): `node scraper/agregar-miembro.mjs correo@x.com Nombre --hogar otro`. Sin `--hogar` la persona entra al hogar `casa` y comparte todo.
- **Cambiaste algo en `web/`**: sube `VERSION` en `web/sw.js` para que los celulares bajen la versión nueva.
- **Robot diario**: GitHub apaga los workflows programados tras 60 días sin actividad; el "latido mensual" del workflow lo evita.
- **Una tienda cambió su página**: el workflow falla si no se pudo leer ninguna tienda VTEX. Corre `node scraper/probar.mjs arroz` para ver cuál.
- **Agregar otra tienda VTEX** (por ejemplo PriceSmart, si usa VTEX): agrégala en `TIENDAS_VTEX` y en la tabla `tiendas`.
- **Uso responsable**: una consulta al día, con pausas, para uso personal. No subas la frecuencia.

## Cómo decide qué llevar de la casa (v5, $0)

1. **Consumo al mes** de cada artículo = parte fija de la casa + por persona (ej. pasta dental 50 ml por persona; detergente 1 kg fijo + 700 g por persona). Los niños cuentan media. Los números iniciales están en `web/hogar/catalogo.js`.
2. **Stock estimado** = lo que había la última vez que compraste o reportaste − consumo × días. De ahí salen los días que te quedan.
3. **Necesidad** = consumo × (días hasta tu próxima compra + 7 de colchón) − stock. Si es mayor que cero, va en la compra.
4. **Producto**: de los productos de tus tiendas que sí son ese artículo (filtra, por ejemplo, "jabón para ropa" cuando buscas jabón de baño), elige el más barato por unidad, descartando presentaciones que te durarían más de ~4 meses.
5. **Oferta**: si el más barato por unidad con descuento tiene ≥ 15 % y te cabe sin pasar de 3 meses de consumo, sugiere llevar más. Todo es configurable en Casa → Ajustes.
6. **Aprender**: cuando dices cuánto queda, `consumo nuevo = 60 % del anterior + 40 % de lo observado` (acotado, para que un dato raro no lo desordene).

El robot diario busca precios de estos artículos con los términos de la migración `_v5_hogar` (y los de marca que elijas en la app).

## Cómo arma el menú (sin IA, $0)

1. **Qué planear**: cada combinación día × comida marcada en la cuadrícula es un espacio a llenar, con sus porciones (por defecto las del hogar; los niños cuentan media).
2. **Precios**: para cada ingrediente busca los productos reales (`candidatos_ingredientes`), descarta los que no son el ingrediente (ej. "sopa sabor pollo", "semidescremada" para crema) y usa el más barato por gramo, ml o unidad. Si todavía no hay precio real, usa uno de referencia y lo marca como *estimado*.
3. **Elegir recetas**: para cada espacio busca solo recetas de ese tipo de comida (`tiempos`) y escoge la que menos cuesta comprar, con estas reglas:
   - **Repeticiones**: un almuerzo o cena no se repite en la semana; un desayuno, máximo 2 veces; una refacción, máximo 3.
   - **Variedad**: el almuerzo y la cena del mismo día no llevan la misma proteína, ni se repite la proteína del día anterior; las dos refacciones del día alternan dulce y salado.
   - **Entre semana**: desayunos y refacciones rápidos.
   - **Bonos**: por tu estilo, por reaprovechar ingredientes que ya se compran esa semana y por ofertas.
   - **Azar**: un toque para que "Generar otro menú" cambie.
4. **Presupuesto**: si se pasa, cambia las comidas más caras por recetas más baratas del mismo tipo.
5. **Compras**: suma lo de toda la semana, quita lo que ya tienes y redondea a paquetes reales, eligiendo la presentación más barata en total.

**Agregar recetas**: ponlas en el archivo de su comida (`recetas-desayunos.js`, `recetas-cenas.js`, `recetas-refacciones.js` o `recetas.js`), con `tiempos` indicando en qué comidas pueden salir.
- Si la receta usa un ingrediente nuevo, agrégalo en `ingredientes.js` y su término en una migración nueva de `terminos`.
- Corre las pruebas: verifican ingredientes, tiempos y costos de todo el recetario.

## IA opcional (centavos al mes)

Todo funciona sin IA. Si la activas, se agregan dos cosas:
- **✨ Ideas con IA** en el Menú: propone 3 recetas con lo que hay en casa, lo que vence y lo que está en oferta. Solo puede usar ingredientes del catálogo, para que se puedan cotizar.
- **Lectura de tickets con IA**: más precisa que la del celular con fotos malas.

La app solo le manda a la IA comida y precios, nunca correos ni nombres. La función tiene un **tope de 30 consultas al día** (`IA_LIMITE_DIARIO`) para que el costo nunca se dispare.

| Proveedor | Modelo por defecto | Precio (por millón de tokens) | Costo estimado al mes* |
|---|---|---|---|
| **Anthropic** (por defecto) | `claude-haiku-5-5` | $0.10 entrada / $0.50 salida | **~$0.05–0.10** |
| Google | `gemini-2.5-flash-lite` | $0.10 / $0.40 (tiene capa gratis con límites) | ~$0.05–0.10, o $0 dentro de la capa gratis |
| OpenAI (no integrado) | `gpt-5-nano` | $0.05 / $0.40 | similar |

\*Supuesto: ~50 consultas de ideas al mes (~4 000 tokens de entrada + 2 000 de salida cada una) y ~30 tickets. Una consulta de ideas con Haiku 5.5 sale en ~$0.0014; un ticket, en menos de $0.001. Precios de Anthropic según su página oficial (oct 2026); los de Google y OpenAI, de comparadores de terceros. Verifícalos antes de activar.

**Activar** (Claude Code):
```powershell
npx supabase functions deploy ideas --project-ref <REF> --no-verify-jwt
# Opción A: Claude (console.anthropic.com → API keys; se paga por uso con saldo prepagado)
npx supabase secrets set ANTHROPIC_API_KEY=<llave> --project-ref <REF>
# Opción B: Gemini (aistudio.google.com → Get API key)
npx supabase secrets set IA_PROVEEDOR=gemini GEMINI_API_KEY=<llave> --project-ref <REF>
# Opcional: npx supabase secrets set IA_LIMITE_DIARIO=20 --project-ref <REF>
```
Luego, en la app: **Ajustes → Inteligencia artificial → activar**.
- Pon un límite de gasto en la consola del proveedor como seguro extra.
- Revisa en sus términos si la capa gratis de Gemini usa los datos para entrenar.

## Ideas para después (no incluidas)

- Postres y bebidas como comidas aparte.
- Leer automáticamente las ofertas de los folletos de las tiendas.
