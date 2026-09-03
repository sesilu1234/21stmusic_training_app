// Modos de "construir": sale el nombre de un acorde o de una escala y hay que
// montarlo tecla a tecla en el piano.
//
// Los dos comparten mecánica —acumular pulsaciones hasta completar— pero se
// corrigen distinto: un acorde suena a la vez, así que da igual en qué orden
// pulses sus notas; una escala se toca en orden, y ahí el orden es la mitad
// del ejercicio.

import { CHORD_WORDS } from "./chordNames";

export interface Shape {
  id: string;
  /** Cómo se llama detrás de la nota: "mayor", "m7"… */
  label: string;
  /** Intervalos desde la fundamental, en semitonos. */
  intervals: number[];
}

export type BuildKind = "acorde" | "escala";

export interface BuildLevel {
  slug: string;
  kind: BuildKind;
  title: string;
  desc: string;
  badge: string;
  shapes: Shape[];
  /** true = la fundamental puede caer en tecla negra. */
  blackRoots: boolean;
}

// --- Acordes ----------------------------------------------------------
// Los nombres salen de lib/chordNames.ts, que es donde se decide cómo se
// escribe un acorde en toda la app ("Do Mayor", "Mi dim", "Fa aug"). Las
// escalas de más abajo no: "mayor" ahí es la escala, no el acorde.
const MAYOR: Shape = { id: "M", label: CHORD_WORDS.MAYOR, intervals: [0, 4, 7] };
const MENOR: Shape = { id: "m", label: CHORD_WORDS.MENOR, intervals: [0, 3, 7] };
const DIM: Shape = { id: "dim", label: CHORD_WORDS.DISMINUIDO, intervals: [0, 3, 6] };
const AUG: Shape = { id: "aug", label: CHORD_WORDS.AUMENTADO, intervals: [0, 4, 8] };

const MAJ7: Shape = { id: "maj7", label: "maj7", intervals: [0, 4, 7, 11] };
const M7: Shape = { id: "m7", label: "m7", intervals: [0, 3, 7, 10] };
const DOM7: Shape = { id: "7", label: "7", intervals: [0, 4, 7, 10] };
const M7B5: Shape = { id: "m7b5", label: "m7b5", intervals: [0, 3, 6, 10] };

// --- Escalas ----------------------------------------------------------
const ESC_MAYOR: Shape = {
  id: "mayor",
  label: "mayor",
  intervals: [0, 2, 4, 5, 7, 9, 11, 12],
};
const ESC_MENOR: Shape = {
  id: "menor",
  label: "menor natural",
  intervals: [0, 2, 3, 5, 7, 8, 10, 12],
};
const ESC_ARMONICA: Shape = {
  id: "armonica",
  label: "menor armónica",
  intervals: [0, 2, 3, 5, 7, 8, 11, 12],
};
const PENTA_MAYOR: Shape = {
  id: "penta-M",
  label: "pentatónica mayor",
  intervals: [0, 2, 4, 7, 9, 12],
};
const PENTA_MENOR: Shape = {
  id: "penta-m",
  label: "pentatónica menor",
  intervals: [0, 3, 5, 7, 10, 12],
};
const BLUES: Shape = {
  id: "blues",
  label: "blues",
  intervals: [0, 3, 5, 6, 7, 10, 12],
};

export const CHORD_BUILD_LEVELS: BuildLevel[] = [
  {
    slug: "mayor-menor",
    kind: "acorde",
    title: "Mayores y menores",
    desc: "Las dos tríadas de siempre, desde tecla blanca.",
    badge: "Nivel 1",
    shapes: [MAYOR, MENOR],
    blackRoots: false,
  },
  {
    slug: "triadas",
    kind: "acorde",
    title: "Las cuatro tríadas",
    desc: "Se añaden el disminuido y el aumentado.",
    badge: "Nivel 2",
    shapes: [MAYOR, MENOR, DIM, AUG],
    blackRoots: false,
  },
  {
    slug: "cuatriadas",
    kind: "acorde",
    title: "Cuatríadas",
    desc: "Cuatro notas: maj7, m7, dominante y semidisminuido.",
    badge: "Nivel 3",
    shapes: [MAJ7, M7, DOM7, M7B5],
    blackRoots: false,
  },
  {
    slug: "todo",
    kind: "acorde",
    title: "Todo, desde donde sea",
    desc: "Tríadas y cuatríadas, y también desde teclas negras.",
    badge: "Nivel 4",
    shapes: [MAYOR, MENOR, DIM, AUG, MAJ7, M7, DOM7, M7B5],
    blackRoots: true,
  },
];

export const SCALE_BUILD_LEVELS: BuildLevel[] = [
  {
    slug: "mayor",
    kind: "escala",
    title: "La escala mayor",
    desc: "Ocho notas subiendo, desde tecla blanca. T T S T T T S.",
    badge: "Nivel 1",
    shapes: [ESC_MAYOR],
    blackRoots: false,
  },
  {
    slug: "mayor-menor",
    kind: "escala",
    title: "Mayor y menor",
    desc: "La mayor y la menor natural, que solo se diferencian en tres notas.",
    badge: "Nivel 2",
    shapes: [ESC_MAYOR, ESC_MENOR],
    blackRoots: false,
  },
  {
    slug: "pentatonicas",
    kind: "escala",
    title: "Pentatónicas",
    desc: "Cinco notas y una octava: las de los solos de toda la vida.",
    badge: "Nivel 3",
    shapes: [PENTA_MAYOR, PENTA_MENOR, BLUES],
    blackRoots: false,
  },
  {
    slug: "todo",
    kind: "escala",
    title: "Todas, desde donde sea",
    desc: "Se añade la menor armónica, y la fundamental puede ser negra.",
    badge: "Nivel 4",
    shapes: [ESC_MAYOR, ESC_MENOR, ESC_ARMONICA, PENTA_MAYOR, PENTA_MENOR, BLUES],
    blackRoots: true,
  },
];

export const findChordBuildLevel = (slug: string) =>
  CHORD_BUILD_LEVELS.find((level) => level.slug === slug);

export const findScaleBuildLevel = (slug: string) =>
  SCALE_BUILD_LEVELS.find((level) => level.slug === slug);

export interface BuildQuestion {
  root: number;
  shape: Shape;
}

/** Semitonos absolutos que forman la respuesta, de grave a agudo. */
export const buildNotes = (question: BuildQuestion) =>
  question.shape.intervals.map((interval) => question.root + interval);

const WHITE_ROOTS = [0, 2, 4, 5, 7, 9, 11];

/**
 * Preguntas de una partida.
 *
 * La fundamental se queda en la primera octava: la forma más larga llega a la
 * octava de arriba (+12), así que todo cabe en el teclado de dos octavas.
 */
export const buildQuiz = (level: BuildLevel, count: number): BuildQuestion[] => {
  const roots = level.blackRoots
    ? Array.from({ length: 12 }, (_, index) => index)
    : WHITE_ROOTS;

  const questions: BuildQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const previous = questions[i - 1];

    let root = roots[Math.floor(Math.random() * roots.length)];
    let shape = level.shapes[Math.floor(Math.random() * level.shapes.length)];

    for (
      let attempt = 0;
      attempt < 8 &&
      previous &&
      previous.root === root &&
      previous.shape.id === shape.id;
      attempt++
    ) {
      root = roots[Math.floor(Math.random() * roots.length)];
      shape = level.shapes[Math.floor(Math.random() * level.shapes.length)];
    }

    questions.push({ root, shape });
  }

  return questions;
};
