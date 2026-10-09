-- =====================================================================
-- Canasta SV — esquema de base de datos (Supabase, plan gratuito)
-- Pegar completo en: Supabase > SQL Editor > New query > Run
-- Es idempotente: se puede volver a correr sin romper nada.
-- =====================================================================

-- ---------- Miembros del hogar (solo estos correos pueden entrar) ----------
create table if not exists public.miembros (
  email  text primary key,
  nombre text
);

create or replace function public.es_miembro()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.miembros
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- Tiendas ----------
create table if not exists public.tiendas (
  id      text primary key,
  nombre  text not null,
  color   text not null default '#64748b',
  activa  boolean not null default true
);

insert into public.tiendas (id, nombre, color) values
  ('walmart',  'Walmart',                 '#0071ce'),
  ('maxi',     'Maxi Despensa',           '#e4002b'),
  ('donjuan',  'La Despensa de Don Juan', '#f5a800'),
  ('selectos', 'Súper Selectos',          '#00843d')
on conflict (id) do nothing;

-- ---------- Productos (precio actual) ----------
create table if not exists public.productos (
  id            bigint generated always as identity primary key,
  tienda        text not null references public.tiendas(id),
  sku           text not null,
  ean           text,
  nombre        text not null,
  busqueda      text not null,              -- nombre normalizado (minúsculas, sin tildes)
  marca         text,
  url           text,
  imagen        text,
  contenido     numeric,                    -- cantidad en unidad base (g, ml o und)
  unidad        text,                       -- 'g' | 'ml' | 'und'
  precio        numeric(10,2),
  precio_lista  numeric(10,2),
  disponible    boolean not null default true,
  visto_en      timestamptz not null default now(),
  creado        timestamptz not null default now(),
  unique (tienda, sku)
);
create index if not exists productos_ean_idx    on public.productos (ean);
create index if not exists productos_visto_idx  on public.productos (visto_en);

-- ---------- Historial: solo se guarda una fila cuando el precio CAMBIA ----------
-- (así la base no crece de más y nunca pasamos del límite gratis de 500 MB)
create table if not exists public.historial (
  producto_id   bigint not null references public.productos(id) on delete cascade,
  fecha         timestamptz not null default now(),
  precio        numeric(10,2),
  precio_lista  numeric(10,2),
  primary key (producto_id, fecha)
);

-- ---------- Términos que el robot busca cada día ----------
create table if not exists public.terminos (
  termino  text primary key,
  activo   boolean not null default true,
  creado   timestamptz not null default now()
);

insert into public.terminos (termino) values
  ('arroz'),('frijol'),('azucar'),('aceite'),('leche'),('huevos'),('cafe'),
  ('harina de maiz'),('pasta'),('pan'),('pollo'),('queso'),('crema'),
  ('tomate'),('cebolla'),('papel higienico'),('detergente'),('jabon'),
  ('pasta dental'),('agua')
on conflict (termino) do nothing;

-- ---------- Lista de compras compartida ----------
create table if not exists public.lista (
  id          bigint generated always as identity primary key,
  nombre      text not null,
  cantidad    numeric not null default 1,
  categoria   text not null default 'Súper',
  productos   bigint[] not null default '{}',   -- productos equivalentes elegidos (de varias tiendas)
  comprado    boolean not null default false,
  creado_por  text default (auth.jwt() ->> 'email'),
  creado      timestamptz not null default now()
);

-- ---------- Presupuesto y gastos ----------
create table if not exists public.presupuestos (
  mes        date    not null,               -- primer día del mes
  categoria  text    not null,
  monto      numeric(10,2) not null,
  primary key (mes, categoria)
);

create table if not exists public.gastos (
  id          bigint generated always as identity primary key,
  fecha       date not null default current_date,
  tienda      text,
  categoria   text not null default 'Súper',
  monto       numeric(10,2) not null,
  nota        text,
  creado_por  text default (auth.jwt() ->> 'email'),
  creado      timestamptz not null default now()
);

-- ---------- Ajustes del hogar ----------
create table if not exists public.ajustes (
  clave  text primary key,
  valor  jsonb not null
);
insert into public.ajustes (clave, valor) values
  ('umbral_segunda_tienda', '3'::jsonb),   -- ir a una 2da tienda solo si ahorra ≥ $3
  ('tiendas_cercanas', '["walmart","maxi","donjuan","selectos"]'::jsonb)
on conflict (clave) do nothing;

-- =====================================================================
-- Funciones
-- =====================================================================

-- Registrar precios en lote (lo usan el robot diario y la búsqueda inmediata).
-- Solo la service_role puede llamarla.
create or replace function public.registrar_precios(items jsonb)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  r       record;
  pid     bigint;
  old_p   numeric;
  old_pl  numeric;
  cambios integer := 0;
