/**
 * Vocalizaciones: el compendio de ejercicios para calentar y entrenar la voz.
 *
 * Un ejercicio es un patrón corto de notas medido en semitonos desde su
 * tónica. La gracia está en repetirlo subiendo de semitono en semitono y
 * volver a bajar: el patrón no cambia nunca, cambia la altura a la que se
 * canta. Por eso aquí no hay notas absolutas, solo formas.
 *
 * El reloj y el recorrido viven en `vocalPlan`, que es lo que comparte con los
 * ejercicios de Rockschool.
 */

import { buildPlan, type AccompanimentMode } from "./vocalPlan";

export {
  ACCOMPANIMENTS,
  buildRoots,
  degreeLabel,
  fullNoteName,
  type AccompanimentMode,
  type Plan,
  type VocalEvent,
} from "./vocalPlan";

export type VocalGroupId =
  | "calentamiento"
  | "escalas"
  | "arpegios"
  | "septimas"
  | "agilidad"
  | "melodias";

export interface VocalGroup {
  id: VocalGroupId;
  label: string;
  /** Una línea de para qué sirve el grupo. */
  hint: string;
}

/** El orden de este array es el orden en que salen los grupos en pantalla. */
export const VOCAL_GROUPS: VocalGroup[] = [
  {
    id: "calentamiento",
    label: "Calentamiento",
    hint: "Poco recorrido y sin saltos difíciles: para empezar en frío.",
  },
  {
    id: "escalas",
    label: "Escalas",
    hint: "Grados seguidos. Afinación y aire largo.",
  },
  {
    id: "arpegios",
    label: "Arpegios",
    hint: "Saltos de acorde. Colocar la nota sin buscarla.",
  },
  {
    id: "septimas",
    label: "Séptimas",
    hint: "Cuatro sonidos. La séptima obliga a afinar de verdad.",
  },
  {
    id: "agilidad",
    label: "Agilidad",
    hint: "Rápido y ligero. Aquí importa más el movimiento que la potencia.",
  },
  {
    id: "melodias",
    label: "Melodías",
    hint: "Canciones conocidas para cantar. Las tuyas van en «Mis melodías».",
  },
];

export interface VocalExercise {
  slug: string;
  name: string;
  /** Una línea de qué se trabaja. */
  desc: string;
  group: VocalGroupId;
  /** El patrón, en semitonos desde la tónica. `null` = un pulso de silencio (solo en las melodías propias). */
  pattern: (number | null)[];
  /** Sílaba sugerida para cantarlo. */
  syllable: string;
  /** Pulsos por minuto a los que se propone. El usuario puede cambiarlo. */
  bpm: number;
}

