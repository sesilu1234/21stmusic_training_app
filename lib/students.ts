import { getSupabaseAdmin } from "./supabaseAdmin";
import { MEDAL_MIN_LENGTH } from "./medals";

export const normalizeEmail = (value: unknown) =>
  String(value ?? "").trim().toLowerCase();

export const normalizeUsername = (value: unknown) =>
  String(value ?? "").trim().toLowerCase();

export interface Student {
  email: string;
  displayName: string;
  username: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Attempt {
  id: string;
  game: string;
  correct: number;
  total: number;
  createdAt: string;
}

export interface Medal {
  game: string;
  createdAt: string;
}

export interface GameStat {
  game: string;
  attempts: number;
  points: number;
  best: number;
  bestTotal: number;
  lastCorrect: number;
  lastTotal: number;
}

export interface StudentStats {
  games: number;
  points: number;
  answered: number;
  byGame: GameStat[];
  recent: Attempt[];
}

interface StudentRow {
  email: string;
  display_name: string;
  username: string | null;
  is_active: boolean;
  created_at: string;
}

const toStudent = (row: StudentRow): Student => ({
  email: row.email,
  displayName: row.display_name,
  username: row.username,
  isActive: row.is_active,
  createdAt: row.created_at,
});

const STUDENT_COLUMNS = "email, display_name, username, is_active, created_at";

/** Alumno activo por email. Devuelve null si no existe o está desactivado. */
export const getStudent = async (email: unknown): Promise<Student | null> => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("students")
    .select(STUDENT_COLUMNS)
    .eq("email", cleanEmail)
    .eq("is_active", true)
    .maybeSingle<StudentRow>();

  // Un fallo de base de datos NO es "no eres alumno". Si se confunden, la
  // página manda a /login, /login ve que hay sesión y manda a /, y el
  // navegador se queda dando vueltas (ERR_TOO_MANY_REDIRECTS).
  if (error) throw new Error(`No se ha podido consultar el alumno: ${error.message}`);

  return data ? toStudent(data) : null;
};

/** Alumno activo por usuario, con su contraseña para poder validarla. */
export const getStudentForLogin = async (username: unknown) => {
  const cleanUsername = normalizeUsername(username);
  if (!cleanUsername) return null;

  const { data } = await getSupabaseAdmin()
    .from("students")
    .select(`${STUDENT_COLUMNS}, password`)
    .eq("username", cleanUsername)
    .eq("is_active", true)
    .maybeSingle<StudentRow & { password: string | null }>();

  if (!data) return null;
  return { ...toStudent(data), password: data.password };
};

export const listMedals = async (email: string): Promise<Medal[]> => {
  const { data } = await getSupabaseAdmin()
    .from("student_medals")
    .select("game_name, created_at")
    .eq("student_email", normalizeEmail(email))
    .order("created_at", { ascending: false });

  return (data || []).map((row) => ({
    game: row.game_name as string,
    createdAt: row.created_at as string,
  }));
};

export const listAttempts = async (email: string, limit = 60): Promise<Attempt[]> => {
  const { data } = await getSupabaseAdmin()
    .from("game_attempts")
    .select("id, game_name, correct, total, created_at")
    .eq("student_email", normalizeEmail(email))
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((row) => ({
    id: row.id as string,
    game: row.game_name as string,
    correct: row.correct as number,
    total: row.total as number,
    createdAt: row.created_at as string,
  }));
};

export const getStudentStats = async (email: string): Promise<StudentStats> => {
  const attempts = await listAttempts(email, 300);
  const byGame = new Map<string, GameStat>();

  for (const attempt of attempts) {
    const stat = byGame.get(attempt.game) || {
      game: attempt.game,
      attempts: 0,
      points: 0,
      best: 0,
      bestTotal: attempt.total,
      lastCorrect: attempt.correct,
      lastTotal: attempt.total,
    };

    stat.attempts += 1;
    stat.points += attempt.correct;
    if (attempt.correct / attempt.total >= stat.best / (stat.bestTotal || 1)) {
      stat.best = attempt.correct;
      stat.bestTotal = attempt.total;
    }
    byGame.set(attempt.game, stat);
  }

  return {
    games: attempts.length,
    points: attempts.reduce((sum, attempt) => sum + attempt.correct, 0),
    answered: attempts.reduce((sum, attempt) => sum + attempt.total, 0),
    byGame: [...byGame.values()].sort((a, b) => b.points - a.points),
    recent: attempts.slice(0, 8),
  };
};

/**
 * Guarda una partida terminada. Si el alumno acertó todo y aún no tenía la
 * medalla de ese juego, se la da (la tabla tiene un unique por alumno+juego).
 */
