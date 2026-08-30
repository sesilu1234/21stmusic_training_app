import type { Animal } from "./pixels";

/**
 * Rana — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const frog: Animal = {
  id: "frog",
  label: "rana",
  bg: "oklch(0.32 0.035 265)",
  palette: {
    "1": "oklch(0.22 0.03 265)",
    "2": "oklch(0.95 0.02 85)",
    "3": "oklch(0.7 0.13 140)",
  },
  pixels: [
    "................",
    "................",
    "................",
    "..1221....1221..",
    "..12121..12121..",
    "..133311113331..",
    "..133333333331..",
    "..133313313331..",
    "..131333333131..",
    "..133111111331..",
    "...1333333331...",
    "....11111111....",
    "................",
    "................",
    "................",
    "................",
  ],
};

export default frog;
