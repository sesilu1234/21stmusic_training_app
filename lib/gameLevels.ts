// Cuántos niveles tiene cada modo, y cuáles.
//
// Esto no existía, y su ausencia se notaba en un sitio concreto: el panel de
// progreso deducía los niveles de un modo a partir de las partidas jugadas, así
// que "he jugado uno de seis y lo he bordado" y "me los sé los seis" daban el
// mismo 100%. No era una decisión, era que no había entre qué otra cosa
// dividir. Con esta lista la barra de un modo puede significar de verdad
// "cuánto llevo dominado", que es lo que la gente cree que está leyendo.
//
// Las claves son el `slug` del modo en `games.ts`. Los valores son los niveles
// TAL Y COMO SE GUARDAN en las partidas: lo que queda de la ruta después del
// slug del modo (ver `gameFromPath`). Por eso los de acordes en el pentagrama
// llevan el "nombrar/" y el "escribir/" delante — así es como llegan a la base
// de datos, y compararlos sin el prefijo no casaría con nada.
//
// Los modos de una sola pantalla (armaduras, modos griegos, trivia, diapasón…)
// no salen aquí a propósito: no tienen niveles, sus partidas se guardan sin
// `level_slug`, y para ellos la barra es sencillamente su récord.

import { CHORD_LEVELS, PROGRESSION_LEVELS } from "./chordEar";
import { PAIR_LEVELS } from "./chordPair";
import { MELODY_LEVELS } from "./melodyEar";
import { NOTE_READING_LEVELS } from "./noteReading";
import { ACORDE_NIVELES, ESCALA_NIVELES } from "./noteSpelling";
import { CHORD_BUILD_LEVELS, SCALE_BUILD_LEVELS } from "./pianoBuild";
import { PIANO_INTERVAL_LEVELS } from "./pianoIntervals";
import { PIANO_NOTE_LEVELS } from "./pianoNotes";
import { RHYTHM_LEVELS } from "./rhythm";
import { CHORD_NAME_LEVELS, CHORD_SPELL_LEVELS } from "./staffChords";
import { STAFF_INTERVAL_LEVELS } from "./staffIntervals";
import { TRIVIA_TOPICS } from "./trivia";
import { CLAVE_LEVELS } from "@/app/play/armadura/notes_images";

const slugs = (levels: { slug: string }[]) => levels.map((level) => level.slug);

/** Modo → niveles que tiene, en el orden en que se ofrecen. */
export const GAME_LEVELS: Record<string, string[]> = {
  "/play/lectura-notas": slugs(NOTE_READING_LEVELS),

  // Hasta octubre de 2026 era una pantalla sola; sus partidas de entonces
  // están en el nivel 2, que es lo mismo que se jugaba (db/intervalos_niveles.sql).
  "/play/intervalos": slugs(STAFF_INTERVAL_LEVELS),

  // Dos submodos, cada uno con sus niveles, y las partidas se guardan con el
  // submodo delante. Cuentan todos: dominar el modo es saber leer los acordes
  // y saber escribirlos.
  "/play/acordes-pentagrama": [
    ...CHORD_NAME_LEVELS.map((level) => `nombrar/${level.slug}`),
    ...CHORD_SPELL_LEVELS.map((level) => `escribir/${level.slug}`),
  ],

  // Construye el intervalo no sale aquí: es una pantalla sola, sin niveles.
  "/play/construye-escalas": slugs(ESCALA_NIVELES),
  "/play/construye-acordes": slugs(ACORDE_NIVELES),

  // Igual que intervalos: dos pantallas y ya. Faltaba, y no por olvido: sus dos
  // pantallas vivían en /play/acordes/, fuera del árbol del modo, así que
  // `gameFromPath` no las reconocía y sus partidas no se guardaban. Al no
  // llegar ninguna a la base de datos, el modo parecía de una sola pantalla.
  "/play/diapason_acordes": ["triadas", "septimas"],

  // Tres, por la clave con la que se juega. Antes la clave se elegía con un
  // botón sin cambiar de dirección, así que las tres partidas se guardaban
  // como el mismo nivel y una sola perfecta daba el modo por dominado.
  "/play/armadura": CLAVE_LEVELS.map((level) => level.slug),

  "/play/ritmo": slugs(RHYTHM_LEVELS),

  // Melódicos y armónicos, con todos los intervalos: lo elegido a mano es
  // práctica y no se guarda (lib/earIntervals.ts). Hasta octubre de 2026
  // tenían cuatro niveles cada uno (db/oido_sin_niveles.sql).
  "/play/oido": ["intervalos", "armonico"],
  "/play/oido/acordes": [...slugs(CHORD_LEVELS), ...slugs(PAIR_LEVELS)],
  "/play/oido/progresiones": slugs(PROGRESSION_LEVELS),
  "/play/oido/dictado": slugs(MELODY_LEVELS),

  "/play/piano/notas": slugs(PIANO_NOTE_LEVELS),
  "/play/piano/intervalos": slugs(PIANO_INTERVAL_LEVELS),
  "/play/piano/reconocer-intervalos": slugs(PIANO_INTERVAL_LEVELS),
  "/play/piano/acordes": slugs(CHORD_BUILD_LEVELS),
  "/play/piano/escalas": slugs(SCALE_BUILD_LEVELS),

  // Los temas del trivial son niveles como los demás. Antes el modo no tenía
  // ninguno: una sola pantalla con todas las preguntas revueltas, y la medalla
  // se sacaba haciendo pleno en 24 cogidas al azar de todas las que hubiera.
  // Por temas hay que hacer pleno en cada uno.
  "/play/trivia": slugs(TRIVIA_TOPICS),
};

/**
 * Cuántos niveles tiene un modo, o null si no lo sabemos.
 *
 * El null importa: significa "este modo no tiene niveles o todavía no está en
 * la lista", y quien pregunta tiene que seguir con lo que hacía antes en vez de
 * dividir entre un total inventado. Un modo nuevo que se olvide de apuntarse
 * aquí se comporta como siempre, no enseña un porcentaje falso.
 */
export const levelCountOf = (gameSlug: string): number | null =>
  GAME_LEVELS[gameSlug]?.length ?? null;
