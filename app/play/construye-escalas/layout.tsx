import type { Metadata } from "next";
import { gameMetadata } from "@/lib/seo";

/**
 * Solo está aquí por el título y la descripción del modo, que salen del
 * catálogo de `lib/games.ts`. Hace falta un layout porque las pantallas de
 * juego son de cliente ("use client") y esas no pueden exportar `metadata`.
 */
export const metadata: Metadata = gameMetadata("/play/construye-escalas");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
