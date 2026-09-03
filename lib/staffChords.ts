// Acordes escritos en el pentagrama: cómo se construyen, cómo se colocan y qué
// niveles hay.
//
// Aquí no valen los semitonos sueltos. En el papel un acorde no es "estas tres
// teclas": Reb mayor se escribe Reb Fa Lab, y Do# mayor se escribe Do# Mi# Sol#
// aunque suenen igual. Por eso todo se construye con grados diatónicos —una
// tercera son siempre dos grados hacia arriba— y la alteración sale de cuadrar
// el grado con el semitono que toca.

import { CHORD_SUFFIX, CHORD_WORDS } from "./chordNames";
import {
  DEGREE_NAMES,
  degreeInOctave,
  spelledName,
  spelledSemitone,
  type Clef,
  type SpelledNote,
} from "./staff";

export interface ChordTone {
  /** Cuántos grados sube en el papel desde la fundamental. */
  steps: number;
  /** Cuántos semitonos suena por encima de la fundamental. */
  semitones: number;
}

export interface ChordShape {
  id: string;
  /** Cómo se dice detrás de la nota: "mayor", "m7"… */
  label: string;
  /** Cómo se escribe pegado a la nota en el cifrado: "", "m", "maj7"… */
  suffix: string;
  tones: ChordTone[];
}

const triad = (third: number, fifth: number): ChordTone[] => [
  { steps: 0, semitones: 0 },
  { steps: 2, semitones: third },
  { steps: 4, semitones: fifth },
];

const seventh = (third: number, fifth: number, top: number): ChordTone[] => [
  ...triad(third, fifth),
  { steps: 6, semitones: top },
];

// Los nombres que se leen ("Mayor", "dim", "aug") están en lib/chordNames.ts:
// ese archivo es el que manda sobre cómo se escribe un acorde en toda la app.
export const MAYOR: ChordShape = {
  id: "M",
  label: CHORD_WORDS.MAYOR,
  suffix: CHORD_SUFFIX.MAYOR,
  tones: triad(4, 7),
};
export const MENOR: ChordShape = {
  id: "m",
  label: CHORD_WORDS.MENOR,
  suffix: CHORD_SUFFIX.MENOR,
  tones: triad(3, 7),
};
export const DISMINUIDO: ChordShape = {
  id: "dim",
  label: CHORD_WORDS.DISMINUIDO,
  suffix: CHORD_SUFFIX.DISMINUIDO,
  tones: triad(3, 6),
};
export const AUMENTADO: ChordShape = {
  id: "aug",
  label: CHORD_WORDS.AUMENTADO,
  suffix: CHORD_SUFFIX.AUMENTADO,
  tones: triad(4, 8),
};

export const MAJ7: ChordShape = {
  id: "maj7",
  label: "maj7",
  suffix: "maj7",
  tones: seventh(4, 7, 11),
};
export const M7: ChordShape = {
  id: "m7",
  label: "m7",
  suffix: "m7",
  tones: seventh(3, 7, 10),
};
export const DOM7: ChordShape = {
  id: "7",
  label: "7",
  suffix: "7",
  tones: seventh(4, 7, 10),
};
export const M7B5: ChordShape = {
  id: "m7b5",
  label: "m7b5",
  suffix: "m7b5",
  tones: seventh(3, 6, 10),
};

export const TRIADAS = [MAYOR, MENOR, DISMINUIDO, AUMENTADO];
export const CUATRIADAS = [MAJ7, M7, DOM7, M7B5];

/**
 * Los nombres de nota que se pueden contestar. Son los mismos que en Armaduras:
 * las siete naturales y las diez alteradas de uso corriente.
 *
 * Fuera de esta lista quedan Si#, Mib doble y compañía. No es que no existan —
 * es que un acorde que las necesite no es material de este modo, así que se
 * descarta al generar la pregunta.
 */
export const ANSWER_NAMES = [
  "Do",
  "Do#",
  "Reb",
  "Re",
  "Re#",
  "Mib",
  "Mi",
  "Fa",
  "Fa#",
  "Solb",
  "Sol",
  "Sol#",
  "Lab",
  "La",
  "La#",
  "Sib",
  "Si",
];

/** Fundamentales naturales: Do, Re, Mi, Fa, Sol, La, Si. */
const NATURAL_ROOTS: SpelledNote[] = DEGREE_NAMES.map((_, degree) => ({
  degree,
  alter: 0,
}));

/** Fundamentales con alteración, las que se ven de verdad en una partitura. */
const ALTERED_ROOTS: SpelledNote[] = [
  { degree: 0, alter: 1 }, // Do#
  { degree: 1, alter: -1 }, // Reb
  { degree: 2, alter: -1 }, // Mib
  { degree: 3, alter: 1 }, // Fa#
  { degree: 4, alter: 1 }, // Sol#
  { degree: 5, alter: -1 }, // Lab
  { degree: 6, alter: -1 }, // Sib
];

