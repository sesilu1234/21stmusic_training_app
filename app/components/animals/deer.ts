import type { Animal } from "./pixels";

/**
 * Ciervo — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const deer: Animal = {
  id: "deer",
  label: "ciervo",
  bg: "oklch(0.32 0.035 265)",
  palette: {
    "1": "oklch(0.88 0.06 25)",
    "2": "oklch(0.22 0.03 265)",
    "3": "oklch(0.7 0.13 25)",
    "4": "oklch(0.95 0.02 85)",
  },
  pixels: [
    "................",
    "..11........11..",
    "..11.11..11.11..",
    "...1111..1111...",
    "....11....11....",
    "....22222222....",
    "...2333333332...",
    "...2443333442...",
    "...2423333242...",
    "...2333333332...",
    "...2334444332...",
    "...2334224332...",
    "....23444432....",
    ".....222222.....",
    "................",
    "................",
  ],
};

export default deer;
