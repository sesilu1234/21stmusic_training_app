-- =====================================================================
-- 21st Century Music — esquema limpio (ejecutar entero en Supabase SQL)
-- =====================================================================
--
--   ###################################################################
--   #  NO EJECUTAR ESTO EN LA BASE DE DATOS BUENA.                    #
--   #                                                                 #
--   #  Es el arranque desde cero, de cuando se limpió el esquema, y   #
--   #  más abajo hace DROP TABLE de game_attempts y student_medals.   #
--   #  Volver a pasarlo hoy borra el progreso y las medallas de       #
--   #  todos los alumnos, y además se lleva por delante la columna    #
--   #  level_slug que añade db/progress.sql, así que a partir de ese  #
--   #  momento la app tampoco podría guardar partidas nuevas.         #
--   #                                                                 #
--   #  Para una instalación nueva, el orden es:                       #
--   #    1) schema.sql   2) progress.sql   3) student_notes.sql       #
--   #    4) profile_fields.sql   5) contact_messages.sql              #
--   #    6) rename_games.sql                                          #
--   #                                                                 #
--   #  Sobre una base de datos que ya está en marcha: solo los        #
--   #  archivos nuevos, nunca este.                                   #
--   ###################################################################
-- =====================================================================
-- Deja SOLO 3 tablas:
--   students        -> quién puede entrar (Google y/o usuario+contraseña)
--   game_attempts   -> una fila por partida terminada
--   student_medals  -> un logro por juego y alumno (pleno de aciertos)
--
-- Todo lo demás (puntos, ranking, progreso) se calcula desde game_attempts,
-- así que no hace falta guardarlo dos veces.
-- =====================================================================

begin;

-- 1. Fuera las tablas que no usa la app -------------------------------
--    (estaban vacías: academy_periods, student_notes, game_scores,
--     game_attempts, student_medals; student_profiles solo duplicaba
--     el display_name que ya está en allowed_students)
drop table if exists academy_periods cascade;
drop table if exists student_notes cascade;
drop table if exists game_scores cascade;
drop table if exists game_attempts cascade;
drop table if exists student_medals cascade;
drop table if exists student_profiles cascade;

-- 2. students ---------------------------------------------------------
alter table allowed_students rename to students;

alter table students
  add column if not exists username text,
  add column if not exists password text;

alter table students drop column if exists password_hash;

comment on column students.password is
  'Contraseña en texto plano, escrita a mano por el profesor.';

update students
   set display_name = coalesce(nullif(trim(display_name), ''), split_part(email, '@', 1));

alter table students alter column display_name set not null;
alter table students alter column is_active set default true;

-- Un usuario no puede repetirse (mayúsculas/minúsculas incluidas).
create unique index if not exists students_username_key
  on students (lower(username));

comment on table students is
  'Alumnos con acceso. Google: se valida el email. Usuario/contraseña: username + password.';

-- 3. game_attempts ----------------------------------------------------
create table game_attempts (
  id            uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on update cascade on delete cascade,
  game_name     text not null,
  correct       integer not null check (correct >= 0),
  total         integer not null check (total > 0),
  created_at    timestamptz not null default now()
);

create index game_attempts_student_idx on game_attempts (student_email, created_at desc);
create index game_attempts_game_idx    on game_attempts (game_name);

-- 4. student_medals ---------------------------------------------------
create table student_medals (
  id            uuid primary key default gen_random_uuid(),
  student_email text not null references students(email) on update cascade on delete cascade,
  game_name     text not null,
  created_at    timestamptz not null default now(),
  unique (student_email, game_name)
);

comment on table student_medals is
  'Logro = terminar un modo de juego con TODOS los ejercicios correctos. Uno por juego y alumno.';

-- 5. Seguridad --------------------------------------------------------
-- La app entra siempre con la service role key desde el servidor, así que
-- RLS activo sin políticas = nadie puede leer/escribir desde el navegador.
alter table students       enable row level security;
alter table game_attempts  enable row level security;
alter table student_medals enable row level security;

-- 6. La primera cuenta ------------------------------------------------
--
--    AQUI NO SE ESCRIBE NINGUNA CONTRASENA. Este repositorio es publico, y
--    una contrasena escrita en un archivo del repositorio es una contrasena
--    que ya no vale: cualquiera que lo abra puede entrar. Aqui hubo dos
--    cuentas de ejemplo con sus claves en claro, y estuvieron publicadas.
--
--    Para dar de alta la primera cuenta, ejecutar esto A MANO en el editor
--    SQL de Supabase cambiando lo que va en mayusculas, y no guardarlo:
--
--      insert into students (email, display_name, username, password, is_active)
--      values ('quien@21stcm.local', 'Nombre', 'usuario', 'CONTRASENA', true)
--      on conflict (email) do update
--        set username     = excluded.username,
--            password     = excluded.password,
--            display_name = excluded.display_name,
--            is_active    = true;
--
--    Las siguientes se dan de alta igual, o desde el editor de tablas.
--    Las contrasenas se guardan en claro a proposito (ver lib/passwords.ts):
--    el profesor tiene que poder leerselas al alumno. Justo por eso no pueden
--    estar ademas en el codigo.

commit;
