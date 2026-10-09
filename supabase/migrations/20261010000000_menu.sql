-- =====================================================================
-- Canasta SV — Menú semanal (almuerzos) estilo NeatEat, sin IA de pago.
-- Se aplica con: npx supabase db push   (o pegando este archivo en SQL Editor)
-- Idempotente.
-- =====================================================================

-- Menú de la semana, compartido entre los celulares del hogar
create table if not exists public.menus (
  semana          date primary key,            -- lunes de la semana
  datos           jsonb not null,              -- plan: días, recetas, compras, semilla
  actualizado     timestamptz not null default now(),
  actualizado_por text default (auth.jwt() ->> 'email')
);

alter table public.menus enable row level security;
drop policy if exists miembros_todo on public.menus;
create policy miembros_todo on public.menus for all to authenticated
  using (public.es_miembro()) with check (public.es_miembro());
grant select, insert, update, delete on public.menus to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.menus;
exception when others then null;
end $$;

-- Productos candidatos para cada ingrediente (los más baratos por gramo/ml/unidad).
-- La app filtra después los que no son el ingrediente (ej. "sopa sabor pollo").
create or replace function public.candidatos_ingredientes(terminos text[], por_termino integer default 15)
returns table (
  termino text, id bigint, tienda text, ean text, nombre text, busqueda text,
  contenido numeric, unidad text, precio numeric, precio_lista numeric
)
language sql stable
set search_path = public
as $$
  select t.termino, p.id, p.tienda, p.ean, p.nombre, p.busqueda, p.contenido, p.unidad, p.precio, p.precio_lista
  from unnest(terminos) as t(termino)
  cross join lateral (
    select * from productos p
    where p.visto_en > now() - interval '14 days'
      and p.disponible
      and p.precio is not null
      and p.contenido is not null and p.contenido > 0
      and not exists (
        select 1 from unnest(string_to_array(trim(t.termino), ' ')) as w
        where w <> '' and p.busqueda not like '%' || w || '%'
      )
    order by p.precio / p.contenido asc
    limit por_termino
  ) p;
$$;
grant execute on function public.candidatos_ingredientes(text[], integer) to authenticated;

-- Términos de los ingredientes del recetario (para que el robot diario los cotice)
-- Generado desde web/menu/ingredientes.js → terminosDeIngredientes()
insert into public.terminos (termino) values
  ('arroz blanco'),
  ('arroz'),
  ('frijol rojo'),
  ('frijol'),
  ('lenteja'),
  ('aceite'),
  ('espagueti'),
  ('spaghetti'),
  ('spagueti'),
  ('codito'),
  ('harina maiz'),
  ('maseca'),
  ('pan molido'),
  ('salsa tomate'),
  ('mayonesa'),
  ('vegetales mixtos'),
  ('mezcla vegetales'),
  ('huevo'),
  ('pechuga pollo'),
  ('pierna pollo'),
  ('muslo pollo'),
  ('pollo entero'),
  ('pollo'),
  ('alita pollo'),
  ('alas pollo'),
  ('posta res'),
  ('posta'),
  ('carne res'),
  ('costilla res'),
  ('carne molida'),
  ('chuleta cerdo'),
  ('chuleta'),
  ('chorizo'),
  ('salchicha'),
  ('tilapia'),
  ('filete pescado'),
  ('atun'),
  ('queso duro'),
  ('quesillo'),
  ('crema salud'),
  ('crema acida'),
  ('crema'),
  ('leche entera'),
  ('leche'),
  ('margarina'),
  ('mantequilla'),
  ('tomate'),
  ('cebolla'),
  ('chile verde'),
  ('chile dulce'),
  ('pimiento verde'),
  ('papa'),
  ('zanahoria'),
  ('guisquil'),
  ('chayote'),
  ('yuca'),
  ('elote'),
  ('repollo'),
  ('lechuga'),
  ('pepino'),
  ('brocoli'),
  ('limon persa'),
  ('limon criollo'),
  ('limon'),
  ('cilantro'),
  ('hierbabuena'),
  ('hierba buena'),
  ('rabano'),
  ('aguacate'),
  ('tortilla maiz'),
  ('tortilla'),
  ('pan frances'),
  ('pan hamburguesa')
on conflict (termino) do nothing;
