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

import { GAMES, gameByStoredName, type GameMode } from "./games";
import { getSupabaseAdmin } from "./supabaseAdmin";

/**
 * Partidas que se traen para calcular el detalle del panel.
 *
 * Era 600 y de ahí salían TODAS las cifras, incluida la casilla de "Partidas",
 * que por tanto se habría quedado clavada en 600 para siempre, y el récord de
 * cada modo, que podía BAJAR: cuando la partida del 100% se salía por abajo de
 * la ventana, la medalla se quedaba pero la barra caía. Un récord que baja se
 * lee como un fallo.
 *
 * El número total de partidas ya no sale de aquí: se pide aparte y exacto, con
 * un `count` que no trae ni una fila. Esta ventana es solo para el detalle
 * (medias, récords, niveles, historial), y a 2000 cubre años de uso normal.
 *
 * Si algún día un alumno pasa de 2000 partidas, lo correcto es una función en
 * Postgres que devuelva los agregados ya hechos. No se ha hecho ya porque los
 * agregados por API están desactivados en este proyecto de Supabase, y montar
 * un RPC para un caso que hoy no existe es trabajo por adelantado.
 */
const DETAIL_LIMIT = 2000;

/**
 * Cuántas partidas miran las medias que se enseñan.
 *
 * La media de toda la vida castiga por haber empezado sin saber: veinte
 * partidas de los primeros días tiran del número para abajo durante meses, y
 * el alumno que ha mejorado no lo ve. Diez es bastante para que una partida
 * mala no lo mueva entero, y poco para que refleje cómo va AHORA.
 */
export const FORM_WINDOW = 10;

/** Los días que mira el porcentaje de aciertos de la cabecera. */
const WEEK_DAYS = 7;

/**
 * Tope de filas que se leen para recalcular la racha al guardar una partida.
 *
 * Un año de partidas, y de cada día basta con que aparezca una. Con 1200 caben
 * más de tres al día todos los días del año; a partir de ahí lo único que se
 * pierde es poder alargar la racha por encima de eso, que no va a pasar.
 */
const STREAK_ROW_LIMIT = 1200;

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
  /** El mejor porcentaje conseguido, de 0 a 100. Es un récord, no un nivel. */
  best: number;
  /**
   * La media de los récords de cada nivel, de 0 a 100. Es LA cifra del modo:
   * la que va en la barra.
   *
   * Antes la barra era el récord del modo entero, y por eso podía marcar 100%
   * con todos los niveles por debajo: bastaba con haber bordado uno. Así no:
   * para llegar al 100% hay que haber hecho pleno en todos los niveles que se
   * han tocado, que es justo lo que significa tener el modo dominado. Y como
   * son récords, no baja al tener un mal día.
   *
   * En los modos sin niveles es directamente el récord del modo.
   *
   * Solo cuenta los niveles jugados, no los que el modo tiene: los niveles no
   * están declarados en ningún catálogo, salen de las URL que se han jugado.
   * O sea que el 100% quiere decir "pleno en todo lo que has tocado", no
   * "pleno en todo lo que existe".
   */
  mastery: number;
  /** Media de las últimas partidas, de 0 a 100: cómo va AHORA, no su récord. */
  form: number;
  /** Media de aciertos de todas las partidas de la ventana, de 0 a 100. */
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
    form: number;
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
  /** Partidas de toda la vida. Exacto: no sale de la ventana de detalle. */
  attempts: number;
  questions: number;
  correct: number;
  /** Aciertos de los últimos siete días, de 0 a 100. */
  weekAccuracy: number;
  weekCorrect: number;
  weekQuestions: number;
  /** true si en los últimos siete días no ha jugado nada. */
  weekEmpty: boolean;
  medals: number;
  streak: Streak;
  games: GameProgress[];
  recent: Attempt[];
}

const percent = (correct: number, total: number) =>
  total > 0 ? Math.round((correct / total) * 100) : 0;

/**
 * La media de las últimas `FORM_WINDOW` partidas de una lista que ya viene de
 * la más nueva a la más vieja.
 *
 * Se pondera por preguntas y no por partidas: una partida de 48 preguntas dice
 * más de cómo va alguien que una de 24, y promediar porcentajes las igualaría.
 */
