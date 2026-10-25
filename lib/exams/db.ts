// Los exámenes en la base de datos (db/examenes.sql). De servidor.

import "server-only";

import { randomInt } from "node:crypto";
import { getSupabaseAdmin } from "../supabaseAdmin";
import { rngFor } from "../seeded";
import { EXAM_LIMITS } from "./catalog";
import { ExamError, generateBlock } from "./generate";
import type { ExamBlock, ExamQuestion, StoredAnswer } from "./types";

/** Sin 0/O ni 1/I: se dictan y se copian a mano sin confundirse. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 12;

const newCode = () =>
  Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

/** Lo que alguien escribe o pega ("abcd-efgh jklm") en el código de verdad. */
export const normalizeCode = (value: unknown) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export const isValidCode = (code: string) =>
  code.length === CODE_LENGTH && [...code].every((char) => CODE_ALPHABET.includes(char));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Exam {
  id: string;
  code: string;
  creatorEmail: string;
  title: string;
  seed: number;
  blocks: ExamBlock[];
  questions: ExamQuestion[];
  questionCount: number;
  closedAt: string | null;
  createdAt: string;
}

interface ExamRow {
  id: string;
  code: string;
  creator_email: string;
  title: string;
  seed: number;
  blocks: ExamBlock[];
  questions: ExamQuestion[];
  question_count: number;
  closed_at: string | null;
  created_at: string;
}

const EXAM_COLUMNS =
  "id, code, creator_email, title, seed, blocks, questions, question_count, closed_at, created_at";

const toExam = (row: ExamRow): Exam => ({
  id: row.id,
  code: row.code,
  creatorEmail: row.creator_email,
  title: row.title,
  seed: Number(row.seed),
  blocks: row.blocks,
  questions: row.questions,
  questionCount: row.question_count,
  closedAt: row.closed_at,
  createdAt: row.created_at,
});

export interface Attempt {
  id: string;
  examId: string;
  studentEmail: string;
  order: number[];
  current: number;
  currentStartedAt: string | null;
  answers: StoredAnswer[];
  correctCount: number;
  startedAt: string;
  finishedAt: string | null;
}

interface AttemptRow {
  id: string;
  exam_id: string;
  student_email: string;
  question_order: number[];
  current: number;
  current_started_at: string | null;
  answers: StoredAnswer[];
  correct_count: number;
  started_at: string;
  finished_at: string | null;
}

const ATTEMPT_COLUMNS =
  "id, exam_id, student_email, question_order, current, current_started_at, answers, correct_count, started_at, finished_at";

const toAttempt = (row: AttemptRow): Attempt => ({
  id: row.id,
  examId: row.exam_id,
  studentEmail: row.student_email,
  order: row.question_order,
  current: row.current,
  currentStartedAt: row.current_started_at,
  answers: row.answers ?? [],
  correctCount: row.correct_count,
  startedAt: row.started_at,
  finishedAt: row.finished_at,
});

// --- Crear --------------------------------------------------------------

/** Lo que llega del formulario, limpio y comprobado. Lanza ExamError si no vale. */
export const cleanExamInput = (title: unknown, blocks: unknown) => {
  const cleanTitle = String(title ?? "").trim().replace(/\s+/g, " ");
  if (!cleanTitle) throw new ExamError("Ponle un título al examen.");
  if (cleanTitle.length > EXAM_LIMITS.titleMax) {
    throw new ExamError(`El título puede tener como mucho ${EXAM_LIMITS.titleMax} caracteres.`);
  }

  if (!Array.isArray(blocks) || !blocks.length) throw new ExamError("Añade al menos un bloque.");
  if (blocks.length > EXAM_LIMITS.blocksMax) {
    throw new ExamError(`Como mucho ${EXAM_LIMITS.blocksMax} bloques.`);
  }

  const cleanBlocks: ExamBlock[] = blocks.map((block) => {
    const raw = block as Partial<ExamBlock>;
    const count = Math.floor(Number(raw.count));
    if (!Number.isFinite(count) || count < 1 || count > EXAM_LIMITS.perBlockMax) {
      throw new ExamError(`Cada bloque lleva entre 1 y ${EXAM_LIMITS.perBlockMax} preguntas.`);
    }
    const seconds = Number(raw.seconds ?? EXAM_LIMITS.secondsDefault);
    if (!(EXAM_LIMITS.secondsOptions as readonly number[]).includes(seconds)) {
      throw new ExamError("Elige el tiempo por pregunta de cada bloque.");
    }
    return {
      mode: String(raw.mode ?? ""),
      level: raw.level == null || raw.level === "" ? null : String(raw.level),
      count,
      seconds,
    };
  });

  const total = cleanBlocks.reduce((sum, block) => sum + block.count, 0);
  if (total > EXAM_LIMITS.totalMax) {
    throw new ExamError(`Un examen puede tener como mucho ${EXAM_LIMITS.totalMax} preguntas.`);
  }

  return { title: cleanTitle, blocks: cleanBlocks };
};

