-- =====================================================================
-- Mensajes del formulario de contacto (/contact)
--
-- El motivo que elige el usuario NO tiene columna propia: llega como primera
-- línea del propio mensaje, entre corchetes ("[Un fallo]"). Se hizo así para no
-- tener que migrar la tabla antes de desplegar. Si algún día interesa filtrar
-- por motivo, se añade una columna `topic text` y se cambia `saveContactMessage`
-- en lib/contact.ts — pero hay que correr el ALTER ANTES de desplegar el código.
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- El formulario es público: lo puede rellenar alguien sin cuenta. Si quien
-- escribe tiene la sesión abierta, se guarda además de qué alumno viene.

create table if not exists contact_messages (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  message       text not null,
  -- Alumno que lo envió, si estaba identificado. Null si escribió de fuera.
  student_email text references students(email) on update cascade on delete set null,
  -- Para ir marcando lo que ya está contestado desde el editor de Supabase.
  handled       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- El formulario tenía un campo "nombre" que se quitó. Si ya creaste la tabla
-- con la versión anterior, esto deja de exigirlo en vez de romper los envíos.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_name = 'contact_messages' and column_name = 'name'
  ) then
    alter table contact_messages alter column name drop not null;
  end if;
end $$;

create index if not exists contact_messages_created_idx
  on contact_messages (created_at desc);

create index if not exists contact_messages_pending_idx
  on contact_messages (handled, created_at desc);

-- La app escribe siempre desde el servidor con la service role key, así que
-- RLS activo y sin políticas = nadie puede leer esto desde el navegador.
alter table contact_messages enable row level security;
