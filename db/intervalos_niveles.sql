-- =====================================================================
-- Intervalos (pentagrama): las partidas de antes de los niveles pasan al nivel 3
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Hasta octubre de 2026 "Intervalos" era una pantalla sola, sin niveles, y
-- sus partidas se guardaban sin nivel (level_slug null). Ahora tiene cuatro:
--
--   · sol-naturales      clave de sol, sin alteraciones
--   · fa-naturales       clave de fa, sin alteraciones
--   · sol-alteraciones   clave de sol, con alteraciones
--   · fa-alteraciones    clave de fa, con alteraciones
--
-- Lo que se jugaba entonces era en clave de sol, con la de arriba alterada o
-- no: lo más parecido es el nivel 3, así que se pasan ahí. Sin esto el panel
-- no las contaría en ningún nivel. No se borra nada: las partidas y las
-- medallas que se ganaron siguen, solo que en su nivel.
-- =====================================================================

begin;

update game_attempts
   set level_slug = 'sol-alteraciones'
 where game_name = 'Intervalos'
   and level_slug is null;

commit;