/**
 * Publica un examen: sortea sus preguntas con una semilla nueva, las congela y
 * le da un código. Cada bloque se sortea con su propia semilla derivada, para
 * que un bloque no dependa de cuántas tiradas gastó el anterior.
 */
export const createExam = async (input: {
  creatorEmail: string;
  title: string;
  blocks: ExamBlock[];
}): Promise<{ id: string; code: string }> => {
  const seed = randomInt(2 ** 31);

  const questions: ExamQuestion[] = [];
  for (const [index, block] of input.blocks.entries()) {
    questions.push(...(await generateBlock(block, rngFor(`examen:${seed}:${index}`))));
  }
  if (!questions.length) throw new ExamError("El examen se ha quedado sin preguntas.");

  // Doce caracteres de un alfabeto de 32 son 2^60 códigos: chocar es casi
  // imposible, pero si pasa se prueba otro.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    const { data, error } = await getSupabaseAdmin()
      .from("exams")
      .insert({
        code,
        creator_email: input.creatorEmail,
        title: input.title,
        seed,
        blocks: input.blocks,
        questions,
        question_count: questions.length,
      })
      .select("id, code")
      .single<{ id: string; code: string }>();

    if (!error && data) return data;
    if (error?.code !== "23505") {
      throw new Error(`No se ha podido guardar el examen: ${error?.message ?? "sin respuesta"}`);
    }
  }
  throw new Error("No se ha podido dar un código al examen.");
};

// --- Leer ---------------------------------------------------------------

export const getExamByCode = async (code: string): Promise<Exam | null> => {
  if (!isValidCode(code)) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("exams")
    .select(EXAM_COLUMNS)
    .eq("code", code)
    .maybeSingle<ExamRow>();
  if (error) throw new Error(`No se ha podido leer el examen: ${error.message}`);
  return data ? toExam(data) : null;
};

export const getExamById = async (id: string): Promise<Exam | null> => {
  if (!UUID.test(id)) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("exams")
    .select(EXAM_COLUMNS)
    .eq("id", id)
    .maybeSingle<ExamRow>();
  if (error) throw new Error(`No se ha podido leer el examen: ${error.message}`);
  return data ? toExam(data) : null;
};

export interface ExamListItem {
  id: string;
  code: string;
  title: string;
  questionCount: number;
  closedAt: string | null;
  createdAt: string;
  /** Intentos terminados. */
  submissions: number;
}

/** Los exámenes que ha creado alguien, con cuántos los han entregado ya. */
export const listExamsByCreator = async (email: string): Promise<ExamListItem[]> => {
  const { data, error } = await getSupabaseAdmin()
    .from("exams")
    .select("id, code, title, question_count, closed_at, created_at")
    .eq("creator_email", email)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<Pick<ExamRow, "id" | "code" | "title" | "question_count" | "closed_at" | "created_at">[]>();
  if (error) throw new Error(`No se han podido leer los exámenes: ${error.message}`);

  const exams = data ?? [];
  const counts = new Map<string, number>();
  if (exams.length) {
    const { data: done, error: doneError } = await getSupabaseAdmin()
      .from("exam_attempts")
      .select("exam_id")
      .in(
        "exam_id",
        exams.map((exam) => exam.id),
      )
      .not("finished_at", "is", null)
      .returns<{ exam_id: string }[]>();
    if (doneError) throw new Error(`No se han podido contar las entregas: ${doneError.message}`);
    (done ?? []).forEach((row) => counts.set(row.exam_id, (counts.get(row.exam_id) ?? 0) + 1));
  }

  return exams.map((exam) => ({
    id: exam.id,
    code: exam.code,
    title: exam.title,
    questionCount: exam.question_count,
    closedAt: exam.closed_at,
    createdAt: exam.created_at,
    submissions: counts.get(exam.id) ?? 0,
  }));
};

export interface DoneItem {
  code: string;
  title: string;
  correct: number;
  total: number;
  finishedAt: string | null;
  startedAt: string;
}

/** Los exámenes que ha hecho (o está haciendo) alguien. */
export const listAttemptsByStudent = async (email: string): Promise<DoneItem[]> => {
  const { data, error } = await getSupabaseAdmin()
    .from("exam_attempts")
    .select("correct_count, started_at, finished_at, exams(code, title, question_count)")
    .eq("student_email", email)
    .order("started_at", { ascending: false })
    .limit(200)
    .returns<
      {
        correct_count: number;
        started_at: string;
        finished_at: string | null;
        exams: { code: string; title: string; question_count: number } | null;
      }[]
    >();
  if (error) throw new Error(`No se han podido leer tus exámenes: ${error.message}`);

  return (data ?? []).flatMap((row) =>
    row.exams
      ? [
          {
            code: row.exams.code,
            title: row.exams.title,
            correct: row.correct_count,
            total: row.exams.question_count,
            finishedAt: row.finished_at,
            startedAt: row.started_at,
          },
        ]
      : [],
  );
};

