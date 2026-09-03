import type { MetadataRoute } from "next";

/**
 * Para poder añadir la app a la pantalla de inicio del móvil.
 *
 * Para una app de practicar a diario esto vale más que el SEO: se abre desde el
 * icono en vez de buscar la pestaña, y sin la barra del navegador se gana la
 * altura que en los modos de piano y mástil hace falta.
 *
 * No la convierte en una app instalable de verdad (no hay service worker ni
 * funciona sin conexión, y no hace falta: todo lo interesante está en el
 * servidor). Es solo el icono y que se abra a pantalla completa.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "21st Century Music · Entrenamiento musical",
    short_name: "21st Music",
    description:
      "Tu gimnasio musical interactivo: oído, ritmo, lectura, guitarra y piano desde el navegador.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    lang: "es",
    categories: ["education", "music"],
    icons: [
      { src: "/icon.png", sizes: "any", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
