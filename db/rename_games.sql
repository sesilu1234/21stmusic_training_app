-- =====================================================================
-- Alinear los nombres de los modos entre la base de datos y la app
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Once modos se guardaban con un nombre distinto del que se enseña en
-- pantalla ("Modos E. Mayor" contra "Modos griegos", "Diapasón" contra "Notas
-- en el mástil"...). El historial del panel pintaba el nombre guardado tal
-- cual, así que la misma página llamaba a un mismo modo de dos maneras.
--
-- YA EJECUTADO (1 de septiembre de 2026). Se queda aquí como historial de la
-- migración, igual que el resto de archivos de db/. Volver a pasarlo no hace
-- nada: no queda ninguna fila con los nombres viejos.
--
-- La app ya NO sabe leer los nombres antiguos: se quitaron de lib/games.ts una
-- vez hecha la migración. Si se restaurara una copia de seguridad anterior a
-- esta fecha, habría que volver a pasar este archivo o las partidas de esos
-- once modos se quedarían sin modo al que pertenecer.
--
-- Se tocan las dos tablas que guardan game_name: partidas y medallas.
-- =====================================================================

begin;

create temp table game_renames (old_name text primary key, new_name text not null) on commit drop;

insert into game_renames (old_name, new_name) values
  ('Modos E. Mayor',                'Modos griegos'),
  ('Lectura Rítmica',               'Lectura rítmica'),
  ('Oído',                          'Intervalos al oído'),
  ('Diapasón',                      'Notas en el mástil'),
  ('Acordes',                       'Acordes en el mástil'),
  ('Piano: notas en el teclado',    'Notas en el teclado'),
  ('Piano: tocar el intervalo',     'Toca el intervalo'),
  ('Piano: reconocer el intervalo', 'Reconoce el intervalo'),
  ('Piano: construir acordes',      'Construye acordes'),
  ('Piano: construir escalas',      'Construye escalas'),
  ('Ej. Rockschool',                'Rockschool');

update game_attempts a
   set game_name = r.new_name
  from game_renames r
 where a.game_name = r.old_name;

-- Las medallas llevan un unique (student_email, game_name). Si un alumno
-- tuviera ya la medalla con el nombre nuevo y con el viejo —no debería pasar,
-- pero renombrar a ciegas reventaría—, se borra la duplicada y se renombra el
-- resto.
delete from student_medals m
 using game_renames r, student_medals otra
 where m.game_name = r.old_name
   and otra.student_email = m.student_email
   and otra.game_name = r.new_name;

update student_medals m
   set game_name = r.new_name
  from game_renames r
 where m.game_name = r.old_name;

commit;