export const listAttemptsForExam = async (examId: string): Promise<Attempt[]> => {
  const { data, error } = await getSupabaseAdmin()
    .from("exam_attempts")
    .select(ATTEMPT_COLUMNS)
    .eq("exam_id", examId)
    .order("finished_at", { ascending: false, nullsFirst: false })
    .limit(1000)
    .returns<AttemptRow[]>();
  if (error) throw new Error(`No se han podido leer los resultados: ${error.message}`);
  return (data ?? []).map(toAttempt);
};

/** Cerrar: nadie más puede empezarlo. Solo el creador, y no tiene vuelta atrás. */
export const closeExam = async (id: string, creatorEmail: string) => {
  const { error } = await getSupabaseAdmin()
    .from("exams")
    .update({ closed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_email", creatorEmail)
    .is("closed_at", null);
  if (error) throw new Error(`No se ha podido cerrar el examen: ${error.message}`);
};

// --- Intentos -----------------------------------------------------------

export const getAttempt = async (examId: string, email: string): Promise<Attempt | null> => {
  const { data, error } = await getSupabaseAdmin()
    .from("exam_attempts")
    .select(ATTEMPT_COLUMNS)
    .eq("exam_id", examId)
    .eq("student_email", email)
    .maybeSingle<AttemptRow>();
  if (error) throw new Error(`No se ha podido leer tu intento: ${error.message}`);
  return data ? toAttempt(data) : null;
};

/**
 * Empieza el intento de un alumno. Las preguntas salen en el mismo orden para
 * todos, el de los bloques; lo que se baraja por alumno son las opciones (ver
 * lib/exams/runner.ts). El orden se guarda igualmente en el intento, por si
 * algún día vuelve a ser por alumno. Si ya lo había empezado (dos pestañas),
 * devuelve ese.
 */
export const createAttempt = async (exam: Exam, email: string): Promise<Attempt> => {
  const order = exam.questions.map((_, index) => index);

  const { data, error } = await getSupabaseAdmin()
    .from("exam_attempts")
    .insert({ exam_id: exam.id, student_email: email, question_order: order })
    .select(ATTEMPT_COLUMNS)
    .single<AttemptRow>();

  if (!error && data) return toAttempt(data);
  if (error?.code === "23505") {
    const existing = await getAttempt(exam.id, email);
    if (existing) return existing;
  }
  throw new Error(`No se ha podido empezar el examen: ${error?.message ?? "sin respuesta"}`);
};

/**
 * Apunta cuándo se le enseña la pregunta en la que va. Solo si todavía no
 * tenía hora: recargar la página no le da el tiempo otra vez.
 */
export const markQuestionShown = async (attempt: Attempt): Promise<Attempt | null> => {
  const { data, error } = await getSupabaseAdmin()
    .from("exam_attempts")
    .update({ current_started_at: new Date().toISOString() })
    .eq("id", attempt.id)
    .eq("current", attempt.current)
    .is("current_started_at", null)
    .select(ATTEMPT_COLUMNS)
    .maybeSingle<AttemptRow>();
  if (error) throw new Error(`No se ha podido apuntar la pregunta: ${error.message}`);
  return data ? toAttempt(data) : null;
};

/**
 * Guarda la respuesta de la pregunta en la que va y pasa a la siguiente.
 *
 * Va con `current` en el filtro: si dos peticiones contestan la misma
 * pregunta a la vez (doble clic, dos pestañas), solo entra la primera y la
 * otra recibe null. Así no se puede contestar dos veces ni saltarse una.
 */
export const saveAnswer = async (
  attempt: Attempt,
  answer: StoredAnswer,
  total: number,
): Promise<Attempt | null> => {
  const next = attempt.current + 1;
  const finished = next >= total;
  const { data, error } = await getSupabaseAdmin()
    .from("exam_attempts")
    .update({
      answers: [...attempt.answers, answer],
      current: next,
      current_started_at: null,
      correct_count: attempt.correctCount + (answer.correct ? 1 : 0),
      finished_at: finished ? new Date().toISOString() : null,
    })
    .eq("id", attempt.id)
    .eq("current", attempt.current)
    .select(ATTEMPT_COLUMNS)
    .maybeSingle<AttemptRow>();
  if (error) throw new Error(`No se ha podido guardar la respuesta: ${error.message}`);
  return data ? toAttempt(data) : null;
};

export const reloadAttempt = async (attempt: Attempt) => getAttempt(attempt.examId, attempt.studentEmail);
