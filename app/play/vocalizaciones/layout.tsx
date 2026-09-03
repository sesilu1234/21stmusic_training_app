import type { Metadata } from "next";
import { gameMetadata } from "@/lib/seo";

/**
 * Solo está aquí por el título y la descripción de "Vocalizaciones".
 *
 * Hace falta un layout y no basta con la propia página porque casi todas las
 * pantallas de juego son componentes de cliente ("use client"), y esas no
 * pueden exportar `metadata`. Los textos no se escriben aquí: salen del
 * catálogo de `lib/games.ts`, que ya es donde vive el nombre y la frase de
 * cada modo.
 *
 * Los niveles que cuelgan de esta ruta heredan estos metadatos, y está bien
 * que sea así: son la misma pantalla con otro contenido, y la dirección
 * canónica que heredan apunta al modo, que es la página que se ofrece.
 */
export const metadata: Metadata = gameMetadata("/play/vocalizaciones");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
