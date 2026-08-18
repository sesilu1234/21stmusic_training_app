import { getSupabaseAdmin } from "./supabaseAdmin";

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

  const { data } = await getSupabaseAdmin()
    .from("students")
    .select(STUDENT_COLUMNS)
    .eq("email", cleanEmail)
    .eq("is_active", true)
    .maybeSingle<StudentRow>();

  return data ? toStudent(data) : null;
};

/** Alumno activo por usuario, con el hash para poder validar la contraseña. */
export const getStudentForLogin = async (username: unknown) => {
  const cleanUsername = normalizeUsername(username);
  if (!cleanUsername) return null;

  const { data } = await getSupabaseAdmin()
    .from("students")
    .select(`${STUDENT_COLUMNS}, password_hash`)
    .eq("username", cleanUsername)
    .eq("is_active", true)
    .maybeSingle<StudentRow & { password_hash: string | null }>();

  if (!data) return null;
  return { ...toStudent(data), passwordHash: data.password_hash };
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
  if (!perfect) return { perfect, medalAwarded: false };

  const { error: medalError } = await supabase
    .from("student_medals")
    .insert({ student_email: studentEmail, game_name: game });

  // 23505 = ya tenía esa medalla, no es un fallo.
  if (medalError && medalError.code !== "23505") throw new Error(medalError.message);

  return { perfect, medalAwarded: !medalError };
};

export interface RankingRow {
  email: string;
  displayName: string;
  points: number;
  games: number;
  medals: number;
}

/** Ranking global y por juego, calculado desde las partidas guardadas. */
export const getRanking = async () => {
  const supabase = getSupabaseAdmin();

  const [{ data: students }, { data: attempts }, { data: medals }] = await Promise.all([
    supabase.from("students").select("email, display_name").eq("is_active", true),
    supabase
      .from("game_attempts")
      .select("student_email, game_name, correct")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("student_medals").select("student_email"),
  ]);

  const names = new Map<string, string>(
    (students || []).map((row) => [row.email as string, row.display_name as string]),
  );
  const medalCount = new Map<string, number>();
  for (const row of medals || []) {
    const key = row.student_email as string;
    medalCount.set(key, (medalCount.get(key) || 0) + 1);
  }

  const global = new Map<string, RankingRow>();
  const perGame = new Map<string, Map<string, RankingRow>>();

  const bump = (table: Map<string, RankingRow>, email: string, correct: number) => {
    const row = table.get(email) || {
      email,
      displayName: names.get(email) || email.split("@")[0],
      points: 0,
      games: 0,
      medals: medalCount.get(email) || 0,
    };
    row.points += correct;
    row.games += 1;
    table.set(email, row);
  };

  for (const attempt of attempts || []) {
    const email = attempt.student_email as string;
    if (!names.has(email)) continue;

    bump(global, email, attempt.correct as number);

    const game = attempt.game_name as string;
    if (!perGame.has(game)) perGame.set(game, new Map());
    bump(perGame.get(game)!, email, attempt.correct as number);
  }

  const sorted = (table: Map<string, RankingRow>) =>
    [...table.values()].sort((a, b) => b.points - a.points || b.games - a.games);

  return {
    global: sorted(global),
    perGame: Object.fromEntries(
      [...perGame.entries()].map(([game, table]) => [game, sorted(table).slice(0, 10)]),
    ) as Record<string, RankingRow[]>,
  };
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
