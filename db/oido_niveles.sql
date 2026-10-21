-- =====================================================================
-- Intervalos al oído: las partidas de antes de los niveles pasan al nivel 4
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Hasta octubre de 2026 "Intervalos al oído" no tenía niveles: melódicos y
-- armónicos sacaban todos los intervalos, y sus partidas se guardaban con el
-- nivel "intervalos" o "armonico" a secas. Ahora hay cuatro niveles y se
-- guardan como "intervalos/nivel-1" … "armonico/nivel-4".
--
-- Las partidas viejas no son de ningún nivel nuevo, así que el panel las
-- enseñaba aparte, como dos niveles más, y contaban en la media del modo.
-- Pero lo que se jugaba entonces es exactamente el nivel 4 de ahora (todos
-- hasta la octava, con el tritono y las 7ªs), así que se pasan ahí. No se
-- borra nada: las partidas y las medallas que se ganaron siguen, solo que en
-- el nivel que les toca.
-- =====================================================================

begin;

update game_attempts
   set level_slug = 'intervalos/nivel-4'
 where game_name = 'Intervalos al oído'
   and level_slug = 'intervalos';

update game_attempts
   set level_slug = 'armonico/nivel-4'
 where game_name = 'Intervalos al oído'
   and level_slug = 'armonico';

commit;
