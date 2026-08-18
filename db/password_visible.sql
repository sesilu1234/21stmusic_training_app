-- =====================================================================
-- Contraseñas visibles en la tabla `students`
-- =====================================================================
-- Para poder crear alumnos a mano desde el editor de Supabase escribiendo
-- la contraseña tal cual, sin generar ningún hash.
--
-- Ejecutar entero una vez sobre la base de datos que ya existe.
-- =====================================================================

begin;

alter table students
  add column if not exists password text;

-- Las dos cuentas de ejemplo, ahora legibles.
update students set password = 'guitarra2026'  where username = 'alumno';
update students set password = 'metronomo2026' where username = 'profe';

-- Fuera el hash: la app ya no lo mira.
alter table students drop column if exists password_hash;

comment on column students.password is
  'Contraseña en texto plano, escrita a mano por el profesor.';

comment on table students is
  'Alumnos con acceso. Google: se valida el email. Usuario/contraseña: username + password.';

commit;
