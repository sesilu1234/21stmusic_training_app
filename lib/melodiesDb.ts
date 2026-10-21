// Leer y escribir las melodías del alumno en `student_melodies`.
//
// De servidor: usa la service role key. Los límites y el tipo `Melody` están
// en `lib/melodies.ts`, que sí puede importar la pantalla.

import { getSupabaseAdmin } from "./supabaseAdmin";
import { MAX_MELODIES, type Melody } from "./melodies";

interface MelodyRow {
  id: string;
  name: string;
  /** Un `integer[]` de Postgres: los silencios llegan como `null`. */
  notes: (number | null)[];
  bpm: number;
}

const toMelody = (row: MelodyRow): Melody => ({
  id: row.id,
  name: row.name,
  notes: row.notes,
  bpm: row.bpm,
});

const COLUMNS = "id, name, notes, bpm";

/** Las más viejas primero: así una nueva sale al final de la lista, donde se espera. */
export const listMelodies = async (email: string): Promise<Melody[]> => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("student_melodies")
    .select(COLUMNS)
    .eq("student_email", email)
    .order("created_at", { ascending: true })
    .limit(MAX_MELODIES);

  if (error) throw error;
  return (data ?? []).map(toMelody);
};

export const countMelodies = async (email: string): Promise<number> => {
  const supabase = getSupabaseAdmin();

  const { count, error } = await supabase
    .from("student_melodies")
    .select("id", { count: "exact", head: true })
    .eq("student_email", email);

  if (error) throw error;
  return count ?? 0;
};

export const createMelody = async (
  email: string,
  melody: Omit<Melody, "id">,
): Promise<Melody> => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("student_melodies")
    .insert({ student_email: email, ...melody })
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return toMelody(data as MelodyRow);
};

/** El `student_email` va en el WHERE por lo mismo que en las notas: el id viene del navegador. */
export const updateMelody = async (email: string, melody: Melody): Promise<Melody> => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("student_melodies")
    .update({
      name: melody.name,
      notes: melody.notes,
      bpm: melody.bpm,
      updated_at: new Date().toISOString(),
    })
    .eq("id", melody.id)
    .eq("student_email", email)
    .select(COLUMNS)
    .single();

  if (error) throw error;
  return toMelody(data as MelodyRow);
};

export const deleteMelody = async (email: string, id: string): Promise<void> => {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("student_melodies")
    .delete()
    .eq("id", id)
    .eq("student_email", email);

  if (error) throw error;
};
