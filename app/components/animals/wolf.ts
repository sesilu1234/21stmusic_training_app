import type { Animal } from "./pixels";

/**
 * Lobo — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const wolf: Animal = {
  id: "wolf",
  label: "lobo",
  bg: "oklch(0.32 0.035 265)",
  palette: {
    "1": "oklch(0.22 0.03 265)",
    "2": "oklch(0.7 0.13 245)",
    "3": "oklch(0.95 0.02 85)",
  },
  pixels: [
    "................",
    "................",
    "..11........11..",
    "..121......121..",
    "..1221....1221..",
    "..122211112221..",
    "..123322223321..",
    "..123122221321..",
    "..122222222221..",
    "..132233332231..",
    "...1223333221...",
    "...1223113221...",
    "....12333321....",
    ".....111111.....",
    "................",
    "................",
  ],
};

export default wolf;
