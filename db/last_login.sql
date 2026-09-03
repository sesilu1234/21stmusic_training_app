-- =====================================================================
-- Última entrada del alumno
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Todo lo demás de esta app se calcula desde `game_attempts`, y esa regla se
-- mantiene. Esto es la excepción justificada: entrar y NO jugar no deja ni una
-- fila en ningún sitio, así que hoy son indistinguibles tres cosas que para
-- quien da la clase son muy distintas:
--
--   · nunca ha entrado          -> la contraseña no le llegó o no sabe usarla
--   · entra pero no juega       -> la cuenta va bien, no practica
--   · entra y juega             -> lo normal
--
-- Las tres se ven hoy igual: "0 partidas". Por eso esto sí se guarda.
--
-- No se guarda el historial de entradas (una tabla `login_events`), a
-- propósito: crecería para siempre, obligaría a hablar de IPs y navegadores en
-- la página de privacidad, y hay alumnos menores de edad. Tres números por
-- alumno responden a la pregunta que se hace de verdad.
-- =====================================================================

begin;

alter table students
  add column if not exists last_login_at  timestamptz,
  add column if not exists first_login_at timestamptz,
  add column if not exists login_count    integer not null default 0;

comment on column students.last_login_at is
  'Última vez que entró. Null = no ha entrado nunca desde que esto existe.';
comment on column students.first_login_at is
  'La primera vez que estrenó la cuenta. No se toca nunca más.';
comment on column students.login_count is
  'Entradas contadas. Solo login de verdad, no cada visita: la sesión va en la cookie.';

-- La función existe porque los tres campos no se pueden escribir con un update
-- normal desde la app: `first_login_at` solo se pone si estaba vacío y
-- `login_count` se incrementa sobre sí mismo, y eso son expresiones de SQL, no
-- valores. Hacerlo con un select + update desde el cliente serían dos viajes y
-- dos entradas a la vez podrían pisarse el contador.
--
-- `security definer` para que corra con los permisos del dueño de la función y
-- no dependa de las políticas de la fila. Se revoca a todo el mundo menos al
-- rol de servicio: esto solo lo llama el servidor al validar la contraseña.
create or replace function record_login(p_email text)
returns void
language sql
security definer
set search_path = public
as $$
  update students
     set last_login_at  = now(),
         first_login_at = coalesce(first_login_at, now()),
         login_count    = coalesce(login_count, 0) + 1
   where email = p_email;
$$;

revoke all on function record_login(text) from public, anon, authenticated;
grant execute on function record_login(text) to service_role;

commit;
