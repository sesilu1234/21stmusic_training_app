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
  bg: "oklch(0.29 0.04 165)",
  palette: {
    "1": "oklch(0.22 0.035 60)",
    "2": "oklch(0.6 0.07 60)",
    "3": "oklch(0.93 0.02 85)",
    "4": "oklch(0.8 0.14 75)",
  },
  pixels: [
    "................",
    "..111......111..",
    "..12211..11221..",
    ".11222222222211.",
    ".12333322333321.",
    ".12331322313321.",
    ".12333322333321.",
    ".12222244222221.",
    ".12222344322221.",
    ".11222222222211.",
    "..123223322321..",
    "..122322223221..",
    "..112222222211..",
    "...1111111111...",
    "....44....44....",
    "................",
  ],
};

export default owl;
