"use server";

import { currentStudent } from "@/lib/session";
import { cleanExamInput, createExam } from "@/lib/exams/db";
import { ExamError } from "@/lib/exams/generate";

/**
 * Publicar un examen. El creador sale de la sesión; del navegador solo llegan
 * el título y los bloques, y se vuelven a comprobar aquí.
 */
export const publishExam = async (
  title: string,
  blocks: { mode: string; level: string | null; count: number; seconds: number }[],
): Promise<{ ok: true; id: string; code: string } | { ok: false; error: string }> => {
  const student = await currentStudent();
  if (!student) return { ok: false, error: "Entra en tu cuenta para crear un examen." };

  try {
    const clean = cleanExamInput(title, blocks);
    const exam = await createExam({ creatorEmail: student.email, ...clean });
    return { ok: true, ...exam };
  } catch (error) {
    if (error instanceof ExamError) return { ok: false, error: error.message };
    console.error("[examen] no se ha podido publicar:", error);
    return { ok: false, error: "No se ha podido publicar. Inténtalo otra vez." };
  }
};
