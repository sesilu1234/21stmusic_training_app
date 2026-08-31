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
  bg: "oklch(0.31 0.045 45)",
  palette: {
    "1": "oklch(0.23 0.04 40)",
    "2": "oklch(0.7 0.15 55)",
    "3": "oklch(0.95 0.02 85)",
  },
  pixels: [
    "................",
    "..1..........1..",
    "..11........11..",
    "..121......121..",
    "..1221....1221..",
    "..122211112221..",
    "..122222222221..",
    "..121122221121..",
    "..122222222221..",
    "..132233332231..",
    "...1233333321...",
    "...1233113321...",
    "....12333321....",
    ".....111111.....",
    "................",
    "................",
  ],
};

export default fox;
