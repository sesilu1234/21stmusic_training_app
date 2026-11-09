// Reto diario "Eco": un Simon con sonido.
//
// Suena una nota, la repites; suenan dos, las repites; y así hasta el primer
// fallo. La secuencia es la misma para todo el mundo el mismo día: sale de la
// fecha de Madrid con un azar con semilla (lib/seeded.ts), así que ni se
// guarda ni hace falta pedírsela al servidor.
//
// Este archivo lo usan los dos lados a propósito. El navegador lo usa para
// tocar; el servidor, para volver a sacar la misma secuencia y contar él solo
// cuántas notas se han acertado (ver lib/ecoDb.ts). Por eso aquí no hay nada
// de base de datos ni de audio.

import { rngFor } from "./seeded";

/** El día del Eco #1. A partir de ahí, uno por día. */
export const ECO_LAUNCH = "2026-10-24";

/**
 * Hasta qué ronda se ilumina el quesito de la nota que suena. Después, solo
 * oído. Con tres se entiende cómo va y enseguida pasa a ser de oído, que es
 * lo que se entrena.
 */
export const ECO_VISUAL_ROUNDS = 3;

/** Ninguna partida pasa de aquí. Es un tope, no una meta: nadie llega. */
export const ECO_MAX_ROUNDS = 60;

export interface EcoNote {
  name: string;
  /** Semitono, 0 = Do central (el mismo cero que app/play/oido/audio.ts). */
  semitone: number;
  /** Color del quesito. Clases fijas: Tailwind necesita el texto entero. */
  fill: string;
  lit: string;
}

/** Do pentatónica: do re mi sol la. Cinco notas que nunca suenan mal juntas. */
export const ECO_NOTES: EcoNote[] = [
  { name: "Do", semitone: 0, fill: "#b45309", lit: "#fcd34d" },
  { name: "Re", semitone: 2, fill: "#be123c", lit: "#fda4af" },
  { name: "Mi", semitone: 4, fill: "#6d28d9", lit: "#c4b5fd" },
  { name: "Sol", semitone: 7, fill: "#0369a1", lit: "#7dd3fc" },
  { name: "La", semitone: 9, fill: "#047857", lit: "#6ee7b7" },
];

/**
 * La secuencia del día: índices de ECO_NOTES. La ronda N toca las N primeras.
 * `day` es la fecha ("2026-10-25") o, practicando, una clave al azar.
 *
 * No deja la misma nota tres veces seguidas: no es que sea imposible, es que
 * tres iguales se oyen como un error del juego y no como un reto.
 */
export const ecoSequence = (day: string): number[] => {
  const rng = rngFor(`eco:${day}`);
  const out: number[] = [];
  while (out.length < ECO_MAX_ROUNDS) {
    const note = Math.floor(rng() * ECO_NOTES.length);
    const n = out.length;
    if (n >= 2 && out[n - 1] === note && out[n - 2] === note) continue;
    out.push(note);
  }
  return out;
};

/**
 * Segundos entre nota y nota en una ronda. Empieza tranquilo y cada ronda va
 * un poco más deprisa, hasta un suelo en el que todavía da tiempo a oírlas.
 */
export const ecoGap = (round: number) => Math.max(0.3, 0.68 - 0.028 * (round - 1));

/** Silencio antes de la primera nota de cada ronda. */
export const ECO_LEAD_IN = 0.75;

/** Lo que tarda en sonar una ronda entera, de principio a fin. */
export const ecoRoundSeconds = (round: number) => ECO_LEAD_IN + round * ecoGap(round);

/**
 * Lo mínimo que puede durar una partida con esta puntuación: el tiempo de oír
 * todas las rondas jugadas, incluida la que se falló. Es la comprobación del
 * servidor: once notas en diez segundos no las ha tocado nadie.
 */
export const ecoMinSeconds = (score: number) => {
  let total = 0;
  for (let round = 1; round <= Math.min(score + 1, ECO_MAX_ROUNDS); round++) {
    total += ecoRoundSeconds(round);
  }
  return total;
};

/**
 * La puntuación de unas pulsaciones: cuántas rondas se han repetido enteras.
 *
 * `taps` son todas las pulsaciones de la partida seguidas, ronda tras ronda.
 * Se cuenta igual que se juega: en la ronda N hay que repetir las N primeras;
 * al primer fallo, se acaba. Si se acaban las pulsaciones a media ronda, esa
 * ronda no cuenta.
 */
export const ecoScore = (sequence: number[], taps: number[]) => {
  let index = 0;
  let score = 0;
  for (let round = 1; round <= Math.min(ECO_MAX_ROUNDS, sequence.length); round++) {
    for (let k = 0; k < round; k++) {
      if (index >= taps.length) return score;
      if (taps[index] !== sequence[k]) return score;
      index++;
    }
    score = round;
  }
  return score;
};
