// El progreso del alumno: qué ha jugado, cómo le ha ido y cuántos días
// seguidos lleva.
//
// Solo hay una tabla de verdad, `game_attempts`: una fila por partida
// terminada. Las rachas, las medias y los récords no se guardan — se calculan
// aquí desde esas filas. Un dato guardado dos veces es un dato que algún día no
// cuadra.
//
// Todo esto es de servidor: usa la service role key de Supabase, igual que
// lib/students.ts. No se importa desde un componente de cliente.

import { GAMES, type GameMode } from "./games";
import { getSupabaseAdmin } from "./supabaseAdmin";

/** Partidas que se traen para calcular el panel. */
const HISTORY_LIMIT = 600;

/**
 * Una medalla es un pleno, pero solo cuenta desde 24 preguntas.
 *
 * Si valiera con 12, la medalla se sacaría en dos minutos y dejaría de
 * significar nada. La partida corta sigue sirviendo para practicar.
 */
export const MEDAL_MIN_TOTAL = 24;

/** La zona horaria de la escuela: es la que decide qué día es "hoy". */
const TIME_ZONE = "Europe/Madrid";

/** El día natural de una fecha, en Madrid: "2026-08-26". */
export const dayKey = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: TIME_ZONE }).format(date);

export interface AttemptRow {
  game_name: string;
  level_slug: string | null;
  correct: number;
  total: number;
  created_at: string;
}

export interface Attempt {
  gameName: string;
  levelSlug: string | null;
  correct: number;
  total: number;
  createdAt: string;
}

export interface GameProgress {
  game: GameMode;
  attempts: number;
  /** El mejor porcentaje conseguido, de 0 a 100. */
  best: number;
  /** Media de aciertos de todas las partidas, de 0 a 100. */
  average: number;
  correct: number;
  questions: number;
  lastPlayedAt: string | null;
  hasMedal: boolean;
  /** Lo mismo, partido por niveles. Vacío en los modos que no tienen. */
  levels: {
    slug: string;
    attempts: number;
    best: number;
    lastPlayedAt: string | null;
  }[];
}

export interface Streak {
  /** Días seguidos jugando, contando hasta hoy. */
  current: number;
  /** La racha más larga que ha llegado a tener. */
  best: number;
  /** true si hoy ya ha jugado: es lo que decide si la racha sigue viva. */
  playedToday: boolean;
  /** Los días naturales en que ha jugado, del más reciente al más antiguo. */
  days: string[];
}

export interface Progress {
  attempts: number;
  questions: number;
  correct: number;
  /** Media global de aciertos, de 0 a 100. */
  accuracy: number;
  medals: number;
  streak: Streak;
  games: GameProgress[];
  recent: Attempt[];
}

const percent = (correct: number, total: number) =>
  total > 0 ? Math.round((correct / total) * 100) : 0;

/**
 * La racha, a partir de los días en que hubo alguna partida.
 *
 * Se cuenta hacia atrás desde hoy. Si hoy todavía no ha jugado, la racha de
 * ayer sigue viva —hasta que acabe el día no se ha roto nada—, pero se marca
 * `playedToday: false` para poder decírselo.
 */
