-- =====================================================================
-- Fuera la tabla de medallas: ya no la lee nadie
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Una medalla es "una partida larga sin fallar". Eso ya está escrito en
-- game_attempts, en la propia partida que la ganó. Tenerlo además en una tabla
-- aparte era guardar el mismo hecho dos veces, con lo que eso trae siempre:
-- dos sitios que pueden dejar de cuadrar y uno de los dos mintiendo. El aviso
-- estaba escrito en el propio progress.sql desde el principio —"no hay tabla de
-- rachas ni de estadísticas: todo eso se calcula desde game_attempts, que es la
-- única verdad"— y la de medallas era la excepción que se coló.
--
-- Además la tabla no podía decir la verdad que ahora hace falta. Su clave única
-- es (student_email, game_name): una fila por alumno y MODO. Las medallas son
-- por NIVEL, así que habría hecho falta migrarla igualmente. Entre migrar una
-- tabla que sobra y quitarla, se quita.
--
-- No se pierde nada. Cada medalla que había en esta tabla se ganó con una
-- partida, y esa partida sigue en game_attempts: al leerla se vuelve a deducir
-- sola. Lo único que cambia es que ahora sale en el nivel donde se ganó y no
-- pegada al modo entero.
--
-- Antes de ejecutar: la app ya no consulta ni escribe student_medals (ver
-- lib/progress.ts). Se puede correr con la app en marcha.
-- =====================================================================

begin;

-- 1. El índice que la servía --------------------------------------------
drop index if exists student_medals_student_idx;

-- 2. La tabla -----------------------------------------------------------
drop table if exists student_medals;

-- 3. El índice que sí hace falta ahora ----------------------------------
--    Al terminar una partida con pleno se pregunta si ESE nivel ya tenía su
--    medalla, o sea "las partidas de este alumno, en este modo, en este nivel".
--    El índice de progress.sql llega hasta el modo; con `level_slug` dentro, la
--    pregunta se resuelve sin salir del índice.
--
--    Es lo único que cuesta haber quitado la tabla: una consulta más por
--    partida ganadora, sobre decenas de filas. A cambio, la medalla deja de ser
--    un dato que hay que mantener a mano y pasa a ser lo que siempre fue, una
--    lectura de las partidas.
create index if not exists game_attempts_student_game_level_idx
  on game_attempts (student_email, game_name, level_slug, created_at desc);

commit;
