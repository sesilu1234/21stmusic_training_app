"use server";

import { currentStudent } from "@/lib/session";
import {
  createNote,
  deleteNote,
  MAX_NOTE_LENGTH,
  type Note,
} from "@/lib/notes";

/**
 * Las notas son de quien las escribe.
 *
 * El email sale SIEMPRE de la sesión del servidor, nunca de lo que mande el
 * navegador: si el cliente pudiera decir de quién es la nota, podría escribir y
 * borrar en la cuenta de otro.
 */

export type NoteResult =
  | { ok: true; note: Note }
  | { ok: false; error: string };

export const addNote = async (text: string): Promise<NoteResult> => {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Entra en tu cuenta para guardar notas." };

  const clean = String(text ?? "").trim();
  if (!clean) return { ok: false, error: "La nota está vacía." };
  if (clean.length > MAX_NOTE_LENGTH) {
    return { ok: false, error: `La nota no puede pasar de ${MAX_NOTE_LENGTH} caracteres.` };
  }

  try {
    return { ok: true, note: await createNote(student.email, clean) };
  } catch {
    return { ok: false, error: "No se ha podido guardar. Inténtalo otra vez." };
  }
};

export const removeNote = async (
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Entra en tu cuenta." };

  try {
    await deleteNote(student.email, String(id ?? ""));
    return { ok: true };
  } catch {
    return { ok: false, error: "No se ha podido borrar. Inténtalo otra vez." };
  }
};
