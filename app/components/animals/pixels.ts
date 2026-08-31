/**
 * El formato en el que están dibujados los avatares.
 *
 * Cada animal es una rejilla de 16 filas escritas a mano: un carácter por
 * píxel. El punto es transparente y cualquier otro carácter es un color de su
 * `palette`. Se ve el dibujo leyendo el archivo, y para retocarlo se cambia un
 * carácter — que es lo cómodo de trabajar con pixel art.
 *
 * De aquí sale un `path` de SVG por color: se juntan los píxeles seguidos de
 * la misma fila en un solo trazo para no acabar con 250 cuadraditos en el DOM.
 */

export interface Animal {
  id: string;
  /** Cómo se llama, para el texto de accesibilidad. */
  label: string;
  /** Fondo de la baldosa, debajo del dibujo. */
  bg: string;
  /** Qué color es cada carácter del dibujo. */
  palette: Record<string, string>;
  /** 16 filas de 16 caracteres. El punto es "no pintes nada". */
  pixels: string[];
}

export const GRID = 16;

/**
 * Aire alrededor del dibujo, en unidades de la rejilla.
 *
 * El número no es a ojo: en el menú de cuenta la baldosa se recorta en redondo,
 * y un círculo inscrito en la rejilla de 16 tiene radio 8, así que todo píxel
 * que quede a más de 8 del centro se pierde. Midiendo hasta dónde llega cada
 * animal:
 *
 *   oso                              9.90   <- las orejas, el caso peor
 *   gato, ciervo, zorro, búho, mapache 9.22
 *   conejo                           8.60
 *   lobo                             8.49
 *   pingüino                         8.06   <- los pies, por los pelos
 *
 * Con 2 el radio pasa a 10 y entran todos. Con 1 seguiría cortándole las orejas
 * al oso. Si algún día se dibuja uno que llegue más lejos, se sube esto y ya.
 *
 * Va en el `viewBox` y no como `padding` de CSS a propósito: así el fondo de la
 * baldosa sigue llenando el hueco entero y lo único que se separa es el dibujo.
 */
export const PAD = 2;

/** La caja del avatar: la rejilla más el aire de los cuatro lados. */
export const VIEW = {
  min: -PAD,
  size: GRID + PAD * 2,
  /** El radio de siempre (3.5 sobre 16), reescalado para que se vea igual. */
  corner: (3.5 * (GRID + PAD * 2)) / GRID,
};

/** Un trazo por color, listo para meter en un `<path>`. */
export const animalPaths = (animal: Animal) => {
  const runs: Record<string, string[]> = {};

  animal.pixels.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const char = row[x];
      if (char === ".") {
        x += 1;
        continue;
      }

      // Píxeles seguidos del mismo color: un solo rectángulo.
      let end = x;
      while (end + 1 < row.length && row[end + 1] === char) end += 1;
      const width = end - x + 1;

      (runs[char] ??= []).push(`M${x} ${y}h${width}v1h-${width}z`);
      x = end + 1;
    }
  });

  return Object.entries(runs).map(([char, parts]) => ({
    fill: animal.palette[char] ?? "transparent",
    d: parts.join(""),
  }));
};
