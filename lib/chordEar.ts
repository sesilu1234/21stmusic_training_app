// Niveles del modo "Acordes al oído".
//
// Hay dos formas de preguntar:
//
//  - "calidad": suena un acorde suelto y hay que decir de qué tipo es. No hace
//    falta contexto, así que no se da tónica de referencia.
//
//  - "grado": suena primero el acorde de tónica y después otro acorde de la
//    misma tonalidad; hay que decir qué grado es. Esto es lo que de verdad se
//    usa al sacar canciones de oído: no reconoces "un Sol", reconoces "el V".
//    Por eso la tonalidad se transporta al azar en cada pregunta.

export type LevelMode = "calidad" | "grado";

export interface ChordOption {
  id: string;
  label: string;
  /** Fundamental del acorde respecto a la tónica, en semitonos. */
  root: number;
  /** Intervalos del acorde desde su propia fundamental. */
  shape: number[];
}

export interface ChordLevel {
  slug: string;
  order: number;
  title: string;
  desc: string;
  badge: string;
  mode: LevelMode;
  options: ChordOption[];
}

const MAYOR = [0, 4, 7];
const MENOR = [0, 3, 7];
const AUMENTADO = [0, 4, 8];
const DISMINUIDO = [0, 3, 6];

const quality = (id: string, label: string, shape: number[]): ChordOption => ({
  id,
  label,
  root: 0,
  shape,
});

const degree = (id: string, label: string, root: number, shape: number[]): ChordOption => ({
  id,
  label,
  root,
  shape,
});

export const CHORD_LEVELS: ChordLevel[] = [
  {
    slug: "mayor-menor",
    order: 1,
    title: "Mayor o menor",
    desc: "Un acorde suelto. Solo hay que decir si suena alegre o triste.",
    badge: "Nivel 1",
    mode: "calidad",
    options: [quality("M", "Mayor", MAYOR), quality("m", "Menor", MENOR)],
  },
  {
    slug: "i-iv-v",
    order: 2,
    title: "I · IV · V",
    desc: "La rueda de toda la vida. Suena la tónica y después uno de los tres.",
    badge: "Nivel 2",
    mode: "grado",
    options: [
      degree("I", "I", 0, MAYOR),
      degree("IV", "IV", 5, MAYOR),
      degree("V", "V", 7, MAYOR),
    ],
  },
  {
    slug: "diatonicos",
    order: 3,
    title: "La rueda completa",
    desc: "Los seis grados que se usan de verdad: I, ii, iii, IV, V y vi.",
    badge: "Nivel 3",
    mode: "grado",
    options: [
      degree("I", "I", 0, MAYOR),
      degree("ii", "ii", 2, MENOR),
      degree("iii", "iii", 4, MENOR),
      degree("IV", "IV", 5, MAYOR),
      degree("V", "V", 7, MAYOR),
      degree("vi", "vi", 9, MENOR),
    ],
  },
  {
    slug: "triadas",
    order: 4,
    title: "Las cuatro tríadas",
    desc: "Mayor, menor, aumentado y disminuido, sin contexto que ayude.",
    badge: "Nivel 4",
    mode: "calidad",
    options: [
      quality("M", "Mayor", MAYOR),
      quality("m", "Menor", MENOR),
      quality("aug", "Aum.", AUMENTADO),
      quality("dim", "Dism.", DISMINUIDO),
    ],
  },
  {
    slug: "cuatriadas",
    order: 5,
    title: "Cuatríadas",
    desc: "Maj7, m7, dominante, semidisminuido y disminuido de séptima.",
    badge: "Nivel 5",
    mode: "calidad",
    options: [
      quality("maj7", "Maj7", [0, 4, 7, 11]),
      quality("m7", "m7", [0, 3, 7, 10]),
      quality("7", "7", [0, 4, 7, 10]),
      quality("m7b5", "m7b5", [0, 3, 6, 10]),
      quality("dim7", "dim7", [0, 3, 6, 9]),
    ],
  },
];

export const findLevel = (slug: string) =>
  CHORD_LEVELS.find((level) => level.slug === slug);

/** Acorde de tónica de la tonalidad, para dar la referencia en modo "grado". */
export const tonicChord = (keyRoot: number) => MAYOR.map((s) => keyRoot + s);

/** Semitonos absolutos de una opción dentro de una tonalidad. */
export const chordNotes = (option: ChordOption, keyRoot: number) =>
  option.shape.map((s) => keyRoot + option.root + s);

/**
 * Tónica al azar dentro de una octava baja: transporta la pregunta para que no
 * se aprenda de memoria por altura absoluta.
 */
export const randomKeyRoot = () => Math.floor(Math.random() * 8) - 4;

/** Lista de preguntas sin repetir la misma dos veces seguidas. */
export const buildChordQuiz = (level: ChordLevel, count: number) => {
  const questions: { option: ChordOption; keyRoot: number }[] = [];

  for (let i = 0; i < count; i++) {
    const previous = questions[i - 1]?.option.id;
    const pool =
      level.options.length > 1
        ? level.options.filter((option) => option.id !== previous)
        : level.options;

    questions.push({
      option: pool[Math.floor(Math.random() * pool.length)],
      keyRoot: randomKeyRoot(),
    });
  }

  return questions;
};
