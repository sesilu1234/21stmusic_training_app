// Lo que se enseña al acabar un reto, o al volver a entrar si ya se jugó hoy.
// De servidor: aparte de app/reto/actions.ts para que no sea una acción que
// cualquiera pueda llamar con el correo de otro.

import "server-only";

import type { EcoCardStatus } from "@/app/components/EcoCard";
import { getEcoDayBoard, getTodayPlays, type EcoPlay, type EcoRankRow } from "./ecoDb";
import { nextMadridMidnight } from "./madrid";
import { RETO_KINDS, retoNumber, type RetoKind } from "./reto";

export interface EcoResult {
  kind: RetoKind;
  day: string;
  number: number;
  score: number;
  /** Se cortó a media partida (se recargó, se cerró): cuenta lo que llevaba. */
  unfinished: boolean;
  /** Puesto de hoy entre los que salen. 0 = sin puesto. */
  rank: number;
  /** false = se ha quitado del cuadro: el puesto es el que tendría. */
  listed: boolean;
  players: number;
  top: EcoRankRow[];
  /** Cuándo sale el siguiente (medianoche de Madrid), ISO. */
  nextAt: string;
}

export const buildEcoResult = async (
  email: string,
  listed: boolean,
  kind: RetoKind,
  day: string,
  play: EcoPlay,
): Promise<EcoResult> => {
  const board = await getEcoDayBoard(day, kind, email).catch(() => ({ top: [], myRank: 0, players: 0 }));
  return {
    kind,
    day,
    number: retoNumber(kind, day),
    score: play.score ?? 0,
    unfinished: !play.finishedAt,
    rank: board.myRank,
    listed,
    players: board.players,
    top: board.top,
    nextAt: nextMadridMidnight().toISOString(),
  };
};

/**
 * Cómo le va hoy a alguien en cada reto, para las tarjetas de la portada y de
 * /reto. Sin sesión, las dos invitan a entrar. Si la base de datos falla, se
 * enseñan como sin jugar: las tarjetas son una invitación, no un dato crítico.
 */
export const retoStatuses = async (
  student: { email: string; showInHonor: boolean } | null,
  day: string,
): Promise<Record<RetoKind, EcoCardStatus>> => {
  if (!student) return { eco: { kind: "guest" }, pulso: { kind: "guest" } };

  const plays = await getTodayPlays(student.email, day).catch(() => ({ eco: null, pulso: null }));
  const entries = await Promise.all(
    RETO_KINDS.map(async (kind): Promise<[RetoKind, EcoCardStatus]> => {
      const play = plays[kind];
      if (!play) return [kind, { kind: "todo" }];
      const score = play.score ?? 0;
      if (!play.finishedAt) return [kind, { kind: "unfinished", score }];
      const board = await getEcoDayBoard(day, kind, student.email).catch(() => null);
      return [kind, { kind: "done", score, rank: board?.myRank ?? 0, listed: student.showInHonor }];
    }),
  );
  return Object.fromEntries(entries) as Record<RetoKind, EcoCardStatus>;
};
