-- =====================================================================
-- Mensajes del formulario de contacto (/contacto)
-- Ejecutar entero en el SQL editor de Supabase.
-- =====================================================================
-- El formulario es público: lo puede rellenar alguien sin cuenta. Si quien
-- escribe tiene la sesión abierta, se guarda además de qué alumno viene.

create table if not exists contact_messages (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  message       text not null,
  -- Alumno que lo envió, si estaba identificado. Null si escribió de fuera.
  student_email text references students(email) on update cascade on delete set null,
  -- Para ir marcando lo que ya está contestado desde el editor de Supabase.
  handled       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists contact_messages_created_idx
  on contact_messages (created_at desc);

create index if not exists contact_messages_pending_idx
  on contact_messages (handled, created_at desc);

-- La app escribe siempre desde el servidor con la service role key, así que
-- RLS activo y sin políticas = nadie puede leer esto desde el navegador.
alter table contact_messages enable row level security;
