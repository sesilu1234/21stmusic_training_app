// Reto diario "Pulso": suena un ritmo y lo repites.
//
// Cada ronda: un compás de entrada con el metrónomo, el ritmo, otro compás de
// entrada y tu turno. Si lo clavas, la siguiente ronda es más difícil. Una
// vida, como el Eco. La puntuación es cuántas rondas has superado.
//
// Los ritmos salen del mismo motor que Lectura rítmica (lib/rhythm.ts), con
// sus mismos niveles: primero negras y blancas, luego corcheas, puntillo y
// síncopa, semicorcheas y tresillos. El azar va con semilla, así que el ritmo
// de cada ronda es el mismo para todo el mundo ese día, y el servidor lo puede
// volver a sacar para corregir (lib/ecoDb.ts).
//
// CÓMO SE CORRIGE, Y POR QUÉ ASÍ. No se mira la hora exacta de cada golpe,
// sino la forma del ritmo: las distancias entre golpes. Con auriculares
// Bluetooth el sonido llega 150-300 ms tarde, y midiendo contra el reloj
// todo el que lleve cascos fallaría siempre aunque tocara perfecto. Se busca
// el desplazamiento que mejor encaja tus golpes con el ritmo (la media de las
// diferencias) y, con eso quitado, cada golpe tiene que caer dentro de su
// margen. Además tiene que haber los mismos golpes que notas: ni de más ni de
// menos.

import { RHYTHM_LEVELS, TPQ, createRhythmScore } from "./rhythm";
import { rngFor, withSeededRandom } from "./seeded";

export const PULSO_MAX_ROUNDS = 30;

/** Pulsos de entrada antes del ritmo y antes de tu turno. */
export const PULSO_COUNT_IN = 4;

/** Silencio antes de que empiece a contar. */
export const PULSO_LEAD_IN = 0.6;

/** Lo que se espera después del último pulso para dar por acabado tu turno. */
export const PULSO_TAIL_BEATS = 0.75;

interface Step {
  level: string;
  measures: number;
  bpm: number;
}

/**
 * La escalera de dificultad. Se sube de figura a figura, y dentro de cada una
 * primero un compás y luego dos. A partir de aquí, todo mezclado y cada vez
 * algo más rápido.
 */
const STEPS: Step[] = [
  { level: "modulo1", measures: 1, bpm: 80 },
  { level: "modulo1", measures: 1, bpm: 90 },
  { level: "modulo2", measures: 1, bpm: 80 },
  { level: "modulo2", measures: 1, bpm: 90 },
  { level: "modulo2", measures: 2, bpm: 85 },
  { level: "modulo3", measures: 1, bpm: 80 },
  { level: "modulo3", measures: 2, bpm: 85 },
  { level: "modulo4", measures: 1, bpm: 70 },
  { level: "modulo4", measures: 2, bpm: 72 },
  { level: "modulo5", measures: 1, bpm: 75 },
  { level: "modulo5", measures: 2, bpm: 78 },
  { level: "modulo6", measures: 1, bpm: 72 },
];

export const pulsoStep = (round: number): Step =>
  round <= STEPS.length
    ? STEPS[round - 1]
    : { level: "modulo6", measures: 2, bpm: Math.min(110, 74 + 3 * (round - STEPS.length)) };

export interface PulsoPattern {
  bpm: number;
  measures: number;
  /** Segundos por pulso. */
  beat: number;
  /** Cuándo cae cada golpe, en segundos desde el principio del ritmo. */
  onsets: number[];
  /** Lo que dura el ritmo, en segundos. */
  seconds: number;
}

