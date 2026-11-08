// El examen del día (db/reto_examen.sql). De servidor.
//
// Cada día, tres secciones de cinco preguntas, iguales para todos. Se
// juega con el mismo motor que cualquier examen (lib/exams/runner.ts): una
// pregunta cada vez, el tiempo lo mide el servidor y no se corrige hasta el
// final. Un intento por alumno.
//
// El examen lo crea la primera persona que lo abre ese día. Desde ahí queda
// congelado: si a media mañana cambia un modo, el de hoy sigue siendo el mismo
// para todos.

import "server-only";

import { randomInt } from "node:crypto";
import { listHonorStudents } from "../students";
import { madridDay } from "../madrid";
import { rngFor, shuffleWith } from "../seeded";
import {
  DAILY_EXAM,
  DAILY_SECTIONS,
  DAILY_SECTION_SIZE,
  dailyExamNumber,
  type DailyDayBoard,
  type DailyExamStatus,
  type DailyRankRow,
} from "../retoExamen";
import { generateBlock } from "./generate";
import { getAttempt, getDailyExam, listAttemptsForExam, saveDailyExam, type Attempt, type Exam } from "./db";
import type { ExamBlock, ExamQuestion } from "./types";

/**
 * De dónde salen las preguntas: tres secciones de cinco, siempre en el mismo
 * orden (DAILY_SECTIONS). Niveles de fácil a medio: es un reto de cada día,
 * no la prueba final.
 *
 * `seconds` es lo que hay para contestar; lo que tarda en sonar (oído, ritmo)
 * va aparte y se suma solo.
 */
interface Option {
  mode: string;
  levels: (string | null)[];
  seconds: number;
}

const option = (mode: string, levels: (string | null)[], seconds: number): Option => ({ mode, levels, seconds });

/**
 * Lenguaje musical: siempre un intervalo y un acorde (leído en el pentagrama o
 * construido), y tres más al azar entre todo lo de lenguaje. Fuera armaduras y
 * escalas, que no gustan, y el ritmo, que es el modo más delicado: depende de
 * dar golpes a tiempo y en algunas pantallas va a tirones.
 */
const INTERVALO: Option[] = [
  option("/play/intervalos", ["sol-naturales", "fa-naturales", "sol-alteraciones"], 20),
  option("/play/construye-intervalos", [null], 30),
];

const ACORDE: Option[] = [
  option("/play/acordes-pentagrama", ["nombrar/mayores-menores", "nombrar/triadas"], 20),
  option("/play/construye-acordes", ["mayor-menor", "triadas"], 30),
];

const LECTURA: Option[] = [
  option("/play/lectura-notas", ["sol-naturales", "fa-naturales", "ambas-naturales", "sol-alteraciones"], 15),
];

/** De dónde salen las tres de lenguaje al azar. */
const LENGUAJE_LIBRE: Option[] = [...LECTURA, ...INTERVALO, ...ACORDE];

/** Instrumento: cinco cosas distintas entre piano y guitarra (3 + 2, o 2 + 3). */
const PIANO: Option[] = [
  option("/play/piano/notas", ["sol-naturales", "fa-naturales"], 15),
  option("/play/piano/intervalos", ["cromaticos"], 20),
  option("/play/piano/reconocer-intervalos", ["cromaticos"], 20),
  option("/play/piano/acordes", ["mayor-menor"], 30),
  option("/play/piano/escalas", ["mayor"], 45),
];

const GUITARRA: Option[] = [
  option("/play/diapason", [null], 20),
  option("/play/diapason_intervalos", [null], 20),
  option("/play/diapason_acordes", ["triadas"], 20),
];

/** Oído: siempre intervalo melódico, intervalo armónico, acorde, progresión y dictado. */
const OIDO: Option[][] = [
  [option("/play/oido", ["intervalos"], 20)],
  [option("/play/oido", ["armonico"], 20)],
  [option("/play/oido/acordes", ["mayor-menor", "triadas"], 20)],
  [option("/play/oido/progresiones", ["i-iv-v"], 30)],
  [option("/play/oido/dictado", ["tres-arriba", "tres-abajo"], 30)],
];

/**
 * Sortea las preguntas de hoy, sección a sección. Si un modo falla al generar
 * (un nivel que ya no existe), se prueba otra forma del mismo hueco o, en
 * instrumento, otro modo: el reto del día no se puede quedar sin salir.
 */
