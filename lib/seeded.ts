// Azar con semilla: la misma semilla da siempre la misma tirada.
//
// Lo usan el reto diario (todo el mundo oye la misma secuencia el mismo día) y
// los exámenes (todos reciben las mismas preguntas, y cada alumno las ve en su
// propio orden). No sirve para nada que tenga que ser secreto: es un sorteo
// reproducible, no criptografía.

/** Un número de 32 bits a partir de un texto (xmur3). */
export const hashSeed = (text: string): number => {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
};

/** mulberry32: devuelve una función que da números en [0, 1), como Math.random. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** El azar de una semilla escrita como texto ("eco:2026-10-24"). */
export const rngFor = (text: string) => mulberry32(hashSeed(text));

/** Fisher-Yates con el azar que se le dé. */
export const shuffleWith = <T,>(list: readonly T[], rng: () => number): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Ejecuta `run` con `Math.random` cambiado por un azar con semilla.
 *
 * Es para reutilizar los generadores de preguntas de los modos tal cual, que
 * tiran de `Math.random` por dentro. La alternativa era duplicar los veinte y
 * pico generadores con un parámetro más, y que con el tiempo los del examen y
 * los del juego dejaran de preguntar lo mismo.
 *
 * Solo vale para código síncrono: mientras corre no puede colarse nada más en
 * el hilo, así que nadie más ve el Math.random cambiado. Se devuelve siempre en
 * el `finally`, también si el generador lanza.
 */
export const withSeededRandom = <T,>(rng: () => number, run: () => T): T => {
  const original = Math.random;
  Math.random = rng;
  try {
    return run();
  } finally {
    Math.random = original;
  }
};
