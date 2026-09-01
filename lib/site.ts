// Datos fijos del sitio: los usan el pie de página y las páginas de info.
export const SITE = {
  name: "21st Century Music",
  academyName: "Escuela de Música Moderna",
  academyUrl: "https://escuelademusicamoderna.com/",
  // Las altas se dan en la academia, no en la app: el login manda aquí.
  academyContactUrl: "https://escuelademusicamoderna.com/contactar/",
  privacyUpdatedAt: "1 de septiembre de 2026",
} as const;

export const FOOTER_LINKS = [
  { href: "/guia", label: "Guía" },
  { href: "/contact", label: "Contacto" },
  { href: "/about", label: "Sobre la app" },
  { href: "/privacidad", label: "Privacidad" },
] as const;
