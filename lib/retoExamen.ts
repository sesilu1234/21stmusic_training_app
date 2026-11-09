// El reto diario: por dentro es un examen del día. Aquí lo que sirve en los
// dos lados (pintar y contar); lo de base de datos está en lib/exams/daily.ts.
//
// Sustituye a los retos Eco y Pulso, que se quedan aparcados (lib/reto.ts).

import { daysBetween } from "./madrid";

export const DAILY_EXAM = {
  name: "Reto diario",
  launch: "2026-10-27",
  questions: 15,
  href: "/reto",
} as const;

/** Las secciones del reto, en el orden en que salen. Todas con las mismas preguntas. */
export const DAILY_SECTIONS = ["Lenguaje musical", "Instrumento", "Oído"] as const;
export const DAILY_SECTION_SIZE = 5;

/** Nº del examen de un día: el del lanzamiento es el #1. */
export const dailyExamNumber = (day: string) => daysBetween(DAILY_EXAM.launch, day) + 1;

/** "1:42", "45 s". */
export const durationLabel = (ms: number) => {
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total} s`;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/** "8/10". */
export const correctLabel = (correct: number, total: number) => `${correct}/${total}`;

export interface DailyRankRow {
  rank: number;
  name: string;
  correct: number;
  total: number;
  /** Lo que tardó, sumando pregunta a pregunta. Desempata. */
  ms: number;
  isMe: boolean;
}

/** El ranking de un día, ya listo para pintar (portada y cuadro de honor). */
export interface DailyDayBoard {
  day: string;
  number: number;
  /** Todos los que salen en el cuadro, en orden. */
  top: DailyRankRow[];
  /** Cuántos lo acabaron ese día. */
  players: number;
  /** Puesto de quien mira (aunque no salga). 0 = no lo acabó. */
  myRank: number;
}

/** Cómo le va hoy a alguien, para la tarjeta de la portada y de /reto. */
export type DailyExamStatus =
  | { kind: "guest" }
  | { kind: "todo" }
  /** Empezado y sin acabar: al volver sigue donde iba. */
  | { kind: "doing"; answered: number; total: number }
  | { kind: "done"; correct: number; total: number; ms: number; rank: number; listed: boolean };
