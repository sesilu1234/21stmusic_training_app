import { getSupabaseAdmin } from "./supabaseAdmin";

const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();

export const CONTACT_LIMITS = {
  email: { max: 120 },
  message: { min: 10, max: 1000 },
} as const;

/**
 * Los motivos del formulario. La lista vive aquí y no en el componente para que
 * el servidor pueda comprobar que lo que llega es uno de estos: el navegador se
 * puede trucar, y un `select` no es una validación.
 */
export const CONTACT_TOPICS = [
  "Un fallo",
  "Una sugerencia",
  "Duda de un ejercicio",
  "Clases",
  "Otra cosa",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const isContactTopic = (value: string): value is ContactTopic =>
  (CONTACT_TOPICS as readonly string[]).includes(value);

export interface ContactMessage {
  email: string;
  message: string;
  topic?: ContactTopic;
}

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
