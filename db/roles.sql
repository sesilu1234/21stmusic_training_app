-- =====================================================================
-- Roles: quién puede ver el alumnario
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- El alumnario (/alumno) se abría con una clave compartida en la URL. Era un
-- apaño para no montar permisos, y traía dos problemas: la clave se queda en el
-- historial del navegador y no se sabe quién ha mirado qué. Ahora es un rol de
-- la propia cuenta: quien entra ya está identificado.
--
-- Tres valores y no más. `alumno` es el de todo el mundo; los otros dos son la
-- excepción y se dan a mano desde aquí.
-- =====================================================================

begin;

alter table students
  add column if not exists role text not null default 'alumno';

-- El check se recrea siempre, para poder cambiar la lista de roles en el futuro
-- pasando este archivo otra vez. Sin el drop, volver a ejecutarlo fallaría.
alter table students drop constraint if exists students_role_check;
alter table students
  add constraint students_role_check check (role in ('admin', 'profesor', 'alumno'));

comment on column students.role is
  'admin | profesor | alumno. Los dos primeros ven el alumnario; admin además ve el muestrario.';

-- Los tres administradores. Por `username` y en minúsculas: es lo que el
-- profesor escribe a mano al dar de alta, y el índice único de la tabla ya
-- trata el usuario sin distinguir mayúsculas.
update students
   set role = 'admin'
 where lower(username) in ('jaume', 'minerva', 'ulises');

-- Los demás, explícitamente a alumno: si alguien quedó con un valor raro de una
-- prueba anterior, el check de arriba lo habría rechazado.
update students
   set role = 'alumno'
 where role is null;

commit;

-- Para dar de alta a un profesor más adelante:
--   update students set role = 'profesor' where username = 'quien-sea';
