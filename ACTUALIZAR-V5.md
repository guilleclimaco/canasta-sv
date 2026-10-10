# Actualización a la v5 (acumulada)

Para Claude Code. El zip trae **todo lo nuevo desde la versión original**: menú completo (v2 y v3), mejoras v4 y la
pestaña **Casa** de la v5. Sirve sin importar qué actualización se haya aplicado antes. Reemplaza a `ACTUALIZAR-MENU.md`
y `ACTUALIZAR-V4.md`.

No trae `scraper/.env` ni `web/config.js`, así que las llaves se conservan.

## Qué trae la v5

Pestaña **Casa**: artículos de cuidado personal (pasta dental, jabón, shampoo, desodorante, papel higiénico…) y de
limpieza (detergente, suavizante, cloro, desinfectante para piso, lavaplatos…). Se compran por **necesidad**, no por
presupuesto: la app estima cuánto queda, dice qué llevar en la próxima compra, cuánto, de qué tienda, y cuándo conviene
abastecerse por una oferta. Aprende el consumo real. Detalle en `README.md` → "Novedades de la v5" y
"Cómo decide qué llevar de la casa".

## Pasos (PowerShell, en la carpeta del proyecto)

1. **Descomprimir encima del proyecto**:
   ```powershell
   Expand-Archive -Path <ruta>\canasta-sv-v5.zip -DestinationPath . -Force
   foreach ($f in 'ACTUALIZAR-MENU.md','ACTUALIZAR-V4.md') { if (Test-Path $f) { Remove-Item $f } }   # reemplazados por este archivo
   git status   # web/config.js y scraper/.env NO deben aparecer como borrados
   ```
2. **`web/config.js`**: si todavía no tiene la línea de avisos (viene de la v4), agrégala; si no quieres avisos, déjala así:
   ```js
   VAPID_PUBLIC_KEY: 'TU-VAPID-PUBLIC-KEY',
   ```
3. **Dependencias y pruebas**:
   ```powershell
   npm install --prefix scraper
   node --test tests/*.test.mjs        # deben pasar todas (58)
   ```
4. **Base de datos**: `npx supabase db push`. Aplica las migraciones que falten (`_menu`, `_menu_completo`, `_v4`, `_v5_hogar`); todas son idempotentes.
5. **Edge Function de precios** (cambió `vtex.mjs`: ahora entiende rollos, hojas, pañales…):
   ```powershell
   npx supabase functions deploy precios --project-ref <REF> --no-verify-jwt
   ```
6. **Revisar que las tiendas traen artículos de la casa con tamaño**:
   ```powershell
   node scraper/probar.mjs "pasta dental"
   node scraper/probar.mjs detergente
   node scraper/probar.mjs "papel higienico"
   node scraper/probar.mjs desinfectante
   ```
   Cada producto debe salir con contenido y unidad (ml, g o und). Si alguno sale sin tamaño (por ejemplo papel
   higiénico "12 rollos" o un "3 pack"), ajusta `parsearContenido` en `supabase/functions/_shared/vtex.mjs`, agrega el
   caso a `tests/vtex.test.mjs` y vuelve a desplegar la función `precios`.
7. **Mercado y avisos** (si venías de antes de la v4): README → "Paso 7b". Los avisos de la casa usan las mismas llaves
   VAPID; no hay que configurar nada nuevo.
8. **IA** (opcional, **solo si Guille lo pide**): README → "IA opcional". La v5 no la usa.
9. **Cargar precios y publicar**:
   ```powershell
   node scraper/actualizar.mjs --sin-selectos     # ahora busca ~190 términos: tarda unos minutos más
   git add -A; git commit -m "Canasta v5: artículos de la casa por necesidad"; git push
   gh workflow run precios.yml
   ```
10. **En los celulares**: cerrar y abrir la app (el service worker cambia a `canasta-v5`). En **Casa**, uno de los dos
    configura la casa (es compartida). Cada quien puede activar el aviso nuevo en Ajustes → Avisos.

## Verificación

Marca las casillas "v5" (y "v4" si venías de antes) de la lista de verificación del README. Lo mínimo:
- [ ] Pruebas en verde y `db push` sin errores.
- [ ] Casa → configurar → aparecen artículos en 🔴/🟡/🟢 con "Lleva … en <tienda>".
- [ ] "Agregar a la lista" → en Lista salen con la etiqueta *casa*; marcarlos comprados sube su stock en Casa.
- [ ] Ofertas → filtro **🏠 De la casa**.
- [ ] `node scraper/alertas.mjs --seco` corre sin errores (muestra avisos de la casa si algo se acaba en ≤ 3 días).
