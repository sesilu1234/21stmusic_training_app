import type { Animal } from "./pixels";

/**
 * Pingüino — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const penguin: Animal = {
  id: "penguin",
  label: "pingüino",
  bg: "oklch(0.34 0.035 235)",
  palette: {
    "1": "oklch(0.19 0.02 250)",
    "2": "oklch(0.96 0.008 250)",
    "3": "oklch(0.78 0.14 60)",
  },
  pixels: [
    "................",
    "....11111111....",
    "...1111111111...",
    "...1122222211...",
    "...1112222111...",
    "...1122332211...",
    "...1122222211...",
    "..111222222111..",
    "..112222222211..",
    "..112222222211..",
    "..112222222211..",
    "..112222222211..",
    "..111222222111..",
    "...1111111111...",
    "....33....33....",
    "................",
  ],
};

export default penguin;
