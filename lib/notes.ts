// Apuntes de estudio del alumno.
//
// Estaban en el localStorage del navegador, así que se perdían al cambiar de
// aparato. Ahora van en la cuenta, en `student_notes`.
//
// Aqui solo estan los limites y el tipo, que necesitan los dos lados: el
// formulario para no dejar escribir de mas y el servidor para comprobarlo.
// Leer y escribir en la base de datos esta en `lib/notesDb.ts`, que es de
// servidor. Estaban juntos, y por eso la pantalla de apuntes se descargaba la
// libreria de Supabase entera sin usarla para nada.


/** Tope de notas por alumno. Son apuntes, no un blog. */
export const MAX_NOTES = 200;

/** Tope por nota, para que una pegada de portapapeles no reviente la pantalla. */
export const MAX_NOTE_LENGTH = 2000;

export interface Note {
  id: string;
  text: string;
  createdAt: string;
  /** Igual que `createdAt` mientras no se haya retocado. */
  updatedAt: string;
}
