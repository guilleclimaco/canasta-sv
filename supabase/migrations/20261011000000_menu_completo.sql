-- =====================================================================
-- Canasta SV — Menú completo: desayunos, refacciones, almuerzos y cenas.
-- Solo agrega los términos de búsqueda de los ingredientes nuevos (fruta, avena,
-- café, pan, jamón, etc.) para que el robot diario los cotice. Idempotente.
-- La tabla menus no cambia: el menú por comidas se guarda en la misma columna jsonb.
-- Generado desde web/menu/ingredientes.js → terminosDeIngredientes()
-- =====================================================================

insert into public.terminos (termino) values
  ('cafe molido'),
  ('cafe'),
  ('avena'),
  ('cereal'),
  ('corn flakes'),
  ('hojuelas maiz'),
  ('yogurt'),
  ('yogur'),
  ('granola'),
  ('galleta'),
  ('pan dulce'),
  ('semita'),
  ('pan de yema'),
  ('pan blanco'),
  ('pan sandwich'),
  ('pan de molde'),
  ('pan integral'),
  ('harina panqueque'),
  ('mezcla panqueque'),
  ('pancake'),
  ('harina arroz'),
  ('jamon'),
  ('queso amarillo'),
  ('queso americano'),
  ('queso cheddar'),
  ('chicharron'),
  ('fideo'),
  ('cabello angel'),
  ('tostada maiz'),
  ('tostada'),
  ('mani'),
  ('cacahuate'),
  ('palomitas'),
  ('maiz palomero'),
  ('poporopo'),
  ('gelatina'),
  ('platano'),
  ('banano'),
  ('guineo'),
  ('mango'),
  ('manzana'),
  ('naranja'),
  ('papaya')
on conflict (termino) do nothing;
