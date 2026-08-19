"use client";

// Longitud de la partida. 24 seguía siendo mucho para practicar cinco minutos
// en el móvil, así que se puede bajar a 12 o subir a 48.
//
// El valor se lee UNA vez, al montar el juego, y no reacciona a cambios: si
// cambiase a mitad de partida, las listas de preguntas y de respuestas se
// quedarían descuadradas. El selector guarda y recarga.

export const ROUND_LENGTHS = [12, 24, 48] as const;
export type RoundLength = (typeof ROUND_LENGTHS)[number];

export const DEFAULT_ROUND_LENGTH: RoundLength = 24;

const ROUND_LENGTH_KEY = "21st_round_length";

const isRoundLength = (value: number): value is RoundLength =>
  (ROUND_LENGTHS as readonly number[]).includes(value);

export const getStoredRoundLength = (): RoundLength => {
  if (typeof window === "undefined") return DEFAULT_ROUND_LENGTH;
  const stored = Number(window.localStorage.getItem(ROUND_LENGTH_KEY));
  return isRoundLength(stored) ? stored : DEFAULT_ROUND_LENGTH;
};

export const setStoredRoundLength = (length: RoundLength) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROUND_LENGTH_KEY, String(length));
};
