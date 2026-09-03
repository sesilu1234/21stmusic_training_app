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
  /**
   * Varias formas posibles para la misma respuesta, y se sortea una por
   * pregunta. Lo usa el nivel de inversiones: "1ª inversión" vale igual para
   * un acorde mayor que para uno menor, y si siempre sonara el mismo se
   * acabaría reconociendo el acorde en vez de la inversión.
   */
  variants?: number[][];
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
  /**
   * Titular de la pantalla, si el de siempre ("¿Qué ACORDE es?") no vale.
   * El nivel de inversiones no pregunta qué acorde suena, sino cómo está
   * colocado.
   */
  heading?: { lead: string; word: string; tail: string };
  /**
   * Una linea corta debajo del titulo, dentro del juego. Solo la llevan los
   * niveles cuyo enunciado se puede entender mal, y dice lo que hay que
   * escuchar. La `desc` no sirve para esto: esa se lee en el menu, antes de
   * entrar, y para cuando suena el primer acorde ya se ha olvidado.
   */
  hint?: string;
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

const inversion = (id: string, label: string, variants: number[][]): ChordOption => ({
  id,
  label,
  root: 0,
  shape: variants[0],
  variants,
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
      quality("aug", "aug", AUMENTADO),
      quality("dim", "dim", DISMINUIDO),
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
      quality("maj7", "maj7", [0, 4, 7, 11]),
      quality("m7", "m7", [0, 3, 7, 10]),
      quality("7", "7", [0, 4, 7, 10]),
      quality("m7b5", "m7b5", [0, 3, 6, 10]),
      quality("dim7", "dim7", [0, 3, 6, 9]),
    ],
  },
  {
    slug: "todo",
    order: 4,
    title: "Todo mezclado",
    desc: "Tríadas y cuatríadas en el mismo bombo: no sabes ni por dónde va a venir.",
    badge: "Nivel 4",
    mode: "calidad",
    length: 1,
    options: [
      quality("M", "Mayor", MAYOR),
      quality("m", "Menor", MENOR),
      quality("aug", "aug", AUMENTADO),
      quality("dim", "dim", DISMINUIDO),
      quality("maj7", "maj7", [0, 4, 7, 11]),
      quality("m7", "m7", [0, 3, 7, 10]),
      quality("7", "7", [0, 4, 7, 10]),
      quality("m7b5", "m7b5", [0, 3, 6, 10]),
      quality("dim7", "dim7", [0, 3, 6, 9]),
    ],
  },
  {
    // Aquí no se pregunta qué acorde es, sino cómo está colocado: qué nota le
    // ha quedado abajo. Por eso solo hay tríadas mayores y menores — meter
    // cuatríadas sería preguntar dos cosas a la vez.
    slug: "inversiones",
    order: 5,
    heading: { lead: "¿Qué nota está", word: "ABAJO", tail: "?" },
    hint: "Da igual si es mayor o menor: solo importa qué nota ha quedado abajo",
    title: "¿Qué hay en el bajo?",
    desc: "Suena una tríada mayor o menor. No preguntamos qué acorde es, sino cuál de sus tres notas ha quedado abajo.",
    badge: "Nivel 5",
    mode: "calidad",
    length: 1,
    options: [
      inversion("fund", "Fundamental", [
        [0, 4, 7],
        [0, 3, 7],
      ]),
      inversion("inv1", "1ª inv.", [
        [4, 7, 12],
        [3, 7, 12],
      ]),
      inversion("inv2", "2ª inv.", [
        [7, 12, 16],
        [7, 12, 15],
      ]),
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

/**
 * Semitonos absolutos de una opción dentro de una tonalidad. `shape` se pasa
 * cuando la pregunta ya sorteó una de las variantes de la opción.
 */
export const chordNotes = (
  option: ChordOption,
  keyRoot: number,
  shape: number[] = option.shape,
) => shape.map((s) => keyRoot + option.root + s);

/**
 * Tónica al azar dentro de una octava baja: transporta la pregunta para que no
 * se aprenda de memoria por altura absoluta.
 */
export const randomKeyRoot = () => Math.floor(Math.random() * 8) - 4;

/** Una pregunta: la tonalidad y los acordes que suenan, en orden. */
export interface ChordQuestion {
  options: ChordOption[];
  keyRoot: number;
  /** La forma sorteada de cada acorde de la secuencia, en el mismo orden. */
  shapes: number[][];
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

/** Una de las formas posibles de la opción; casi siempre solo hay una. */
const pickShape = (option: ChordOption) =>
  option.variants
    ? option.variants[Math.floor(Math.random() * option.variants.length)]
    : option.shape;

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

    questions.push({
      options,
      keyRoot: randomKeyRoot(),
      shapes: options.map(pickShape),
    });
  }

  return questions;
};
