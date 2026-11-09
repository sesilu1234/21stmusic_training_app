// Los retos diarios en la base de datos (tabla eco_plays: db/eco.sql y
// db/retos.sql). Guarda los dos retos, Eco y Pulso. De servidor.
//
// La validación es sencilla a propósito, y tiene dos patas:
//
//   1. La puntuación la cuenta el servidor. El navegador manda lo que se ha
//      pulsado, y aquí se vuelve a sacar la secuencia o el ritmo del día y se
//      cuenta cuántas rondas se han superado (lib/reto.ts). No se acepta un
//      "he hecho 30" a secas.
//   2. El tiempo lo mide el servidor. La partida se apunta al pulsar
//      "Empezar"; cada vez que llega una puntuación se comprueba que haya
//      pasado al menos lo que tardan en sonar esas rondas. Por debajo, no vale.
//
// La puntuación se va guardando al superar cada ronda, no solo al acabar: si
// se recarga o se cierra a media partida, cuenta lo que se llevaba hecho.

import "server-only";

import { retoMinSeconds, retoScore, type RetoKind } from "./reto";
import { listHonorStudents } from "./students";
import { getSupabaseAdmin } from "./supabaseAdmin";

/** Margen sobre el tiempo mínimo: el reloj del audio y el del servidor no son el mismo. */
const TIME_SLACK = 0.85;

export interface EcoPlay {
  startedAt: string;
  /** Null mientras se juega (o si se cortó sin terminar). */
  finishedAt: string | null;
  /** Lo superado hasta ahora. Null si todavía no ha superado ninguna ronda. */
  score: number | null;
}

interface EcoRow {
  student_email: string;
  started_at: string;
  finished_at: string | null;
  score: number | null;
}

const COLUMNS = "student_email, started_at, finished_at, score";

const toPlay = (row: EcoRow): EcoPlay => ({
  startedAt: row.started_at,
  finishedAt: row.finished_at,
  score: row.score,
});

export const getEcoPlay = async (email: string, day: string, kind: RetoKind): Promise<EcoPlay | null> => {
  const { data, error } = await getSupabaseAdmin()
    .from("eco_plays")
    .select(COLUMNS)
    .eq("student_email", email)
    .eq("day", day)
    .eq("kind", kind)
    .maybeSingle<EcoRow>();

  if (error) throw new Error(`No se ha podido leer el reto: ${error.message}`);
  return data ? toPlay(data) : null;
};

/** Las partidas de hoy de los dos retos, de una vez. */
export const getTodayPlays = async (
  email: string,
  day: string,
): Promise<Record<RetoKind, EcoPlay | null>> => {
  const { data, error } = await getSupabaseAdmin()
    .from("eco_plays")
    .select(`${COLUMNS}, kind`)
    .eq("student_email", email)
    .eq("day", day)
    .returns<(EcoRow & { kind: RetoKind })[]>();

  if (error) throw new Error(`No se han podido leer los retos: ${error.message}`);
  const find = (kind: RetoKind) => {
    const row = (data ?? []).find((item) => item.kind === kind);
    return row ? toPlay(row) : null;
  };
  return { eco: find("eco"), pulso: find("pulso") };
};

/**
 * Apunta que empieza la partida de hoy de un reto. Si ya había una, devuelve
 * esa y no crea otra: es el "un intento al día".
 */
export const startEcoPlay = async (
  email: string,
  day: string,
  kind: RetoKind,
): Promise<{ play: EcoPlay; isNew: boolean }> => {
  const { data, error } = await getSupabaseAdmin()
    .from("eco_plays")
    .insert({ student_email: email, day, kind })
    .select(COLUMNS)
    .single<EcoRow>();

  if (!error && data) return { play: toPlay(data), isNew: true };

  // 23505 = ya existe la fila: ya había empezado hoy.
  if (error?.code === "23505") {
    const existing = await getEcoPlay(email, day, kind);
    if (existing) return { play: existing, isNew: false };
  }
  throw new Error(`No se ha podido empezar el reto: ${error?.message ?? "sin respuesta"}`);
};

/**
 * La puntuación de lo recibido, o 0 si es imposible en el tiempo que ha pasado.
 *
 * Al acabar ya ha sonado también la ronda que se falló, así que cuenta en el
 * mínimo. A media partida (`final` a false), no: la siguiente aún no ha sonado.
 */
const validScore = (kind: RetoKind, day: string, play: EcoPlay, payload: unknown, final: boolean) => {
  const score = retoScore(kind, day, payload);
  const elapsed = (Date.now() - new Date(play.startedAt).getTime()) / 1000;
  const needed = final ? retoMinSeconds(kind, score) : score > 0 ? retoMinSeconds(kind, score - 1) : 0;
  if (elapsed < needed * TIME_SLACK) {
    console.warn(`[reto] ${kind}: puntuación imposible (${score} en ${elapsed.toFixed(1)} s): no vale.`);
    return 0;
  }
  return score;
};

