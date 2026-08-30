import type { Animal } from "./pixels";

/**
 * Gato — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const cat: Animal = {
  id: "cat",
  label: "gato",
  bg: "oklch(0.32 0.035 265)",
  palette: {
    "1": "oklch(0.22 0.03 265)",
    "2": "oklch(0.55 0.12 335)",
    "3": "oklch(0.7 0.13 335)",
    "4": "oklch(0.95 0.02 85)",
    "5": "oklch(0.84 0.07 350)",
  },
  pixels: [
    "................",
    "................",
    "...1........1...",
    "...11......11...",
    "...121....121...",
    "...1221111221...",
    "..133333333331..",
    "..134433334431..",
    "..134133331431..",
    "..133335533331..",
    "...1331331331...",
    "....13333331....",
    ".....111111.....",
    "................",
    "................",
    "................",
  ],
};

export default cat;