/**
 * Las notas de un acorde, escritas como se escriben.
 *
 * Cada nota cae en el grado que le toca (la tercera, dos grados arriba) y la
 * alteración es lo que falta para que ese grado suene donde tiene que sonar.
 */
export const chordNotes = (root: SpelledNote, shape: ChordShape): SpelledNote[] => {
  const rootSemitone = spelledSemitone(root);

  return shape.tones.map(({ steps, semitones }) => {
    const degree = root.degree + steps;
    const natural = spelledSemitone({ degree, alter: 0 });
    return { degree, alter: rootSemitone + semitones - natural };
  });
};

/** ¿Se puede escribir este acorde sin dobles alteraciones ni rarezas? */
const isWritable = (notes: SpelledNote[]) =>
  notes.every(
    (note) => Math.abs(note.alter) <= 1 && ANSWER_NAMES.includes(spelledName(note)),
  );

/** Sube al agudo las `count` notas más graves: eso es invertir un acorde. */
const invert = (notes: SpelledNote[], count: number): SpelledNote[] =>
  notes
    .map((note, index) =>
      index < count ? { ...note, alter: note.alter, degree: note.degree + 7 } : note,
    )
    .sort((a, b) => a.degree - b.degree);

/**
 * Dónde se sienta el acorde en el pentagrama.
 *
 * Se busca la octava en la que la nota más grave cae cerca del centro de la
 * clave, para que el acorde entero quepa sin irse de líneas adicionales.
 */
const CENTER_DEGREE: Record<Clef, number> = { sol: 2, fa: -10 };

/** El grado que cae en mitad del pentagrama: Si4 en clave de sol, Re3 en fa. */
const STAFF_CENTER: Record<Clef, number> = { sol: 6, fa: -6 };

const place = (notes: SpelledNote[], clef: Clef): SpelledNote[] => {
  const lowest = notes[0].degree;
  const shift = Math.round((CENTER_DEGREE[clef] - lowest) / 7) * 7;
  return notes.map((note) => ({ ...note, degree: note.degree + shift }));
};

export interface ChordStaffLevel {
  slug: string;
  title: string;
  desc: string;
  badge: string;
  shapes: ChordShape[];
  /** true = la fundamental puede llevar alteración. */
  alteredRoots: boolean;
  /** true = el acorde puede salir invertido. */
  inversions: boolean;
  /** "ambas" mezcla claves: cada pregunta trae la suya. */
  clef: Clef | "ambas";
}

/** Niveles de "Nombra el acorde": se lee el pentagrama y se dice qué acorde es. */
export const CHORD_NAME_LEVELS: ChordStaffLevel[] = [
  {
    slug: "mayores-menores",
    title: "Mayores y menores",
    desc: "Las dos tríadas de siempre, en clave de sol y en estado fundamental.",
    badge: "Nivel 1",
    shapes: [MAYOR, MENOR],
    alteredRoots: false,
    inversions: false,
    clef: "sol",
  },
  {
    slug: "triadas",
    title: "Las cuatro tríadas",
    desc: "Se añaden el disminuido y el aumentado: hay que mirar bien la quinta.",
    badge: "Nivel 2",
    shapes: TRIADAS,
    alteredRoots: false,
    inversions: false,
    clef: "sol",
  },
  {
    slug: "cuatriadas",
    title: "Cuatríadas",
    desc: "Cuatro notas apiladas: maj7, m7, dominante y semidisminuido.",
    badge: "Nivel 3",
    shapes: CUATRIADAS,
    alteredRoots: false,
    inversions: false,
    clef: "sol",
  },
  {
    slug: "alteraciones",
    title: "Con alteraciones",
    desc: "Fundamentales alteradas y las dos claves. Todo se mueve de sitio.",
    badge: "Nivel 4",
    shapes: [...TRIADAS, ...CUATRIADAS],
    alteredRoots: true,
    inversions: false,
    clef: "ambas",
  },
  {
    slug: "inversiones",
    title: "Inversiones",
    desc: "El bajo ya no es la fundamental: hay que reordenar antes de nombrar.",
    badge: "Nivel 5",
    shapes: [...TRIADAS, ...CUATRIADAS],
    alteredRoots: true,
    inversions: true,
    clef: "ambas",
  },
];

/** Niveles de "Escribe el acorde": se da el nombre y se ponen sus notas. */
export const CHORD_SPELL_LEVELS: ChordStaffLevel[] = [
  {
    slug: "mayores-menores",
    title: "Mayores y menores",
    desc: "Fundamental, tercera y quinta. Por aquí se empieza.",
    badge: "Nivel 1",
    shapes: [MAYOR, MENOR],
    alteredRoots: false,
    inversions: false,
    clef: "sol",
  },
  {
    slug: "triadas",
    title: "Las cuatro tríadas",
    desc: "Con disminuido y aumentado: cambia la quinta, cambia el nombre.",
    badge: "Nivel 2",
    shapes: TRIADAS,
    alteredRoots: false,
    inversions: false,
    clef: "sol",
  },
  {
    slug: "cuatriadas",
    title: "Cuatríadas",
    desc: "Se añade la séptima, que es la nota que le da el color.",
    badge: "Nivel 3",
    shapes: CUATRIADAS,
    alteredRoots: false,
    inversions: false,
    clef: "sol",
  },
  {
    slug: "alteraciones",
    title: "Con alteraciones",
    desc: "Desde fundamentales alteradas. Ojo: Reb mayor lleva Fa, no Mi#.",
    badge: "Nivel 4",
    shapes: [...TRIADAS, ...CUATRIADAS],
    alteredRoots: true,
    inversions: false,
    clef: "sol",
  },
];

