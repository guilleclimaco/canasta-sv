// Edge Function "precios": busca términos en Walmart, Maxi Despensa y Don Juan
// y guarda los precios en la base. La llaman:
//   1) la app (botón "Buscar ahora"), con la sesión del usuario (debe ser miembro)
//   2) el robot diario de GitHub Actions, con el CRON_SECRET
// Body: { "terminos": ["leche", "arroz"] }  (máximo 10 por llamada)
import { createClient } from 'npm:@supabase/supabase-js@2.108.2';
import { buscarTodo } from '../_shared/vtex.mjs';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Usa POST' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // ---- ¿Quién llama? ----
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const cronSecret = Deno.env.get('CRON_SECRET');
  let permitido = false;
  if (cronSecret && token === cronSecret) {
    permitido = true;
  } else if (token) {
    const { data } = await admin.auth.getUser(token);
    const email = data?.user?.email?.toLowerCase();
    if (email) {
      // ilike sin comodines: compara sin distinguir mayúsculas ("_" y "%" se escapan)
      const exacto = email.replace(/[\\%_]/g, (c) => `\\${c}`);
      const { data: m } = await admin.from('miembros').select('email').ilike('email', exacto).maybeSingle();
      permitido = !!m;
    }
  }
  if (!permitido) return json({ error: 'No autorizado' }, 401);

  // ---- Qué buscar ----
  let terminos: string[] = [];
  try {
    const body = await req.json();
    terminos = (body?.terminos || []).map((t: string) => String(t).trim().toLowerCase()).filter(Boolean);
  } catch { /* body vacío */ }
  terminos = [...new Set(terminos)].slice(0, 10);
  if (!terminos.length) return json({ error: 'Manda { "terminos": [...] }' }, 400);

  // Guardar los términos para que el robot diario los siga revisando
  await admin.from('terminos').upsert(terminos.map((termino) => ({ termino, activo: true })), {
    onConflict: 'termino',
    ignoreDuplicates: true,
  });

  // ---- Buscar y guardar ----
  const { filas, errores } = await buscarTodo(terminos, { max: 40 });
  let cambios = 0;
  for (let i = 0; i < filas.length; i += 500) {
    const { data, error } = await admin.rpc('registrar_precios', { items: filas.slice(i, i + 500) });
    if (error) return json({ error: error.message, errores }, 500);
    cambios += data ?? 0;
  }
  return json({ terminos, productos: filas.length, cambios, errores });
});
