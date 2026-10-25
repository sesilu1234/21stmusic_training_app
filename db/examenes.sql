-- =====================================================================
-- Exámenes: los crea cualquiera con sesión y los hace cualquiera con sesión
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Dos tablas y nada más:
--
--   exams          el examen: título, bloques y las preguntas ya sorteadas,
--                  con sus respuestas. Las preguntas se congelan al publicar:
--                  si mañana cambia un modo de juego, el examen sigue siendo
--                  el mismo para quien llegue tarde.
--
--   exam_attempts  el intento de cada alumno: en qué pregunta va, cuándo le
--                  salió (el tiempo se mide aquí, no en el navegador) y lo que
--                  ha contestado. Una fila por alumno y examen: un intento.
--
-- Las respuestas buenas viven en `exams.questions` y nunca salen hacia el
-- navegador de quien hace el examen (ver lib/exams/runner.ts).
--
-- No toca game_attempts: un examen no da medallas ni cuenta para el progreso.
-- =====================================================================

begin;

create table if not exists exams (
  id             uuid primary key default gen_random_uuid(),
  -- 12 caracteres sin 0/O/1/I, en mayúsculas. Es lo que se comparte.
  code           text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{12}$'),
  creator_email  text not null references students(email) on update cascade on delete cascade,
  title          text not null check (length(btrim(title)) between 1 and 120),
  -- Semilla del sorteo. Con ella + el alumno se baraja el orden de cada uno.
  seed           bigint not null,
  -- Lo que pidió el creador: [{ mode, level, count }].
  blocks         jsonb not null,
  -- Las preguntas ya sorteadas, con su respuesta. Solo para el servidor.
  questions      jsonb not null,
  question_count integer not null check (question_count > 0),
  closed_at      timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists exams_creator_idx
  on exams (creator_email, created_at desc);

comment on table exams is
  'Exámenes. `questions` lleva las respuestas: nunca se manda al navegador de quien lo hace.';

create table if not exists exam_attempts (
  id                 uuid primary key default gen_random_uuid(),
  exam_id            uuid not null references exams(id) on delete cascade,
  student_email      text not null references students(email) on update cascade on delete cascade,
  -- El orden en que le salen las preguntas a este alumno (índices de exams.questions).
  question_order     integer[] not null,
  -- Por qué pregunta va, contando en su orden. Igual a question_count = terminado.
  current            integer not null default 0,
  -- Cuándo se le enseñó la pregunta actual. Null = todavía no se le ha servido.
  current_started_at timestamptz,
  -- [{ q, given, correct, timedOut, ms }], en el orden en que las contestó.
  answers            jsonb not null default '[]'::jsonb,
  correct_count      integer not null default 0,
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  unique (exam_id, student_email)
);

create index if not exists exam_attempts_student_idx
  on exam_attempts (student_email, started_at desc);

comment on table exam_attempts is
  'Un intento por alumno y examen. El tiempo de cada pregunta se mide con current_started_at.';

alter table exams         enable row level security;
alter table exam_attempts enable row level security;

commit;
