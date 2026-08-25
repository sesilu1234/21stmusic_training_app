// Niveles del modo "Notas en el teclado": sale una nota en el pentagrama y hay
// que pulsarla en el piano.
//
// La octava cuenta: no vale tocar el Do que sea, hay que tocar EL Do que está
// escrito. Por eso cada nivel lleva su ventana de teclado, elegida para que
// todas las notas del nivel caigan dentro.

import type { Clef } from "./staff";

export interface PianoNoteLevel {
  slug: string;
  title: string;
  desc: string;
  badge: string;
  clef: Clef;
  /** Semitono más grave del teclado que se dibuja. Múltiplo de 12. */
  keyboardFrom: number;
  keyboardOctaves: number;
  /** Semitonos que pueden salir preguntados. */
  notes: number[];
}

/** Las siete naturales de una octava a partir de `from`. */
const naturals = (from: number, octaves: number) =>
  Array.from({ length: octaves }, (_, octave) =>
    [0, 2, 4, 5, 7, 9, 11].map((offset) => from + octave * 12 + offset),
  ).flat();

/** Todos los semitonos de un tramo. */
const chromatic = (from: number, octaves: number) =>
  Array.from({ length: octaves * 12 }, (_, index) => from + index);

export const PIANO_NOTE_LEVELS: PianoNoteLevel[] = [
  {
    slug: "sol-naturales",
    title: "Clave de sol",
    desc: "Las notas naturales, de Do central para arriba. Por aquí se empieza.",
    badge: "Nivel 1",
    clef: "sol",
    keyboardFrom: 0,
    keyboardOctaves: 2,
    notes: naturals(0, 2),
  },
  {
    slug: "sol-alteraciones",
    title: "Sol con alteraciones",
    desc: "Se añaden sostenidos y bemoles: hay que mirar bien qué hay delante.",
    badge: "Nivel 2",
    clef: "sol",
    keyboardFrom: 0,
    keyboardOctaves: 2,
    notes: chromatic(0, 2),
  },
  {
    slug: "fa-naturales",
    title: "Clave de fa",
    desc: "Las naturales dos octavas más abajo. Cambia todo de sitio.",
    badge: "Nivel 3",
    clef: "fa",
    keyboardFrom: -24,
    keyboardOctaves: 2,
    notes: naturals(-24, 2),
  },
  {
    slug: "fa-alteraciones",
    title: "Fa con alteraciones",
    desc: "La clave de fa entera, con sostenidos y bemoles.",
    badge: "Nivel 4",
    clef: "fa",
    keyboardFrom: -24,
    keyboardOctaves: 2,
    notes: chromatic(-24, 2),
  },
];

export const findPianoNoteLevel = (slug: string) =>
  PIANO_NOTE_LEVELS.find((level) => level.slug === slug);

export interface PianoNoteQuestion {
  semitone: number;
  /** Cómo se escribe si es tecla negra: true = bemol, false = sostenido. */
  preferFlat: boolean;
}

/** Preguntas de una partida, sin repetir la misma dos veces seguidas. */
export const buildPianoNoteQuiz = (
  level: PianoNoteLevel,
  count: number,
): PianoNoteQuestion[] => {
  const questions: PianoNoteQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const previous = questions[i - 1]?.semitone;
    const pool =
      level.notes.length > 1
        ? level.notes.filter((note) => note !== previous)
        : level.notes;

    questions.push({
      semitone: pool[Math.floor(Math.random() * pool.length)],
      // Las teclas negras salen unas veces como sostenido y otras como bemol,
      // que es como se las va a encontrar en una partitura de verdad.
      preferFlat: Math.random() < 0.5,
    });
  }

  return questions;
};