begin
  for r in
    select * from jsonb_to_recordset(items) as x(
      tienda text, sku text, ean text, nombre text, busqueda text, marca text,
      url text, imagen text, contenido numeric, unidad text,
      precio numeric, precio_lista numeric, disponible boolean)
  loop
    continue when r.tienda is null or r.sku is null or r.nombre is null;

    select id, precio, precio_lista into pid, old_p, old_pl
      from productos where tienda = r.tienda and sku = r.sku;

    if pid is null then
      insert into productos (tienda, sku, ean, nombre, busqueda, marca, url, imagen,
                             contenido, unidad, precio, precio_lista, disponible)
      values (r.tienda, r.sku, nullif(r.ean, ''), r.nombre, coalesce(r.busqueda, lower(r.nombre)),
              r.marca, r.url, r.imagen, r.contenido, r.unidad, r.precio,
              coalesce(r.precio_lista, r.precio), coalesce(r.disponible, true))
      returning id into pid;
      insert into historial (producto_id, precio, precio_lista)
        values (pid, r.precio, coalesce(r.precio_lista, r.precio));
      cambios := cambios + 1;
    else
      update productos set
        ean = coalesce(nullif(r.ean, ''), ean),
        nombre = r.nombre,
        busqueda = coalesce(r.busqueda, busqueda),
        marca = coalesce(r.marca, marca),
        url = coalesce(r.url, url),
        imagen = coalesce(r.imagen, imagen),
        contenido = coalesce(r.contenido, contenido),
        unidad = coalesce(r.unidad, unidad),
        precio = r.precio,
        precio_lista = coalesce(r.precio_lista, r.precio),
        disponible = coalesce(r.disponible, true),
        visto_en = now()
      where id = pid;
      if old_p is distinct from r.precio
         or old_pl is distinct from coalesce(r.precio_lista, r.precio) then
        insert into historial (producto_id, precio, precio_lista)
          values (pid, r.precio, coalesce(r.precio_lista, r.precio));
        cambios := cambios + 1;
      end if;
    end if;
  end loop;
  return cambios;
end;
$$;

-- Buscar productos: q debe venir normalizado (minúsculas, sin tildes).
-- Todas las palabras de q deben aparecer en el nombre.
create or replace function public.buscar_productos(q text, lim integer default 80)
returns setof public.productos
language sql stable
set search_path = public
as $$
  select p.*
  from productos p
  where p.visto_en > now() - interval '14 days'
    and p.precio is not null
    and not exists (
      select 1 from unnest(string_to_array(trim(q), ' ')) as w
      where w <> '' and p.busqueda not like '%' || w || '%'
    )
  order by p.precio asc
  limit lim;
$$;

-- Ofertas: precio actual por debajo del precio de lista o del máximo de los últimos 60 días.
create or replace view public.ofertas
with (security_invoker = on) as
select
  p.*,
  greatest(coalesce(p.precio_lista, p.precio), coalesce(h.max60, p.precio)) as precio_ref,
  round(100 * (1 - p.precio / nullif(greatest(coalesce(p.precio_lista, p.precio),
                                              coalesce(h.max60, p.precio)), 0)))::int as descuento_pct
from public.productos p
left join lateral (
  select max(precio) as max60 from public.historial
  where producto_id = p.id and fecha > now() - interval '60 days'
) h on true
where p.disponible
  and p.visto_en > now() - interval '3 days'
  and p.precio < 0.97 * greatest(coalesce(p.precio_lista, p.precio), coalesce(h.max60, p.precio));

-- =====================================================================
-- Seguridad (RLS): solo miembros del hogar leen/escriben.
-- El robot usa la service_role, que se salta RLS.
-- =====================================================================
alter table public.miembros     enable row level security;
alter table public.tiendas      enable row level security;
alter table public.productos    enable row level security;
alter table public.historial    enable row level security;
alter table public.terminos     enable row level security;
alter table public.lista        enable row level security;
alter table public.presupuestos enable row level security;
alter table public.gastos       enable row level security;
alter table public.ajustes      enable row level security;

do $$
declare t text;
begin
  -- solo lectura para miembros
  foreach t in array array['miembros','tiendas','productos','historial'] loop
    execute format('drop policy if exists miembros_leen on public.%I', t);
    execute format('create policy miembros_leen on public.%I for select to authenticated using (public.es_miembro())', t);
  end loop;
  -- lectura y escritura para miembros
  foreach t in array array['terminos','lista','presupuestos','gastos','ajustes'] loop
    execute format('drop policy if exists miembros_todo on public.%I', t);
    execute format('create policy miembros_todo on public.%I for all to authenticated using (public.es_miembro()) with check (public.es_miembro())', t);
  end loop;
end $$;

revoke all on all tables in schema public from anon;
grant select on public.miembros, public.tiendas, public.productos, public.historial, public.ofertas to authenticated;
grant select, insert, update, delete on public.terminos, public.lista, public.presupuestos,
  public.gastos, public.ajustes to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke execute on function public.registrar_precios(jsonb) from public, anon, authenticated;
grant execute on function public.registrar_precios(jsonb) to service_role;
grant execute on function public.buscar_productos(text, integer) to authenticated;
grant execute on function public.es_miembro() to authenticated;

-- Sincronización en vivo de la lista entre los dos celulares
do $$
begin
  alter publication supabase_realtime add table public.lista;
exception when others then null;  -- ya estaba agregada o no existe la publicación
end $$;

-- =====================================================================
-- ÚLTIMO PASO (editar los correos y correr):
-- insert into public.miembros (email, nombre) values
--   ('tu-correo@gmail.com', 'Guille'),
--   ('correo-de-la-tia@gmail.com', 'Tía')
-- on conflict do nothing;
-- =====================================================================
