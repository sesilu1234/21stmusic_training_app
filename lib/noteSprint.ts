// Lectura de notas contrarreloj: ristras de cinco notas en el pentagrama, una
// detrás de otra, con el reloj en marcha.
//
// Son niveles de "Lectura de notas" (cuelgan de /play/lectura-notas/…), pero
// con su propia lista porque se juegan distinto: no son una nota suelta y no
// entran en los exámenes.
//
// Se guardan como cualquier partida, contando NOTAS: 10 ristras de 5 son 50
// preguntas, y solo cuentan las leídas bien antes de que se acabe el tiempo.
// Así la medalla de siempre (pleno en partida de 24 o más) es justo "las diez
// ristras sin un fallo y a tiempo", sin tocar la base de datos.

import { NATURAL_ANSWERS, noteLabel, notesFor } from "./noteReading";
import type { Clef } from "./staff";

export interface NoteSprintLevel {
  slug: string;
  title: string;
  desc: string;
  badge: string;
  /** "ambas": cada ristra en una clave. */
  clef: Clef | "ambas";
  /** El tiempo para las diez ristras. */
  seconds: number;
}

/** Cuántas ristras y de cuántas notas. */
export const SPRINT_RUNS = 10;
export const SPRINT_LENGTH = 5;

export const NOTE_SPRINT_LEVELS: NoteSprintLevel[] = [
  {
    slug: "contrarreloj-sol",
    title: "Contrarreloj · Clave de sol",
    desc: "Diez ristras de cinco notas en 50 segundos. Leer de corrido, no nota a nota.",
    badge: "Contrarreloj",
    clef: "sol",
    seconds: 50,
  },
  {
    slug: "contrarreloj-fa",
    title: "Contrarreloj · Clave de fa",
    desc: "Lo mismo en clave de fa, con 60 segundos.",
    badge: "Contrarreloj",
    clef: "fa",
    seconds: 60,
  },
  {
    slug: "contrarreloj-ambas",
    title: "Contrarreloj · Ambas claves",
    desc: "Cada ristra en una clave: primero mirar cuál toca. 60 segundos.",
    badge: "Contrarreloj",
    clef: "ambas",
    seconds: 60,
  },
];

export const findNoteSprintLevel = (slug: string) =>
  NOTE_SPRINT_LEVELS.find((level) => level.slug === slug);

/** Los botones: las siete naturales. */
export const SPRINT_ANSWERS = NATURAL_ANSWERS;

export interface SprintRun {
  clef: Clef;
  /** Semitonos, 0 = Do central. */
  notes: number[];
  /** Cómo se llama cada una, en orden. */
  labels: string[];
}

/**
 * Las ristras de una partida. Dentro de una ristra no se repite la misma nota
 * dos veces seguidas: parecería que el botón no ha hecho caso.
 */
export const buildSprint = (level: NoteSprintLevel): SprintRun[] =>
  Array.from({ length: SPRINT_RUNS }, () => {
    const clef: Clef = level.clef === "ambas" ? (Math.random() < 0.5 ? "sol" : "fa") : level.clef;
    const pool = notesFor(clef, false);
    const notes: number[] = [];
    while (notes.length < SPRINT_LENGTH) {
      const note = pool[Math.floor(Math.random() * pool.length)];
      if (note !== notes[notes.length - 1]) notes.push(note);
    }
    return {
      clef,
      notes,
      labels: notes.map((semitone) => noteLabel({ semitone, clef, preferFlat: false })),
    };
  });
