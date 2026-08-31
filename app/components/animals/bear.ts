import type { Animal } from "./pixels";

/**
 * Oso — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const bear: Animal = {
  id: "bear",
  label: "oso",
  bg: "oklch(0.3 0.04 95)",
  palette: {
    "1": "oklch(0.24 0.04 50)",
    "2": "oklch(0.55 0.075 55)",
    "3": "oklch(0.82 0.06 70)",
  },
  pixels: [
    "................",
    ".111........111.",
    ".1331......1331.",
    ".11222111122211.",
    "..122222222221..",
    "..122222222221..",
    "..121122221121..",
    "..122222222221..",
    "..122333333221..",
    "..123311113321..",
    "..123333333321..",
    "...1223333221...",
    "...1122222211...",
    "....11111111....",
    "................",
    "................",
  ],
};

export default bear;