export const VOCAL_EXERCISES: VocalExercise[] = [
  // --- Calentamiento ---------------------------------------------------
  {
    slug: "segunda",
    name: "Do · Re · Do",
    desc: "Tres notas pegadas. Lo mínimo para arrancar sin forzar.",
    group: "calentamiento",
    pattern: [0, 2, 0],
    syllable: "mm",
    bpm: 76,
  },
  {
    slug: "tres-notas",
    name: "Tres notas",
    desc: "Sube hasta la tercera y vuelve. Abre la voz despacio.",
    group: "calentamiento",
    pattern: [0, 2, 4, 2, 0],
    syllable: "ma",
    bpm: 84,
  },
  {
    slug: "cinco-descendente",
    name: "Cinco descendente",
    desc: "Desde la quinta hacia abajo. El clásico de todos los calentamientos.",
    group: "calentamiento",
    pattern: [7, 5, 4, 2, 0],
    syllable: "no",
    bpm: 84,
  },
  {
    slug: "quinta",
    name: "Quinta abierta",
    desc: "Un salto y vuelta. Para colocar el apoyo antes de nada más.",
    group: "calentamiento",
    pattern: [0, 7, 0],
    syllable: "ma",
    bpm: 66,
  },
  {
    slug: "octava",
    name: "Octava",
    desc: "El salto grande, sin prisa. La de arriba tiene que salir sola.",
    group: "calentamiento",
    pattern: [0, 12, 0],
    syllable: "no",
    bpm: 58,
  },

  // --- Escalas ---------------------------------------------------------
  {
    slug: "escala-mayor",
    name: "Escala mayor",
    desc: "La octava entera, subiendo y bajando. Aire y afinación.",
    group: "escalas",
    pattern: [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0],
    syllable: "la",
    bpm: 104,
  },
  {
    slug: "escala-mayor-asc",
    name: "Mayor ascendente",
    desc: "Solo la subida, con la octava sostenida al final.",
    group: "escalas",
    pattern: [0, 2, 4, 5, 7, 9, 11, 12],
    syllable: "la",
    bpm: 96,
  },
  {
    slug: "escala-menor",
    name: "Menor natural",
    desc: "La misma escala con la tercera y la sexta bajadas. Cambia el color.",
    group: "escalas",
    pattern: [0, 2, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 2, 0],
    syllable: "la",
    bpm: 104,
  },
  {
    slug: "pentatonica",
    name: "Pentatónica mayor",
    desc: "Cinco notas, sin semitonos. Suena bien casi sin querer.",
    group: "escalas",
    pattern: [0, 2, 4, 7, 9, 12, 9, 7, 4, 2, 0],
    syllable: "la",
    bpm: 100,
  },
  {
    slug: "cromatica",
    name: "Cromática corta",
    desc: "Semitono a semitono. El ejercicio más ingrato y el que más afina.",
    group: "escalas",
    pattern: [0, 1, 2, 3, 4, 3, 2, 1, 0],
    syllable: "mi",
    bpm: 76,
  },

  // --- Arpegios --------------------------------------------------------
  {
    slug: "triada-mayor",
    name: "Tríada mayor",
    desc: "Fundamental, tercera y quinta. El acorde cantado.",
    group: "arpegios",
    pattern: [0, 4, 7, 4, 0],
    syllable: "ma",
    bpm: 88,
  },
  {
    slug: "triada-mayor-octava",
    name: "Mayor hasta la octava",
    desc: "El mismo acorde estirado una octava. Recorrido de verdad.",
    group: "arpegios",
    pattern: [0, 4, 7, 12, 7, 4, 0],
    syllable: "ma",
    bpm: 92,
  },
  {
    slug: "triada-menor",
    name: "Tríada menor",
    desc: "Con la tercera bajada. Cuidado, se tiende a cantarla alta.",
    group: "arpegios",
    pattern: [0, 3, 7, 3, 0],
    syllable: "no",
    bpm: 88,
  },
  {
    slug: "triada-menor-octava",
    name: "Menor hasta la octava",
    desc: "Menor con el salto de octava incluido.",
    group: "arpegios",
    pattern: [0, 3, 7, 12, 7, 3, 0],
    syllable: "no",
    bpm: 92,
  },
  {
    slug: "arpegio-largo",
    name: "Arpegio largo",
    desc: "Hasta la décima y vuelta. Solo cuando la voz ya está caliente.",
    group: "arpegios",
    pattern: [0, 4, 7, 12, 16, 12, 7, 4, 0],
    syllable: "ma",
    bpm: 100,
  },

  // --- Séptimas --------------------------------------------------------
  {
    slug: "septima-dominante",
    name: "Séptima de dominante",
    desc: "Tríada mayor más séptima menor. Pide resolver, no resuelvas.",
    group: "septimas",
    pattern: [0, 4, 7, 10, 7, 4, 0],
    syllable: "ma",
    bpm: 92,
  },
  {
    slug: "septima-mayor",
    name: "Séptima mayor",
    desc: "La séptima a un semitono de la octava. Es la difícil de afinar.",
    group: "septimas",
    pattern: [0, 4, 7, 11, 7, 4, 0],
    syllable: "ma",
    bpm: 92,
  },
  {
    slug: "septima-menor",
    name: "Séptima menor",
    desc: "Tríada menor con séptima menor. La de casi todo el pop.",
    group: "septimas",
    pattern: [0, 3, 7, 10, 7, 3, 0],
    syllable: "no",
    bpm: 92,
  },
  {
    slug: "semidisminuido",
    name: "Semidisminuido",
    desc: "Quinta bemol. Suena raro a propósito: por eso entrena.",
    group: "septimas",
    pattern: [0, 3, 6, 10, 6, 3, 0],
    syllable: "no",
    bpm: 88,
  },
  {
    slug: "dominante-octava",
    name: "Dominante hasta la octava",
    desc: "El acorde completo, tapando la octava por arriba.",
    group: "septimas",
    pattern: [0, 4, 7, 10, 12, 10, 7, 4, 0],
    syllable: "ma",
    bpm: 100,
  },

  // --- Agilidad --------------------------------------------------------
  {
    slug: "cinco-ida-vuelta",
    name: "Cinco ida y vuelta",
    desc: "Nueve notas de una tirada, en un solo aire.",
    group: "agilidad",
    pattern: [0, 2, 4, 5, 7, 5, 4, 2, 0],
    syllable: "la",
    bpm: 132,
  },
  {
    slug: "terceras-rotas",
    name: "Terceras rotas",
    desc: "Sube de tres en tres bajando de dos. Lía la lengua y por eso vale.",
    group: "agilidad",
    pattern: [0, 4, 2, 5, 4, 7, 5, 2, 0],
    syllable: "la",
    bpm: 126,
  },
  {
    slug: "trino",
    name: "Trino",
    desc: "Dos notas alternándose. Ligero, sin empujar.",
    group: "agilidad",
    pattern: [0, 2, 0, 2, 0, 2, 0],
    syllable: "la",
    bpm: 144,
  },
  {
    slug: "quintas-repetidas",
    name: "Quintas repetidas",
    desc: "Ir y venir al mismo salto. Mide si la quinta se te va cayendo.",
    group: "agilidad",
    pattern: [0, 7, 0, 7, 0],
    syllable: "ma",
    bpm: 112,
  },
  {
    slug: "escala-rapida",
    name: "Escala rápida",
    desc: "La octava entera al doble de velocidad. El examen final.",
    group: "agilidad",
    pattern: [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0],
    syllable: "la",
    bpm: 152,
  },

  // --- Melodías --------------------------------------------------------
  // Pocas a propósito: son la muestra de lo que se puede hacer, y las que
  // importan son las que crea cada uno (lib/melodies.ts). Todas de dominio
  // público y escritas en Do, todas las notas de un pulso.
  {
    slug: "estrellita",
    name: "Estrellita",
    desc: "La primera frase. Saltos cortos y vuelta a casa.",
    group: "melodias",
    pattern: [0, 0, 7, 7, 9, 9, 7, 5, 5, 4, 4, 2, 2, 0],
    syllable: "la",
    bpm: 96,
  },
  {
    slug: "himno-alegria",
    name: "Himno de la alegría",
    desc: "Beethoven. Casi todo por grados seguidos: ideal para afinar.",
    group: "melodias",
    pattern: [4, 4, 5, 7, 7, 5, 4, 2, 0, 0, 2, 4, 4, 2, 2],
    syllable: "la",
    bpm: 104,
  },
  {
    slug: "martinillo",
    name: "Martinillo",
    desc: "Frases que se repiten. Se aprende a la segunda vuelta.",
    group: "melodias",
    pattern: [0, 2, 4, 0, 0, 2, 4, 0, 4, 5, 7, 4, 5, 7],
    syllable: "la",
    bpm: 108,
  },
];

