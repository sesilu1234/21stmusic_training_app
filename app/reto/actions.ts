"use server";

import { currentStudent } from "@/lib/session";
import { madridDay } from "@/lib/madrid";
import { isRetoKind, type RetoKind } from "@/lib/reto";
import { finishEcoPlay, progressEcoPlay, startEcoPlay } from "@/lib/ecoDb";
import { buildEcoResult, type EcoResult } from "@/lib/ecoResult";

/** Solo el de hoy o, si se ha pasado la medianoche jugando, el de ayer. */
const playDay = (day: string) => {
  const yesterday = madridDay(new Date(Date.now() - 24 * 3600 * 1000));
  return day === yesterday ? yesterday : madridDay();
};

/**
 * Empezar la partida de hoy de un reto. Es lo que gasta el intento: si ya
 * había una, no se empieza otra y se devuelve el resultado.
 */
export const startReto = async (
  kind: RetoKind,
): Promise<{ ok: true; day: string } | { ok: false; result?: EcoResult; error?: string }> => {
  if (!isRetoKind(kind)) return { ok: false, error: "No existe ese reto." };
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Entra en tu cuenta para jugar el reto." };

  try {
    const day = madridDay();
    const { play, isNew } = await startEcoPlay(student.email, day, kind);
    if (!isNew) {
      return { ok: false, result: await buildEcoResult(student.email, student.showInHonor, kind, day, play) };
    }
    return { ok: true, day };
  } catch (error) {
    console.error("[reto] no se ha podido empezar:", error);
    return { ok: false, error: "No se ha podido empezar. Inténtalo otra vez." };
  }
};

/**
 * Lo que se lleva hecho, al superar cada ronda. Si falla no pasa nada: es
 * una red por si se corta la partida, y al acabar se manda todo otra vez.
 */
export const progressReto = async (kind: RetoKind, day: string, payload: unknown): Promise<void> => {
  if (!isRetoKind(kind)) return;
  const student = await currentStudent();
  if (!student) return;
  await progressEcoPlay(student.email, playDay(day), kind, payload).catch((error) =>
    console.error("[reto] no se ha podido guardar el avance:", error),
  );
};

/** Terminar: el navegador manda todo lo pulsado y el servidor cuenta. */
export const finishReto = async (
  kind: RetoKind,
  day: string,
  payload: unknown,
): Promise<{ ok: true; result: EcoResult } | { ok: false; error: string }> => {
  if (!isRetoKind(kind)) return { ok: false, error: "No existe ese reto." };
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Entra en tu cuenta para guardar el reto." };

  try {
    const targetDay = playDay(day);
    const play = await finishEcoPlay(student.email, targetDay, kind, payload);
    if (!play) return { ok: false, error: "No hay ninguna partida empezada hoy." };
    return { ok: true, result: await buildEcoResult(student.email, student.showInHonor, kind, targetDay, play) };
  } catch (error) {
    console.error("[reto] no se ha podido guardar:", error);
    return { ok: false, error: "No se ha podido guardar la partida. Inténtalo otra vez." };
  }
};
