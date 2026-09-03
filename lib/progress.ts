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
import { GAME_LEVELS, levelCountOf } from "./gameLevels";
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
 * Techo al mirar las partidas de UN nivel de UN alumno, para saber si su
 * medalla es nueva. Un alumno no juega 500 veces la misma pantalla; está por si
 * acaso, para que la consulta no pueda crecer sin tope.
 */
const LEVEL_ROW_LIMIT = 500;

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
   * Cuánto llevas dominado del modo, de 0 a 100. Es LA cifra del modo: la que
   * va en la barra.
   *
   * Es la suma de los récords de cada nivel dividida entre los niveles que el
   * modo TIENE (`lib/gameLevels.ts`), no entre los que has jugado. Un nivel sin
   * abrir cuenta cero, porque cero es lo que llevas de él.
   *
   * Antes se dividía entre los jugados, y entonces jugar uno solo y bordarlo
   * daba 100%: la barra decía "me sé este modo" cuando quería decir "me sé el
   * trozo que he tocado". Para llegar al 100% ahora hay que haber hecho pleno
   * en todos los niveles del modo, que es lo que la gente entiende al leerlo.
   * Y como son récords y no medias, no baja por tener un mal día.
   *
   * Un 20% aquí no es un suspenso: es una barra de progreso empezando. Lo bien
   * que lo haces se lee en `form`, que va escrito justo debajo de la barra.
   *
   * En los modos de una sola pantalla (armaduras, trivia…) es su récord.
   */
  mastery: number;
  /** Media de las últimas partidas, de 0 a 100: cómo va AHORA, no su récord. */
  form: number;
  /** Media de aciertos de todas las partidas de la ventana, de 0 a 100. */
  average: number;
  correct: number;
  questions: number;
  lastPlayedAt: string | null;
  /** Cuántos niveles del modo tienen medalla. Nunca baja. */
  medals: number;
  /** Cuántos podría tener: sus niveles, o 1 si es de una sola pantalla. */
  medalsTotal: number;
  /** true cuando están todas: el modo está rematado. */
  hasMedal: boolean;
  /** Lo mismo, partido por niveles. Vacío en los modos que no tienen. */
  levels: {
    slug: string;
    attempts: number;
    best: number;
    form: number;
    lastPlayedAt: string | null;
    /** Pleno en partida larga en este nivel. */
    hasMedal: boolean;
  }[];
  /** Cuántos niveles del modo se han tocado alguna vez. */
  levelsPlayed: number;
  /** Cuántos tiene en total, o null si el modo no tiene niveles. */
  levelsTotal: number | null;
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

const UNDEFINED_COLUMN = "42703";

/**
 * Si la columna `completed` está o no (db/abandoned.sql). Igual que en
 * lib/students.ts: las migraciones se pasan a mano y pueden llegar más tarde
 * que el despliegue, y en esa ventana esto no puede dejar de guardar partidas.
 *
 * Se apaga sola en el primer 42703 y no se vuelve a pedir en lo que dure el
 * proceso. Mientras está apagada, todas las partidas cuentan como terminadas,
 * que es exactamente como funcionaba la app antes de esto.
 */
let hasCompletedColumn = true;

/** Un error de PostgREST por una columna que no existe. */
const isMissingColumn = (error: { code?: string } | null) =>
  !!error && error.code === UNDEFINED_COLUMN && hasCompletedColumn;

const forgetCompletedColumn = () => {
  console.warn(
    "[progreso] la columna `completed` no existe todavía: ejecuta db/abandoned.sql. " +
      "Mientras tanto todas las partidas cuentan como terminadas.",
  );
  hasCompletedColumn = false;
};

/**
 * Añade "y que esté terminada" a una consulta de partidas.
 *
 * Se escribe encadenando sobre una variable en vez de con una función que
 * envuelva la consulta: los tipos de Supabase son enormes y una función
 * genérica sobre ellos hace que TypeScript se rinda ("type instantiation is
 * excessively deep"). Así el tipo se conserva tal cual.
 */