const draw = async (seed: number) => {
  const rng = rngFor(`examen-del-dia:${seed}`);
  const blocks: ExamBlock[] = [];
  const questions: ExamQuestion[] = [];
  const [lenguaje, instrumento, oido] = DAILY_SECTIONS;

  const tryOption = async (entry: Option, section: string) => {
    const block: ExamBlock = {
      mode: entry.mode,
      level: entry.levels[Math.floor(rng() * entry.levels.length)],
      count: 1,
      seconds: entry.seconds,
      section,
    };
    try {
      const generated = await generateBlock(block, rngFor(`examen-del-dia:${seed}:${blocks.length}`));
      if (!generated.length) return false;
      blocks.push(block);
      questions.push(...generated);
      return true;
    } catch (error) {
      console.warn(`[examen del día] ${entry.mode} no ha podido dar pregunta:`, error);
      return false;
    }
  };

  /** Un hueco detrás de otro; en cada uno, la primera de sus formas que salga. */
  const fillSlots = async (slots: Option[][], section: string) => {
    for (const slot of slots) {
      for (const entry of shuffleWith(slot, rng)) {
        if (await tryOption(entry, section)) break;
      }
    }
  };

  /** Hasta `count` modos de la lista, sin repetir ninguno ya puesto. */
  const used = new Set<Option>();
  const fillFrom = async (candidates: Option[], count: number, section: string) => {
    let got = 0;
    for (const entry of candidates) {
      if (got >= count) break;
      if (used.has(entry)) continue;
      used.add(entry);
      if (await tryOption(entry, section)) got++;
    }
    return got;
  };

  await fillSlots([INTERVALO, ACORDE], lenguaje);
  // Las tres libres: cualquiera de lenguaje, puede repetir modo (sale otra pregunta).
  for (let free = 0, tries = 0; free < DAILY_SECTION_SIZE - 2 && tries < 12; tries++) {
    if (await tryOption(LENGUAJE_LIBRE[Math.floor(rng() * LENGUAJE_LIBRE.length)], lenguaje)) free++;
  }

  const piano = shuffleWith(PIANO, rng);
  const guitarra = shuffleWith(GUITARRA, rng);
  const pianoCount = rng() < 0.5 ? 3 : 2;
  let got = await fillFrom(piano, pianoCount, instrumento);
  got += await fillFrom(guitarra, DAILY_SECTION_SIZE - got, instrumento);
  if (got < DAILY_SECTION_SIZE) await fillFrom([...piano, ...guitarra], DAILY_SECTION_SIZE - got, instrumento);

  await fillSlots(OIDO, oido);

  if (!questions.length) throw new Error("El examen del día se ha quedado sin preguntas.");
  return { blocks, questions };
};

/** El examen de un día. Si todavía no existe, lo crea. */
export const getOrCreateDailyExam = async (day: string): Promise<Exam> => {
  const existing = await getDailyExam(day);
  if (existing) return existing;

  // Semilla al azar, no sacada del día: así nadie puede calcular mañana las
  // preguntas de mañana. Si dos lo crean a la vez, se queda el primero.
  const seed = randomInt(2 ** 31);
  const { blocks, questions } = await draw(seed);
  return saveDailyExam({
    day,
    title: `${DAILY_EXAM.name} #${dailyExamNumber(day)}`,
    seed,
    blocks,
    questions,
  });
};

/**
 * Lo que ha tardado: pregunta a pregunta, nunca más que su tiempo. Si se fue
 * a mitad y volvió por la tarde, esa pregunta cuenta como agotada, no como
 * cinco horas.
 */
export const attemptMs = (exam: Exam, attempt: Attempt) =>
  attempt.answers.reduce((sum, answer) => {
    const limit = exam.questions[answer.q]?.limitMs ?? answer.ms;
    return sum + Math.max(0, Math.min(answer.ms, limit));
  }, 0);

/**
 * Los intentos de un examen del día. Los de un día ya pasado no cambian, así
 * que se guardan un rato: el de ayer sale en la portada en cada visita.
 */
const PAST_CACHE_MS = 10 * 60 * 1000;
const pastAttempts = new Map<string, { at: number; attempts: Attempt[] }>();

const attemptsOf = async (exam: Exam) => {
  const past = exam.dailyDay !== null && exam.dailyDay < madridDay();
  if (!past) return listAttemptsForExam(exam.id);
  const cached = pastAttempts.get(exam.id);
  if (cached && Date.now() - cached.at < PAST_CACHE_MS) return cached.attempts;
  const attempts = await listAttemptsForExam(exam.id);
  pastAttempts.clear(); // Solo hace falta el de ayer: que no crezca.
  pastAttempts.set(exam.id, { at: Date.now(), attempts });
  return attempts;
};

