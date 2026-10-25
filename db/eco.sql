-- =====================================================================
-- Reto diario "Eco": una partida por alumno y día
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- La secuencia del día no se guarda: sale de la fecha (lib/eco.ts), igual en
-- el navegador que en el servidor. Aquí solo va cada partida.
--
-- La fila se crea al pulsar "Empezar", no al acabar. Así el intento del día ya
-- está gastado aunque se recargue la página a media partida, y el servidor
-- sabe cuándo empezó para comprobar que la puntuación es posible.
--
-- No va en game_attempts a propósito: el reto no da medallas ni cuenta para
-- el progreso, y mezclarlo con las partidas de los modos ensuciaría las dos
-- cosas.
-- =====================================================================

begin;

create table if not exists eco_plays (
  student_email text not null references students(email) on update cascade on delete cascade,
  -- El día del reto en Madrid ("2026-10-24"), que es cuando cambia.
  day           date not null,
  started_at    timestamptz not null default now(),
  -- Null mientras se juega. Una partida empezada y sin terminar cuenta como 0.
  finished_at   timestamptz,
  -- La secuencia más larga repetida entera. La calcula el servidor.
  score         integer check (score >= 0),
  primary key (student_email, day)
);

create index if not exists eco_plays_day_idx
  on eco_plays (day, score desc, finished_at);

comment on table eco_plays is
  'Reto diario Eco: una fila por alumno y día. La puntuación la calcula el servidor.';

alter table eco_plays enable row level security;

commit;
