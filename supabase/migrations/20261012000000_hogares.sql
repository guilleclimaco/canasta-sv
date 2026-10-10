-- =====================================================================
-- Canasta SV — varios hogares en la misma base.
-- Cada miembro pertenece a un hogar. Lista, presupuestos, gastos, ajustes y menús
-- son de cada hogar (cada quien ve solo los suyos). Precios, tiendas, ofertas y
-- términos de búsqueda siguen siendo compartidos: el robot diario sirve a todos.
-- Los datos que ya existían quedan en el hogar 'casa'.
-- Agregar a alguien en otro hogar:  node scraper/agregar-miembro.mjs correo@x.com Nombre --hogar otro
-- Idempotente.
-- =====================================================================

alter table public.miembros add column if not exists hogar text;
update public.miembros set hogar = 'casa' where hogar is null;
alter table public.miembros alter column hogar set default 'casa';
alter table public.miembros alter column hogar set not null;

-- Hogar de quien hace la consulta (null si no es miembro)
create or replace function public.mi_hogar()
returns text
language sql stable security definer
set search_path = public
as $$
  select hogar from public.miembros
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;
grant execute on function public.mi_hogar() to authenticated;

-- Columna hogar en las tablas de cada hogar; lo existente pasa a 'casa'
do $$
declare t text;
begin
  foreach t in array array['lista','presupuestos','gastos','ajustes','menus'] loop
    execute format('alter table public.%I add column if not exists hogar text', t);
    execute format('update public.%I set hogar = ''casa'' where hogar is null', t);
    execute format('alter table public.%I alter column hogar set default public.mi_hogar()', t);
    execute format('alter table public.%I alter column hogar set not null', t);
    execute format('create index if not exists %I on public.%I (hogar)', t || '_hogar_idx', t);
  end loop;
end $$;

-- Claves primarias que ahora dependen del hogar (la app hace upsert sobre ellas)
do $$
begin
  if not exists (select 1 from information_schema.key_column_usage
                 where table_schema = 'public' and table_name = 'presupuestos'
                   and constraint_name = 'presupuestos_pkey' and column_name = 'hogar') then
    alter table public.presupuestos drop constraint presupuestos_pkey;
    alter table public.presupuestos add primary key (hogar, mes, categoria);
  end if;
  if not exists (select 1 from information_schema.key_column_usage
                 where table_schema = 'public' and table_name = 'ajustes'
                   and constraint_name = 'ajustes_pkey' and column_name = 'hogar') then
    alter table public.ajustes drop constraint ajustes_pkey;
    alter table public.ajustes add primary key (hogar, clave);
  end if;
  if not exists (select 1 from information_schema.key_column_usage
                 where table_schema = 'public' and table_name = 'menus'
                   and constraint_name = 'menus_pkey' and column_name = 'hogar') then
    alter table public.menus drop constraint menus_pkey;
    alter table public.menus add primary key (hogar, semana);
  end if;
end $$;

-- Reglas: cada miembro solo ve y escribe lo de su hogar
do $$
declare t text;
begin
  foreach t in array array['lista','presupuestos','gastos','ajustes','menus'] loop
    execute format('drop policy if exists miembros_todo on public.%I', t);
    execute format('drop policy if exists hogar_todo on public.%I', t);
    execute format('create policy hogar_todo on public.%I for all to authenticated
                      using (public.es_miembro() and hogar = public.mi_hogar())
                      with check (public.es_miembro() and hogar = public.mi_hogar())', t);
  end loop;
end $$;

-- miembros: cada quien ve solo a los de su hogar
drop policy if exists miembros_leen on public.miembros;
create policy miembros_leen on public.miembros for select to authenticated
  using (public.es_miembro() and hogar = public.mi_hogar());

-- Un hogar nuevo arranca con los ajustes por defecto
create or replace function public.ajustes_hogar_nuevo()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.ajustes (hogar, clave, valor) values
    (new.hogar, 'umbral_segunda_tienda', '3'::jsonb),
    (new.hogar, 'tiendas_cercanas', '["walmart","maxi","donjuan","selectos"]'::jsonb)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists miembros_ajustes_hogar on public.miembros;
create trigger miembros_ajustes_hogar after insert or update of hogar on public.miembros
  for each row execute function public.ajustes_hogar_nuevo();

-- Por si algún hogar ya existía sin ajustes
insert into public.ajustes (hogar, clave, valor)
select distinct m.hogar, a.clave, a.valor
from public.miembros m
cross join (values ('umbral_segunda_tienda', '3'::jsonb),
                   ('tiendas_cercanas', '["walmart","maxi","donjuan","selectos"]'::jsonb)) as a(clave, valor)
on conflict do nothing;
