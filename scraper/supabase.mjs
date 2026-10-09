// Cliente mínimo de la API REST de Supabase (sin dependencias).
// Usa la llave secreta (service_role o sb_secret_...), SOLO en el robot, nunca en la app.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

// En la compu: lee scraper/.env si existe. En GitHub Actions vienen como secretos.
try {
  process.loadEnvFile(path.join(path.dirname(fileURLToPath(import.meta.url)), '.env'));
} catch { /* no hay .env: se usan las variables del sistema */ }

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_KEY || '';

export function configurado() {
  return Boolean(URL_BASE && KEY);
}

function headers() {
  const h = { apikey: KEY, 'Content-Type': 'application/json' };
  // Las llaves antiguas (JWT) también van en Authorization; las nuevas sb_secret_ solo en apikey.
  if (!KEY.startsWith('sb_')) h.Authorization = `Bearer ${KEY}`;
  return h;
}

export async function leerTerminos() {
  const res = await fetch(`${URL_BASE}/rest/v1/terminos?select=termino&activo=eq.true&order=creado.asc`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`No pude leer términos: ${res.status} ${await res.text()}`);
  return (await res.json()).map((r) => r.termino);
}

export async function registrarPrecios(filas) {
  let cambios = 0;
  for (let i = 0; i < filas.length; i += 500) {
    const res = await fetch(`${URL_BASE}/rest/v1/rpc/registrar_precios`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ items: filas.slice(i, i + 500) }),
    });
    if (!res.ok) throw new Error(`registrar_precios falló: ${res.status} ${await res.text()}`);
    cambios += Number(await res.json()) || 0;
  }
  return cambios;
}
