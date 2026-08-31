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
  bg: "oklch(0.34 0.04 250)",
  palette: {
    "1": "oklch(0.23 0.03 30)",
    "2": "oklch(0.93 0.015 70)",
    "3": "oklch(0.84 0.07 15)",
  },
  pixels: [
    "................",
    "....111..111....",
    "....131..131....",
    "....131..131....",
    "....131..131....",
    "...1131111311...",
    "..122211112221..",
    ".12222222222221.",
    ".12112222221121.",
    ".12112222221121.",
    ".12222222222221.",
    ".12322233222321.",
    ".11222133122211.",
    "..112222222211..",
    "...1111111111...",
    "................",
  ],
};

export default rabbit;
