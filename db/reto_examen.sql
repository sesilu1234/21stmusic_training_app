-- =====================================================================
-- Examen del día: el reto diario pasa a ser un examen de preguntas sueltas
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- Necesita db/examenes.sql pasado antes.
-- =====================================================================
-- El examen del día es un examen más, en la misma tabla `exams`, con dos
-- diferencias:
--
--   · No lo crea nadie: creator_email va a null y daily_day lleva el día de
--     Madrid al que pertenece. Uno por día (unique).
--   · Lo crea la primera persona que abre /reto ese día. Si dos lo
--     crean a la vez, la segunda inserción choca con el unique y las dos se
--     quedan con el primero: todos hacen el mismo.
--
-- Los intentos van en exam_attempts como los de cualquier examen: el ranking
-- del día sale de ahí (aciertos y, a igualdad, menos tiempo).
-- =====================================================================

begin;

alter table exams alter column creator_email drop not null;

alter table exams add column if not exists daily_day date;

create unique index if not exists exams_daily_day_idx on exams (daily_day);

-- O lo ha creado alguien, o es el del día. Nunca las dos cosas ni ninguna.
alter table exams drop constraint if exists exams_creator_or_daily;
alter table exams
  add constraint exams_creator_or_daily check ((creator_email is null) = (daily_day is not null));

comment on column exams.daily_day is
  'Solo en el examen del día: el día de Madrid al que pertenece. Entonces creator_email es null.';

commit;