export const streakFrom = (days: string[], today = dayKey(new Date())): Streak => {
  const unique = [...new Set(days)].sort().reverse();
  if (!unique.length) return { current: 0, best: 0, playedToday: false, days: [] };

  const dayBefore = (day: string) => {
    const date = new Date(`${day}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  };

  const playedToday = unique[0] === today;
  const yesterday = dayBefore(today);

  let current = 0;
  if (playedToday || unique[0] === yesterday) {
    current = 1;
    for (let i = 1; i < unique.length; i++) {
      if (unique[i] !== dayBefore(unique[i - 1])) break;
      current++;
    }
  }

  let best = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    run = unique[i] === dayBefore(unique[i - 1]) ? run + 1 : 1;
    best = Math.max(best, run);
  }

  return { current, best, playedToday, days: unique };
};

/** Todo el progreso de un alumno, listo para pintar. */
export const getProgress = async (email: string): Promise<Progress> => {
  const supabase = getSupabaseAdmin();

  const [attemptsResult, medalsResult] = await Promise.all([
    supabase
      .from("game_attempts")
      .select("game_name, level_slug, correct, total, created_at")
      .eq("student_email", email)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase.from("student_medals").select("game_name").eq("student_email", email),
  ]);

  if (attemptsResult.error) {
    throw new Error(`No se ha podido leer el progreso: ${attemptsResult.error.message}`);
  }

  const rows = (attemptsResult.data ?? []) as AttemptRow[];
  const medals = new Set(
    (medalsResult.data ?? []).map((row: { game_name: string }) => row.game_name),
  );

  const attempts: Attempt[] = rows.map((row) => ({
    gameName: row.game_name,
    levelSlug: row.level_slug,
    correct: row.correct,
    total: row.total,
    createdAt: row.created_at,
  }));

  // Los modos salen en el orden del catálogo, y solo los que se han jugado
  // alguna vez o tienen medalla: un panel lleno de ceros no dice nada.
  const games: GameProgress[] = GAMES.map((game) => {
    const mine = attempts.filter((attempt) => attempt.gameName === game.name);
    const correct = mine.reduce((sum, attempt) => sum + attempt.correct, 0);
    const questions = mine.reduce((sum, attempt) => sum + attempt.total, 0);

    const levelSlugs = [
      ...new Set(mine.map((attempt) => attempt.levelSlug).filter(Boolean)),
    ] as string[];

    return {
      game,
      attempts: mine.length,
      best: Math.max(0, ...mine.map((attempt) => percent(attempt.correct, attempt.total))),
      average: percent(correct, questions),
      correct,
      questions,
      lastPlayedAt: mine[0]?.createdAt ?? null,
      hasMedal: medals.has(game.name),
      levels: levelSlugs
        .map((slug) => {
          const ofLevel = mine.filter((attempt) => attempt.levelSlug === slug);
          return {
            slug,
            attempts: ofLevel.length,
            best: Math.max(
              0,
              ...ofLevel.map((attempt) => percent(attempt.correct, attempt.total)),
            ),
            lastPlayedAt: ofLevel[0]?.createdAt ?? null,
          };
        })
        .sort((a, b) => b.attempts - a.attempts),
    };
  }).filter((entry) => entry.attempts > 0 || entry.hasMedal);

  const correct = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
  const questions = attempts.reduce((sum, attempt) => sum + attempt.total, 0);

  return {
    attempts: attempts.length,
    questions,
    correct,
    accuracy: percent(correct, questions),
    medals: medals.size,
    streak: streakFrom(attempts.map((attempt) => dayKey(new Date(attempt.createdAt)))),
    games,
    recent: attempts.slice(0, 12),
  };
};

export interface SaveResult {
  /** false = no había sesión, o el modo no puntúa. La partida no se guarda. */
  saved: boolean;
  /** true si esta partida ha estrenado la medalla del modo. */
  newMedal: boolean;
  /** Días seguidos jugando, ya contando esta partida. */
  streak: number;
}

const NOT_SAVED: SaveResult = { saved: false, newMedal: false, streak: 0 };

/**
 * Guarda una partida terminada.
 *
 * Ojo con lo que llega: `correct` y `total` los manda el navegador, así que un
 * alumno con la consola abierta puede inventarse un pleno. Se comprueba lo que
 * se puede comprobar aquí (que el modo exista, que puntúe, que los números
 * tengan sentido), pero la solución de verdad es que las preguntas las reparta
 * y las corrija el servidor. Está apuntado en toDo.md.
 */
export const recordAttempt = async (input: {
  email: string;
  gameName: string;
  levelSlug: string | null;
  correct: number;
  total: number;
}): Promise<SaveResult> => {
  const game = GAMES.find((item) => item.name === input.gameName);
  if (!game?.scored) return NOT_SAVED;

  const total = Math.floor(input.total);
  const correct = Math.floor(input.correct);
  if (!Number.isFinite(total) || total < 1 || total > 200) return NOT_SAVED;
  if (!Number.isFinite(correct) || correct < 0 || correct > total) return NOT_SAVED;

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("game_attempts").insert({
    student_email: input.email,
    game_name: game.name,
    level_slug: input.levelSlug,
    correct,
    total,
  });

  if (error) throw new Error(`No se ha podido guardar la partida: ${error.message}`);

  // La medalla es de pleno, y solo desde partida larga.
  let newMedal = false;
  if (correct === total && total >= MEDAL_MIN_TOTAL) {
    const { data } = await supabase
      .from("student_medals")
      .upsert(
        { student_email: input.email, game_name: game.name },
        { onConflict: "student_email,game_name", ignoreDuplicates: true },
      )
      .select("id");

    // upsert con ignoreDuplicates devuelve filas solo cuando ha insertado de
    // verdad: es la manera de saber si la medalla es nueva o ya la tenía.
    newMedal = Boolean(data?.length);
  }

  const { data: days } = await supabase
    .from("game_attempts")
    .select("created_at")
    .eq("student_email", input.email)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const streak = streakFrom(
    (days ?? []).map((row: { created_at: string }) => dayKey(new Date(row.created_at))),
  );

  return { saved: true, newMedal, streak: streak.current };
};
