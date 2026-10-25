// Cómo avanza un examen. De servidor.
//
// Reglas, y dónde se cumple cada una:
//
//   · Una pregunta cada vez y sin la respuesta: `publicQuestion` quita
//     `answer` y `solution`, y la ruta de las imágenes.
//   · El tiempo lo mide el servidor: la hora en que se le sirve cada pregunta
//     queda en `current_started_at`. Lo que diga el reloj del navegador da
//     igual; contestar tarde es fallar.
//   · Si recarga, sigue donde iba y con el tiempo que le quedaba: la hora no se
//     vuelve a poner si ya la tenía.
//   · Si se va y vuelve cuando ya se le acabó el tiempo, esa pregunta cuenta
//     como fallo y pasa a la siguiente (`serve` las va cerrando).
//   · Sin corrección durante el examen: lo que se devuelve al contestar es la
//     pregunta siguiente, no si la anterior estaba bien.

import "server-only";

import { rngFor, shuffleWith } from "../seeded";
import { isCorrect } from "./check";
import {
  createAttempt,
  markQuestionShown,
  reloadAttempt,
  saveAnswer,
  type Attempt,
  type Exam,
} from "./db";
import type { ExamQuestion, GivenAnswer, PromptPart, PublicQuestion } from "./types";

/** Margen por la red: lo que tarda en llegar la respuesta no es culpa del alumno. */
const GRACE_MS = 2500;

export type ExamView =
  | { phase: "question"; question: PublicQuestion }
  | { phase: "done"; correct: number; total: number };

/** La pregunta tal y como la ve el alumno: barajada para él y sin respuesta. */
const publicQuestion = (
  exam: Exam,
  attempt: Attempt,
  question: ExamQuestion,
  remainingMs: number,
): PublicQuestion => {
  const original = attempt.order[attempt.current];

  const prompt: PromptPart[] = question.prompt.map((part) =>
    part.type === "image"
      ? { type: "image", fretboard: part.fretboard, alt: part.alt }
      : part,
  );

  const input =
    question.input.type === "choice"
      ? {
          type: "choice" as const,
          options: shuffleWith(
            question.input.options,
            rngFor(`examen:${exam.seed}:opciones:${attempt.studentEmail}:${original}`),
          ),
        }
      : question.input;

  return {
    index: attempt.current,
    total: exam.questionCount,
    title: question.title,
    prompt,
    input,
    limitMs: question.limitMs,
    remainingMs: Math.max(0, Math.round(remainingMs)),
  };
};

const questionAt = (exam: Exam, attempt: Attempt) =>
  exam.questions[attempt.order[attempt.current]];

/** Lo que manda el navegador, recortado: nadie necesita 10.000 notas. */
const cleanGiven = (given: unknown): GivenAnswer => {
  if (given === null || given === undefined) return null;
  if (typeof given === "string") return given.slice(0, 300);
  if (Array.isArray(given)) {
    const list = given.slice(0, 400);
    return list.every((item) => typeof item === "number")
      ? (list as number[]).filter((item) => Number.isFinite(item))
      : list.map((item) => String(item).slice(0, 20));
  }
  return null;
};

/**
 * Lo que toca enseñar ahora: la pregunta en juego, o el final.
 *
 * Por el camino cierra las preguntas que se quedaron sin contestar y sin
 * tiempo, y apunta la hora de la que se sirve por primera vez.
 */
export const serve = async (exam: Exam, start: Attempt): Promise<ExamView> => {
  let attempt: Attempt | null = start;

  for (let guard = 0; guard < exam.questionCount + 5 && attempt; guard++) {
    if (attempt.finishedAt || attempt.current >= exam.questionCount) {
      return { phase: "done", correct: attempt.correctCount, total: exam.questionCount };
    }

    const question = questionAt(exam, attempt);

    if (!attempt.currentStartedAt) {
      // Puede que otra pestaña la haya servido a la vez: entonces vale su hora.
      attempt = (await markQuestionShown(attempt)) ?? (await reloadAttempt(attempt));
      continue;
    }

    const elapsed: number = Date.now() - new Date(attempt.currentStartedAt).getTime();
    if (elapsed <= question.limitMs + GRACE_MS) {
      return { phase: "question", question: publicQuestion(exam, attempt, question, question.limitMs - elapsed) };
    }

    // Sin tiempo y sin contestar: fallo, y a la siguiente.
    attempt =
      (await saveAnswer(
        attempt,
        { q: attempt.order[attempt.current], given: null, correct: false, timedOut: true, ms: elapsed },
        exam.questionCount,
      )) ?? (await reloadAttempt(attempt));
  }

  throw new Error("No se ha podido seguir con el examen.");
};

/** Empezar (o seguir, si ya lo había empezado). */
export const begin = async (exam: Exam, email: string, existing: Attempt | null) =>
  serve(exam, existing ?? (await createAttempt(exam, email)));

/**
 * Contestar la pregunta `position` (en el orden del alumno).
 *
 * Si no es la que está en juego —una respuesta repetida, una pestaña vieja—
 * no se guarda nada y se devuelve lo que toca ahora.
 */
export const answer = async (
  exam: Exam,
  attempt: Attempt,
  position: number,
  rawGiven: unknown,
): Promise<ExamView> => {
  if (attempt.finishedAt || position !== attempt.current || !attempt.currentStartedAt) {
    return serve(exam, attempt);
  }

  const question = questionAt(exam, attempt);
  const elapsed = Date.now() - new Date(attempt.currentStartedAt).getTime();
  const timedOut = elapsed > question.limitMs + GRACE_MS;
  const given = timedOut ? null : cleanGiven(rawGiven);

  const saved =
    (await saveAnswer(
      attempt,
      {
        q: attempt.order[attempt.current],
        given,
        correct: !timedOut && isCorrect(question, given),
        timedOut: timedOut || given === null,
        ms: elapsed,
      },
      exam.questionCount,
    )) ?? (await reloadAttempt(attempt));

  if (!saved) throw new Error("No se ha podido seguir con el examen.");
  return serve(exam, saved);
};

/** La ruta de la imagen de la pregunta en juego, para /e/[code]/imagen. */
export const currentImage = (exam: Exam, attempt: Attempt) => {
  if (attempt.finishedAt || attempt.current >= exam.questionCount) return null;
  const part = questionAt(exam, attempt).prompt.find((item) => item.type === "image");
  return part?.type === "image" ? (part.src ?? null) : null;
};
