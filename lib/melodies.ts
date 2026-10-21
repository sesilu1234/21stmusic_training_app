// Las melodías que crea el alumno en Vocalizaciones.
//
// Una melodía es lo mismo que un ejercicio: una lista de notas en semitonos
// desde la tónica, todas de un pulso. Por eso se cantan con el mismo motor,
// subiendo y bajando de medio tono, con el mismo acompañamiento y metrónomo.
// Se escriben tocándolas en un piano que empieza en Do, así que la tónica
// escrita es siempre Do y "Empieza en" la transporta.
//
// Aquí solo están los límites, el tipo y la conversión a ejercicio, que
// necesitan los dos lados. Leer y escribir está en `lib/melodiesDb.ts`, que es
// de servidor (lo mismo que se hizo con las notas).

import type { VocalExercise } from "./vocalizaciones";

/** Tope de melodías por alumno. */
export const MAX_MELODIES = 50;

/** Tope de notas por melodía: una frase, no una canción entera. */
export const MAX_MELODY_NOTES = 48;

export const MAX_MELODY_NAME = 40;

/** Las notas que se pueden escribir: las del piano del editor, Do4 a Si5. */
export const MELODY_LOWEST = 0;
export const MELODY_HIGHEST = 23;

export interface Melody {
  id: string;
  name: string;
  /** Semitonos desde Do4, uno por pulso. `null` = un pulso de silencio. */
  notes: (number | null)[];
  bpm: number;
}

/** Cuántas notas de verdad tiene, sin contar los silencios. */
export const soundingCount = (notes: (number | null)[]) =>
  notes.filter((note) => note !== null).length;

/** El ejercicio con el que se canta una melodía guardada. */
export const melodyExercise = (melody: Melody): VocalExercise => ({
  slug: `melodia-${melody.id}`,
  name: melody.name,
  desc: `${soundingCount(melody.notes)} notas. Tu melodía.`,
  group: "melodias",
  pattern: melody.notes,
  syllable: "la",
  bpm: melody.bpm,
});

/** ¿Es una melodía del alumno (y no una de las de ejemplo)? */
export const melodyIdOf = (exercise: VocalExercise) =>
  exercise.slug.startsWith("melodia-") ? exercise.slug.slice("melodia-".length) : null;
