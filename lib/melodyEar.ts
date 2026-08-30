// Dictado melódico: suena una melodía corta y hay que tocarla en el piano.
//
// Dos decisiones que son casi todo el modo:
//
//  - Es DIATÓNICO. Se sortean grados de la escala mayor, no semitonos sueltos:
//    con intervalos cromáticos al azar salen melodías que no son de ninguna
//    tonalidad, no hay quien las retenga y el ejercicio deja de parecerse a
//    sacar una canción.
//
//  - La primera nota se da hecha, y siempre es la tónica. Antes de la melodía
//    suena su acorde: sin ancla, el dictado se convierte en oído absoluto.

export type MelodyDirection = "up" | "down" | "free";

export interface MelodyLevel {
  slug: string;
  title: string;
  desc: string;
  badge: string;
  /** Cuántas notas suenan, contando la que se da hecha. */
  notes: number;
  direction: MelodyDirection;
}

export const MELODY_LEVELS: MelodyLevel[] = [
  {
    slug: "tres-arriba",
    title: "Tres notas, subiendo",
    desc: "Sale de la tónica y solo sube. Dos notas que sacar.",
    badge: "Nivel 1",
    notes: 3,
    direction: "up",
  },
  {
    slug: "tres-abajo",
    title: "Tres notas, bajando",
    desc: "Lo mismo pero hacia abajo, que se oye distinto de lo que parece.",
    badge: "Nivel 2",
    notes: 3,
    direction: "down",
  },
  {
    slug: "cuatro",
    title: "Cuatro notas, libre",
    desc: "Ya sube y baja. Tres notas que sacar.",
    badge: "Nivel 3",
    notes: 4,
    direction: "free",
  },
  {
    slug: "cinco",
    title: "Cinco notas, libre",
    desc: "Una frase entera: aquí tanto se entrena el oído como la memoria.",
    badge: "Nivel 4",
    notes: 5,
    direction: "free",
  },
];

export const findMelodyLevel = (slug: string) =>
  MELODY_LEVELS.find((level) => level.slug === slug);

/** Escala mayor. El grado 7 es la octava, el -1 el si de abajo, etc. */
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

/** Semitonos de un grado, contando octavas hacia arriba y hacia abajo. */
export const degreeToSemitone = (degree: number) => {
  const octave = Math.floor(degree / 7);
  return MAJOR[degree - octave * 7] + 12 * octave;
};

export interface MelodyQuestion {
  /** Tónica de la melodía, en semitonos (0 = Do central). */
  keyRoot: number;
  /** Grados de la melodía. El primero es siempre 0: la nota que se da. */
  degrees: number[];
}

/** Las notas de la melodía, en semitonos absolutos. */
export const melodyNotes = (question: MelodyQuestion) =>
  question.degrees.map((degree) => question.keyRoot + degreeToSemitone(degree));

/** El acorde de tónica que suena antes de la melodía. */
export const melodyTonicChord = (question: MelodyQuestion) =>
  [0, 4, 7].map((s) => question.keyRoot + s);

/** Las notas que hay que tocar: todas menos la primera, que va dada. */
export const melodyAnswer = (question: MelodyQuestion) =>
  melodyNotes(question).slice(1);

/**
 * Hasta dónde puede alejarse la melodía de la tónica. Una octava para cada
 * lado: es lo que cabe en el teclado que se dibuja y lo que se canta sin
 * forzar.
 */
const RANGE = 7;

const randomStep = () => 1 + Math.floor(Math.random() * 3);

/** El siguiente grado, respetando la dirección del nivel y el ámbito. */
const nextDegree = (current: number, direction: MelodyDirection) => {
  const candidates: number[] = [];

  for (let step = 1; step <= 3; step++) {
    if (direction !== "down" && current + step <= RANGE) candidates.push(current + step);
    if (direction !== "up" && current - step >= -RANGE) candidates.push(current - step);
  }

  // Solo pasa en los extremos del ámbito, y ahí se da media vuelta.
  if (!candidates.length) {
    return direction === "up" ? current - randomStep() : current + randomStep();
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
};

const buildMelody = (level: MelodyLevel) => {
  const degrees = [0];
  for (let i = 1; i < level.notes; i++) {
    degrees.push(nextDegree(degrees[i - 1], level.direction));
  }
  return degrees;
};

/** Tónica al azar dentro de una octava: transporta cada pregunta. */
const randomKeyRoot = () => Math.floor(Math.random() * 12);

/** Preguntas de una ronda, sin repetir la misma melodía dos veces seguidas. */
export const buildMelodyQuiz = (
  level: MelodyLevel,
  count: number,
): MelodyQuestion[] => {
  const questions: MelodyQuestion[] = [];
  const signature = (degrees: number[]) => degrees.join("-");

  for (let i = 0; i < count; i++) {
    let degrees = buildMelody(level);
    for (
      let attempt = 0;
      attempt < 8 &&
      questions[i - 1] &&
      signature(degrees) === signature(questions[i - 1].degrees);
      attempt++
    ) {
      degrees = buildMelody(level);
    }

    questions.push({ keyRoot: randomKeyRoot(), degrees });
  }

  return questions;
};
