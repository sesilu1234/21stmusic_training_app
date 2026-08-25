// Niveles de los dos modos de acordes al oído.
//
// Son dos cosas distintas y por eso son dos modos distintos en el menú:
//
//  - ACORDES (mode "calidad"): suena un acorde suelto y hay que decir de qué
//    tipo es. No hace falta contexto, así que no se da tónica de referencia.
//
//  - PROGRESIONES (mode "grado"): suena primero el acorde de tónica y después
//    una o varias acordes de la misma tonalidad; hay que decir qué grados son,
//    en orden. Esto es lo que de verdad se usa al sacar canciones de oído: no
//    reconoces "un Sol", reconoces "el V". Por eso la tonalidad se transporta
//    al azar en cada pregunta.

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
  /** Cuántos acordes suenan por pregunta. 1 = acorde suelto. */
  length: number;
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

// Grados diatónicos de la escala mayor que se usan de verdad.
const I = degree("I", "I", 0, MAYOR);
const ii = degree("ii", "ii", 2, MENOR);
const iii = degree("iii", "iii", 4, MENOR);
const IV = degree("IV", "IV", 5, MAYOR);
const V = degree("V", "V", 7, MAYOR);
const vi = degree("vi", "vi", 9, MENOR);

// =====================================================================
// Modo 1 — Acordes sueltos
// =====================================================================
export const CHORD_LEVELS: ChordLevel[] = [
  {
    slug: "mayor-menor",
    order: 1,
    title: "Mayor o menor",
    desc: "Un acorde suelto. Solo hay que decir si suena alegre o triste.",
    badge: "Nivel 1",
    mode: "calidad",
    length: 1,
    options: [quality("M", "Mayor", MAYOR), quality("m", "Menor", MENOR)],
  },
  {
    slug: "triadas",
    order: 2,
    title: "Las cuatro tríadas",
    desc: "Mayor, menor, aumentado y disminuido, sin contexto que ayude.",
    badge: "Nivel 2",
    mode: "calidad",
    length: 1,
    options: [
      quality("M", "Mayor", MAYOR),
      quality("m", "Menor", MENOR),
      quality("aug", "Aum.", AUMENTADO),
      quality("dim", "Dism.", DISMINUIDO),
    ],
  },
  {
    slug: "cuatriadas",
    order: 3,
    title: "Cuatríadas",
    desc: "Maj7, m7, dominante, semidisminuido y disminuido de séptima.",
    badge: "Nivel 3",
    mode: "calidad",
    length: 1,
    options: [
      quality("maj7", "Maj7", [0, 4, 7, 11]),
      quality("m7", "m7", [0, 3, 7, 10]),
      quality("7", "7", [0, 4, 7, 10]),
      quality("m7b5", "m7b5", [0, 3, 6, 10]),
      quality("dim7", "dim7", [0, 3, 6, 9]),
    ],
  },
];

// =====================================================================
// Modo 2 — Progresiones (grados dentro de una tonalidad)
// =====================================================================
// Los dos primeros niveles son de un solo acorde a propósito: acostumbrarse a
// oír un grado suelto contra la tónica es el paso previo a sacar una rueda
// entera, y sin él el nivel de cuatro acordes es un muro.
export const PROGRESSION_LEVELS: ChordLevel[] = [
  {
    slug: "i-iv-v",
    order: 1,
    title: "I · IV · V",
    desc: "La rueda de toda la vida. Suena la tónica y después uno de los tres.",
    badge: "Nivel 1",
    mode: "grado",
    length: 1,
    options: [I, IV, V],
  },
  {
    slug: "diatonicos",
    order: 2,
    title: "La rueda completa",
    desc: "Los seis grados que se usan de verdad: I, ii, iii, IV, V y vi.",
    badge: "Nivel 2",
    mode: "grado",
    length: 1,
    options: [I, ii, iii, IV, V, vi],
  },
  {
    slug: "dos-acordes",
    order: 3,
    title: "Dos acordes seguidos",
    desc: "Tónica y después dos grados. Hay que decirlos en orden.",
    badge: "Nivel 3",
    mode: "grado",
    length: 2,
    options: [I, IV, V, vi],
  },
  {
    slug: "tres-acordes",
    order: 4,
    title: "Progresión de tres",
    desc: "Tres acordes seguidos sobre la misma tonalidad.",
    badge: "Nivel 4",
    mode: "grado",
    length: 3,
    options: [I, ii, IV, V, vi],
  },
  {
    slug: "cuatro-acordes",
    order: 5,
    title: "Progresión de cuatro",
    desc: "Una rueda entera de pop, con los seis grados en juego.",
    badge: "Nivel 5",
    mode: "grado",
    length: 4,
    options: [I, ii, iii, IV, V, vi],
  },
];

export const findLevel = (slug: string) =>
  CHORD_LEVELS.find((level) => level.slug === slug);

export const findProgressionLevel = (slug: string) =>
  PROGRESSION_LEVELS.find((level) => level.slug === slug);

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

/** Una pregunta: la tonalidad y los acordes que suenan, en orden. */
export interface ChordQuestion {
  options: ChordOption[];
  keyRoot: number;
}

/**
 * Construye la secuencia de una pregunta. No se repite el mismo acorde dos
 * veces seguidas dentro de la progresión: sonaría como si no hubiera cambiado
 * nada y la pregunta se volvería tramposa.
 */
const buildSequence = (level: ChordLevel): ChordOption[] => {
  const sequence: ChordOption[] = [];

  for (let i = 0; i < level.length; i++) {
    const previous = sequence[i - 1]?.id;
    const pool =
      level.options.length > 1
        ? level.options.filter((option) => option.id !== previous)
        : level.options;

    sequence.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return sequence;
};

/** Lista de preguntas sin repetir la misma dos veces seguidas. */
export const buildChordQuiz = (level: ChordLevel, count: number): ChordQuestion[] => {
  const questions: ChordQuestion[] = [];

  const signature = (options: ChordOption[]) => options.map((o) => o.id).join("-");

  for (let i = 0; i < count; i++) {
    const previous = questions[i - 1];
    let options = buildSequence(level);

    // Con pocas combinaciones posibles no siempre hay alternativa, así que se
    // intenta unas cuantas veces y se acepta lo que salga.
    for (
      let attempt = 0;
      attempt < 8 &&
      previous &&
      signature(options) === signature(previous.options);
      attempt++
    ) {
      options = buildSequence(level);
    }

    questions.push({ options, keyRoot: randomKeyRoot() });
  }

  return questions;
};
