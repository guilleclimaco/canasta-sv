# Actualización: Menú semanal de almuerzos (v2)

Para Claude Code. Esta actualización agrega la pestaña **Menú** (estilo NeatEat): arma los almuerzos de la semana
con un recetario de 28 platos, usando los precios reales de las tiendas, y pasa los ingredientes a la lista.
Sigue costando **$0** (no usa IA de pago).

El zip de actualización trae **solo archivos nuevos o cambiados**. No trae `web/config.js` ni `scraper/.env`,
así que tus llaves y configuración se conservan.

## Qué cambia

| Archivo | Cambio |
|---|---|
| `web/menu/recetas.js` | **Nuevo.** 28 almuerzos con cantidades, pasos, aparatos y etiquetas |
| `web/menu/ingredientes.js` | **Nuevo.** Cómo buscar cada ingrediente en las tiendas + precio de referencia |
| `web/menu/planificador.js` | **Nuevo.** Arma la semana: costo, variedad, presupuesto, despensa, paquetes |
| `web/app.js`, `web/datos.js`, `web/estilos.css`, `web/sw.js` | Pestaña Menú; `sw.js` sube a `canasta-v2` |
| `supabase/migrations/20261010000000_menu.sql` | **Nuevo.** Tabla `menus`, función `candidatos_ingredientes`, 73 términos de ingredientes |
| `supabase/functions/_shared/vtex.mjs` | Lee el tamaño de productos a granel ("por libra", `measurementUnit`) y paquetes ("30 huevos") |
| `tests/menu.test.mjs` (nuevo), `tests/vtex.test.mjs` | Pruebas del menú y del nuevo lector de tamaños |
| `README.md`, `CLAUDE.md`, `docs/capturas.png` | Documentación |

## Pasos (PowerShell, en la carpeta del proyecto)

1. **Descomprimir encima del proyecto**, sobrescribiendo:
   ```powershell
   Expand-Archive -Path <ruta>\canasta-sv-actualizacion-menu.zip -DestinationPath . -Force
   git status   # confirma que web/config.js y scraper/.env NO aparecen como borrados ni modificados por el zip
   ```
2. **Pruebas**: `node --test tests/*.test.mjs` (deben pasar todas).
3. **Base de datos**:
   - Si ya hiciste `npx supabase db push` antes, vuelve a correrlo: solo aplica la migración nueva.
   - Si aún no llegaste al paso 3 del README, sigue normal: `db push` aplica las dos.
   - Alternativa: pegar `supabase/migrations/20261010000000_menu.sql` en SQL Editor → Run.
4. **Edge Function** (cambió `vtex.mjs`). Si ya estaba desplegada:
   ```powershell
   npx supabase functions deploy precios --project-ref <REF> --no-verify-jwt
   ```
5. **Revisar productos a granel** (los usa el menú):
   ```powershell
   node scraper/probar.mjs tomate
   node scraper/probar.mjs "pechuga pollo"
   ```
   Si salen sin tamaño o con precios raros, ajusta `contenidoPorMedida()` en `supabase/functions/_shared/vtex.mjs`
   según lo que traigan `measurementUnit` y `unitMultiplier`, y agrega un caso en `tests/vtex.test.mjs`.
6. **Cotizar los ingredientes nuevos** (si Supabase ya está configurado):
   ```powershell
   node scraper/actualizar.mjs --sin-selectos
   ```
7. **Publicar**:
   - Si el repo ya está en GitHub: `git add -A; git commit -m "Menú semanal de almuerzos"; git push`. Esto vuelve a publicar la app.
   - Si no, sigue el paso 6 del README normalmente.
8. **Probar en el cel**: pestaña **Menú** → preferencias → "Armar mi semana". Si la app se ve vieja, ciérrala y ábrela de nuevo
   (el service worker cambia a `canasta-v2`).

## Verificación
- [ ] Pruebas en verde.
- [ ] La tabla `menus` existe y `select * from candidatos_ingredientes(array['arroz'])` devuelve productos.
- [ ] En la app, Menú arma la semana; ↻ cambia un día; la receta muestra ingredientes y pasos.
- [ ] "Agregar a mi lista" crea los ingredientes en Lista y "Dónde comprar" los incluye.
- [ ] Tras la corrida diaria, casi todos los ingredientes tienen precio real (pocos "precio estimado").
