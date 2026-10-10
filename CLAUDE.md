# CLAUDE.md — Canasta SV

Objetivo: dejar funcionando la app Canasta (lista del súper + menú semanal (desayunos, refacciones, almuerzos y cenas) + presupuesto +
comparador de precios de supermercados de El Salvador + artículos de la casa (cuidado personal y limpieza) por necesidad) con **costo $0**, accesible desde el iPhone de Guille y el Android
de su tía desde cualquier lugar.

## Qué hacer
1. Sigue `README.md` → "🤖 Instalación paso a paso" en orden (pasos 0–8).
2. Termina marcando la "✅ Lista de verificación final" y repórtale a Guille el link de la app.

## Reglas
- La compu es Windows: usa comandos de PowerShell.
- **Secretos**: la llave secret/service_role va SOLO en `scraper/.env` (en .gitignore) y en GitHub Secrets.
  Nunca en `web/`, en commits ni en mensajes. `web/config.js` lleva solo la llave publishable/anon.
- Los correos de los miembros no se guardan en el repo (es público): usa `scraper/agregar-miembro.mjs`.
- No subas servicios de pago ni cambies a planes pagados. Si algo exige pagar, detente y pregunta.
- Scraping respetuoso: una corrida al día, pausas entre páginas, sin paralelizar Selectos.
- Antes de cambiar código corre `node --test tests/*.test.mjs`; si tocas `web/`, sube `VERSION` en `web/sw.js`.
- Selectos (`scraper/selectos.mjs`) está **sin verificar** contra la página real: usa `--descubrir` y ajusta.
- Pide a Guille solo lo que no puedas hacer (crear cuentas, iniciar sesión en el navegador, pegar llaves).

- Si el proyecto ya estaba instalado y llegó una actualización, sigue `ACTUALIZAR-V5.md` (incluye todo lo anterior).
- La IA es OPCIONAL y la activa Guille: no despliegues la función `ideas` ni pidas llaves de IA si él no lo pide.
- Ningún dato personal (correos, nombres) se manda a la IA: solo comida y precios (`web/v4/ia.js → pedidoIdeas`).

## Comandos útiles
```powershell
node --test tests/*.test.mjs                 # pruebas
node scraper/probar.mjs "arroz omoa"         # precios VTEX sin base de datos
node scraper/actualizar.mjs --sin-selectos   # cargar precios a Supabase
node scraper/selectos.mjs --descubrir        # inspeccionar Selectos
node scraper/agregar-miembro.mjs --ver       # miembros del hogar
node scraper/mercado.mjs --seco              # sondeo de mercados de la Defensoría (sin guardar)
node scraper/alertas.mjs --seco              # qué avisos se mandarían hoy
npx serve web                                # app local; agrega ?demo para datos inventados
```
