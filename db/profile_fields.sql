-- Campos nuevos para el perfil del alumno.
-- Ejecutar una vez en Supabase SQL.

begin;

alter table students
  add column if not exists academy_since date;

update students
   set academy_since = created_at::date
 where academy_since is null;

create table if not exists student_instruments (
  id            uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on update cascade on delete cascade,
  name          text not null check (length(trim(name)) > 0),
  started_at    date,
  created_at    timestamptz not null default now()
);

create index if not exists student_instruments_student_idx
  on student_instruments (student_email, started_at);

alter table student_instruments enable row level security;

comment on column students.academy_since is
  'Fecha editable desde la que el alumno está en la academia.';

comment on table student_instruments is
  'Instrumentos del alumno y fecha aproximada de inicio.';

commit;