export const findChordNameLevel = (slug: string) =>
  CHORD_NAME_LEVELS.find((level) => level.slug === slug);

export const findChordSpellLevel = (slug: string) =>
  CHORD_SPELL_LEVELS.find((level) => level.slug === slug);

export interface ChordStaffQuestion {
  root: SpelledNote;
  shape: ChordShape;
  clef: Clef;
  /** 0 = estado fundamental. */
  inversion: number;
  /** Las notas ya colocadas en el pentagrama, de grave a agudo. */
  notes: SpelledNote[];
}

/** "Reb mayor", "Sol m7"… */
export const chordName = (question: ChordStaffQuestion) =>
  `${spelledName(question.root)} ${question.shape.label}`;

/** Los nombres de las notas del acorde, sin octava: es lo que se contesta. */
export const chordNoteNames = (question: ChordStaffQuestion) =>
  chordNotes(question.root, question.shape).map(spelledName);

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

/** Preguntas de una partida, sin repetir el mismo acorde dos veces seguidas. */
export const buildChordStaffQuiz = (
  level: ChordStaffLevel,
  count: number,
): ChordStaffQuestion[] => {
  const roots = level.alteredRoots
    ? [...NATURAL_ROOTS, ...ALTERED_ROOTS]
    : NATURAL_ROOTS;

  const questions: ChordStaffQuestion[] = [];

  while (questions.length < count) {
    const root = pick(roots);
    const shape = pick(level.shapes);
    const notes = chordNotes(root, shape);

    // Acordes que no se pueden escribir con las notas de siempre (Mi aumentado
    // pide Si#) se tiran y se saca otro: no son material de este modo.
    if (!isWritable(notes)) continue;

    const previous = questions[questions.length - 1];
    if (
      previous &&
      previous.root.degree === root.degree &&
      previous.root.alter === root.alter &&
      previous.shape.id === shape.id
    ) {
      continue;
    }

    const clef: Clef =
      level.clef === "ambas" ? (Math.random() < 0.5 ? "sol" : "fa") : level.clef;
    const inversion = level.inversions
      ? Math.floor(Math.random() * notes.length)
      : 0;

    questions.push({
      root,
      shape,
      clef,
      inversion,
      notes: place(invert(notes, inversion), clef),
    });
  }

  return questions;
};

/** De "Mib" a la nota escrita que le corresponde, dentro de la octava central. */
export const parseNoteName = (name: string): SpelledNote => {
  const alter = name.endsWith("#") ? 1 : name.endsWith("b") ? -1 : 0;
  const letter = alter === 0 ? name : name.slice(0, -1);
  return { degree: DEGREE_NAMES.indexOf(letter as (typeof DEGREE_NAMES)[number]), alter };
};

/**
 * Apila unos nombres de nota para poder dibujarlos: la primera se sienta en la
 * clave y cada siguiente se pone por encima de la anterior.
 *
 * Es lo que se enseña mientras el alumno escribe el acorde: las notas van
 * apareciendo en el pentagrama en el orden en que las va diciendo.
 */
export const stackNoteNames = (names: string[], clef: Clef): SpelledNote[] => {
  const stacked: SpelledNote[] = [];

  const used = new Set<number>();

  names.forEach((name) => {
    const note = parseNoteName(name);
    const previous = stacked[stacked.length - 1];

    if (!previous) {
      stacked.push(note);
      used.add(note.degree);
      return;
    }

    // De las dos octavas posibles se coge la que deje la nota más cerca de la
    // anterior. Si se apilara siempre hacia arriba, decir el acorde de aguda a
    // grave lo estiraría dos octavas y se saldría del papel.
    const up = degreeInOctave(note.degree - previous.degree) || 7;
    let degree = up <= 3 ? previous.degree + up : previous.degree + up - 7;

    while (used.has(degree)) degree += 7;

    stacked.push({ ...note, degree });
    used.add(degree);
  });

  if (!stacked.length) return stacked;

  // Y el racimo entero se centra en el pentagrama, para que caiga en las líneas
  // en vez de colgar de ellas.
  const degrees = stacked.map((note) => note.degree);
  const middle = (Math.min(...degrees) + Math.max(...degrees)) / 2;
  const shift = Math.round((STAFF_CENTER[clef] - middle) / 7) * 7;

  return stacked.map((note) => ({ ...note, degree: note.degree + shift }));
};