const formOf = (list: Attempt[]) => {
  const recent = list.slice(0, FORM_WINDOW);
  return percent(
    recent.reduce((sum, a) => sum + a.correct, 0),
    recent.reduce((sum, a) => sum + a.total, 0),
  );
};

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

  const [attemptsResult, medalsResult, countResult] = await Promise.all([
    supabase
      .from("game_attempts")
      .select("game_name, level_slug, correct, total, created_at")
      .eq("student_email", email)
      .order("created_at", { ascending: false })
      .limit(DETAIL_LIMIT),
    supabase.from("student_medals").select("game_name").eq("student_email", email),
    // `head: true` pide el número y ni una fila: es una consulta de contar, no
    // de traer. Es lo que hace que "Partidas" sea exacto para siempre sin
    // depender del tamaño de la ventana de arriba.
    supabase
      .from("game_attempts")
      .select("id", { count: "exact", head: true })
      .eq("student_email", email),
  ]);

  if (attemptsResult.error) {
    throw new Error(`No se ha podido leer el progreso: ${attemptsResult.error.message}`);
  }

  const rows = (attemptsResult.data ?? []) as AttemptRow[];
  // Las medallas también se guardaron con los nombres viejos, así que se
  // normalizan al entrar: si no, un alumno con la medalla de "Ej. Rockschool"
  // no la vería en el modo que ahora se llama "Rockschool".
  const medals = new Set(
    (medalsResult.data ?? []).map(
      (row: { game_name: string }) =>
        gameByStoredName(row.game_name)?.name ?? row.game_name,
    ),
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
    // Por el modo resuelto y no por el texto: así una partida guardada con el
    // nombre viejo cuenta en el modo que le toca.
    const mine = attempts.filter(
      (attempt) => gameByStoredName(attempt.gameName) === game,
    );
    const correct = mine.reduce((sum, attempt) => sum + attempt.correct, 0);
    const questions = mine.reduce((sum, attempt) => sum + attempt.total, 0);

    const levelSlugs = [
      ...new Set(mine.map((attempt) => attempt.levelSlug).filter(Boolean)),
    ] as string[];

    const best = Math.max(
      0,
      ...mine.map((attempt) => percent(attempt.correct, attempt.total)),
    );

    // Se calculan aquí arriba y no dentro del objeto porque `mastery` es la
    // media de sus récords y los necesita ya hechos.
    const levels = levelSlugs
      .map((slug) => {
        const ofLevel = mine.filter((attempt) => attempt.levelSlug === slug);
        return {
          slug,
          attempts: ofLevel.length,
          best: Math.max(
            0,
            ...ofLevel.map((attempt) => percent(attempt.correct, attempt.total)),
          ),
          form: formOf(ofLevel),
          lastPlayedAt: ofLevel[0]?.createdAt ?? null,
        };
      })
      .sort((a, b) => b.attempts - a.attempts);

    return {
      game,
      attempts: mine.length,
      best,
      mastery: levels.length
        ? Math.round(levels.reduce((sum, level) => sum + level.best, 0) / levels.length)
        : best,
      form: formOf(mine),
      average: percent(correct, questions),
      correct,
      questions,
      lastPlayedAt: mine[0]?.createdAt ?? null,
      hasMedal: medals.has(game.name),
      levels,
    };
  }).filter((entry) => entry.attempts > 0 || entry.hasMedal);

  const correct = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
  const questions = attempts.reduce((sum, attempt) => sum + attempt.total, 0);

  // Los siete días naturales que cuentan como "esta semana", hoy incluido.
  const weekKeys = new Set(
    Array.from({ length: WEEK_DAYS }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
      return dayKey(date);
    }),
  );
  const week = attempts.filter((attempt) =>
    weekKeys.has(dayKey(new Date(attempt.createdAt))),
  );
  const weekCorrect = week.reduce((sum, attempt) => sum + attempt.correct, 0);
  const weekQuestions = week.reduce((sum, attempt) => sum + attempt.total, 0);

  return {
    attempts: countResult.count ?? attempts.length,
    questions,
    correct,
    weekAccuracy: percent(weekCorrect, weekQuestions),
    weekCorrect,
    weekQuestions,
    weekEmpty: week.length === 0,
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

  // Solo hacen falta los días del último año: la racha se corta en el primer
  // hueco, así que nada de más atrás puede alargarla. Antes se releían 2000
  // filas enteras después de CADA partida para acabar contando días.
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 366);

  const { data: days } = await supabase
    .from("game_attempts")
    .select("created_at")
    .eq("student_email", input.email)
    .gte("created_at", yearAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(STREAK_ROW_LIMIT);

  const streak = streakFrom(
    (days ?? []).map((row: { created_at: string }) => dayKey(new Date(row.created_at))),
  );

  return { saved: true, newMedal, streak: streak.current };
};
