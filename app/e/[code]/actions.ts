"use server";

import { currentStudent } from "@/lib/session";
import { getAttempt, getExamByCode, normalizeCode } from "@/lib/exams/db";
import { answer, begin, type ExamView } from "@/lib/exams/runner";

type Result = { ok: true; view: ExamView } | { ok: false; error: string };

/**
 * El alumno sale SIEMPRE de la sesión, y el examen, del código: nada de lo que
 * mande el navegador decide de quién es el intento.
 */
const load = async (code: unknown) => {
  const student = await currentStudent();
  if (!student) return { error: "Entra en tu cuenta para hacer el examen." } as const;
  const exam = await getExamByCode(normalizeCode(code));
  if (!exam) return { error: "No hay ningún examen con ese código." } as const;
  const attempt = await getAttempt(exam.id, student.email);
  return { student, exam, attempt } as const;
};

export const startExam = async (code: string): Promise<Result> => {
  try {
    const loaded = await load(code);
    if ("error" in loaded) return { ok: false, error: loaded.error! };
    const { student, exam, attempt } = loaded;
    // El creador lo ve desde /examenes/[id]/ver: si lo hiciera aquí, saldría en sus resultados.
    if (exam.creatorEmail === student.email) {
      return { ok: false, error: "Es tu examen: ábrelo con «Ver examen» desde sus resultados." };
    }
    // Cerrado: nadie empieza ya. Quien estaba a medias sí puede terminar.
    if (exam.closedAt && !attempt) return { ok: false, error: "Este examen ya está cerrado." };
    return { ok: true, view: await begin(exam, student.email, attempt) };
  } catch (error) {
    console.error("[examen] no se ha podido empezar:", error);
    return { ok: false, error: "No se ha podido empezar. Inténtalo otra vez." };
  }
};

export const answerExam = async (code: string, position: number, given: unknown): Promise<Result> => {
  try {
    const loaded = await load(code);
    if ("error" in loaded) return { ok: false, error: loaded.error! };
    const { exam, attempt } = loaded;
    if (!attempt) return { ok: false, error: "Todavía no has empezado este examen." };
    return { ok: true, view: await answer(exam, attempt, Number(position), given) };
  } catch (error) {
    console.error("[examen] no se ha podido guardar la respuesta:", error);
    return { ok: false, error: "No se ha podido guardar la respuesta. Inténtalo otra vez." };
  }
};
