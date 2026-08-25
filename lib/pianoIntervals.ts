// Intervalos que se piden en el modo "Toca el intervalo".
//
// Solo ascendentes por ahora: el enunciado es siempre "desde X, toca la Y"
// hacia arriba, que es como se estudia al principio.

export interface PianoInterval {
  semitones: number;
  /** Cifrado corto, el mismo que usan los modos de oído. */
  short: string;
  /** Nombre largo para el enunciado. */
  name: string;
}

export const PIANO_INTERVALS: PianoInterval[] = [
  { semitones: 1, short: "b2", name: "2ª menor" },
  { semitones: 2, short: "2", name: "2ª mayor" },
  { semitones: 3, short: "b3", name: "3ª menor" },
  { semitones: 4, short: "3", name: "3ª mayor" },
  { semitones: 5, short: "4", name: "4ª justa" },
  { semitones: 6, short: "b5", name: "5ª disminuida" },
  { semitones: 7, short: "5", name: "5ª justa" },
  { semitones: 8, short: "b6", name: "6ª menor" },
  { semitones: 9, short: "6", name: "6ª mayor" },
  { semitones: 10, short: "b7", name: "7ª menor" },
  { semitones: 11, short: "7", name: "7ª mayor" },
  { semitones: 12, short: "8va", name: "octava" },
];

/**
 * Los intervalos de cada nivel. Se empieza por los que se reconocen de oído
 * antes que ningún otro (3ª, 5ª y octava) y se va abriendo el abanico.
 */
export interface PianoIntervalLevel {
  slug: string;
  title: string;
  desc: string;
  badge: string;
  semitones: number[];
  /** true = la nota de partida puede caer en tecla negra. */
  blackRoots: boolean;
}

export const PIANO_INTERVAL_LEVELS: PianoIntervalLevel[] = [
  {
    slug: "basicos",
    title: "Los tres de siempre",
    desc: "3ª mayor, 5ª justa y octava, y siempre desde tecla blanca.",
    badge: "Nivel 1",
    semitones: [4, 7, 12],
    blackRoots: false,
  },
  {
    slug: "terceras-y-quintas",
    title: "Mayores y menores",
    desc: "Se añaden la 3ª menor y la 5ª disminuida: hay que afinar el dedo.",
    badge: "Nivel 2",
    semitones: [3, 4, 6, 7, 12],
    blackRoots: false,
  },
  {
    slug: "diatonicos",
    title: "Toda la escala",
    desc: "Los siete intervalos de la escala mayor, desde tecla blanca.",
    badge: "Nivel 3",
    semitones: [2, 4, 5, 7, 9, 11, 12],
    blackRoots: false,
  },
  {
    slug: "cromaticos",
    title: "Los doce",
    desc: "Todos los intervalos y también partiendo de teclas negras.",
    badge: "Nivel 4",
    semitones: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    blackRoots: true,
  },
];

export const findPianoIntervalLevel = (slug: string) =>
  PIANO_INTERVAL_LEVELS.find((level) => level.slug === slug);

export const intervalOf = (semitones: number) =>
  PIANO_INTERVALS.find((interval) => interval.semitones === semitones)!;

const WHITE_ROOTS = [0, 2, 4, 5, 7, 9, 11];

export interface PianoIntervalQuestion {
  /** Semitono absoluto de la nota de partida. */
  root: number;
  interval: PianoInterval;
}

/**
 * Preguntas de una partida.
 *
 * La fundamental se queda siempre en la primera octava (0–11) para que el
 * objetivo, que puede estar hasta una octava por encima, siga cabiendo en el
 * teclado de dos octavas sin tener que hacerlo scrollable.
 */
export const buildPianoIntervalQuiz = (
  level: PianoIntervalLevel,
  count: number,
): PianoIntervalQuestion[] => {
  const roots = level.blackRoots
    ? Array.from({ length: 12 }, (_, index) => index)
    : WHITE_ROOTS;

  const questions: PianoIntervalQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const previous = questions[i - 1];

    let root = roots[Math.floor(Math.random() * roots.length)];
    let semitones =
      level.semitones[Math.floor(Math.random() * level.semitones.length)];

    // Ni la misma pregunta dos veces seguidas ni el mismo intervalo repetido:
    // con pocas opciones no siempre hay alternativa, así que se intenta unas
    // cuantas veces y se acepta lo que salga.
    for (
      let attempt = 0;
      attempt < 8 &&
      previous &&
      previous.root === root &&
      previous.interval.semitones === semitones;
      attempt++
    ) {
      root = roots[Math.floor(Math.random() * roots.length)];
      semitones = level.semitones[Math.floor(Math.random() * level.semitones.length)];
    }

    questions.push({ root, interval: intervalOf(semitones) });
  }

  return questions;
};
