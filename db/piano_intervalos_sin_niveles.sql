-- =====================================================================
-- Piano · Toca el intervalo y Reconoce el intervalo: se quitan los niveles
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Desde noviembre de 2026 estos dos modos tienen un solo nivel, los doce
-- intervalos ("cromaticos"), y es lo único que se guarda. Elegir a mano cuáles
-- practicar es práctica y no se guarda. Igual que en oido_sin_niveles.sql.
--
--   · "cromaticos" (nivel 4) es exactamente lo de ahora: no se toca, sus
--     partidas y medallas siguen valiendo.
--
--   · "basicos", "terceras-y-quintas" y "diatonicos" (niveles 1 a 3) eran
--     menos intervalos. Ya no son ningún nivel, así que pierden el nivel. No
--     se borran: siguen en el historial y cuentan en el total del modo, pero
--     no salen como nivel ni dan medalla. Si se quedaran con el nivel, el
--     panel de progreso los enseñaría como tres niveles más del modo, sin
--     forma de completarlos.
-- =====================================================================

begin;

update game_attempts
   set level_slug = null
 where game_name in (
         'Toca el intervalo', 'Reconoce el intervalo',
         -- Los nombres de antes de rename_games.sql, por si queda alguna.
         'Piano: tocar el intervalo', 'Piano: reconocer el intervalo'
       )
   and level_slug in ('basicos', 'terceras-y-quintas', 'diatonicos');

commit;
