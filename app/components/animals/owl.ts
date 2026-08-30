import type { Animal } from "./pixels";

/**
 * Búho — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const owl: Animal = {
  id: "owl",
  label: "búho",
  bg: "oklch(0.32 0.035 265)",
  palette: {
    "1": "oklch(0.22 0.03 265)",
    "2": "oklch(0.7 0.13 200)",
    "3": "oklch(0.95 0.02 85)",
    "4": "oklch(0.84 0.07 350)",
    "5": "oklch(0.55 0.12 200)",
  },
  pixels: [
    "................",
    "................",
    "................",
    "..11........11..",
    "..121111111121..",
    "..122222222221..",
    "..133322223331..",
    "..131324423131..",
    "..133324423331..",
    "..122222222221..",
    "..125222222521..",
    "...1255225521...",
    "....11111111....",
    "................",
    "................",
    "................",
  ],
};

export default owl;
