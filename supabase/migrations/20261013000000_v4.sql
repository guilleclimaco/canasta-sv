-- =====================================================================
-- Canasta SV v4: despensa viva, precios del mercado, avisos al celular,
-- recetas de la familia, ahorro registrado, historial y código de barras.
-- Idempotente: se puede correr más de una vez.
-- =====================================================================

-- ---------- Despensa viva: lo que hay en casa, con cantidad y vencimiento ----------
create table if not exists public.despensa (
  id           bigint generated always as identity primary key,
  ingrediente  text,                       -- id del catálogo del menú (ej. 'arroz'); null si es algo libre
  nombre       text not null,
  cantidad     numeric,                    -- en la unidad base (g, ml, und); null = "hay", sin medir
  unidad       text,
  caduca       date,
  creado       timestamptz not null default now(),
  actualizado  timestamptz not null default now(),
  creado_por   text default (auth.jwt() ->> 'email')
);
create index if not exists despensa_ing_idx on public.despensa (ingrediente);

-- La lista recuerda a qué ingrediente corresponde (para pasar a la despensa al comprar)
alter table public.lista add column if not exists ingrediente text;

-- Cada gasto puede registrar cuánto se ahorró (vs. la tienda más cara)
alter table public.gastos add column if not exists ahorro numeric(10,2) not null default 0;

-- ---------- Precios de mercados (sondeo semanal de la Defensoría del Consumidor) ----------
create table if not exists public.precios_mercado (
  fecha      date not null,                -- fecha final del sondeo
  producto   text not null,
  unidad     text not null default '',
  cantidad   numeric,
  categoria  text,
  centro     numeric(10,2),
  occidente  numeric(10,2),
  oriente    numeric(10,2),
  minimo     numeric(10,2),
  maximo     numeric(10,2),
  promedio   numeric(10,2),
  fuente     text,
  primary key (fecha, producto, unidad)
);

-- ---------- Avisos al celular (Web Push) ----------
create table if not exists public.avisos_suscripciones (
  endpoint  text primary key,
  email     text not null default (auth.jwt() ->> 'email'),
  datos     jsonb not null,                -- la suscripción del navegador (keys p256dh/auth)
  prefs     jsonb not null default '{"bajas": true, "menu": true, "presupuesto": true, "vence": true}'::jsonb,
  creado    timestamptz not null default now()
);

-- ---------- Recetas de la familia ----------
create table if not exists public.recetas_propias (
  id          text primary key,
  datos       jsonb not null,              -- mismo formato que web/menu/recetas.js
  creado_por  text default (auth.jwt() ->> 'email'),
  creado      timestamptz not null default now()
);

-- ---------- Funciones ----------
-- Historial de 60 días de varios productos: mínimo, máximo, promedio y puntos para la gráfica
create or replace function public.resumen_precios(ids bigint[])
returns table (producto_id bigint, min60 numeric, max60 numeric, prom60 numeric, puntos jsonb)
language sql stable
set search_path = public
as $$
  with ventana as (
    -- cambios de los últimos 60 días + el último cambio anterior (el precio vigente al inicio)
    select h.producto_id, h.fecha, h.precio from historial h
    where h.producto_id = any(ids) and h.fecha > now() - interval '60 days'
    union all
    select * from (
      select distinct on (h.producto_id) h.producto_id, now() - interval '60 days' as fecha, h.precio from historial h
      where h.producto_id = any(ids) and h.fecha <= now() - interval '60 days'
      order by h.producto_id, h.fecha desc
    ) anterior
  )
  select producto_id, min(precio), max(precio), round(avg(precio), 2),
         jsonb_agg(jsonb_build_array(to_char(fecha, 'YYYY-MM-DD'), precio) order by fecha)
  from ventana group by producto_id;
$$;

-- Buscar por código de barras (tolera ceros a la izquierda: UPC-12 vs EAN-13)
create or replace function public.productos_por_ean(codigo text)
returns setof public.productos
language sql stable
set search_path = public
as $$
  select * from productos
  where ean is not null and ltrim(ean, '0') = ltrim(trim(codigo), '0')
  order by precio asc;
$$;

-- ---------- Seguridad ----------
alter table public.despensa             enable row level security;
alter table public.precios_mercado      enable row level security;
alter table public.avisos_suscripciones enable row level security;
alter table public.recetas_propias      enable row level security;

drop policy if exists miembros_todo on public.despensa;
create policy miembros_todo on public.despensa for all to authenticated
  using (public.es_miembro()) with check (public.es_miembro());

drop policy if exists miembros_todo on public.recetas_propias;
create policy miembros_todo on public.recetas_propias for all to authenticated
  using (public.es_miembro()) with check (public.es_miembro());

drop policy if exists miembros_leen on public.precios_mercado;
create policy miembros_leen on public.precios_mercado for select to authenticated
  using (public.es_miembro());

-- cada quien maneja solo sus propias suscripciones
drop policy if exists propias on public.avisos_suscripciones;
create policy propias on public.avisos_suscripciones for all to authenticated
  using (public.es_miembro() and lower(email) = lower(auth.jwt() ->> 'email'))
  with check (public.es_miembro() and lower(email) = lower(auth.jwt() ->> 'email'));

grant select, insert, update, delete on public.despensa, public.recetas_propias, public.avisos_suscripciones to authenticated;
grant select on public.precios_mercado to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.resumen_precios(bigint[]) to authenticated;
grant execute on function public.productos_por_ean(text) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.despensa;
exception when others then null;
end $$;
