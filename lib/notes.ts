// Apuntes de estudio del alumno.
//
// Estaban en el localStorage del navegador, así que se perdían al cambiar de
// aparato. Ahora van en la cuenta, en `student_notes`.
//
// Esto es de servidor: usa la service role key de Supabase, igual que
// lib/progress.ts. No se importa desde un componente de cliente.

import { getSupabaseAdmin } from "./supabaseAdmin";

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

interface NoteRow {
  id: string;
  text: string;
  created_at: string;
  updated_at: string;
}

const toNote = (row: NoteRow): Note => ({
  id: row.id,
  text: row.text,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** Las columnas que necesita la pantalla, en un solo sitio. */
const COLUMNS = "id, text, created_at, updated_at";

export const listNotes = async (email: string): Promise<Note[]> => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("student_notes")
    .select(COLUMNS)
    .eq("student_email", email)
    .order("created_at", { ascending: false })
    .limit(MAX_NOTES);

  if (error) throw error;
  return (data ?? []).map(toNote);
};

/** Devuelve la nota creada, para poder pintarla sin recargar la lista entera. */
export const createNote = async (email: string, text: string): Promise<Note> => {
  const clean = text.trim().slice(0, MAX_NOTE_LENGTH);
  if (!clean) throw new Error("Nota vacía");

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("student_notes")
    .insert({ student_email: email, text: clean })
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return toNote(data as NoteRow);
};

/**
 * Cambia el texto de una nota.
 *
 * `updated_at` se pone a mano en vez de con un disparador en la base de datos:
 * es una columna sola y así queda a la vista de quien lea esto, sin tener que
 * ir a mirar qué disparadores hay puestos.
 */
export const updateNote = async (
  email: string,
  id: string,
  text: string,
): Promise<Note> => {
  const clean = text.trim().slice(0, MAX_NOTE_LENGTH);
  if (!clean) throw new Error("Nota vacía");

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("student_notes")
    .update({ text: clean, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("student_email", email)
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return toNote(data as NoteRow);
};

/**
 * El `student_email` va en el WHERE a propósito: el id de la nota viene del
 * navegador, así que sin esa condición cualquiera podría borrar —o cambiar— la
 * nota de otro mandando un id ajeno. Por eso está también en `updateNote`.
 */
export const deleteNote = async (email: string, id: string): Promise<void> => {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("student_notes")
    .delete()
    .eq("id", id)
    .eq("student_email", email);

  if (error) throw error;
};
