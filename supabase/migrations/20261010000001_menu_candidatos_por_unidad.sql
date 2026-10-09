-- =====================================================================
-- Canasta SV — candidatos_ingredientes: los más baratos POR UNIDAD de medida.
-- Antes ordenaba todo junto por precio/contenido, y los productos en gramos o ml
-- (precio por gramo muy pequeño) llenaban los 15 lugares; los ingredientes que se
-- miden en unidades (huevo, limón, aguacate, tortillas, pan...) quedaban sin candidatos.
-- Idempotente.
-- =====================================================================

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
    select * from (
      select p.*, row_number() over (partition by p.unidad order by p.precio / p.contenido asc) as n
      from productos p
      where p.visto_en > now() - interval '14 days'
        and p.disponible
        and p.precio is not null
        and p.contenido is not null and p.contenido > 0
        and not exists (
          select 1 from unnest(string_to_array(trim(t.termino), ' ')) as w
          where w <> '' and p.busqueda not like '%' || w || '%'
        )
    ) x
    where x.n <= por_termino
  ) p;
$$;
grant execute on function public.candidatos_ingredientes(text[], integer) to authenticated;
