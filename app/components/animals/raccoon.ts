import type { Animal } from "./pixels";

/**
 * Mapache — 16x16.
 *
 * Se dibuja tal cual: cada letra del dibujo es un color de `palette` y el
 * punto es transparente (se ve el fondo). Para retocarlo, se cambia el
 * carácter y ya está.
 */
const raccoon: Animal = {
  id: "raccoon",
  label: "mapache",
  bg: "oklch(0.31 0.025 260)",
  palette: {
    "1": "oklch(0.22 0.02 265)",
    "2": "oklch(0.66 0.02 265)",
    "3": "oklch(0.95 0.01 265)",
    "4": "oklch(0.35 0.025 265)",
  },
  pixels: [
    "................",
    "..11........11..",
    "..1221....1221..",
    ".11222111122211.",
    ".12222222222221.",
    ".13444322344431.",
    ".14411422411441.",
    ".14444422444441.",
    ".12444322344421.",
    ".12223333332221.",
    "..123331133321..",
    "..122333333221..",
    "...1123333211...",
    ".....111111.....",
    "................",
    "................",
  ],
};

export default raccoon;
