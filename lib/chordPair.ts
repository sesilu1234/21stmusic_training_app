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

/** Todo lo que el menú de niveles necesita saber de este nivel. */
export const PAIR_LEVEL = {
  slug: "dos-acordes",
  title: "Dos acordes seguidos",
  desc: "Te decimos el primero. Suenan los dos y dices qué distancia hay y qué tipo es el segundo.",
  badge: "Nivel 6",
};

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

/** El primero siempre es mayor, y se dice cuál es: es el ancla de la pregunta. */
const FIRST_SHAPE = [0, 4, 7];

export interface PairQuestion {
  /** Fundamental del primer acorde, en semitonos (0 = Do central). */
  root: number;
  distanceId: string;
  qualityId: string;
}

export const findDistance = (id: string) =>
  PAIR_DISTANCES.find((item) => item.id === id)!;

export const findQuality = (id: string) =>
  PAIR_QUALITIES.find((item) => item.id === id)!;

/** Los dos acordes de la pregunta, en semitonos absolutos. */
export const pairChords = (question: PairQuestion): number[][] => {
  const second = question.root + findDistance(question.distanceId).semitones;
  return [
    FIRST_SHAPE.map((s) => question.root + s),
    findQuality(question.qualityId).shape.map((s) => second + s),
  ];
};

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/**
 * Fundamental del primero. Se mueve por toda la octava para que no se aprenda
 * por altura, pero centrada: con el segundo acorde una 8ª por encima ya se sube
 * bastante.
 */
const randomRoot = () => Math.floor(Math.random() * 12) - 5;

/** Preguntas de una ronda, sin repetir la misma distancia dos veces seguidas. */
export const buildPairQuiz = (count: number): PairQuestion[] => {
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
    });
  }

  return questions;
};
