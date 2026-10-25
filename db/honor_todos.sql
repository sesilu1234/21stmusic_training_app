-- =====================================================================
-- Cuadro de honor: todo el mundo sale por defecto, con aviso
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Hasta ahora salir en el cuadro era voluntario (db/honor.sql): la columna
-- empezaba en false y solo la cambiaba el alumno. Se cambia: ahora sale todo
-- el mundo, con su nombre completo, y quien no quiera se quita desde el menú
-- de su usuario ("Aparecer en el cuadro de honor").
--
-- Para que nadie salga sin saberlo, la primera vez que entra se le enseña un
-- aviso en la portada. `honor_notice_seen_at` apunta cuándo lo cerró; mientras
-- esté a null, el aviso sigue saliendo.
--
-- Necesita db/honor.sql pasado antes (es el que crea show_in_honor).
-- =====================================================================

begin;

alter table students
  add column if not exists show_in_honor boolean not null default true;

alter table students
  alter column show_in_honor set default true;

alter table students
  add column if not exists honor_notice_seen_at timestamptz;

-- Todo el que todavía no ha visto el aviso pasa a salir. Quien ya lo vio y se
-- quitó a mano se queda como esté: repetir este archivo no le vuelve a meter.
update students
   set show_in_honor = true
 where honor_notice_seen_at is null;

comment on column students.show_in_honor is
  'true = sale en el cuadro de honor y en los rankings del reto. Por defecto, sí. Solo lo cambia el alumno.';

comment on column students.honor_notice_seen_at is
  'Cuándo cerró el aviso de "sales en el cuadro de honor". Null = todavía no lo ha visto.';

commit;
