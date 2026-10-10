-- =====================================================================
-- Canasta SV — precios de los Agromercados del MAG (El Salvador).
-- El MAG publica sus listas como imágenes/videos en redes ("20 tomates grandes por $1"), no como datos,
-- así que se anotan a mano en la app (Ajustes → Agromercado). Son precios nacionales: los ve y los
-- actualiza cualquier miembro, de cualquier hogar. Idempotente.
-- =====================================================================

create table if not exists public.precios_agromercado (
  id               bigint generated always as identity primary key,
  ingrediente      text not null,            -- id del catálogo del menú (tomate, cebolla, arroz…)
  descripcion      text not null,            -- como lo dice el MAG: "Tomate grande"
  cantidad         numeric not null,         -- 20 (tomates), 12 (libras)…
  unidad           text not null check (unidad in ('und', 'lb', 'oz')),
  precio           numeric(10,2) not null,   -- por esa cantidad
  gramos_unidad    numeric,                  -- si se vende por unidad y la receta usa gramos (un tomate grande ≈ 170 g)
  fecha            date not null default current_date,
  fuente           text,
  actualizado_por  text default (auth.jwt() ->> 'email'),
  unique (ingrediente, descripcion)
);

alter table public.precios_agromercado enable row level security;
drop policy if exists miembros_todo on public.precios_agromercado;
create policy miembros_todo on public.precios_agromercado for all to authenticated
  using ((select public.es_miembro())) with check ((select public.es_miembro()));
grant select, insert, update, delete on public.precios_agromercado to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Últimos precios publicados (notas de prensa con las listas del MAG, 2026). Se corrigen en la app.
insert into public.precios_agromercado (ingrediente, descripcion, cantidad, unidad, precio, gramos_unidad, fecha, fuente) values
  ('tomate', 'Tomate grande', 20, 'und', 1.00, 170, '2026-05-15', 'Lista del MAG, mayo 2026 (elsalvador.com)'),
  ('tomate', 'Tomate mediano', 25, 'und', 1.00, 130, '2026-05-15', 'Lista del MAG, mayo 2026 (elsalvador.com)'),
  ('tomate', 'Tomate pequeño', 35, 'und', 1.00, 90, '2026-05-15', 'Lista del MAG, mayo 2026 (elsalvador.com)'),
  ('cebolla', 'Cebolla blanca', 10, 'und', 1.00, 200, '2026-05-15', 'Lista del MAG, mayo 2026 (elsalvador.com)'),
  ('limon', 'Limón', 32, 'und', 2.00, null, '2026-09-30', 'Video del MAG, 30 sep 2026'),
  ('banano', 'Guineo', 20, 'und', 2.00, null, '2026-09-30', 'Video del MAG, 30 sep 2026'),
  ('papa', 'Papa', 12, 'lb', 4.00, null, '2026-09-30', 'Video del MAG, 30 sep 2026'),
  ('arroz', 'Arroz', 1, 'lb', 0.25, null, '2026-07-01', 'Lista del MAG (dinero.com.sv)'),
  ('frijol', 'Frijol', 1, 'lb', 0.70, null, '2026-07-01', 'Lista del MAG (dinero.com.sv)'),
  ('sandia', 'Sandía pequeña', 1, 'und', 0.80, 2500, '2026-07-01', 'Lista del MAG (dinero.com.sv)')
on conflict (ingrediente, descripcion) do nothing;
