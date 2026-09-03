-- =====================================================================
-- Progreso del alumno: partidas, medallas y rachas
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Las tablas `game_attempts` y `student_medals` ya estaban creadas en
-- schema.sql, pero hasta ahora no las escribía nadie: la app no guardaba los
-- resultados. Esto añade lo que faltaba para que sí lo haga.
--
-- No hay tabla de rachas ni de estadísticas: todo eso se calcula desde
-- game_attempts, que es la única verdad. Guardar el mismo dato dos veces solo
-- sirve para que un día no cuadren.
-- =====================================================================

begin;

-- 1. En qué nivel se jugó ---------------------------------------------
--    Muchos modos tienen niveles (/play/piano/notas/sol-naturales). Sin esto
--    el panel solo podría decir "Notas en el teclado", sin poder enseñar por
--    dónde va el alumno dentro del modo.
alter table game_attempts
  add column if not exists level_slug text;

comment on column game_attempts.level_slug is
  'Nivel dentro del modo, tal cual sale en la URL. Null si el modo no tiene niveles.';

-- 2. Índices que necesita el panel -------------------------------------
--    El panel pregunta siempre "lo de este alumno en este modo", y la racha
--    pregunta "los días que ha jugado este alumno".
create index if not exists game_attempts_student_game_idx
  on game_attempts (student_email, game_name, created_at desc);

-- OBSOLETO desde db/drop_medals.sql: la tabla student_medals ya no existe.
-- Las medallas se deducen de game_attempts, que es donde estaban de verdad.
-- Se deja la linea comentada porque este fichero es el historico de como se
-- monto el progreso, y borrarla haria que no se entendiese drop_medals.sql.
-- create index if not exists student_medals_student_idx
--   on student_medals (student_email, created_at desc);

-- 3. Seguridad ---------------------------------------------------------
--    Igual que el resto: la app entra con la service role key desde el
--    servidor, así que RLS activo y sin políticas = el navegador no toca esto.
alter table game_attempts  enable row level security;
-- alter table student_medals enable row level security;  -- ver drop_medals.sql

commit;
