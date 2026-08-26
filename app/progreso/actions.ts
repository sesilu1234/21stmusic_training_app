"use server";

import { currentStudent } from "@/lib/session";
import { gameFromPath } from "@/lib/games";
import { recordAttempt, type SaveResult } from "@/lib/progress";

const NOT_SAVED: SaveResult = { saved: false, newMedal: false, streak: 0 };

/**
 * Guarda la partida que acaba de terminar.
 *
 * La llama el modal de fin de partida, que es por donde pasan todos los modos.
 * En vez de que cada juego diga cómo se llama —quince sitios que se pueden
 * quedar desfasados—, se saca de la ruta: /play/piano/notas/sol-naturales es el
 * modo "Notas en el teclado", nivel "sol-naturales".
 *
 * Sin sesión no se guarda nada y no pasa nada: jugar sin cuenta sigue
 * funcionando igual, solo que no queda registro.
 */
export const saveAttempt = async (input: {
  pathname: string;
  correct: number;
  total: number;
}): Promise<SaveResult> => {
  const student = await currentStudent();
  if (!student) return NOT_SAVED;

  const found = gameFromPath(String(input.pathname ?? ""));
  if (!found) return NOT_SAVED;

  try {
    return await recordAttempt({
      email: student.email,
      gameName: found.game.name,
      levelSlug: found.levelSlug,
      correct: Number(input.correct),
      total: Number(input.total),
    });
  } catch {
    // Que se caiga la base de datos no puede estropear el final de la partida:
    // el alumno ve su resultado igual, simplemente no queda guardado.
    return NOT_SAVED;
  }
};
