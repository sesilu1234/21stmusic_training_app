"use client";

export interface GameResult {
  perfect: boolean;
  medalAwarded: boolean;
  saved: boolean;
}

/** Guarda una partida terminada y dice si ha caído medalla. */
export const saveGameResult = async (
  game: string,
  correct: number,
  total: number,
): Promise<GameResult> => {
  const perfect = total > 0 && correct === total;

  try {
    const response = await fetch("/api/game-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game, correct, total }),
    });

    if (!response.ok) return { perfect, medalAwarded: false, saved: false };

    const data = await response.json();
    return {
      perfect: Boolean(data.perfect),
      medalAwarded: Boolean(data.medalAwarded),
      saved: true,
    };
  } catch {
    return { perfect, medalAwarded: false, saved: false };
  }
};
