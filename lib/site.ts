// Datos fijos del sitio: los usan el pie de página y las páginas de info.
export const SITE = {
  name: "21st Century Music",
  academyName: "Escuela de Música Moderna",
  academyUrl: "https://escuelademusicamoderna.com/",
  privacyUpdatedAt: "19 de agosto de 2026",
} as const;

export const FOOTER_LINKS = [
  { href: "/guia", label: "Guía" },
  { href: "/contacto", label: "Contacto" },
  { href: "/sobre", label: "Sobre la app" },
  { href: "/privacidad", label: "Privacidad" },
] as const;
