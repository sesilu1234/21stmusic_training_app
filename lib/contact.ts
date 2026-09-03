// Los motivos, los limites y los tipos del formulario de contacto.
//
// Client-safe: lo importan el formulario y el desplegable. Guardar el mensaje
// en la base de datos esta en `lib/contactDb.ts`. Estaban en el mismo archivo,
// y como el formulario importa de aqui, el navegador acababa descargandose el
// acceso a Supabase para no usarlo.

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

/**
 * Lo que la acción de enviar devuelve al formulario.
 *
 * Vive aquí y no al lado de la acción por una regla de Next que no perdona: un
 * archivo con `"use server"` solo puede exportar funciones asíncronas. Tenía el
 * estado inicial exportado desde `app/contact/actions.ts`, y como es un objeto,
 * el módulo entero fallaba al cargarse — el formulario contestaba "A server
 * error occurred" antes de llegar a ejecutar nada. Los tipos sí se pueden
 * exportar desde allí (desaparecen al compilar), pero el objeto no.
 */
export interface ContactState {
  status: "idle" | "ok" | "error";
  error?: string;
  /** Se devuelve para no vaciar el formulario cuando algo falla. */
  values?: { email: string; message: string; topic?: string };
}

export const initialContactState: ContactState = { status: "idle" };

/** Lo que se guarda de un mensaje. El tipo es compartido; guardarlo, no. */
export interface ContactMessage {
  email: string;
  message: string;
  topic?: ContactTopic;
}
