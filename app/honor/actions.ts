"use server";

import { refresh } from "next/cache";
import { currentStudent } from "@/lib/session";
import { forgetHonorBoard } from "@/lib/honor";
import { markHonorNoticeSeen, setShowInHonor } from "@/lib/students";

/**
 * Salir en el cuadro de honor (y en los rankings del reto), o quitarse.
 *
 * El alumno sale SIEMPRE de la sesión: nadie puede meter ni quitar a otro.
 */
export const toggleHonor = async (
  value: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Entra en tu cuenta para cambiar esto." };

  try {
    await setShowInHonor(student.email, Boolean(value));
    // Quien toca el interruptor ya sabe que existe: fuera el aviso.
    await markHonorNoticeSeen(student.email).catch(() => undefined);
  } catch (error) {
    console.error("[honor] no se ha podido cambiar:", error);
    return { ok: false, error: "No se ha podido guardar. Inténtalo otra vez." };
  }

  // Que se vea ya, no dentro de cinco minutos: quien se quita no puede seguir
  // saliendo, y quien se vuelve a poner quiere verse.
  forgetHonorBoard();
  refresh();
  return { ok: true };
};

/** Cómo está el interruptor, para el menú de usuario (que no lo trae de serie). */
export const getHonorSetting = async (): Promise<{ ok: true; on: boolean } | { ok: false }> => {
  const student = await currentStudent();
  return student ? { ok: true, on: student.showInHonor } : { ok: false };
};

/** "Entendido" en el aviso de la portada. */
export const dismissHonorNotice = async (): Promise<void> => {
  const student = await currentStudent();
  if (!student) return;
  await markHonorNoticeSeen(student.email).catch((error) =>
    console.error("[honor] no se ha podido cerrar el aviso:", error),
  );
  refresh();
};
