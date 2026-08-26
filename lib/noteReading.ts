// Niveles del modo "Lectura de notas": sale una nota escrita en el pentagrama y
// hay que decir cómo se llama.
//
// Aquí la octava NO cuenta: la pregunta es "¿qué nota es?", no "¿en qué octava
// está?". Lo que sí cuenta es cómo está escrita: Do# y Reb caen en sitios
// distintos del pentagrama y se contestan distinto.

import { staffPosition, type Clef } from "./staff";

export interface NoteReadingLevel {
  slug: string;
  title: string;
  desc: string;
  badge: string;
  /** "ambas" mezcla claves: cada pregunta trae la suya. */
  clef: Clef | "ambas";
  /** true = salen sostenidos y bemoles, no solo notas naturales. */
  accidentals: boolean;
}

/** Nombre de cada grado diatónico dentro de la octava. */
export const NOTE_LETTERS = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"] as const;

/** Botones que se enseñan: las siete naturales, y si toca, las alteradas. */
export const NATURAL_ANSWERS = [...NOTE_LETTERS];
export const ALTERED_ANSWERS = [
  "Do#",
  "Reb",
  "Re#",
  "Mib",
  "Fa#",
  "Solb",
  "Sol#",
  "Lab",
  "La#",
  "Sib",
];

export const answersFor = (level: NoteReadingLevel) =>
  level.accidentals ? [...NATURAL_ANSWERS, ...ALTERED_ANSWERS] : NATURAL_ANSWERS;

/**
 * Tramo que se lee en cada clave sin pasar de una línea adicional.
 * En semitonos absolutos, 0 = Do central.
 */
const CLEF_NOTES: Record<Clef, { from: number; to: number }> = {
  // De La3 a La5.
  sol: { from: -3, to: 21 },
  // De Do2 a Do4, dos octavas por debajo.
  fa: { from: -24, to: 0 },
};

const isNatural = (semitone: number) =>
  [0, 2, 4, 5, 7, 9, 11].includes(((semitone % 12) + 12) % 12);

/** Semitonos que pueden salir preguntados en una clave. */
const notesFor = (clef: Clef, accidentals: boolean) => {
  const { from, to } = CLEF_NOTES[clef];
  const all = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return accidentals ? all : all.filter(isNatural);
};

export const NOTE_READING_LEVELS: NoteReadingLevel[] = [
  {
    slug: "sol-naturales",
    title: "Clave de sol",
    desc: "Las notas naturales en clave de sol. Por aquí se empieza a leer.",
    badge: "Nivel 1",
    clef: "sol",
    accidentals: false,
  },
  {
    slug: "fa-naturales",
    title: "Clave de fa",
    desc: "Las mismas naturales, pero en clave de fa: cambia todo de sitio.",
    badge: "Nivel 2",
    clef: "fa",
    accidentals: false,
  },
  {
    slug: "ambas-naturales",
    title: "Ambas claves",
    desc: "Sol y fa mezcladas. Lo primero es mirar qué clave hay.",
    badge: "Nivel 3",
    clef: "ambas",
    accidentals: false,
  },
  {
    slug: "sol-alteraciones",
    title: "Sol con alteraciones",
    desc: "Se añaden sostenidos y bemoles: hay que fijarse en lo que hay delante.",
    badge: "Nivel 4",
    clef: "sol",
    accidentals: true,
  },
  {
    slug: "ambas-alteraciones",
    title: "Todo mezclado",
    desc: "Las dos claves y todas las alteraciones. El examen de verdad.",
    badge: "Nivel 5",
    clef: "ambas",
    accidentals: true,
  },
];

export const findNoteReadingLevel = (slug: string) =>
  NOTE_READING_LEVELS.find((level) => level.slug === slug);

export interface NoteReadingQuestion {
  semitone: number;
  clef: Clef;
  /** Cómo se escribe si es tecla negra: true = bemol, false = sostenido. */
  preferFlat: boolean;
}

/** Cómo se llama la nota tal y como está escrita: "Do", "Do#", "Reb"… */
export const noteLabel = (question: NoteReadingQuestion) => {
  const { degree, accidental } = staffPosition(question.semitone, question.preferFlat);
  const letter = NOTE_LETTERS[((degree % 7) + 7) % 7];
  if (accidental === "sharp") return `${letter}#`;
  if (accidental === "flat") return `${letter}b`;
  return letter;
};

/** Preguntas de una partida, sin repetir la misma nota dos veces seguidas. */
export const buildNoteReadingQuiz = (
  level: NoteReadingLevel,
  count: number,
): NoteReadingQuestion[] => {
  const questions: NoteReadingQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const clef: Clef =
      level.clef === "ambas" ? (Math.random() < 0.5 ? "sol" : "fa") : level.clef;

    const notes = notesFor(clef, level.accidentals);
    const previous = questions[i - 1];
    const pool =
      previous && previous.clef === clef && notes.length > 1
        ? notes.filter((note) => note !== previous.semitone)
        : notes;

    questions.push({
      semitone: pool[Math.floor(Math.random() * pool.length)],
      clef,
      // Las teclas negras salen unas veces como sostenido y otras como bemol,
      // que es como se las va a encontrar en una partitura de verdad.
      preferFlat: Math.random() < 0.5,
    });
  }

  return questions;
};
