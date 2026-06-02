"use client";

export interface GameScore {
  correct: number;
  total: number;
  attempts: number;
  totalCorrect: number;
}

export interface GameAttempt {
  id: number;
  fecha: string;
  game: string;
  correct: number;
  total: number;
}

export const DEFAULT_GAME_TOTAL = 24;

export const defaultGameScores = (): Record<string, GameScore> => ({
  Armaduras: { correct: 0, total: DEFAULT_GAME_TOTAL, attempts: 0, totalCorrect: 0 },
  "Diapasón": { correct: 0, total: DEFAULT_GAME_TOTAL, attempts: 0, totalCorrect: 0 },
  Acordes: { correct: 0, total: DEFAULT_GAME_TOTAL, attempts: 0, totalCorrect: 0 },
  Intervalos: { correct: 0, total: DEFAULT_GAME_TOTAL, attempts: 0, totalCorrect: 0 },
  Trivial: { correct: 0, total: DEFAULT_GAME_TOTAL, attempts: 0, totalCorrect: 0 },
  "Lectura Rítmica": { correct: 0, total: DEFAULT_GAME_TOTAL, attempts: 0, totalCorrect: 0 },
});

export const normalizeGameScores = (
  scores: Partial<Record<string, GameScore | number>> | undefined,
) => {
  const fallback = defaultGameScores();

  return Object.fromEntries(
    Object.entries(fallback).map(([game, defaultScore]) => {
      const score = scores?.[game];

      if (typeof score === "object" && score) {
        const total = Math.max(1, Number(score.total) || defaultScore.total);
        const correct = Math.max(0, Math.min(total, Number(score.correct) || 0));
        const hasAccumulatedScore =
          typeof score.totalCorrect === "number" || typeof score.attempts === "number";
        const attempts = hasAccumulatedScore
          ? Math.max(0, Number(score.attempts) || 0)
          : correct > 0
            ? 1
            : 0;
        const totalCorrect = hasAccumulatedScore
          ? Math.max(0, Number(score.totalCorrect) || 0)
          : correct;
        return [
          game,
          {
            correct,
            total,
            attempts,
            totalCorrect,
          },
        ];
      }

      return [game, defaultScore];
    }),
  );
};

const safeParse = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const displayNameFromEmail = (email: string) => email.split("@")[0] || "Alumno";
const perfectMedalText = (gameName: string) => `100% en ${gameName}`;

const normalizeGameHistory = (history: unknown): GameAttempt[] =>
  Array.isArray(history)
    ? history
        .map((entry) => {
          const attempt = entry as Partial<GameAttempt>;
          const total = Math.max(1, Number(attempt.total) || DEFAULT_GAME_TOTAL);
          return {
            id: Number(attempt.id) || Date.now(),
            fecha: String(attempt.fecha || new Date().toLocaleDateString("es-ES")),
            game: String(attempt.game || ""),
            correct: Math.max(0, Math.min(total, Number(attempt.correct) || 0)),
            total,
          };
        })
        .filter((entry) => entry.game)
    : [];

export const saveGameScore = async (
  gameName: string,
  correct: number,
  total = DEFAULT_GAME_TOTAL,
) => {
  if (typeof window === "undefined") return;

  const session = await fetch("/api/auth/session")
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  const email = session?.user?.email;

  if (!email) return;

  const profileKey = `profile:${email}`;
  const rawProfile = safeParse(localStorage.getItem(profileKey));
  const safeTotal = Math.max(1, Number(total) || DEFAULT_GAME_TOTAL);
  const safeCorrect = Math.max(0, Math.min(safeTotal, Number(correct) || 0));
  const currentScores = normalizeGameScores(rawProfile?.gameScores);
  const currentGameScore = currentScores[gameName] || {
    correct: 0,
    total: safeTotal,
    attempts: 0,
    totalCorrect: 0,
  };
  const currentMedalsHistory = Array.isArray(rawProfile?.medalsHistory)
    ? rawProfile.medalsHistory
    : [];
  const currentMedalsCount = Math.max(
    Number(rawProfile?.medalsCount) || 0,
    currentMedalsHistory.length,
  );
  const earnedPerfectMedal = safeCorrect === safeTotal;
  const newMedalText = perfectMedalText(gameName);
  const shouldAddPerfectMedal =
    earnedPerfectMedal && !currentMedalsHistory.includes(newMedalText);
  const currentGameHistory = normalizeGameHistory(rawProfile?.gameHistory);
  const gameHistoryEntry: GameAttempt = {
    id: Date.now(),
    fecha: new Date().toLocaleDateString("es-ES"),
    game: gameName,
    correct: safeCorrect,
    total: safeTotal,
  };
  const nextProfile = {
    ...(rawProfile || {}),
    email,
    displayName: rawProfile?.displayName || displayNameFromEmail(email),
    medalsCount: shouldAddPerfectMedal
      ? currentMedalsCount + 1
      : currentMedalsCount,
    medalsHistory: shouldAddPerfectMedal
      ? [newMedalText, ...currentMedalsHistory]
      : currentMedalsHistory,
    gameHistory: [gameHistoryEntry, ...currentGameHistory],
    gameScores: {
      ...currentScores,
      [gameName]: {
        correct: safeCorrect,
        total: safeTotal,
        attempts: currentGameScore.attempts + 1,
        totalCorrect: currentGameScore.totalCorrect + safeCorrect,
      },
    },
  };

  localStorage.setItem(profileKey, JSON.stringify(nextProfile));

  const index = safeParse(localStorage.getItem("student_profiles_index")) || {};
  index[email] = nextProfile;
  localStorage.setItem("student_profiles_index", JSON.stringify(index));

  await fetch("/api/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile: nextProfile }),
  }).catch(() => {});
};
