/**
 * Cuántas preguntas tiene una partida. Igual para todos los modos.
 *
 * Hubo un selector de 12 / 24 / 48 guardado en localStorage, pero el único
 * sitio desde el que se podía tocar era el marcador del final de la partida:
 * para bajar a 12 había que jugarse antes una de 24 enteras. En vez de moverlo
 * de sitio se ha quitado entero, que 24 vale para todo el mundo.
 *
 * Si algún día vuelve a hacer falta poder elegir, este es el sitio por donde
 * empezar: los dieciocho modos leen esta constante y nada más.
 *
 * Menos los de `SHORT_ROUND_LENGTH`.
 */
export const ROUND_LENGTH = 24;

/**
 * Partida corta: 12 preguntas, y con 12 ya hay medalla. Para los modos en los
 * que cada pregunta es larga y dura (escuchar una progresión entera, sacar una
 * melodía, deletrear una escala): 24 de esas se hacían eternas.
 */
export const SHORT_ROUND_LENGTH = 12;

/** Los modos de partida corta, por su nombre en `lib/games.ts`. */
const SHORT_ROUND_GAMES = new Set([
  "Progresiones al oído",
  "Modos al oído",
  "Dictado melódico",
  "Construye la escala",
  "Construye el acorde",
  "Construye escalas",
  "Construye acordes",
]);

/** Y niveles sueltos de modos que, por lo demás, van a 24. */
const SHORT_ROUND_LEVELS: Record<string, string[]> = {
  "Acordes al oído": ["dos-acordes", "dos-acordes-variable"],
};

/** ¿Este modo (y nivel) va con partida corta? */
export const isShortRound = (gameName: string, levelSlug: string | null) =>
  SHORT_ROUND_GAMES.has(gameName) ||
  (levelSlug !== null && (SHORT_ROUND_LEVELS[gameName] ?? []).includes(levelSlug));
