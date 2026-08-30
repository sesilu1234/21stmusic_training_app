import type { Animal } from "./pixels";

/**
 * Conejo — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const rabbit: Animal = {
  id: "rabbit",
  label: "conejo",
  bg: "oklch(0.32 0.035 265)",
  palette: {
    "1": "oklch(0.22 0.03 265)",
    "2": "oklch(0.84 0.07 350)",
    "3": "oklch(0.7 0.13 300)",
    "4": "oklch(0.95 0.02 85)",
  },
  pixels: [
    "................",
    "................",
    "..11........11..",
    "..121......121..",
    "...121....121...",
    "...121....121...",
    "...1311111131...",
    "..133333333331..",
    "..134433334431..",
    "..134133331431..",
    "..133332233331..",
    "...1333443331...",
    "....11111111....",
    "................",
    "................",
    "................",
  ],
};

export default rabbit;
