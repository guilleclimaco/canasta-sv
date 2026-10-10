// Edge Function "ideas" (OPCIONAL): IA para ideas de recetas y para leer tickets.
// Cuesta centavos al mes. Proveedores:
//   IA_PROVEEDOR=anthropic (por defecto) → Claude Haiku 5.5   (secreto ANTHROPIC_API_KEY)
//   IA_PROVEEDOR=gemini                  → Gemini Flash-Lite  (secreto GEMINI_API_KEY; tiene capa gratis con límites)
// Otros secretos opcionales: IA_MODELO (para cambiar el modelo), IA_LIMITE_DIARIO (por defecto 30 consultas/día en total).
// Body: { modo: 'ideas', tiempo, antojo, porciones, evitar, estilos, aparatos, enCasa, porVencer, enOferta, catalogo }
//    o  { modo: 'ticket', imagen: <jpeg en base64> }
import { createClient } from 'npm:@supabase/supabase-js@2.108.2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const PROVEEDOR = (Deno.env.get('IA_PROVEEDOR') || 'anthropic').toLowerCase();
const MODELO = Deno.env.get('IA_MODELO') || (PROVEEDOR === 'gemini' ? 'gemini-2.5-flash-lite' : 'claude-haiku-5-5');
const LIMITE = Number(Deno.env.get('IA_LIMITE_DIARIO') || 30);

const SISTEMA_IDEAS = `Eres cocinero de casa en El Salvador. Propones recetas sencillas, baratas y ricas para una familia.
Reglas estrictas:
- Usa SOLO ingredientes del catálogo que te doy, con su id exacto. Cantidades en la unidad indicada (g, ml o und) para las porciones pedidas; los "basico" van con cantidad 1.
- Prioriza lo que está por vencer, luego lo que hay en casa, luego lo que está en oferta.
- Respeta lo que no comen (evitar) y los aparatos disponibles.
- Platos realistas de la cocina salvadoreña o cotidiana. 3 a 6 pasos cortos.
Responde SOLO con JSON: {"recetas":[{"nombre":"","minutos":30,"porciones":4,"tiempos":["almuerzo"],"proteina":"pollo|res|cerdo|pescado|huevo|embutido|vegetal","etiquetas":["rapido"],"aparatos":[],"ing":[["id",cantidad]],"pasos":[""],"motivo":"por qué conviene hoy, una frase"}]}
Da 3 recetas distintas.`;

const SISTEMA_TICKET = `Lees fotos de tickets de supermercados de El Salvador. Responde SOLO con JSON:
{"total": número o null, "fecha": "AAAA-MM-DD" o null, "tienda": "walmart"|"maxi"|"donjuan"|"selectos"|"Mercado"|null}
El total es lo que se pagó (no subtotal, ni IVA, ni ahorro, ni cambio).`;

async function llamarIA(sistema: string, texto: string, imagen?: string) {
  if (PROVEEDOR === 'gemini') {
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) throw new Error('Falta el secreto GEMINI_API_KEY');
    const parts: unknown[] = [{ text: texto }];
    if (imagen) parts.push({ inline_data: { mime_type: 'image/jpeg', data: imagen } });
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 2500, temperature: 0.8 },
      }),
    });
    if (!r.ok) throw new Error(`Gemini respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  }
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) throw new Error('Falta el secreto ANTHROPIC_API_KEY');
  const content: unknown[] = [];
  if (imagen) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imagen } });
  content.push({ type: 'text', text: texto });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODELO, max_tokens: 2500, system: sistema, messages: [{ role: 'user', content }] }),
  });
  if (!r.ok) throw new Error(`Claude respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  return (d.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('');
}

function extraerJSON(t: string) {
  const i = t.indexOf('{');
  const j = t.lastIndexOf('}');
  if (i < 0 || j < i) throw new Error('La IA no devolvió JSON');
  return JSON.parse(t.slice(i, j + 1));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Usa POST' }, 405);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // Solo miembros del hogar
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: u } = await admin.auth.getUser(token);
  const email = u?.user?.email?.toLowerCase();
  if (!email) return json({ error: 'No autorizado' }, 401);
  const exacto = email.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data: m } = await admin.from('miembros').select('email').ilike('email', exacto).maybeSingle();
  if (!m) return json({ error: 'No autorizado' }, 401);

  // Tope diario para que el costo nunca se dispare
  const hoy = new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10); // hora de El Salvador
  const { data: uso } = await admin.from('ajustes').select('valor').eq('clave', 'ia_uso').maybeSingle();
  const n = uso?.valor?.fecha === hoy ? Number(uso.valor.n) || 0 : 0;
  if (n >= LIMITE) return json({ error: `Se alcanzó el límite de ${LIMITE} consultas de IA por hoy.` }, 429);
  await admin.from('ajustes').upsert({ clave: 'ia_uso', valor: { fecha: hoy, n: n + 1 } });

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { /* vacío */ }
  try {
    if (b.modo === 'ticket') {
      if (typeof b.imagen !== 'string' || b.imagen.length > 3_000_000) return json({ error: 'Imagen inválida o muy grande' }, 400);
      const r = extraerJSON(await llamarIA(SISTEMA_TICKET, 'Lee este ticket.', b.imagen as string));
      return json({ total: Number(r.total) || null, fecha: r.fecha || null, tienda: r.tienda || null });
    }
    const pedido = {
      comida: b.tiempo, antojo: b.antojo, porciones: b.porciones, evitar: b.evitar, estilos: b.estilos, aparatos: b.aparatos,
      porVencer: b.porVencer, enCasa: b.enCasa, enOferta: b.enOferta,
      catalogo: (Array.isArray(b.catalogo) ? b.catalogo : []).slice(0, 200),
    };
    const r = extraerJSON(await llamarIA(SISTEMA_IDEAS, JSON.stringify(pedido)));
    return json({ recetas: Array.isArray(r.recetas) ? r.recetas.slice(0, 4) : [], proveedor: PROVEEDOR, modelo: MODELO });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 502);
  }
});
