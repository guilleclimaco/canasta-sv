-- =====================================================================
-- Canasta SV v5: artículos de la casa por NECESIDAD (cuidado personal y limpieza).
-- Cada artículo lleva su ritmo de consumo y lo que queda; la app calcula cuándo se acaba,
-- cuánto llevar y si conviene abastecerse por una oferta. Idempotente.
-- =====================================================================

create table if not exists public.hogar_articulos (
  id             bigint generated always as identity primary key,
  catalogo       text,                         -- id en web/hogar/catalogo.js (null = artículo propio)
  nombre         text not null,
  categoria      text not null default 'limpieza',   -- 'personal' | 'limpieza'
  unidad         text not null default 'und',        -- 'g' | 'ml' | 'und'
  marca          text,                         -- marca preferida (null = la más barata)
  usuarios       numeric,                      -- cuántas personas lo usan
  consumo_mes    numeric not null default 0,   -- unidad base por mes (se ajusta solo)
  stock          numeric not null default 0,   -- lo que había al momento de stock_fecha
  stock_fecha    timestamptz not null default now(),
  ref_stock      numeric,                      -- último dato real (para aprender el consumo)
  ref_fecha      timestamptz,
  compras_desde  numeric not null default 0,   -- comprado desde el último dato real
  activo         boolean not null default true,
  creado         timestamptz not null default now(),
  creado_por     text default (auth.jwt() ->> 'email')
);

create table if not exists public.hogar_movimientos (
  id           bigint generated always as identity primary key,
  articulo_id  bigint not null references public.hogar_articulos(id) on delete cascade,
  fecha        timestamptz not null default now(),
  tipo         text not null check (tipo in ('compra', 'reporte')),
  cantidad     numeric not null,               -- compra: cuánto entró; reporte: cuánto quedaba
  precio       numeric(10,2),
  tienda       text,
  producto_id  bigint,
  lista_id     bigint,                         -- si vino de marcar un artículo de la lista
  creado_por   text default (auth.jwt() ->> 'email')
);
create index if not exists hogar_mov_art_idx on public.hogar_movimientos (articulo_id, fecha desc);

-- La lista recuerda a qué artículo de la casa corresponde (al marcarlo comprado, sube el stock).
-- Se llama articulo_casa (no "hogar"): lista.hogar ya existe y es el hogar dueño de la fila (20261012000000_hogares.sql).
alter table public.lista add column if not exists articulo_casa bigint references public.hogar_articulos(id) on delete set null;

alter table public.hogar_articulos   enable row level security;
alter table public.hogar_movimientos enable row level security;
drop policy if exists miembros_todo on public.hogar_articulos;
create policy miembros_todo on public.hogar_articulos for all to authenticated
  using (public.es_miembro()) with check (public.es_miembro());
drop policy if exists miembros_todo on public.hogar_movimientos;
create policy miembros_todo on public.hogar_movimientos for all to authenticated
  using (public.es_miembro()) with check (public.es_miembro());
grant select, insert, update, delete on public.hogar_articulos, public.hogar_movimientos to authenticated;
grant usage, select on all sequences in schema public to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.hogar_articulos;
exception when others then null;
end $$;

-- Términos para que el robot diario cotice estos artículos
-- Generado desde web/hogar/catalogo.js → terminosHogar()
insert into public.terminos (termino) values
  ('pasta dental'),
  ('crema dental'),
  ('cepillo dental'),
  ('cepillo dientes'),
  ('cepillo de dientes'),
  ('jabon tocador'),
  ('jabon de tocador'),
  ('jabon antibacterial'),
  ('jabon de baño'),
  ('jabon'),
  ('shampoo'),
  ('champu'),
  ('acondicionador'),
  ('desodorante'),
  ('antitranspirante'),
  ('papel higienico'),
  ('toallas sanitarias'),
  ('toalla sanitaria'),
  ('toallas femeninas'),
  ('toalla femenina'),
  ('panal'),
  ('panales'),
  ('rastrillo'),
  ('maquina de afeitar'),
  ('afeitadora desechable'),
  ('crema corporal'),
  ('locion corporal'),
  ('enjuague bucal'),
  ('detergente en polvo'),
  ('detergente'),
  ('suavizante'),
  ('cloro'),
  ('lejia'),
  ('blanqueador'),
  ('desinfectante'),
  ('limpiador multiusos'),
  ('fabuloso'),
  ('poett'),
  ('mistolin'),
  ('lavaplatos'),
  ('lavatrastes'),
  ('lava platos'),
  ('jabon para platos'),
  ('axion'),
  ('esponja'),
  ('bolsa para basura'),
  ('bolsas para basura'),
  ('bolsa basura'),
  ('bolsas basura'),
  ('bolsas de basura'),
  ('jabon de lavar'),
  ('jabon para ropa'),
  ('jabon en barra'),
  ('xtra'),
  ('papel toalla'),
  ('toalla de cocina'),
  ('papel de cocina'),
  ('servilleta'),
  ('limpiavidrios'),
  ('limpia vidrios'),
  ('insecticida'),
  ('raid'),
  ('baygon'),
  ('ambientador'),
  ('aromatizante ambiental'),
  ('glade')
on conflict (termino) do nothing;
