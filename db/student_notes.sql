-- =====================================================================
-- Apuntes de estudio del alumno
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Las notas vivían en el localStorage del navegador: cambiabas de ordenador (o
-- de móvil a portátil, que es lo normal) y ya no estaban. Como son apuntes que
-- el alumno escribe a mano y no puede recuperar, van a la cuenta.
--
-- `schema.sql` tira una tabla `student_notes` antigua que estaba vacía y que no
-- usaba nadie. Esta es otra, con la estructura que pide la pantalla de notas.
-- =====================================================================

begin;

create table if not exists student_notes (
  id            uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on update cascade on delete cascade,
  text          text not null check (length(btrim(text)) > 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table student_notes is
  'Apuntes de estudio que escribe el alumno. Uno por fila, del más nuevo al más viejo.';

-- La pantalla siempre pregunta lo mismo: "las notas de este alumno, la última
-- primero".
create index if not exists student_notes_student_idx
  on student_notes (student_email, created_at desc);

-- Seguridad: igual que el resto de tablas. La app entra con la service role key
-- desde el servidor, así que RLS activo y sin políticas = el navegador no lo
-- toca nunca por su cuenta.
alter table student_notes enable row level security;

commit;
