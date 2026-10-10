-- =====================================================================
-- Canasta SV — tablas de la v4 separadas por hogar, con reglas rápidas.
-- La v4 se escribió para un solo hogar: la despensa ("En casa") y las recetas de la familia
-- quedaban compartidas entre hogares. Aquí cada hogar ve solo las suyas (como la lista y el menú).
-- Los precios del mercado siguen siendo de todos. Las reglas usan (select ...) para evaluarse
-- una vez por consulta y no una vez por fila (ver 20261012000001_rls_rapido.sql).
-- Lo que ya existía queda en el hogar 'casa'. Idempotente.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array['despensa','recetas_propias'] loop
    execute format('alter table public.%I add column if not exists hogar text', t);
    execute format('update public.%I set hogar = ''casa'' where hogar is null', t);
    execute format('alter table public.%I alter column hogar set default public.mi_hogar()', t);
    execute format('alter table public.%I alter column hogar set not null', t);
    execute format('create index if not exists %I on public.%I (hogar)', t || '_hogar_idx', t);
    execute format('drop policy if exists miembros_todo on public.%I', t);
    execute format('drop policy if exists hogar_todo on public.%I', t);
    execute format('create policy hogar_todo on public.%I for all to authenticated
                      using ((select public.es_miembro()) and hogar = (select public.mi_hogar()))
                      with check ((select public.es_miembro()) and hogar = (select public.mi_hogar()))', t);
  end loop;
end $$;

-- Dos hogares pueden tener una receta con el mismo nombre (y por tanto el mismo id)
do $$
begin
  if not exists (select 1 from information_schema.key_column_usage
                 where table_schema = 'public' and table_name = 'recetas_propias'
                   and constraint_name = 'recetas_propias_pkey' and column_name = 'hogar') then
    alter table public.recetas_propias drop constraint recetas_propias_pkey;
    alter table public.recetas_propias add primary key (hogar, id);
  end if;
end $$;

drop policy if exists miembros_leen on public.precios_mercado;
create policy miembros_leen on public.precios_mercado for select to authenticated
  using ((select public.es_miembro()));

drop policy if exists propias on public.avisos_suscripciones;
create policy propias on public.avisos_suscripciones for all to authenticated
  using ((select public.es_miembro()) and lower(email) = lower((select auth.jwt() ->> 'email')))
  with check ((select public.es_miembro()) and lower(email) = lower((select auth.jwt() ->> 'email')));
