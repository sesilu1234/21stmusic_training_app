-- =====================================================================
-- Cuadro de honor: quién quiere salir en él
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- El cuadro de honor (/honor y la franja de la portada) enseña a otros
-- alumnos el nombre de quien va arriba. Hay alumnos menores de edad, así que
-- nadie sale ahí sin haberlo pedido: la columna empieza en false para todo el
-- mundo y solo la cambia el propio alumno desde /honor.
--
-- Las cifras del cuadro no se guardan: salen de `game_attempts`, como todo lo
-- demás. Esto es solo el permiso.
-- =====================================================================

begin;

alter table students
  add column if not exists show_in_honor boolean not null default false;

comment on column students.show_in_honor is
  'true = el alumno ha pedido salir en el cuadro de honor. Solo lo cambia él.';

commit;
