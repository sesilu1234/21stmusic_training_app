/**
 * Temas de la guía.
 *
 * Los colores de verdad viven en globals.css, en un bloque por tema. Aquí solo
 * está la lista para pintar el selector: el nombre y dos colores de muestra
 * (el fondo y el acento) para la bolita de cada opción.
 */

export interface GuideTheme {
  id: string;
  label: string;
  /** Color de fondo, para la muestra del selector. */
  bg: string;
  /** Color de acento, para el aro de la muestra. */
  accent: string;
  dark: boolean;
}

export const GUIDE_THEMES: GuideTheme[] = [
  { id: "dracula", label: "Drácula", bg: "#282a36", accent: "#bd93f9", dark: true },
  { id: "ayu", label: "Ayu", bg: "#0f1419", accent: "#ffb454", dark: true },
  { id: "rust", label: "Rust", bg: "#e8e3d9", accent: "#a2542e", dark: false },
  { id: "light", label: "Claro", bg: "#ffffff", accent: "#7c3aed", dark: false },
];

export const DEFAULT_THEME = "dracula";

export const isTheme = (value: unknown): value is string =>
  GUIDE_THEMES.some((theme) => theme.id === value);
