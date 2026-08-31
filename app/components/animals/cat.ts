import type { Animal } from "./pixels";

/**
 * Gato — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const cat: Animal = {
  id: "cat",
  label: "gato",
  bg: "oklch(0.32 0.035 330)",
  palette: {
    "1": "oklch(0.22 0.02 60)",
    "2": "oklch(0.74 0.05 70)",
    "3": "oklch(0.96 0.012 80)",
    "4": "oklch(0.8 0.09 15)",
  },
  pixels: [
    "................",
    "..11........11..",
    ".12211....11221.",
    ".12222111122221.",
    ".12222222222221.",
    ".12222222222221.",
    ".12312222221321.",
    ".12112222221121.",
    ".12222222222221.",
    ".12223344332221.",
    "1122233113322211",
    ".11223333332211.",
    "..112222222211..",
    "...1111111111...",
    "................",
    "................",
  ],
};

export default cat;
