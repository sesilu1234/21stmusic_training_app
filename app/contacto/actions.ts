"use server";

import { CONTACT_LIMITS, saveContactMessage } from "@/lib/contact";
import { safeAuth } from "@/lib/session";

export interface ContactState {
  status: "idle" | "ok" | "error";
  error?: string;
  /** Se devuelve para no vaciar el formulario cuando algo falla. */
  values?: { name: string; email: string; message: string };
}

export const initialContactState: ContactState = { status: "idle" };

// Un correo válido de verdad no se valida con una regex; esto solo descarta lo
// obviamente mal escrito para que no se pierda la respuesta.
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export async function sendContactMessage(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const values = { name, email, message };

  // Campo trampa: está oculto, así que un humano nunca lo rellena. Si viene
  // con algo es un bot, y se le contesta que todo bien sin guardar nada.
  if (String(formData.get("website") || "")) return { status: "ok" };

  const fail = (error: string): ContactState => ({ status: "error", error, values });

  if (name.length < CONTACT_LIMITS.name.min || name.length > CONTACT_LIMITS.name.max) {
    return fail("Escribe tu nombre.");
  }
  if (!email || email.length > CONTACT_LIMITS.email.max || !looksLikeEmail(email)) {
    return fail("Ese correo no parece válido. Lo necesitamos para contestarte.");
  }
  if (message.length < CONTACT_LIMITS.message.min) {
    return fail("Cuéntanos un poco más, que con eso no podemos ayudarte.");
  }
  if (message.length > CONTACT_LIMITS.message.max) {
    return fail(`El mensaje no puede pasar de ${CONTACT_LIMITS.message.max} caracteres.`);
  }

  try {
    const session = await safeAuth();
    await saveContactMessage({
      name,
      email,
      message,
      studentEmail: session?.user?.email ?? null,
    });
  } catch {
    return fail("No se ha podido enviar. Inténtalo otra vez en un momento.");
  }

  return { status: "ok" };
}
