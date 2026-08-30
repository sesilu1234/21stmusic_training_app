import type { Animal } from "./pixels";

/**
 * Tigre — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const tiger: Animal = {
  id: "tiger",
  label: "tigre",
  bg: "oklch(0.32 0.035 265)",
  palette: {
    "1": "oklch(0.22 0.03 265)",
    "2": "oklch(0.7 0.13 85)",
    "3": "oklch(0.55 0.12 85)",
    "4": "oklch(0.95 0.02 85)",
  },
  pixels: [
    "................",
    "................",
    "...11......11...",
    "..1221....1221..",
    "..122211112221..",
    "..123222222321..",
    "..124422224421..",
    "..124122221421..",
    "..132444444231..",
    "..122441144221..",
    "..122444444221..",
    "...1222222221...",
    "....11111111....",
    "................",
    "................",
    "................",
  ],
};

export default tiger;
