# Actualización a la v4 (acumulada)

Para Claude Code. El zip trae **todo lo nuevo desde la versión original**: menú completo (v2 y v3) y mejoras v4.
Sirve sin importar qué actualización se haya aplicado antes. Reemplaza a `ACTUALIZAR-MENU.md`.

No trae `scraper/.env` ni `web/config.js`, así que las llaves se conservan. Hay que **agregar a mano una línea en `web/config.js`** (paso 2).

## Qué trae la v4

Despensa viva ("En casa"), cocinar una vez y comer dos veces (sobras), precios de mercados de la Defensoría,
avisos al celular, resumen de ahorro con meta, modo "en el súper", escáner de código de barras, ticket con foto,
"¿es buen precio?" con historial, compartir por WhatsApp, 👍/👎 de recetas, recetas de la familia, balance de
verduras, lonchera e ideas con IA (opcional). Detalle en `README.md` → "Novedades de la v4".

## Pasos (PowerShell, en la carpeta del proyecto)

1. **Descomprimir encima del proyecto**:
   ```powershell
   Expand-Archive -Path <ruta>\canasta-sv-v4.zip -DestinationPath . -Force
   if (Test-Path ACTUALIZAR-MENU.md) { Remove-Item ACTUALIZAR-MENU.md }   # quedó reemplazado por este archivo
   git status   # web/config.js y scraper/.env NO deben aparecer como borrados
   ```
2. **`web/config.js`**: agrega la llave pública para avisos (si no quieres avisos todavía, déjala así):
   ```js
   VAPID_PUBLIC_KEY: 'TU-VAPID-PUBLIC-KEY',
   ```
3. **Dependencias y pruebas**:
   ```powershell
   npm install --prefix scraper
   node --test tests/*.test.mjs        # deben pasar todas (48)
   ```
4. **Base de datos**: `npx supabase db push`. Aplica las migraciones que falten (`_menu`, `_menu_completo`, `_v4`); todas son idempotentes.
5. **Edge Function de precios** (cambió `vtex.mjs`):
   ```powershell
   npx supabase functions deploy precios --project-ref <REF> --no-verify-jwt
   ```
6. **Revisar lectura de tiendas y mercado**:
   ```powershell
   node scraper/probar.mjs tomate
   node scraper/probar.mjs banano
   node scraper/mercado.mjs --seco
   ```
   Si algo sale sin tamaño o el mercado no encuentra el PDF, ver README pasos 1 y 7b.
7. **Avisos al celular** (opcional, pero recomendado): README → "Paso 7b" (llaves VAPID y secretos de GitHub).
8. **IA** (opcional, **solo si Guille lo pide**): README → "IA opcional".
9. **Cargar precios y publicar**:
   ```powershell
   node scraper/actualizar.mjs --sin-selectos
   git add -A; git commit -m "Canasta v4: despensa, sobras, mercado, avisos, ahorro, escáner y más"; git push
   gh workflow run precios.yml
   ```
10. **En los celulares**: cerrar y abrir la app (el service worker cambia a `canasta-v4`). Cada quien activa los avisos en Ajustes.

## Verificación

Marca la sección "v4" de la lista de verificación del README. Lo mínimo:
- [ ] Pruebas en verde y `db push` sin errores.
- [ ] Marcar algo como comprado → aparece en Lista → **En casa**.
- [ ] Menú con "El almuerzo se cocina doble…" → las cenas salen como *sobras*.
- [ ] Gastos muestra **Ahorro** con la gráfica por mes.
- [ ] El botón 📷 abre la cámara (pide permiso) y con un código EAN muestra precios por tienda.
- [ ] Registrar gasto → "Leer el ticket con una foto" llena el monto.
