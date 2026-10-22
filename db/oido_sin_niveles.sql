-- =====================================================================
-- Intervalos al oído: se quitan los niveles
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Desde octubre de 2026 "Intervalos al oído" no tiene niveles: lo normal son
-- todos los intervalos, y es lo único que se guarda. Elegir a mano cuáles
-- practicar es práctica y no se guarda. Las partidas nuevas se guardan como
-- "intervalos" (melódicos) y "armonico".
--
--   · Nivel 4 (todos hasta la octava) es exactamente lo de ahora, así que
--     sus partidas pasan a "intervalos" / "armonico", con sus medallas.
--
--   · Niveles 1 a 3 eran menos intervalos. Ya no son ningún nivel, así que
--     pierden el nivel (como se hizo en intervalos_separados.sql). No se
--     borran: siguen en el historial y en las partidas del alumno, pero no
--     cuentan como nivel ni dan medalla. Si se quedaran con el nivel, el panel
--     los enseñaría como seis niveles más del modo, sin forma de completarlos.
-- =====================================================================

begin;

update game_attempts
   set level_slug = 'intervalos'
 where game_name = 'Intervalos al oído'
   and level_slug = 'intervalos/nivel-4';

update game_attempts
   set level_slug = 'armonico'
 where game_name = 'Intervalos al oído'
   and level_slug = 'armonico/nivel-4';

update game_attempts
   set level_slug = null
 where game_name = 'Intervalos al oído'
   and level_slug in (
     'intervalos/nivel-1', 'intervalos/nivel-2', 'intervalos/nivel-3',
     'armonico/nivel-1',   'armonico/nivel-2',   'armonico/nivel-3'
   );

commit;
