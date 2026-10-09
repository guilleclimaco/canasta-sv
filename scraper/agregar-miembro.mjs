// Agrega (o quita) a alguien del hogar. Así los correos NO quedan en el repo público.
//   node scraper/agregar-miembro.mjs tucorreo@gmail.com Guille
//   node scraper/agregar-miembro.mjs --quitar correo@gmail.com
//   node scraper/agregar-miembro.mjs --ver
import './supabase.mjs'; // carga scraper/.env

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_KEY || '';
if (!URL_BASE || !KEY) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY en scraper/.env');
  process.exit(1);
}
const h = { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' };
if (!KEY.startsWith('sb_')) h.Authorization = `Bearer ${KEY}`;

const [a, b, ...resto] = process.argv.slice(2);
let res;
if (a === '--ver') {
  res = await fetch(`${URL_BASE}/rest/v1/miembros?select=*`, { headers: h });
} else if (a === '--quitar' && b) {
  res = await fetch(`${URL_BASE}/rest/v1/miembros?email=eq.${encodeURIComponent(b.toLowerCase())}`, { method: 'DELETE', headers: h });
} else if (a && a.includes('@')) {
  res = await fetch(`${URL_BASE}/rest/v1/miembros`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ email: a.toLowerCase(), nombre: [b, ...resto].filter(Boolean).join(' ') || null }),
  });
} else {
  console.log('Uso: node scraper/agregar-miembro.mjs correo@x.com Nombre | --quitar correo | --ver');
  process.exit(1);
}
console.log(res.status, await res.text() || 'ok');