export const recordAttempt = async (
  email: string,
  game: string,
  correct: number,
  total: number,
) => {
  const supabase = getSupabaseAdmin();
  const studentEmail = normalizeEmail(email);

  const { error: attemptError } = await supabase.from("game_attempts").insert({
    student_email: studentEmail,
    game_name: game,
    correct,
    total,
  });
  if (attemptError) throw new Error(attemptError.message);

  const perfect = total > 0 && correct === total;
  // Una partida corta puede ser un pleno, pero no da medalla: si no, bastaría
  // con encadenar rondas de 12 para subir de escalón sin esfuerzo.
  const countsForMedal = perfect && total >= MEDAL_MIN_LENGTH;
  if (!countsForMedal) return { perfect, medalAwarded: false, tooShort: perfect };

  const { error: medalError } = await supabase
    .from("student_medals")
    .insert({ student_email: studentEmail, game_name: game });

  // 23505 = ya tenía esa medalla, no es un fallo.
  if (medalError && medalError.code !== "23505") throw new Error(medalError.message);

  return { perfect, medalAwarded: !medalError, tooShort: false };
};

export interface GameProgress {
  game: string;
  attempts: number;
  /** partidas perfectas de 24 o más preguntas: son las que suben de escalón */
  plenos: number;
  lastCorrect: number | null;
  lastTotal: number | null;
  medalAt: string | null;
}

/**
 * Estado de cada modo para un alumno: cuántas veces lo ha jugado, cuántos
 * plenos lleva (para el escalón de medalla) y cómo le fue la última vez.
 * Lo usan el menú principal y la página de medallas.
 */
export const getProgressByGame = async (email: string) => {
  const supabase = getSupabaseAdmin();
  const studentEmail = normalizeEmail(email);

  const [{ data: attempts }, { data: medals }] = await Promise.all([
    supabase
      .from("game_attempts")
      .select("game_name, correct, total, created_at")
      .eq("student_email", studentEmail)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("student_medals")
      .select("game_name, created_at")
      .eq("student_email", studentEmail),
  ]);

  const progress = new Map<string, GameProgress>();
  /** El juego de la partida más reciente, para el "sigue por aquí" del menú. */
  const lastPlayed = (attempts?.[0]?.game_name as string) ?? null;

  const entry = (game: string) => {
    const existing = progress.get(game);
    if (existing) return existing;
    const created: GameProgress = {
      game,
      attempts: 0,
      plenos: 0,
      lastCorrect: null,
      lastTotal: null,
      medalAt: null,
    };
    progress.set(game, created);
    return created;
  };

  // Vienen ordenados de más nuevo a más viejo, así que la primera fila de cada
  // juego es la última partida.
  for (const row of attempts || []) {
    const stat = entry(row.game_name as string);
    const correct = row.correct as number;
    const total = row.total as number;

    stat.attempts += 1;
    if (stat.lastCorrect === null) {
      stat.lastCorrect = correct;
      stat.lastTotal = total;
    }
    if (total >= MEDAL_MIN_LENGTH && correct === total) stat.plenos += 1;
  }

  for (const row of medals || []) {
    const stat = entry(row.game_name as string);
    stat.medalAt = row.created_at as string;
    // Medallas viejas ganadas con rondas más cortas que las de ahora: la
    // medalla está concedida, así que como mínimo vale por un pleno.
    if (stat.plenos === 0) stat.plenos = 1;
  }

  return { byGame: progress, lastPlayed };
};

export interface MedalBoardRow {
  email: string;
  displayName: string;
  games: string[];
}

/** Cuadro de honor: quién tiene medallas y cuáles. */
export const getMedalBoard = async (): Promise<MedalBoardRow[]> => {
  const supabase = getSupabaseAdmin();

  const [{ data: students }, { data: medals }] = await Promise.all([
    supabase.from("students").select("email, display_name").eq("is_active", true),
    supabase
      .from("student_medals")
      .select("student_email, game_name")
      .order("created_at", { ascending: true }),
  ]);

  const names = new Map<string, string>(
    (students || []).map((row) => [row.email as string, row.display_name as string]),
  );
  const board = new Map<string, MedalBoardRow>();

  for (const medal of medals || []) {
    const email = medal.student_email as string;
    if (!names.has(email)) continue;

    const row = board.get(email) || {
      email,
      displayName: names.get(email) || email.split("@")[0],
      games: [],
    };
    row.games.push(medal.game_name as string);
    board.set(email, row);
  }

  return [...board.values()].sort((a, b) => b.games.length - a.games.length);
};
