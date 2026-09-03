// Guardar un mensaje del formulario de contacto en `contact_messages`.
//
// De servidor: usa la service role key. Los motivos, los limites y los tipos
// estan en `lib/contact.ts`, que si puede importar el formulario. Estaban todos
// en el mismo archivo, y como el formulario importa de alli, el navegador
// acababa descargandose el acceso a Supabase para no usarlo jamas.

import { getSupabaseAdmin } from "./supabaseAdmin";
import { type ContactMessage } from "./contact";

const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();

export const saveContactMessage = async (payload: ContactMessage) => {
  // El motivo va como primera línea del mensaje, no en columna propia. La tabla
  // `contact_messages` no la tiene, y añadirla obligaría a migrar Supabase antes
  // de desplegar: si se despliega el código sin haber corrido el ALTER, el
  // formulario deja de funcionar para todo el mundo. Así no hay ese riesgo, y en
  // el editor de Supabase el motivo se lee igual de bien.
  const message = payload.topic
    ? `[${payload.topic}]\n\n${payload.message}`
    : payload.message;

  const { error } = await getSupabaseAdmin().from("contact_messages").insert({
    email: normalizeEmail(payload.email),
    message,
  });

  if (error) throw new Error(error.message);
};
