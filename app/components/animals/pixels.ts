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