export const exercisesOfGroup = (group: VocalGroupId) =>
  VOCAL_EXERCISES.filter((exercise) => exercise.group === group);

export const findExercise = (slug: string) =>
  VOCAL_EXERCISES.find((exercise) => exercise.slug === slug) ?? VOCAL_EXERCISES[0];

/** Cuánto se separan la nota más grave y la más aguda del patrón. */
export const exerciseSpan = (exercise: VocalExercise) => {
  const notes = exercise.pattern.filter((offset): offset is number => offset !== null);
  return Math.max(...notes) - Math.min(...notes);
};

// --- Tesituras ---------------------------------------------------------

export interface VoiceRange {
  id: string;
  label: string;
  /** Tónica de la primera repetición, en semitonos desde el Do central. */
  start: number;
  /** Semitonos que se propone subir y bajar desde ahí. */
  up: number;
  down: number;
}

/**
 * Puntos de partida razonables por tipo de voz. No son límites: son el sitio
 * donde a esa voz le resulta cómodo empezar a calentar.
 *
 * Por defecto sube cinco veces y vuelve a donde empezó, sin pasarse por
 * debajo: subir una octava entera y luego bajar otras cinco era un ejercicio
 * larguísimo para cantarlo de una tirada. Quien quiera más lo sube con "Sube" y
 * "Baja".
 */
export const VOICE_RANGES: VoiceRange[] = [
  { id: "soprano", label: "Soprano", start: 0, up: 5, down: 0 },
  { id: "mezzo", label: "Mezzo / Contralto", start: -5, up: 5, down: 0 },
  { id: "tenor", label: "Tenor", start: -12, up: 5, down: 0 },
  { id: "baritono", label: "Barítono / Bajo", start: -17, up: 5, down: 0 },
];

export const findVoiceRange = (id: string) =>
  VOICE_RANGES.find((range) => range.id === id) ?? VOICE_RANGES[0];

// --- Plan -------------------------------------------------------------

/** Lo que dura la última nota de cada vuelta, en pulsos. */
const LAST_BEATS = 2;
/**
 * Pulsos mínimos de espera después de la última nota, contando desde el
 * siguiente a ella. El segundo pulso de la última nota cuenta como espera: es
 * como lo cuenta quien canta, porque ahí ya no entra nada nuevo.
 */
const MIN_REST_BEATS = 3;

/**
 * El silencio entre vueltas. Cada vuelta dura un número par de pulsos (una por
 * nota más la espera), con al menos tres de espera; si con tres sale impar,
 * cuatro. Una vuelta de 7 pulsos se oía coja, porque el metrónomo y el cuerpo
 * cuentan de dos en dos. Así, la quinta abierta (3 notas) dura 6 y una de 4
 * notas dura 8.
 */
const gapBeatsFor = (notes: number) => {
  const rest = MIN_REST_BEATS + ((notes + MIN_REST_BEATS) % 2);
  // Lo que `buildPlan` llama silencio va después de los LAST_BEATS de la
  // última nota, que ya se comen uno de la espera.
  return rest - (LAST_BEATS - 1);
};

/** El plan de un ejercicio: el motor es el mismo que usa Rockschool. */
export const buildVocalPlan = (
  exercise: VocalExercise,
  roots: number[],
  bpm: number,
  mode: AccompanimentMode,
) =>
  buildPlan({
    pattern: exercise.pattern,
    roots,
    bpm,
    mode,
    lastBeats: LAST_BEATS,
    gapBeats: gapBeatsFor(exercise.pattern.length),
  });
