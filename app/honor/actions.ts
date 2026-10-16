"use server";

import { refresh } from "next/cache";
import { currentStudent } from "@/lib/session";
import { forgetHonorBoard } from "@/lib/honor";
import { setShowInHonor } from "@/lib/students";

/**
 * Apuntarse al cuadro de honor, o borrarse.
 *
 * El alumno sale SIEMPRE de la sesión: nadie puede apuntar ni borrar a otro.
 */
export const toggleHonor = async (
  value: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Entra en tu cuenta para cambiar esto." };

  try {
    await setShowInHonor(student.email, Boolean(value));
  } catch (error) {
    console.error("[honor] no se ha podido cambiar:", error);
    return { ok: false, error: "No se ha podido guardar. Inténtalo otra vez." };
  }

  // Que se vea ya, no dentro de cinco minutos: quien se borra no puede seguir
  // saliendo, y quien se apunta quiere verse.
  forgetHonorBoard();
  refresh();
  return { ok: true };
};
