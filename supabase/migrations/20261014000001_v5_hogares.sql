-- =====================================================================
-- Canasta SV — artículos de la casa (v5) separados por hogar, con reglas rápidas.
-- La v5 se escribió para un solo hogar: los artículos de cuidado personal y limpieza (y sus
-- movimientos) quedaban compartidos. Aquí cada hogar ve solo los suyos, como la lista y la despensa.
-- Lo que ya existía queda en el hogar 'casa'. Idempotente.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array['hogar_articulos','hogar_movimientos'] loop
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
