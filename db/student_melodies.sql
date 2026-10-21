-- =====================================================================
-- Melodías que crea el alumno en Vocalizaciones
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- El alumno toca una melodía en el piano de Vocalizaciones y la guarda para
-- cantarla después, subiendo y bajando como cualquier ejercicio. Va a la
-- cuenta y no al navegador por lo mismo que las notas: si no, al cambiar de
-- aparato ya no estaría.
--
-- `notes` son semitonos desde Do4 (0 = Do central), una por pulso. Los
-- límites (cuántas, de qué nota a qué nota) los pone la app al guardar.
-- =====================================================================

begin;

create table if not exists student_melodies (
  id            uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on update cascade on delete cascade,
  name          text not null check (length(btrim(name)) > 0),
  notes         integer[] not null check (cardinality(notes) between 2 and 64),
  bpm           integer not null default 96 check (bpm between 40 and 200),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table student_melodies is
  'Melodías que el alumno crea en Vocalizaciones. notes = semitonos desde Do4, una por pulso.';

create index if not exists student_melodies_student_idx
  on student_melodies (student_email, created_at);

-- Seguridad: igual que el resto de tablas. La app entra con la service role key
-- desde el servidor, así que RLS activo y sin políticas = el navegador no lo
-- toca nunca por su cuenta.
alter table student_melodies enable row level security;

commit;