/**
 * Guarda lo que se lleva hecho, a media partida. Solo sube: una puntuación
 * más baja que la guardada (una pestaña vieja) no la pisa.
 */
export const progressEcoPlay = async (email: string, day: string, kind: RetoKind, payload: unknown) => {
  const play = await getEcoPlay(email, day, kind);
  if (!play || play.finishedAt) return;

  const score = validScore(kind, day, play, payload, false);
  if (score <= (play.score ?? -1)) return;

  const { error } = await getSupabaseAdmin()
    .from("eco_plays")
    .update({ score })
    .eq("student_email", email)
    .eq("day", day)
    .eq("kind", kind)
    .is("finished_at", null)
    .or(`score.is.null,score.lt.${score}`);

  if (error) throw new Error(`No se ha podido guardar el avance: ${error.message}`);
};

/**
 * Cierra la partida de hoy con todo lo pulsado. Devuelve la partida como queda
 * guardada (si ya estaba cerrada, la de antes, sin tocarla).
 */
export const finishEcoPlay = async (
  email: string,
  day: string,
  kind: RetoKind,
  payload: unknown,
): Promise<EcoPlay | null> => {
  const play = await getEcoPlay(email, day, kind);
  if (!play) return null;
  if (play.finishedAt) return play;

  // Lo guardado a media partida ya pasó la comprobación: no se pierde.
  const score = Math.max(play.score ?? 0, validScore(kind, day, play, payload, true));

  const { data, error } = await getSupabaseAdmin()
    .from("eco_plays")
    .update({ finished_at: new Date().toISOString(), score })
    .eq("student_email", email)
    .eq("day", day)
    .eq("kind", kind)
    .is("finished_at", null)
    .select(COLUMNS)
    .maybeSingle<EcoRow>();

  if (error) throw new Error(`No se ha podido guardar el reto: ${error.message}`);
  // Si otra pestaña la cerró a la vez, vale la que llegó primero.
  return data ? toPlay(data) : getEcoPlay(email, day, kind);
};

export interface EcoRankRow {
  rank: number;
  name: string;
  score: number;
  isMe: boolean;
}

export interface EcoDayBoard {
  /** Los diez primeros de hoy, entre los que salen en el cuadro. */
  top: EcoRankRow[];
  /** El puesto de quien mira entre los que salen. 0 = todavía sin puntuación hoy. */
  myRank: number;
  /** Cuántos tienen puntuación hoy. */
  players: number;
}

/** Cuántos salen en el top del reto. */
export const ECO_TOP = 10;

/**
 * El ranking de un reto en un día. Cuenta toda partida con puntuación, también
 * las que se cortaron a medias (con lo que llevaban). En la tabla solo salen
 * quienes salen en el cuadro de honor: quien se ha quitado no sale en ningún
 * ranking, pero a él se le dice qué puesto tendría.
 *
 * Con la misma puntuación se comparte puesto y se ordena por nombre: ordenar
 * por quién acabó antes premiaría madrugar, no tocar mejor.
 */
export const getEcoDayBoard = async (
  day: string,
  kind: RetoKind,
  viewerEmail: string | null,
): Promise<EcoDayBoard> => {
  const [{ data, error }, listed] = await Promise.all([
    getSupabaseAdmin()
      .from("eco_plays")
      .select(COLUMNS)
      .eq("day", day)
      .eq("kind", kind)
      .not("score", "is", null)
      .order("score", { ascending: false })
      .limit(1000)
      .returns<EcoRow[]>(),
    listHonorStudents(),
  ]);

  if (error) throw new Error(`No se ha podido leer el ranking del reto: ${error.message}`);

  const names = new Map(listed.map((student) => [student.email, student.displayName.trim()]));
  const rows = (data ?? [])
    .filter((row) => names.has(row.student_email))
    .sort(
      (a, b) =>
        (b.score ?? 0) - (a.score ?? 0) ||
        names.get(a.student_email)!.localeCompare(names.get(b.student_email)!, "es"),
    );

  const ranked: EcoRankRow[] = [];
  rows.forEach((row, index) => {
    const previous = ranked[index - 1];
    const score = row.score ?? 0;
    ranked.push({
      rank: previous && previous.score === score ? previous.rank : index + 1,
      name: names.get(row.student_email)!,
      score,
      isMe: row.student_email === viewerEmail,
    });
  });

  const mine = (data ?? []).find((row) => row.student_email === viewerEmail);
  const myScore = mine?.score ?? 0;
  const myRank = mine
    ? rows.filter((row) => row.student_email !== viewerEmail && (row.score ?? 0) > myScore).length + 1
    : 0;

  return { top: ranked.slice(0, ECO_TOP), myRank, players: (data ?? []).length };
};
