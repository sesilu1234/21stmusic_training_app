"use server";

import { currentStudent } from "@/lib/session";
import {
  MAX_MELODIES,
  MAX_MELODY_NAME,
  MAX_MELODY_NOTES,
  MELODY_HIGHEST,
  MELODY_LOWEST,
  soundingCount,
  type Melody,
} from "@/lib/melodies";
import {
  countMelodies,
  createMelody,
  deleteMelody,
  updateMelody,
} from "@/lib/melodiesDb";

/**
 * Las melodías son de quien las crea: el email sale siempre de la sesión,
 * nunca de lo que mande el navegador (igual que en las notas).
 */

export type MelodyResult =
  | { ok: true; melody: Melody }
  | { ok: false; error: string };

/** Lo que llega del navegador, limpio. null = no vale. */
const clean = (input: { name: unknown; notes: unknown; bpm: unknown }) => {
  const name = String(input.name ?? "").trim().slice(0, MAX_MELODY_NAME);
  const raw = Array.isArray(input.notes) ? input.notes : [];
  const bpm = Math.round(Number(input.bpm));

  // Los silencios del final sobran: después de la última nota ya va la espera
  // entre vueltas, y sumarlos solo alargaría el hueco.
  const notes = [...raw];
  while (notes.length > 0 && notes[notes.length - 1] === null) notes.pop();

  const validNotes =
    notes.length <= MAX_MELODY_NOTES &&
    soundingCount(notes) >= 2 &&
    notes.every(
      (note) =>
        note === null ||
        (Number.isInteger(note) && note >= MELODY_LOWEST && note <= MELODY_HIGHEST),
    );

  if (!name || !validNotes || !(bpm >= 40 && bpm <= 200)) return null;
  return { name, notes: notes as (number | null)[], bpm };
};

export const saveMelody = async (input: {
  id?: string;
  name: string;
  notes: (number | null)[];
  bpm: number;
}): Promise<MelodyResult> => {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Entra en tu cuenta para guardar melodías." };

  const melody = clean(input);
  if (!melody) return { ok: false, error: "Ponle nombre y al menos dos notas (sin contar silencios)." };

  try {
    if (input.id) {
      return {
        ok: true,
        melody: await updateMelody(student.email, { id: String(input.id), ...melody }),
      };
    }

    if ((await countMelodies(student.email)) >= MAX_MELODIES) {
      return { ok: false, error: `Como mucho ${MAX_MELODIES} melodías. Borra alguna antes.` };
    }
    return { ok: true, melody: await createMelody(student.email, melody) };
  } catch {
    return { ok: false, error: "No se ha podido guardar. Inténtalo otra vez." };
  }
};

export const removeMelody = async (
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Entra en tu cuenta." };

  try {
    await deleteMelody(student.email, String(id ?? ""));
    return { ok: true };
  } catch {
    return { ok: false, error: "No se ha podido borrar. Inténtalo otra vez." };
  }
};
