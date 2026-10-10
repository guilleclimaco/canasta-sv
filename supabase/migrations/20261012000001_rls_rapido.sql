-- =====================================================================
-- Canasta SV — reglas de seguridad (RLS) rápidas.
-- Las reglas llamaban es_miembro() / mi_hogar() UNA VEZ POR FILA. Con ~7,500 productos,
-- candidatos_ingredientes tardaba 1.4 s por lote (87 ms sin la regla) y la pestaña Menú
-- se quedaba cargando. Envolver la llamada en (select ...) hace que Postgres la evalúe
-- una sola vez por consulta (recomendación de Supabase). Mismo resultado, mucho más rápido.
-- Idempotente.
-- =====================================================================

do $$
declare t text;
begin
  -- solo lectura, compartidas entre hogares
  foreach t in array array['tiendas','productos','historial'] loop
    execute format('drop policy if exists miembros_leen on public.%I', t);
    execute format('create policy miembros_leen on public.%I for select to authenticated
                      using ((select public.es_miembro()))', t);
  end loop;

  -- términos de búsqueda: compartidos, lectura y escritura
  execute 'drop policy if exists miembros_todo on public.terminos';
  execute 'create policy miembros_todo on public.terminos for all to authenticated
             using ((select public.es_miembro())) with check ((select public.es_miembro()))';

  -- de cada hogar
  foreach t in array array['lista','presupuestos','gastos','ajustes','menus'] loop
    execute format('drop policy if exists hogar_todo on public.%I', t);
    execute format('create policy hogar_todo on public.%I for all to authenticated
                      using ((select public.es_miembro()) and hogar = (select public.mi_hogar()))
                      with check ((select public.es_miembro()) and hogar = (select public.mi_hogar()))', t);
  end loop;
end $$;

drop policy if exists miembros_leen on public.miembros;
create policy miembros_leen on public.miembros for select to authenticated
  using ((select public.es_miembro()) and hogar = (select public.mi_hogar()));
