"use server";

import { refresh } from "next/cache";
import { currentStudent } from "@/lib/session";
import { closeExam, getExamById } from "@/lib/exams/db";

/** Cerrar un examen: solo su creador. Quien estaba a medias puede terminar. */
export const closeExamAction = async (id: string): Promise<{ ok: true } | { ok: false; error: string }> => {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Entra en tu cuenta." };

  try {
    const exam = await getExamById(String(id));
    if (!exam || exam.creatorEmail !== student.email) {
      return { ok: false, error: "Este examen no es tuyo." };
    }
    await closeExam(exam.id, student.email);
  } catch (error) {
    console.error("[examen] no se ha podido cerrar:", error);
    return { ok: false, error: "No se ha podido cerrar. Inténtalo otra vez." };
  }

  refresh();
  return { ok: true };
};