/** Todo el progreso de un alumno, listo para pintar. */
export const getProgress = async (email: string): Promise<Progress> => {
  const supabase = getSupabaseAdmin();

  // Todo lo que se enseña son partidas TERMINADAS. Las abandonadas se guardan
  // (ver db/abandoned.sql) pero no entran aquí: si entraran, las medias, los
  // récords y las medallas de todos los alumnos cambiarían de un día para otro
  // sin que nadie haya jugado nada distinto.
  const leer = () => {
    let detalle = supabase
      .from("game_attempts")
      .select("game_name, level_slug, correct, total, created_at")
      .eq("student_email", email);

    // `head: true` pide el número y ni una fila: es una consulta de contar, no
    // de traer. Es lo que hace que "Partidas" sea exacto para siempre sin
    // depender del tamaño de la ventana de arriba.
    let cuenta = supabase
      .from("game_attempts")
      .select("id", { count: "exact", head: true })
      .eq("student_email", email);

    if (hasCompletedColumn) {
      detalle = detalle.eq("completed", true);
      cuenta = cuenta.eq("completed", true);
    }

    return Promise.all([
      detalle.order("created_at", { ascending: false }).limit(DETAIL_LIMIT),
      cuenta,
    ]);
  };

  let [attemptsResult, countResult] = await leer();

  if (isMissingColumn(attemptsResult.error)) {
    forgetCompletedColumn();
    [attemptsResult, countResult] = await leer();
  }

  if (attemptsResult.error) {
    throw new Error(`No se ha podido leer el progreso: ${attemptsResult.error.message}`);
  }

  const rows = (attemptsResult.data ?? []) as AttemptRow[];

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

    const played = [
      ...new Set(mine.map((attempt) => attempt.levelSlug).filter(Boolean)),
    ] as string[];

    // Los niveles del catálogo primero y en su orden (que es el orden en que se
    // aprenden), y detrás cualquiera jugado que no esté en la lista — una
    // partida vieja de un nivel que se quitó, por ejemplo. Los del catálogo van
    // TODOS, se hayan jugado o no: si solo salieran los jugados, un modo al 60%
    // enseñaría cuatro niveles bordados y no habría manera de ver de dónde sale
    // ese 60. Los que faltan por tocar son justo la explicación.
    const known = GAME_LEVELS[game.slug] ?? [];
    const levelSlugs = [
      ...known,
      ...played.filter((slug) => !known.includes(slug)),
    ];

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
          // Pleno en partida larga en este nivel. Sale de las partidas y de
          // nada más: es el único sitio donde el dato es verdad por definición.
          hasMedal: ofLevel.some(
            (attempt) =>
              attempt.correct === attempt.total &&
              attempt.total >= MEDAL_MIN_TOTAL,
          ),
        };
      });

    // La barra del modo: cuánto llevas dominado, no lo bien que se te da.
    //
    // Era la media de los récords de los niveles JUGADOS, y eso hacía que jugar
    // uno solo y bordarlo diera 100%: el número decía "me sé este modo" cuando
    // en realidad decía "me sé el trozo que he tocado". Ahora se divide entre
    // los niveles que el modo tiene de verdad, así que los que no has abierto
    // cuentan como el cero que son.
    //
    // La precisión no se pierde: sigue ahí, en la línea de debajo de la barra
    // ("últimas 6: 87%"), que es donde se lee lo bien que lo estás haciendo.
    // Antes las dos cosas eran el mismo número y por eso una de las dos mentía.
    //
    // Si el modo no tiene niveles (armaduras, trivia…) o no está en la lista,
    // `levelCountOf` devuelve null y se sigue como antes.
    // Las medallas del modo son las de sus niveles, contadas.
    //
    // Una medalla no se puede perder, y por eso es un contador y no un sí/no.
    // Con un sí/no ("medalla = todos los niveles al pleno"), añadir un nivel
    // nuevo a un modo que alguien tenía completo se la quitaba sin que hubiera
    // hecho nada mal. Contando, un nivel nuevo solo añade uno más que
    // conseguir: lo que ya está ganado no se toca nunca.
    //
    // Y no repite lo que dice la barra: la barra es la media de los RÉCORDS, y
    // esto son PLENOS en partida larga. Un 100% sacado en una ronda corta sube
    // la barra y no da medalla.
    //
    // Los modos de una sola pantalla no tienen niveles, así que su medalla sale
    // de sus propias partidas: o la tienen o no, y el total es uno.
    const modeMedal = mine.some(
      (attempt) =>
        attempt.correct === attempt.total && attempt.total >= MEDAL_MIN_TOTAL,
    );
    const medalCount = levels.length
      ? levels.filter((level) => level.hasMedal).length
      : Number(modeMedal);
    const medalTotal = levels.length || 1;

    const totalLevels = levelCountOf(game.slug);
    const mastery = levels.length
      ? Math.round(
          levels.reduce((sum, level) => sum + level.best, 0) / levels.length,
        )
      : best;

    return {
      game,
      attempts: mine.length,
      best,
      mastery,
      form: formOf(mine),
      average: percent(correct, questions),
      correct,
      questions,
      lastPlayedAt: mine[0]?.createdAt ?? null,
      medals: medalCount,
      medalsTotal: medalTotal,
      hasMedal: medalCount > 0 && medalCount === medalTotal,
      levels,
      /** Cuántos niveles tiene el modo y cuántos llevas tocados. */
      levelsPlayed: levels.filter((level) => level.attempts > 0).length,
      levelsTotal: totalLevels,
    };
  })
    // Salen todos los modos que puntúan, jugados o no. Antes solo salían los
    // empezados, y entonces el panel contaba lo que ya habías hecho pero no lo
    // que te quedaba: si Armaduras no aparece, no hay forma de saber desde el
    // panel que existe y está a cero. Igual que con los niveles, los que no has
    // tocado son justo la parte que dice por dónde seguir.
    //
    // Fuera los que no puntúan (piano libre, vocalizaciones, rockschool): esos
    // no guardan partidas, así que se quedarían a cero para siempre y estarían
    // mintiendo. Y fuera los que todavía no existen.
    .filter((entry) => entry.game.scored && !entry.game.comingSoon);

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
    // La suma de las de cada modo, que a su vez son las de sus niveles. Es el
    // mismo número que sale de sumar lo que se ve en las tarjetas.
    medals: games.reduce((sum, entry) => sum + entry.medals, 0),
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
  /**
   * false = el alumno se fue a media partida y esto es lo que llevaba.
   *
   * Una abandonada se guarda pero no cuenta para nada de lo que se enseña: ni
   * medalla, ni racha, ni media. Solo queda ahí para poder saber algún día qué
   * pantallas se dejan a medias, que es lo único que responde.
   */
  completed?: boolean;
}): Promise<SaveResult> => {
  const game = GAMES.find((item) => item.name === input.gameName);
  if (!game?.scored) return NOT_SAVED;

  const total = Math.floor(input.total);
  const correct = Math.floor(input.correct);
  if (!Number.isFinite(total) || total < 1 || total > 200) return NOT_SAVED;
  if (!Number.isFinite(correct) || correct < 0 || correct > total) return NOT_SAVED;

  const supabase = getSupabaseAdmin();

  // La medalla es de pleno, y solo desde partida larga. Se mira ANTES de meter
  // esta partida: si se mirara después, la que se acaba de jugar ya estaría en
  // la tabla y toda medalla parecería vieja.
  const completed = input.completed !== false;
  const isPerfect = completed && correct === total && total >= MEDAL_MIN_TOTAL;
  let newMedal = false;

  if (isPerfect) {
    // Ya no hay tabla de medallas: la medalla no es un dato aparte que haya que
    // mantener a mano y que pueda quedarse a medias respecto a las partidas, es
    // una lectura de las partidas. Aquí solo hace falta saber si este NIVEL ya
    // tenía la suya.
    //
    // Se filtra por alumno, modo y nivel, así que son las partidas de una sola
    // pantalla de un solo alumno: decenas, no miles. `level_slug` es null en
    // los modos de una sola pantalla y PostgREST necesita `is` para eso, que no
    // es lo mismo que `eq`.
    let base = supabase
      .from("game_attempts")
      .select("correct, total")
      .eq("student_email", input.email)
      .eq("game_name", game.name);

    if (hasCompletedColumn) base = base.eq("completed", true);

    const query = base.limit(LEVEL_ROW_LIMIT);

    const { data: before } = await (input.levelSlug === null
      ? query.is("level_slug", null)
      : query.eq("level_slug", input.levelSlug));

    newMedal = !(before ?? []).some(
      (row: { correct: number; total: number }) =>
        row.correct === row.total && row.total >= MEDAL_MIN_TOTAL,
    );
  }

  // El tipo se escribe entero, con `completed` opcional: si se dejara inferir
  // de un `? :` saldrían dos formas distintas de fila y Supabase rechaza la
  // unión.
  const fila: {
    student_email: string;
    game_name: string;
    level_slug: string | null;
    correct: number;
    total: number;
    completed?: boolean;
  } = {
    student_email: input.email,
    game_name: game.name,
    level_slug: input.levelSlug,
    correct,
    total,
  };

  if (hasCompletedColumn) fila.completed = completed;

  let { error } = await supabase.from("game_attempts").insert(fila);

  // Si la migración todavía no está pasada, una partida terminada se guarda
  // igual (sin la columna); una abandonada se descarta, porque sin `completed`
  // entraría en el panel como si el alumno hubiera acabado con un 3 de 9 y le
  // hundiría la media. Perder el dato nuevo es mejor que estropear el viejo.
  if (isMissingColumn(error)) {
    forgetCompletedColumn();
    if (!completed) return NOT_SAVED;
    delete fila.completed;
    ({ error } = await supabase.from("game_attempts").insert(fila));
  }

  if (error) throw new Error(`No se ha podido guardar la partida: ${error.message}`);

  // Una partida abandonada no alarga la racha ni gana medallas, así que aquí se
  // acaba: nos ahorramos el viaje de recalcular los días.
  if (!completed) return { saved: true, newMedal: false, streak: 0 };

  // Solo hacen falta los días del último año: la racha se corta en el primer
  // hueco, así que nada de más atrás puede alargarla. Antes se releían 2000
  // filas enteras después de CADA partida para acabar contando días.
  const yearAgo = new Date();
  yearAgo.setDate(yearAgo.getDate() - 366);

  let dias = supabase
    .from("game_attempts")
    .select("created_at")
    .eq("student_email", input.email);

  if (hasCompletedColumn) dias = dias.eq("completed", true);

  const { data: days } = await dias
    .gte("created_at", yearAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(STREAK_ROW_LIMIT);

  const streak = streakFrom(
    (days ?? []).map((row: { created_at: string }) => dayKey(new Date(row.created_at))),
  );

  return { saved: true, newMedal, streak: streak.current };
};
