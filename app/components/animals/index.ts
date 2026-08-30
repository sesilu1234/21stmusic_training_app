import type { Animal } from "./pixels";
import cat from "./cat";
import owl from "./owl";
import fox from "./fox";
import tiger from "./tiger";
import wolf from "./wolf";
import rabbit from "./rabbit";
import deer from "./deer";
import frog from "./frog";

/**
 * La baraja de avatares. El orden importa poco, pero cambiarlo le cambia el
 * animal a todo el mundo: se elige por posición.
 *
 * Para añadir uno nuevo: un archivo más al lado de estos y una línea aquí.
 */
export const ANIMALS: Animal[] = [
  cat,
  owl,
  fox,
  tiger,
  wolf,
  rabbit,
  deer,
  frog,
];

export type { Animal } from "./pixels";
export { animalPaths, GRID } from "./pixels";
