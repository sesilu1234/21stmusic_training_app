-- =====================================================================
-- "Intervalos" se parte en dos: pentagrama (lenguaje) y mástil (guitarra)
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Hasta octubre de 2026 "Intervalos" era un menú con dos pantallas, y sus
-- partidas se guardaban con el nivel "pentagrama" o "diapason":
--
--   · Pentagrama pasa a ser el modo entero (/play/intervalos), sin niveles.
--     Sus partidas se quedan en "Intervalos" y pierden el nivel, que ya no
--     existe: si lo conservaran, el panel lo enseñaría como un nivel suelto.
--
--   · Diapasón pasa a ser su propio modo en Guitarra, "Intervalos en el
--     mástil" (/play/diapason_intervalos), también sin niveles. Sus partidas
--     se cambian de modo, con sus medallas.
--
-- No se borra nada: cada partida acaba en el modo que le toca.
-- =====================================================================

begin;

update game_attempts
   set game_name = 'Intervalos en el mástil',
       level_slug = null
 where game_name = 'Intervalos'
   and level_slug = 'diapason';

update game_attempts
   set level_slug = null
 where game_name = 'Intervalos'
   and level_slug = 'pentagrama';

commit;
