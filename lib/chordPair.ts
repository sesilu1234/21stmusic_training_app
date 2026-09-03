// Nivel "Dos acordes seguidos" del modo Acordes al oído.
//
// Es el único nivel que no pregunta por el acorde, sino por lo que pasa ENTRE
// dos: suenan dos acordes, se te dice cuál es el primero y hay que decir qué
// distancia hay hasta el segundo y de qué tipo es. Eso es lo que de verdad se
// hace al sacar una canción — no reconoces "un Sol", reconoces que ha subido
// una cuarta.
//
// Vive aparte de `chordEar.ts` porque la respuesta son dos cosas (distancia y
// calidad) y no una lista de acordes en orden, que es lo único que sabe hacer
// el motor de allí.

export interface PairLevel {
  slug: string;
  title: string;
  desc: string;
  badge: string;
  /**
   * Si el primer acorde puede ser menor además de mayor.
   *
   * En el nivel 6 el primero es siempre mayor: es el ancla de la pregunta, y
   * con él fijo solo hay que sacar dos cosas de oído (cuánto sube y de qué tipo
   * es el segundo). En el 7 también varía, y entonces la referencia deja de ser
   * un color conocido — hay que medir el salto contra un acorde que además
   * tienes que reconocer. Es bastante más duro, y por eso es un nivel aparte y
   * no una vuelta de tuerca metida en el 6.
   */
  firstVariable: boolean;
}

/** Los dos niveles de "dos acordes", en orden. */
export const PAIR_LEVELS: PairLevel[] = [
  {
    slug: "dos-acordes",
    title: "Dos acordes seguidos",
    desc: "Te decimos el primero, que siempre es mayor. Suenan los dos y dices qué distancia hay y qué tipo es el segundo.",
    badge: "Nivel 6",
    firstVariable: false,
  },
  {
    slug: "dos-acordes-variable",
    title: "Dos acordes, el primero también",
    desc: "Igual que el anterior, pero el primero puede ser mayor o menor. Se te dice cuál es: lo que cambia es que ya no puedes darlo por sabido de oído.",
    badge: "Nivel 7",
    firstVariable: true,
  },
];

export const findPairLevel = (slug: string) =>
  PAIR_LEVELS.find((level) => level.slug === slug);

/** El de siempre. Se mantiene el nombre porque hay sitios que lo usan suelto. */
export const PAIR_LEVEL = PAIR_LEVELS[0];

export interface PairDistance {
  id: string;
  label: string;
  semitones: number;
}

/**
 * Siempre hacia arriba y dentro de la octava. Si se permitiera bajar, "sube
 * una 4ª" y "baja una 5ª" darían el mismo acorde y la pregunta tendría dos
 * respuestas buenas.
 */
export const PAIR_DISTANCES: PairDistance[] = [
  { id: "1", label: "b2", semitones: 1 },
  { id: "2", label: "2", semitones: 2 },
  { id: "3", label: "b3", semitones: 3 },
  { id: "4", label: "3", semitones: 4 },
  { id: "5", label: "4", semitones: 5 },
  { id: "6", label: "b5", semitones: 6 },
  { id: "7", label: "5", semitones: 7 },
  { id: "8", label: "b6", semitones: 8 },
  { id: "9", label: "6", semitones: 9 },
  { id: "10", label: "b7", semitones: 10 },
  { id: "11", label: "7", semitones: 11 },
  { id: "12", label: "8va", semitones: 12 },
];

export interface PairQuality {
  id: string;
  label: string;
  shape: number[];
}

/** El segundo acorde solo puede ser mayor o menor: ya hay bastante lío. */
export const PAIR_QUALITIES: PairQuality[] = [
  { id: "M", label: "Mayor", shape: [0, 4, 7] },
  { id: "m", label: "Menor", shape: [0, 3, 7] },
];

export interface PairQuestion {
  /** Fundamental del primer acorde, en semitonos (0 = Do central). */
  root: number;
  distanceId: string;
  qualityId: string;
  /** Tipo del primer acorde. En el nivel 6 siempre "M". */
  firstQualityId: string;
}

export const findDistance = (id: string) =>
  PAIR_DISTANCES.find((item) => item.id === id)!;

export const findQuality = (id: string) =>
  PAIR_QUALITIES.find((item) => item.id === id)!;

/** Los dos acordes de la pregunta, en semitonos absolutos. */
export const pairChords = (question: PairQuestion): number[][] => {
  const second = question.root + findDistance(question.distanceId).semitones;
  return [
    findQuality(question.firstQualityId).shape.map((s) => question.root + s),
    findQuality(question.qualityId).shape.map((s) => second + s),
  ];
};

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/**
 * Fundamental del primero. Se mueve por toda la octava para que no se aprenda
 * por altura, pero centrada: con el segundo acorde una 8ª por encima ya se sube
 * bastante.
 *
 * Iba de -5 a +6 semitonos respecto al Do central. Ahí el primer acorde caía
 * en la misma zona que el segundo y su fundamental quedaba enterrada entre las
 * notas de arriba, que es lo que hacía difícil medir el salto: la referencia
 * hay que oírla, no adivinarla. Bajando el rango una quinta el primero se
 * asienta debajo y se distingue del segundo por registro, no solo por orden.
 */
const randomRoot = () => Math.floor(Math.random() * 12) - 12;

/** Preguntas de una ronda, sin repetir la misma distancia dos veces seguidas. */
export const buildPairQuiz = (
  count: number,
  /** Si el primer acorde puede salir menor. Lo dice el nivel. */
  firstVariable = false,
): PairQuestion[] => {
  const questions: PairQuestion[] = [];

  for (let i = 0; i < count; i++) {
    let distance = pick(PAIR_DISTANCES);
    for (
      let attempt = 0;
      attempt < 8 && distance.id === questions[i - 1]?.distanceId;
      attempt++
    ) {
      distance = pick(PAIR_DISTANCES);
    }

    questions.push({
      root: randomRoot(),
      distanceId: distance.id,
      qualityId: pick(PAIR_QUALITIES).id,
      firstQualityId: firstVariable ? pick(PAIR_QUALITIES).id : "M",
    });
  }

  return questions;
};
