# Actualización: Menú semanal completo (v3)

Para Claude Code. Esta actualización agrega la pestaña **Menú** (estilo NeatEat) con **todas las comidas**:
desayuno, refacción de la mañana, almuerzo, refacción de la tarde y cena.

- Guille elige en una cuadrícula día × comida qué planear (con plantillas como "Solo almuerzos",
  "Desayuno + almuerzo", "Almuerzo + refacciones" o "Todo el día") y cuántas porciones lleva cada comida.
- La app arma la semana con un recetario de 68 platos, usando los precios reales de las tiendas.
- Pasa los ingredientes a la lista.

Sigue costando **$0** (no usa IA de pago).

El zip es **acumulado desde la versión original**: sirve tanto si ya aplicaste la v2 (solo almuerzos) como si no.
No trae `web/config.js` ni `scraper/.env`, así que tus llaves y configuración se conservan.

## Qué cambia

| Archivo | Cambio |
|---|---|
| `web/menu/recetas.js` + `recetas-desayunos.js`, `recetas-cenas.js`, `recetas-refacciones.js` | Recetario: 32 sirven de almuerzo, 21 de desayuno, 32 de cena y 24 de refacción (varias sirven para más de una comida) |
| `web/menu/ingredientes.js` | Cómo buscar cada ingrediente en las tiendas + precio de referencia (ahora con fruta, avena, café, pan, jamón…) |
| `web/menu/planificador.js` | Arma la semana por día × comida: costo, variedad, repeticiones por tipo, presupuesto, despensa, paquetes |
| `web/app.js`, `web/datos.js`, `web/estilos.css`, `web/sw.js` | Pestaña Menú con cuadrícula, filtros por comida y recetario; `sw.js` sube a `canasta-v3` |
| `supabase/migrations/20261010000000_menu.sql` | Tabla `menus`, función `candidatos_ingredientes`, términos de almuerzos |
| `supabase/migrations/20261011000000_menu_completo.sql` | Términos de ingredientes de desayunos, cenas y refacciones |
| `supabase/functions/_shared/vtex.mjs` | Lee el tamaño de productos a granel ("por libra", `measurementUnit`) y paquetes ("30 huevos") |
| `tests/menu.test.mjs`, `tests/vtex.test.mjs` | Pruebas |
| `README.md`, `CLAUDE.md`, `docs/capturas.png` | Documentación |

Compatibilidad: si ya había un perfil o menú guardado de la v2 (solo almuerzos), la app lo convierte sola.

## Pasos (PowerShell, en la carpeta del proyecto)

1. **Descomprimir encima del proyecto**, sobrescribiendo:
   ```powershell
   Expand-Archive -Path <ruta>\canasta-sv-actualizacion-menu-completo.zip -DestinationPath . -Force
   git status   # confirma que web/config.js y scraper/.env NO aparecen como borrados ni modificados por el zip
   ```
2. **Pruebas**: `node --test tests/*.test.mjs` (deben pasar todas).
3. **Base de datos**: `npx supabase db push` (aplica las migraciones que falten).
   Alternativa: pegar en SQL Editor, en orden, `20261010000000_menu.sql` y `20261011000000_menu_completo.sql`. Las dos son idempotentes.
4. **Edge Function** (cambió `vtex.mjs`). Si ya estaba desplegada:
   ```powershell
   npx supabase functions deploy precios --project-ref <REF> --no-verify-jwt
   ```
5. **Revisar productos a granel y de desayuno** (los usa el menú):
   ```powershell
   node scraper/probar.mjs tomate
   node scraper/probar.mjs "pechuga pollo"
   node scraper/probar.mjs banano
   node scraper/probar.mjs avena
   ```
   Si salen sin tamaño o con precios raros, ajusta `contenidoPorMedida()` en `supabase/functions/_shared/vtex.mjs`
   según lo que traigan `measurementUnit` y `unitMultiplier`, y agrega un caso en `tests/vtex.test.mjs`.
6. **Cotizar los ingredientes** (si Supabase ya está configurado): `node scraper/actualizar.mjs --sin-selectos`.
   Ahora son unos 127 términos × 3 tiendas; tarda unos minutos.
7. **Publicar**:
   - Si el repo ya está en GitHub: `git add -A; git commit -m "Menú completo: desayunos, refacciones, almuerzos y cenas"; git push`.
   - Si no, sigue el paso 6 del README.
8. **Probar en el cel**: pestaña **Menú** → elegir comidas en la cuadrícula → "Armar mi semana".
   Si la app se ve vieja, ciérrala y ábrela de nuevo (el service worker cambia a `canasta-v3`).

## Verificación
- [ ] Pruebas en verde.
- [ ] `select count(*) from terminos` ≥ 127 y `select * from candidatos_ingredientes(array['avena','banano'])` devuelve productos.
- [ ] Menú con "Todo el día": cada día muestra sus comidas; los filtros (Desayuno, Refacción AM…) funcionan.
- [ ] Porciones por comida: poner el almuerzo en 1 y verlo como "Almuerzo · 1 porc.".
- [ ] ↻ cambia solo esa comida; "Elegir otra" abre el recetario filtrado por esa comida y buscable.
- [ ] "Agregar a mi lista" crea los ingredientes en Lista y "Dónde comprar" los incluye.
- [ ] Tras la corrida diaria, casi todos los ingredientes tienen precio real (pocos "precio estimado").
