"use server";

import {
  CONTACT_LIMITS,
  isContactTopic,
  saveContactMessage,
  type ContactTopic,
} from "@/lib/contact";

export interface ContactState {
  status: "idle" | "ok" | "error";
  error?: string;
  /** Se devuelve para no vaciar el formulario cuando algo falla. */
  values?: { email: string; message: string; topic?: string };
}

export const initialContactState: ContactState = { status: "idle" };

// Un correo válido de verdad no se valida con una regex; esto solo descarta lo
// obviamente mal escrito para que no se pierda la respuesta.
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export async function sendContactMessage(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const rawTopic = String(formData.get("topic") || "").trim();

  // El motivo es una ayuda para clasificar, no un dato que el usuario deba
  // acertar. Si llega algo raro (o no llega nada) se guarda el mensaje sin
  // motivo en vez de devolverle un error por algo que ni ha escrito.
  const topic: ContactTopic | undefined = isContactTopic(rawTopic) ? rawTopic : undefined;

  const values = { email, message, topic };

  // Campo trampa: está oculto, así que un humano nunca lo rellena. Si viene
  // con algo es un bot, y se le contesta que todo bien sin guardar nada.
  if (String(formData.get("website") || "")) return { status: "ok" };

  const fail = (error: string): ContactState => ({ status: "error", error, values });

  if (!email || email.length > CONTACT_LIMITS.email.max || !looksLikeEmail(email)) {
    return fail("Ese correo no parece válido, y sin él no podemos contestarte.");
  }
  if (message.length < CONTACT_LIMITS.message.min) {
    return fail("Cuéntanos un poco más, que con eso no podemos hacer nada.");
  }
  if (message.length > CONTACT_LIMITS.message.max) {
    return fail(`No puede pasar de ${CONTACT_LIMITS.message.max} caracteres.`);
  }

  try {
    await saveContactMessage({ email, message, topic });
  } catch {
    return fail("No se ha podido enviar. Inténtalo otra vez en un momento.");
  }

  return { status: "ok" };
}