/** El ritmo de una ronda. `seedKey` es el día ("2026-10-25") o, practicando, uno al azar. */
export const pulsoPattern = (seedKey: string, round: number): PulsoPattern => {
  const step = pulsoStep(round);
  const level = RHYTHM_LEVELS.find((item) => item.slug === step.level) ?? RHYTHM_LEVELS[0];
  const score = withSeededRandom(rngFor(`pulso:${seedKey}:${round}`), () =>
    createRhythmScore(level, step.measures, { countIn: false }),
  );

  const secondsPerTick = 60 / step.bpm / TPQ;
  const onsets: number[] = [];
  let acc = 0;
  score.forEach((item) => {
    if (item.ticks === 0) return;
    if (item.kind === "note") onsets.push(acc * secondsPerTick);
    acc += item.ticks;
  });

  return {
    bpm: step.bpm,
    measures: step.measures,
    beat: 60 / step.bpm,
    onsets,
    seconds: acc * secondsPerTick,
  };
};

/** Lo que dura una ronda entera: entrada, ritmo, entrada y tu turno. */
export const pulsoRoundSeconds = (round: number) => {
  const step = pulsoStep(round);
  const beats = 2 * PULSO_COUNT_IN + 2 * step.measures * 4 + PULSO_TAIL_BEATS;
  return PULSO_LEAD_IN + (beats * 60) / step.bpm;
};

/** Lo mínimo que puede durar una partida con esta puntuación (ver lib/eco.ts). */
export const pulsoMinSeconds = (score: number) => {
  let total = 0;
  for (let round = 1; round <= Math.min(score + 1, PULSO_MAX_ROUNDS); round++) {
    total += pulsoRoundSeconds(round);
  }
  return total;
};

/**
 * El margen de cada golpe: proporcional a lo cerca que tiene a sus vecinos,
 * entre 60 y 140 ms. En una blanca hay sitio de sobra; en semicorcheas, no.
 */
const tolerance = (onsets: number[], index: number) => {
  const gaps = [
    index > 0 ? onsets[index] - onsets[index - 1] : Infinity,
    index < onsets.length - 1 ? onsets[index + 1] - onsets[index] : Infinity,
  ];
  const nearest = Math.min(...gaps);
  return Math.min(0.14, Math.max(0.06, Number.isFinite(nearest) ? nearest * 0.4 : 0.14));
};

/**
 * ¿Estos golpes son este ritmo? Los golpes, en segundos y con cualquier origen.
 *
 * Dos comprobaciones, y hacen falta las dos:
 *
 *   · Cada golpe en su sitio, una vez quitado el desplazamiento que mejor
 *     encaja (la media de las diferencias). Así no vale ir acelerando poco a
 *     poco aunque cada paso parezca bien.
 *   · Cada distancia entre dos golpes seguidos, parecida a la del ritmo. Con
 *     dos o tres golpes la media se reparte el error entre todos y un golpe
 *     claramente fuera pasaría; mirando las distancias, no.
 */
export const pulsoMatches = (onsets: number[], taps: number[]) => {
  if (!onsets.length || taps.length !== onsets.length) return false;
  const sorted = [...taps].sort((a, b) => a - b);
  const offset = sorted.reduce((sum, tap, i) => sum + (tap - onsets[i]), 0) / sorted.length;
  const placed = sorted.every((tap, i) => Math.abs(tap - offset - onsets[i]) <= tolerance(onsets, i));
  const spaced = sorted.every((tap, i) => {
    if (i === 0) return true;
    const expected = onsets[i] - onsets[i - 1];
    const margin = Math.min(0.14, Math.max(0.06, expected * 0.35));
    return Math.abs(tap - sorted[i - 1] - expected) <= margin;
  });
  return placed && spaced;
};

/** Cuántas rondas seguidas se han superado, desde la primera. `rounds[i]` = golpes de la ronda i+1. */
export const pulsoScore = (seedKey: string, rounds: number[][]) => {
  let score = 0;
  for (let round = 1; round <= Math.min(rounds.length, PULSO_MAX_ROUNDS); round++) {
    if (!pulsoMatches(pulsoPattern(seedKey, round).onsets, rounds[round - 1])) return score;
    score = round;
  }
  return score;
};
