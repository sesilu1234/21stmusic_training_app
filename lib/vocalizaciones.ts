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
  | "agilidad";

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
];

export interface VocalExercise {
  slug: string;
  name: string;
  /** Una línea de qué se trabaja. */
  desc: string;
  group: VocalGroupId;
  /** El patrón, en semitonos desde la tónica. */
  pattern: number[];
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
];

export const exercisesOfGroup = (group: VocalGroupId) =>
  VOCAL_EXERCISES.filter((exercise) => exercise.group === group);

export const findExercise = (slug: string) =>
  VOCAL_EXERCISES.find((exercise) => exercise.slug === slug) ?? VOCAL_EXERCISES[0];

/** Cuánto se separan la nota más grave y la más aguda del patrón. */
export const exerciseSpan = (exercise: VocalExercise) =>
  Math.max(...exercise.pattern) - Math.min(...exercise.pattern);

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
 */
export const VOICE_RANGES: VoiceRange[] = [
  { id: "soprano", label: "Soprano", start: 0, up: 12, down: 5 },
  { id: "mezzo", label: "Mezzo / Contralto", start: -5, up: 12, down: 5 },
  { id: "tenor", label: "Tenor", start: -12, up: 12, down: 5 },
  { id: "baritono", label: "Barítono / Bajo", start: -17, up: 12, down: 5 },
];

export const findVoiceRange = (id: string) =>
  VOICE_RANGES.find((range) => range.id === id) ?? VOICE_RANGES[0];

// --- Plan -------------------------------------------------------------

/** El plan de un ejercicio: el motor es el mismo que usa Rockschool. */
export const buildVocalPlan = (
  exercise: VocalExercise,
  roots: number[],
  bpm: number,
  mode: AccompanimentMode,
) => buildPlan({ pattern: exercise.pattern, roots, bpm, mode });
