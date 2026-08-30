import type { Animal } from "./pixels";

/**
 * Zorro — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const fox: Animal = {
  id: "fox",
  label: "zorro",
  bg: "oklch(0.32 0.035 265)",
  palette: {
    "1": "oklch(0.22 0.03 265)",
    "2": "oklch(0.55 0.12 50)",
    "3": "oklch(0.7 0.13 50)",
    "4": "oklch(0.95 0.02 85)",
  },
  pixels: [
    "................",
    "................",
    "...11......11...",
    "..1221....1221..",
    "..132211112231..",
    "..134433334431..",
    "..134133331431..",
    "..133333333331..",
    "..143344443341..",
    "...1334444331...",
    "....13444431....",
    ".....141141.....",
    "......1441......",
    ".......11.......",
    "................",
    "................",
  ],
};

export default fox;
