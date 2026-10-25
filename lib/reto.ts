// Los retos diarios: lo que tienen en común Eco (memoria y oído) y Pulso
// (ritmo). Cada día hay uno de cada, con su intento y su ranking.
//
// Sirve en los dos lados: el navegador lo usa para pintar y el servidor para
// puntuar (lib/ecoDb.ts). Nada de base de datos ni de audio aquí.

import { ECO_LAUNCH, ECO_MAX_ROUNDS, ecoMinSeconds, ecoScore, ecoSequence } from "./eco";
import { daysBetween } from "./madrid";
import { PULSO_MAX_ROUNDS, pulsoMinSeconds, pulsoScore } from "./pulso";

export type RetoKind = "eco" | "pulso";

export const RETO_KINDS: RetoKind[] = ["eco", "pulso"];

export const isRetoKind = (value: unknown): value is RetoKind => value === "eco" || value === "pulso";

export const RETOS: Record<
  RetoKind,
  { name: string; symbol: string; emoji: string; launch: string; tagline: string }
> = {
  eco: {
    name: "Eco",
    symbol: "⬠",
    emoji: "🎵",
    launch: ECO_LAUNCH,
    tagline: "Escucha las notas y repítelas",
  },
  pulso: {
    name: "Pulso",
    symbol: "🥁",
    emoji: "🥁",
    launch: "2026-10-25",
    tagline: "Escucha el ritmo y repítelo",
  },
};

/** Nº del reto de un día: el del lanzamiento de cada uno es el #1. */
export const retoNumber = (kind: RetoKind, day: string) => daysBetween(RETOS[kind].launch, day) + 1;

/** "11 notas", "4 ritmos". */
export const scoreLabel = (kind: RetoKind, score: number) =>
  kind === "eco"
    ? `${score} ${score === 1 ? "nota" : "notas"}`
    : `${score} ${score === 1 ? "ritmo" : "ritmos"}`;

/** Lo que se comparte: "🎵 Eco #47 · 11 notas ⬠". */
export const retoShareText = (kind: RetoKind, day: string, score: number) => {
  const reto = RETOS[kind];
  return `${reto.emoji} ${reto.name} #${retoNumber(kind, day)} · ${scoreLabel(kind, score)} ${reto.symbol}`;
};

/**
 * La puntuación de lo que manda el navegador, contada aquí. Lo que llega se
 * limpia antes: nada se toma por bueno.
 *
 *   · Eco: todas las pulsaciones seguidas, como índices del 0 al 4.
 *   · Pulso: los golpes de cada ronda, en segundos.
 */
export const retoScore = (kind: RetoKind, day: string, payload: unknown): number => {
  if (!Array.isArray(payload)) return 0;

  if (kind === "eco") {
    const maxTaps = (ECO_MAX_ROUNDS * (ECO_MAX_ROUNDS + 1)) / 2;
    const taps = payload
      .slice(0, maxTaps)
      .map(Number)
      .filter((tap) => Number.isInteger(tap) && tap >= 0 && tap <= 4);
    return ecoScore(ecoSequence(day), taps);
  }

  const rounds = payload.slice(0, PULSO_MAX_ROUNDS).map((round) =>
    Array.isArray(round)
      ? round
          .slice(0, 80)
          .map(Number)
          .filter((tap) => Number.isFinite(tap))
      : [],
  );
  return pulsoScore(day, rounds);
};

/** Lo mínimo que puede durar una partida con esta puntuación. */
export const retoMinSeconds = (kind: RetoKind, score: number) =>
  kind === "eco" ? ecoMinSeconds(score) : pulsoMinSeconds(score);