export interface DailyBoard {
  /** Todos los que salen en el cuadro, en orden. Cada vista corta lo que quiera enseñar. */
  top: DailyRankRow[];
  /** Puesto de quien mira entre los que salen (aunque él no salga). 0 = sin acabar. */
  myRank: number;
  /** Cuántos lo han acabado hoy. */
  players: number;
}

/** Cuántos se enseñan al acabar el reto (/reto). */
export const DAILY_TOP = 10;

/**
 * El ranking del examen de un día: más aciertos y, a igualdad, menos tiempo.
 * Solo cuentan los acabados. Como en el resto de rankings, en la tabla solo
 * salen quienes salen en el cuadro de honor; a quien se ha quitado se le dice
 * qué puesto tendría.
 */
export const getDailyBoard = async (exam: Exam, viewerEmail: string | null): Promise<DailyBoard> => {
  const [attempts, listed] = await Promise.all([attemptsOf(exam), listHonorStudents()]);
  const names = new Map(listed.map((student) => [student.email, student.displayName.trim()]));

  const finished = attempts
    .filter((attempt) => attempt.finishedAt)
    .map((attempt) => ({ email: attempt.studentEmail, correct: attempt.correctCount, ms: attemptMs(exam, attempt) }));

  const better = (a: { correct: number; ms: number }, b: { correct: number; ms: number }) =>
    b.correct - a.correct || a.ms - b.ms;

  // Mismo puesto solo con los mismos aciertos y el mismo segundo.
  const sameScore = (a: { correct: number; ms: number }, b: { correct: number; ms: number }) =>
    a.correct === b.correct && Math.round(a.ms / 1000) === Math.round(b.ms / 1000);

  const shown = finished
    .filter((entry) => names.has(entry.email))
    .sort((a, b) => better(a, b) || names.get(a.email)!.localeCompare(names.get(b.email)!, "es"));

  const ranked: DailyRankRow[] = [];
  shown.forEach((entry, index) => {
    const previous = ranked[index - 1];
    ranked.push({
      rank: previous && sameScore(previous, entry) ? previous.rank : index + 1,
      name: names.get(entry.email)!,
      correct: entry.correct,
      total: exam.questionCount,
      ms: entry.ms,
      isMe: entry.email === viewerEmail,
    });
  });

  const mine = finished.find((entry) => entry.email === viewerEmail);
  const myRank = mine
    ? shown.filter((entry) => entry.email !== viewerEmail && better(entry, mine) < 0 && !sameScore(entry, mine))
        .length + 1
    : 0;

  return { top: ranked, myRank, players: finished.length };
};

/**
 * El ranking de un día para enseñarlo (portada, cuadro de honor). Aquí no se
 * crea el examen: si ese día nadie lo abrió, sale vacío. null si falla.
 */
export const getDayBoard = async (day: string, viewerEmail: string | null): Promise<DailyDayBoard | null> => {
  try {
    const exam = await getDailyExam(day);
    const number = dailyExamNumber(day);
    if (!exam) return { day, number, top: [], players: 0, myRank: 0 };
    const board = await getDailyBoard(exam, viewerEmail);
    return { day, number, ...board };
  } catch (error) {
    console.error(`[examen del día] no se ha podido leer el ranking del ${day}:`, error);
    return null;
  }
};

/**
 * Cómo le va hoy, para las tarjetas. Aquí no se crea el examen: si nadie lo
 * ha abierto todavía, es que está por hacer. Si falla la base de datos, se
 * enseña como por hacer: la tarjeta es una invitación, no un dato crítico.
 */
export const dailyExamStatus = async (
  student: { email: string; showInHonor: boolean } | null,
  day: string,
): Promise<DailyExamStatus> => {
  if (!student) return { kind: "guest" };
  try {
    const exam = await getDailyExam(day);
    if (!exam) return { kind: "todo" };
    const attempt = await getAttempt(exam.id, student.email);
    if (!attempt) return { kind: "todo" };
    if (!attempt.finishedAt) {
      return { kind: "doing", answered: attempt.answers.length, total: exam.questionCount };
    }
    const board = await getDailyBoard(exam, student.email).catch(() => null);
    return {
      kind: "done",
      correct: attempt.correctCount,
      total: exam.questionCount,
      ms: attemptMs(exam, attempt),
      rank: board?.myRank ?? 0,
      listed: student.showInHonor,
    };
  } catch (error) {
    console.error("[examen del día] no se ha podido leer el estado:", error);
    return { kind: "todo" };
  }
};
