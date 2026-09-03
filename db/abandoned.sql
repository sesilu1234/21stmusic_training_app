-- =====================================================================
-- Partidas abandonadas
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Hasta ahora solo se guardaba la partida que llega al final, y eso sesga TODO
-- lo que se enseña: quien va fallando recarga la página o se va, esa partida no
-- se guarda, y la media del alumno acaba siendo la media de sus partidas
-- buenas. El `form` del panel no dice cómo va el alumno, dice cómo va cuando le
-- sale bien.
--
-- No es una tabla nueva a propósito: una partida abandonada ES una partida, y
-- tener las partidas en dos sitios es exactamente lo que se evitó al quitar
-- `student_medals`. Es una columna, y por defecto true, así que las filas que
-- ya existen siguen siendo lo que eran: partidas terminadas.
--
-- Nada de lo que se enseña hoy cambia: todas las consultas de lib/progress.ts
-- filtran por `completed = true`. Las abandonadas se quedan guardadas esperando
-- a que alguien decida mirarlas.
-- =====================================================================

begin;

alter table game_attempts
  add column if not exists completed boolean not null default true;

comment on column game_attempts.completed is
  'false = el alumno se fue a media partida. `correct` y `total` son lo que llevaba contestado en ese momento.';

-- El panel pide siempre las terminadas de un alumno; sin la columna en el
-- índice, filtrar por ella obliga a ir a buscar cada fila a la tabla.
create index if not exists game_attempts_student_completed_idx
  on game_attempts (student_email, completed, created_at desc);

commit;
